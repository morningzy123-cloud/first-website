/* Marketing Buddy export radar. Public references and explicit planning estimates. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const day = 86400000;
  const isoDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  const addDays = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * day).toISOString().slice(0, 10);
  const total = route => route.segments.reduce((sum, stage) => ({ min: sum.min + stage.min, max: sum.max + stage.max }), { min: 0, max: 0 });
  const stale = (date, days = 7) => !isoDay(date) || Date.parse(today()) - Date.parse(date) > days * day;
  const riskState = risk => risk.expiresAt && today() > risk.expiresAt ? 'expired' : stale(risk.checkedAt) ? 'stale' : 'current';
  const activeRisks = (data, code, routeId) => data.risks.filter(r => (!code || r.countryCodes.includes(code)) && (!routeId || !r.routeIds.length || r.routeIds.includes(routeId)) && riskState(r) !== 'expired');
  const range = span => `${span.min}–${span.max}`;
  const url = (code = '', route = '') => `#/radar${code ? '/' + encodeURIComponent(code) : ''}${route ? '/' + encodeURIComponent(route) : ''}`;
  const sourceLinks = (data, ids, label = '依据') => (ids || []).map(id => data.sources.find(s => s.id === id)).filter(Boolean).map(s => `<a class="rr-source" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(s.title)}">${esc(label)} · ${esc(s.publisher)} ↗</a>`).join('');
  const levelText = risk => riskState(risk) === 'stale' ? '待复核' : risk.level === 'high' ? '高关注' : '需关注';
  const countryLevel = (data, code) => {
    const list = activeRisks(data, code);
    return list.some(r => riskState(r) === 'current' && r.level === 'high') ? ['high', '高关注'] : list.some(r => riskState(r) === 'stale') ? ['stale', '待复核'] : ['watch', '需关注'];
  };
  function impact(data, base, risk) {
    const names = (base.vehicles || []).filter(v => risk.countryCodes.includes(v.marketCode)).map(v => `${v.brand} ${v.model}`);
    return names.length ? `可能涉及：${[...new Set(names)].join(' / ')}。按目的地匹配，仍需逐车型、税号及批次核定。` : '涉及该目的地的新车进口与上市计划；本站尚未登记当地车型或具体项目。';
  }
  function mapPoint(point) {
    const [lon, lat] = point;
    return [(((lon + 30) % 360 + 360) % 360) / 360 * 1000, (85 - lat) / 150 * 470];
  }
  function linePath(points, close = false) {
    let previous;
    let output = '';
    for (const point of points) {
      const xy = mapPoint(point);
      const jump = previous && Math.abs(xy[0] - previous[0]) > 500;
      output += `${!previous || jump ? 'M' : 'L'}${xy[0].toFixed(1)},${xy[1].toFixed(1)} `;
      previous = xy;
    }
    return output + (close ? 'Z' : '');
  }
  const land = () => (window.MB_RADAR_LAND || []).map(ring => `<path d="${linePath(ring, true)}"/>`).join('');
  function routeMap(data, routes, focused = false) {
    const allPoints = routes.flatMap(r => r.waypoints.map(p => mapPoint(p.coords)));
    let viewBox = '0 0 1000 470';
    if (focused && allPoints.length) {
      const xs = allPoints.map(p => p[0]), ys = allPoints.map(p => p[1]);
      let w = Math.max(210, Math.max(...xs) - Math.min(...xs) + 100);
      let h = Math.max(140, Math.max(...ys) - Math.min(...ys) + 80);
      w = Math.max(w, h * 1.8); h = Math.max(h, w / 2.3);
      const x = Math.max(0, Math.min(1000 - w, (Math.max(...xs) + Math.min(...xs) - w) / 2));
      const y = Math.max(0, Math.min(470 - h, (Math.max(...ys) + Math.min(...ys) - h) / 2));
      viewBox = `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
    }
    const markers = new Map();
    for (const route of routes) for (const p of route.waypoints.filter(p => p.type !== 'transit')) markers.set(p.name, { ...p, code: route.countryCode, route: route.id });
    const markerSize = focused ? 2.4 : 3.1;
    return `<div class="rr-map ${focused ? 'focused' : ''}">
      <div class="rr-map-heading"><span><i></i> ${focused ? 'ROUTE DETAIL / 路线规划' : 'TIANJIN / 八国出口网络'}</span><small>示意路线 · 非实时船位</small></div>
      <svg viewBox="${viewBox}" role="img" aria-label="天津出发的海运及中亚陆路路线示意图" preserveAspectRatio="xMidYMid meet">
        <defs><pattern id="rr-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#83b5ec" stroke-opacity=".10" stroke-width=".5"/></pattern><filter id="rr-glow"><feGaussianBlur stdDeviation="1.7"/></filter></defs>
        <rect width="1000" height="470" fill="#091b33"/><rect width="1000" height="470" fill="url(#rr-grid)"/>
        <g class="rr-land" fill="#173550" stroke="#2d5270" stroke-width=".45">${land()}</g>
        ${routes.map((r, i) => `<path class="rr-route-halo" d="${linePath(r.waypoints.map(p => p.coords))}"/><path class="rr-route-line ${r.mode === 'rail_container' ? 'rail' : ''} ${r.availability === 'reference_only' ? 'restricted' : ''}" d="${linePath(r.waypoints.map(p => p.coords))}" style="--route-delay:${i * .2}s"/>`).join('')}
        ${[...markers.values()].map((p, i) => { const [x, y] = mapPoint(p.coords); const origin = p.type === 'origin'; return `<a href="${esc(url(p.code, p.route))}" aria-label="${esc(p.name)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${origin ? markerSize * 2.5 : markerSize * 2}" fill="${origin ? '#4da7ff' : '#5fe4e6'}" opacity=".13"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${markerSize}" fill="${origin ? '#fff' : '#70f2e8'}"/><title>${esc(p.name)}</title>${!focused && !['origin', 'destination'].includes(p.type) ? '' : `<text x="${(x + 5).toFixed(1)}" y="${(y + (i % 2 ? 10 : -7)).toFixed(1)}" font-size="${focused ? 6 : 9}" fill="#e4f5ff" paint-order="stroke" stroke="#091b33" stroke-width="2">${esc(p.shortName || p.name)}</text>`}</a>`; }).join('')}
      </svg>
      <div class="rr-map-legend"><span><b></b>海运 / 多式联运候选</span><span><b class="rail"></b>中亚铁路候选</span><span><b class="restricted"></b>常态参考 · 受限制</span></div>
      <div class="rr-map-credit">陆地底图：<a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth · Public Domain</a> / 航线经停与地理位置为规划示意</div>
    </div>`;
  }
  function riskCard(data, base, risk) {
    const state = riskState(risk);
    return `<article class="rr-risk-card ${state === 'stale' ? 'stale' : risk.level}"><header><span class="rr-pill ${state === 'stale' ? 'stale' : risk.level}">${levelText(risk)}</span><span>${esc(risk.category === 'policy' ? '准入 / 关税' : '运输 / 港口')}</span>${risk.evidenceStatus==='pending'?'<span class="rr-pill stale">部分原文待核对</span>':''}<time>核查 ${esc(risk.checkedAt)}</time></header><h3>${esc(risk.title)}</h3><p>${esc(risk.summary)}</p>${state === 'stale' ? '<p class="rr-stale-note">超过 7 天未复核，以下为历史风险提示，当前状态需重新确认。</p>' : ''}<div class="rr-risk-impact">${esc(impact(data, base, risk))}</div><div class="rr-risk-action"><strong>建议行动</strong><span>${esc(risk.action)}</span></div><footer>${sourceLinks(data, risk.sourceIds)}<small>${esc(risk.legalStatus || '承运限制按具体航次确认')}</small></footer></article>`;
  }
  function summaryHeader(data, country) {
    return `<div class="rr-page-heading"><div><span class="rr-kicker">EXPORT INTELLIGENCE / ${country ? country.code : 'TIANJIN'}</span><h1>${country ? esc(country.name) + '<span>运输与政策</span>' : '汽车出口<span>运输与政策风险雷达</span>'}</h1><p>${country ? esc(country.summary) : '从天津出发，把路线、时间与风险放在一张图里。为发运决策和上市排期提供参考。'}</p></div><div class="rr-update"><span class="rr-pill ${stale(data.asOf) ? 'stale' : 'blue'}">${stale(data.asOf) ? '快照待复核' : '研究快照'}</span><strong>${esc(data.asOf)}</strong><small>公开资料 + 规划估算<br>按次更新 · 非实时监控</small></div></div>`;
  }
  function overview(container, crumb, base, data) {
    crumb.textContent = 'Marketing Buddy / 出口风险雷达';
    const primary = data.countries.map(c => data.routes.find(r => r.id === c.defaultRouteId));
    const topRisks = [...activeRisks(data)].sort((a, b) => Number(b.level === 'high') - Number(a.level === 'high')).slice(0, 3);
    container.innerHTML = `<div class="rr-shell">${summaryHeader(data)}<div class="rr-intro-note"><b>规划口径</b><span>从实际离津启运开始，分段估算至当地清关放行；配送与上市准备单独列为参考。海湾路线需先确认承运可用性。</span></div>
      <div class="rr-overview-grid">${routeMap(data, primary)}<aside class="rr-situation"><span class="rr-kicker">SITUATION BRIEF</span><h2>先看会改变计划的事</h2>${topRisks.map(r => `<a href="${url(r.countryCodes[0])}"><span class="rr-pill ${riskState(r) === 'stale' ? 'stale' : r.level}">${levelText(r)}</span><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><small>查看受影响路线 →</small></a>`).join('')}</aside></div>
      <div class="rr-section-heading"><div><span class="rr-kicker">DESTINATION BOARD / 08</span><h2>八国目的地看板</h2></div><p>点击国家，查看路线、关键节点和适用风险</p></div>
      <div class="rr-country-grid">${data.countries.map(c => { const route = data.routes.find(r => r.id === c.defaultRouteId); const span = total(route); const [level, text] = countryLevel(data, c.code); const release = total({segments:route.segments.filter(s=>s.id !== 'local')}); return `<a class="rr-country-card" href="${url(c.code)}"><div class="rr-country-top"><span>${esc(c.flag)} <small>${esc(c.region)}</small></span><span class="rr-pill ${level}">${text}</span></div><h3>${esc(c.name)}<small>${c.code}</small></h3><div class="rr-country-duration"><strong>${range(release)}</strong><span>天 / 启运至放行估算</span></div><p>${esc(c.summary)}</p><div class="rr-country-meta"><span>${route.mode === 'rail_container' ? '铁路 / 集装箱候选' : '海运 / 联运候选'}</span><span>${route.sourceIds.length} 组依据</span></div><footer><span>含配送参考 ${range(span)} 天</span><strong>路线详情 ↗</strong></footer></a>`; }).join('')}</div>
      <details class="rr-method"><summary>这些时间和风险是怎么得出的？</summary><p>${esc(data.methodology)}</p><p>区间表示规划情景，尚无逐票样本支持统计分位数。高关注由已核查重大承运限制触发；需关注表示存在运输或准入核查项；待复核表示证据已超过 7 天。没有警报不代表已确认安全或政策合规。</p><p>八国仅扩展物流与政策范围；原四国竞品池保持既有范围。</p></details></div>`;
  }
  function milestones(route, date) {
    let min = 0, max = 0;
    return route.segments.map(s => { min += s.min; max += s.max; return { ...s, minDay: min, maxDay: max, early: addDays(date, min), late: addDays(date, max) }; });
  }
  function timeline(data, route, date) {
    const stages = milestones(route, date);
    return `<div class="rr-timeline"><div class="rr-timeline-origin"><b>00</b><strong>离津启运</strong><span>${esc(date)}</span><small>${route.mode === 'rail_container' ? '铁路实际发车日' : '天津港实际离港日'}</small></div>${stages.map((s, i) => `<article class="rr-timeline-stage"><b>0${i + 1}</b><span>${esc(s.label)}</span><strong>${s.min}–${s.max}<small>天</small></strong><p>${s.early}<br>至 ${s.late}</p><small>累计 D+${s.minDay}–${s.maxDay}</small><em>规划估算</em></article>`).join('')}</div><p class="rr-timeline-note">各阶段按顺序相加，不重复叠加同一项清关时间。日期基于输入的假设启运日；未录入订舱确认、实际 ETD 或报关单。</p>`;
  }
  function country(container, crumb, base, data, code, selectedId) {
    const c = data.countries.find(c => c.code === code);
    if (!c) { container.innerHTML = '<div class="rr-empty"><h1>没有找到这个雷达目的地</h1><a href="#/radar">返回八国看板</a></div>'; return; }
    const routes = data.routes.filter(r => r.countryCode === code);
    const route = routes.find(r => r.id === selectedId) || routes.find(r => r.id === c.defaultRouteId);
    const release = total({ segments: route.segments.filter(s => s.id !== 'local') });
    const local = route.segments.find(s => s.id === 'local');
    const risks = activeRisks(data, code, route.id);
    crumb.textContent = `Marketing Buddy / 出口风险雷达 / ${c.name}`;
    container.innerHTML = `<div class="rr-shell"><a class="back-link" href="#/radar">← 返回八国看板</a>${summaryHeader(data, c)}
      <nav class="rr-country-tabs" aria-label="雷达目的地">${data.countries.map(item => `<a class="${item.code === code ? 'active' : ''}" href="${url(item.code)}" ${item.code===code?'aria-current="page"':''}>${esc(item.flag)} ${esc(item.name)}</a>`).join('')}</nav>
      <div class="rr-route-layout"><div>${routeMap(data, [route], true)}<div class="rr-waypoint-list">${route.waypoints.filter(p => p.type !== 'transit').map((p,i)=>`<span><b>${i+1}</b>${esc(p.name)}</span>`).join('<i>→</i>')}</div></div><aside class="rr-route-selector"><span class="rr-kicker">ROUTE OPTIONS</span><h2>选择运输方案</h2>${routes.map(r=>`<a href="${url(code,r.id)}" class="${r.id===route.id?'active':''}" ${r.id===route.id?'aria-current="true"':''}><span>${esc(r.scenario)}</span><h3>${esc(r.name)}</h3><p>${esc(r.deliveryPoint)}</p><small>${r.availability==='reference_only'?'常态参考 · 当前承运待确认':'候选走廊 · 需逐票确认'} <b>→</b></small></a>`).join('')}<p class="rr-selector-note">集装箱班轮或班列资料不等于已获整车滚装、装箱或新能源危险品承运许可。</p></aside></div>
      <section class="rr-plan-summary"><div><small>启运 → 当地清关放行</small><strong>${range(release)}<em>天</em></strong><p>条件成立时的规划区间</p></div><div><small>配送 / PDI / 上市准备参考</small><strong>+${local.min}–${local.max}<em>天</em></strong><p>与进口放行分开计算</p></div><div class="rr-plan-conclusion"><small>排期结论</small><h3>${esc(route.conclusion)}</h3><p>${esc(route.assumptions)}</p></div></section>
      ${route.availability==='reference_only'?'<div class="rr-warning"><b>该方案仅作常态对照</b><span>当前通行、订舱或车辆接载条件尚未确认。区间不构成可用 ETA，上线排期应先取得承运人书面确认。</span></div>':''}
      <section class="rr-timing"><div class="rr-section-heading"><div><span class="rr-kicker">MILESTONE PLANNER</span><h2>关键时间节点</h2></div><span class="rr-pill blue">全部为规划估算</span></div><form class="rr-planner" id="rr-planner"><label>假设离津启运日<input type="date" name="departure" value="${today()}" required></label><label>计划上市日（选填）<input type="date" name="launch"></label><label>额外风险缓冲 / 天<input type="number" name="buffer" value="7" min="0" max="90" step="1" required></label><button type="submit">重新测算 →</button><small>仅本页测算，不保存项目数据</small></form><div id="rr-timeline">${timeline(data, route, today())}</div><div id="rr-plan-result" class="rr-plan-result" role="status">默认预留 7 天额外缓冲；可输入上市日检查排期余量。</div></section>
      <div class="rr-detail-grid"><section><div class="rr-section-heading"><div><span class="rr-kicker">RISK & POLICY</span><h2>运输与政策关注项</h2></div><span>${risks.length} 项</span></div><div class="rr-risk-list">${risks.map(r=>riskCard(data,base,r)).join('')||'<div class="rr-empty">本快照没有匹配项；并不代表已确认安全，发运前仍需复核。</div>'}</div></section><aside class="rr-evidence-panel"><span class="rr-kicker">EVIDENCE & ASSUMPTIONS</span><h2>依据和估算边界</h2><p>${esc(c.planningNote)}</p>${route.segments.map(s=>`<article><strong>${esc(s.label)} · ${s.min}–${s.max} 天</strong><span>规划估算</span><p>${esc(s.basisNote)}</p>${sourceLinks(data,s.sourceIds)}</article>`).join('')}<details><summary>查看本路线资料</summary>${route.sourceIds.map(id=>data.sources.find(s=>s.id===id)).filter(Boolean).map(s=>`<div class="rr-source-record"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${esc(s.publisher)} · ${esc(s.publishedAt || '发布日期未注明')}<br>核查：${esc(s.checkedAt)}</small><p>${esc(s.supports)}</p></div>`).join('')}</details></aside></div></div>`;
    const form = container.querySelector?.('#rr-planner');
    form?.addEventListener('submit', event => {
      event.preventDefault();
      const date = form.elements.departure.value;
      const launch = form.elements.launch.value;
      const buffer = Number(form.elements.buffer.value);
      const output = container.querySelector('#rr-plan-result');
      if (!isoDay(date) || (launch && !isoDay(launch)) || !Number.isInteger(buffer) || buffer < 0 || buffer > 90) { output.textContent = '请输入有效日期和 0–90 天的整数缓冲。'; return; }
      container.querySelector('#rr-timeline').innerHTML = timeline(data, route, date);
      const end = total(route);
      const ready = addDays(date, end.max + buffer);
      const conditional = route.availability==='reference_only' ? '该路线承运条件未确认，以下仅为假设情景。' : '需确认舱位、整车承运资质与报关条件。';
      if (launch) {
        const slack = Math.round((Date.parse(launch) - Date.parse(ready)) / day);
        output.className = `rr-plan-result ${slack < 0 ? 'tight' : 'room'}`;
        output.textContent = `${conditional}按区间上限另加 ${buffer} 天缓冲，参考就绪日 ${ready}；${slack < 0 ? `比计划上市日晚 ${-slack} 天，建议前移发运或调整上市日。` : `距计划上市日余 ${slack} 天。`}区间不覆盖无限期封航、扣货或认证失败。`;
      } else { output.className='rr-plan-result'; output.textContent=`${conditional}按区间上限另加 ${buffer} 天缓冲，参考就绪日 ${ready}。上市准备不代表已完成法规准入。`; }
    });
  }
  window.MB_RADAR = {
    total, milestones, riskState, activeRisks, isoDay, mapPoint,
    render(container, crumb, base, code, routeId) {
      const data=window.MB_RADAR_DATA;
      if (!data) { container.innerHTML='<div class="rr-empty"><h1>雷达数据暂不可用</h1><p>请稍后刷新，或继续查看国家市场。</p><a href="#/overview">返回情报总览</a></div>'; return; }
      if (code) country(container,crumb,base,data,code,routeId); else overview(container,crumb,base,data);
    }
  };
})();
