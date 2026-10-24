const DATA_URL = './data/autointel-v1.6.global.json';

const MARKET_META = {
  MX: { flag: '🇲🇽', name: '墨西哥', focus: '已完成首轮基线研究' },
  KZ: { flag: '🇰🇿', name: '哈萨克斯坦', focus: '已完成首轮基线研究' },
  SA: { flag: '🇸🇦', name: '沙特阿拉伯', focus: '已完成首轮基线研究' },
  AE: { flag: '🇦🇪', name: '阿联酋', focus: '已完成首轮基线研究；竞品建议待确认' }
};

const state = { data: null };
const app = document.querySelector('#app');
const breadcrumb = document.querySelector('#breadcrumb');

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const compact = (value, max = 105) => {
  if (!value) return '尚未采集，等待下一轮研究。';
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

const money = (amount, currency = 'MXN') => {
  if (amount === undefined || amount === null) return '待补充';
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
};

const number = (value) => value === undefined || value === null ? '待补充' : new Intl.NumberFormat('zh-CN').format(value);
const factText = (fact) => fact?.status === 'confirmed' ? fact.value : '待补充';
const first = (items) => Array.isArray(items) ? items[0] : items;
const sourceMap = () => new Map(state.data.sources.map(source => [source.id, source]));
const vehicleMap = () => new Map(state.data.vehicles.map(vehicle => [vehicle.id, vehicle]));

function loading() {
  app.innerHTML = `<div class="loading"><div class="skeleton" style="width:28%"></div><div class="skeleton" style="width:70%;height:52px"></div><div class="skeleton" style="width:86%"></div><div class="skeleton" style="height:250px;margin-top:25px"></div></div>`;
}

function updateNav(route) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.route === route));
}

function sectionHead(no, label, title, note = '') {
  return `<div class="section-head"><div><span class="section-no">${no} · ${escapeHtml(label)}</span><h2>${escapeHtml(title)}</h2></div>${note ? `<p>${escapeHtml(note)}</p>` : ''}</div>`;
}

function statusTag(confirmed, label) {
  return `<span class="tag ${confirmed ? 'confirmed' : ''}">${confirmed ? '● 已核验' : '○ 待研究'}${label ? ` · ${escapeHtml(label)}` : ''}</span>`;
}

function sourceLinks(sourceIds = []) {
  const map = sourceMap();
  const unique = [...new Set(sourceIds)].map(id => map.get(id)).filter(Boolean);
  if (!unique.length) return `<p class="muted">暂无可用来源。</p>`;
  return `<div class="source-list">${unique.map(source => `
    <a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">
      <div><strong>${escapeHtml(source.title || source.publisher)}</strong><small>${escapeHtml(source.publisher)} · ${escapeHtml(source.sourceType)}</small></div><span>↗</span>
    </a>`).join('')}</div>`;
}

function inlineSource(sourceIds = [], label = '来源') {
  const ids = Array.isArray(sourceIds) ? sourceIds : [sourceIds];
  const source = ids.map(id => sourceMap().get(id)).find(Boolean);
  return source ? `<a class="inline-source" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(source.title || source.publisher)}">${escapeHtml(label)} ↗</a>` : '';
}

function activityType(event) {
  const text = `${event?.title || ''} ${event?.description || ''}`;
  if (/免息|利率|首付|月供|金融|奖励|特别价/.test(text)) return { key: 'finance', label: '金融与促销', style: '' };
  if (/售后|质保|保修|零部件|道路救援/.test(text)) return { key: 'aftersales', label: '售后与品牌动作', style: 'orange' };
  return { key: 'marketing', label: '营销活动', style: 'orange' };
}

function embeddedEvents(events = [], emptyText = '当前没有已核验的相关活动。') {
  if (!events.length) return `<p class="empty-inline">${escapeHtml(emptyText)}</p>`;
  return events.map(event => `<div class="embedded-event"><div class="embedded-event-head"><span>${escapeHtml(event.eventDate || event.activityDate || '日期待核实')}</span>${inlineSource(event.sourceIds, '原始来源')}</div><strong>${escapeHtml(event.title)}</strong><p>${escapeHtml(event.description || '')}</p>${event.whyItMatters ? `<div class="why-line"><b>对 EMGRAND 的意义</b>${escapeHtml(event.whyItMatters)}</div>` : ''}</div>`).join('');
}

function overview() {
  updateNav('overview');
  breadcrumb.textContent = 'Marketing Buddy / 全球总览';
  const data = state.data;
  const mx = data.markets.find(m => m.code === 'MX');
  const confirmedVehicles = data.vehicles.filter(v => v.researchStatus === 'confirmed');
  const confirmedMarkets = data.markets.filter(m => m.basics?.summary?.status === 'confirmed');
  const totalCompetitors = data.competitorPools.reduce((sum, pool) => sum + pool.entries.length, 0);
  const globalSummary = data.globalOverview.summary30d?.status === 'confirmed' ? data.globalOverview.summary30d.value : factText(mx.basics.summary);
  const weeklyFocus = data.globalOverview.weeklyFocus?.status === 'confirmed' ? data.globalOverview.weeklyFocus.value : '首轮基线研究正在按国家推进。';
  const topPolicy = first(data.globalOverview.environmentPanels.policy);

  app.innerHTML = `
    <section class="hero">
      <div><span class="eyebrow">Marketing Buddy · Global intelligence</span><h1>EMGRAND<br>全球营销情报</h1><p>聚焦四国市场，用价格、销量、金融政策、保修政策与营销活动，把分散的公开信息转化为可核对的竞争判断。</p></div>
      <div class="hero-meta"><strong>V1.6</strong><span>四国上线基线</span></div>
    </section>

    <section class="metric-grid">
      <div class="metric"><small>已完成市场</small><strong>${confirmedMarkets.length}/4</strong><span class="trend">四国固定范围</span></div>
      <div class="metric"><small>竞品池对象</small><strong>${totalCompetitors}</strong><span class="trend">含待确认 AI 建议</span></div>
      <div class="metric"><small>已核验车型</small><strong>${confirmedVehicles.length}</strong><span class="trend">四国基线</span></div>
      <div class="metric"><small>可追溯来源</small><strong>${data.sources.length}</strong><span class="trend">公开来源</span></div>
    </section>

    ${sectionHead('01', '30-day brief', '近 30 天重点情报', '首页只保留最值得关注的变化，详细证据进入国家页和车型页。')}
    <section class="brief-card">
      <div><span class="eyebrow" style="color:var(--lime)">Global baseline · verified</span><h3>${escapeHtml(weeklyFocus)}</h3><p>${escapeHtml(globalSummary)}</p></div>
      <div class="brief-side"><span>一级政策提醒</span><strong>相关整车税号：50% 一般进口税率<br>2026-01-01 起生效</strong></div>
    </section>

    ${sectionHead('02', 'Markets', '四国市场', '四国首轮公开信息基线均已完成；未公开、口径冲突或需企业资料确认的字段继续明确标注。')}
    <section class="country-grid">${data.markets.map(market => countryCard(market)).join('')}</section>

    ${sectionHead('03', 'Environment', '政策与竞争环境', '把分散事实压缩成面向业务的观察；竞品的金融、保修和营销活动进入各自详情页查看。')}
    <section class="panel-grid">
      <article class="info-panel policy-critical"><div class="panel-top"><div class="panel-icon">§</div><span class="policy-level">一级政策</span></div><h3>${escapeHtml(topPolicy?.title || '国家政策')}</h3><p>${escapeHtml(topPolicy?.summary || '等待政策专项研究。')} ${inlineSource(topPolicy?.sourceIds, '官方依据')}</p><div class="policy-impact"><b>四国政策已覆盖</b>墨西哥、哈萨克斯坦、沙特和阿联酋的关税与税费均已建立来源链；车型实际适用仍以报关资料为准。</div></article>
      <article class="info-panel"><div class="panel-icon">%</div><h3>金融与促销</h3><p>${escapeHtml(data.globalOverview.environmentPanels.financeAndPromotions.map(item => item.title).slice(0, 4).join('；'))}</p></article>
      <article class="info-panel"><div class="panel-icon">↗</div><h3>市场变化</h3><p>${escapeHtml(data.globalOverview.environmentPanels.marketChanges.map(item => item.title).slice(0, 4).join('；'))}</p></article>
    </section>`;
}

function countryCard(market) {
  const meta = MARKET_META[market.code];
  const confirmed = market.basics?.summary?.status === 'confirmed';
  const overviewCard = state.data.globalOverview.countryCards.find(card => card.marketCode === market.code);
  const action = overviewCard?.importantCompetitorAction?.status === 'confirmed' ? overviewCard.importantCompetitorAction.value : '等待该市场首轮公开数据研究。';
  const summary = confirmed ? compact(market.basics.summary.value, 120) : market.code === 'AE' ? '竞品尚未指定，需先完成当地在售车型扫描。' : '市场结构已建立，关键字段等待研究 AI 按模板补齐。';
  return `<a class="country-card ${confirmed ? 'ready' : ''}" href="#/market/${market.code}">
    <div class="country-top"><div class="country-name"><span class="flag">${meta.flag}</span><div><strong>${meta.name}</strong><div class="sub">${market.code}</div></div></div>${statusTag(confirmed)}</div>
    <div class="country-insight"><small>市场状态</small><p>${escapeHtml(summary)}</p></div>
    <div class="country-insight"><small>竞争动作</small><p>${escapeHtml(action)}</p></div>
    <span class="go">进入市场 →</span>
  </a>`;
}

function marketPage(code) {
  updateNav('market');
  const market = state.data.markets.find(item => item.code === code) || state.data.markets[0];
  const meta = MARKET_META[market.code];
  const confirmed = market.basics?.summary?.status === 'confirmed';
  breadcrumb.textContent = `Marketing Buddy / 国家市场 / ${meta.name}`;

  app.innerHTML = `
    <section class="hero">
      <div><span class="eyebrow">Country intelligence · ${market.code}</span><h1>${meta.flag} ${meta.name}市场</h1><p>${confirmed ? escapeHtml(market.basics.summary.value) : `页面框架已经就绪。${meta.name}的数据尚未完成公开来源核验，因此不展示推测值。`}</p></div>
      <div class="hero-meta">${statusTag(confirmed, confirmed ? '已完成首轮基线研究' : meta.focus)}</div>
    </section>
    <nav class="market-tabs">${state.data.markets.map(item => `<a href="#/market/${item.code}" class="market-tab ${item.code === market.code ? 'active' : ''}">${MARKET_META[item.code].flag} ${MARKET_META[item.code].name}</a>`).join('')}</nav>
    ${confirmed ? confirmedMarket(market) : pendingMarket(market)}
  `;
}

function pendingMarket(market) {
  const meta = MARKET_META[market.code];
  const pool = state.data.competitorPools.find(item => item.marketCode === market.code);
  const names = (pool?.entries || []).map(entry => vehicleMap().get(entry.vehicleId)).filter(Boolean).map(v => `${v.brand} ${v.model}`);
  return `
    <div class="callout"><span>◷</span><div><strong>这个市场等待数据，不影响网站继续制作</strong><p>后续可以把标准研究任务交给其他 AI。返回的数据通过格式与来源检查后，即可直接进入当前页面。</p></div></div>
    ${sectionHead('01', 'Market basics', '市场基本情况')}
    <section class="basics-grid">${['市场规模与趋势','轿车细分市场','税费及政策环境','主要销售渠道'].map(label => `<article class="basic-card unavailable"><small>${label}</small><p>待 AI 根据当地官方及可靠公开来源补充。</p></article>`).join('')}</section>
    ${sectionHead('02', 'Competitive map', '价格 × 车身长度 × 销量')}
    <section class="empty-state"><div class="empty-icon">◌</div><h2>数据坐标尚未形成</h2><p>需要至少获得车型当地售价、车身长度，以及可比统计周期销量。缺少销量时仍可降级展示，但必须明确标注。</p></section>
    ${sectionHead('03', 'Competitors', '已设定竞品')}
    <section class="vehicle-grid">${names.length ? names.map(name => `<article class="vehicle-card"><div class="title-row"><h3>${escapeHtml(name)}</h3>${statusTag(false, '人工设定')}</div><p class="muted">已纳入监测范围，等待首轮研究。</p></article>`).join('') : `<article class="empty-state" style="grid-column:1/-1"><div class="empty-icon">＋</div><h2>尚未指定竞品</h2><p>${meta.name}需要先扫描当地同价位、同级别在售轿车，再由用户确认核心竞品。</p></article>`}</section>`;
}

function confirmedMarket(market) {
  const basics = market.basics;
  const pool = state.data.competitorPools.find(item => item.marketCode === market.code);
  const vehicles = (pool?.entries || []).map(entry => {
    const vehicle = vehicleMap().get(entry.vehicleId);
    return vehicle ? { ...vehicle, _poolEntry: entry } : null;
  }).filter(Boolean);
  const emgrand = state.data.vehicles.find(v => v.id === market.emgrandLocalProfile.vehicleId);
  return `
    ${sectionHead('01', 'Market basics', '市场基本情况')}
    <section class="basics-grid">
      ${basicCard('市场规模与趋势', basics.marketSizeAndTrend)}
      ${basicCard('轿车细分市场', basics.sedanSegment)}
      ${basicCard('税费及政策环境', basics.taxImportAndPolicy)}
      ${basicCard('主要销售渠道', basics.salesChannels)}
    </section>
    ${sectionHead('02', 'Competitive map', '价格 × 车身长度 × 销量', bubbleNote(market.bubbleChart))}
    ${bubbleChart(market.bubbleChart)}
    ${sectionHead('03', 'EMGRAND local', 'EMGRAND 当地车型信息')}
    ${localProfile(emgrand)}
    ${sectionHead('04', 'Competitors', market.code === 'AE' ? 'AI 建议竞品（待确认）' : '主要与次级竞品', '此处保留快速比较；金融、保修和营销活动的完整内容进入对应竞品详情。AI 建议不会自动变为正式竞品。')}
    <section class="vehicle-grid">${vehicles.map(vehicleCard).join('')}</section>
    ${sectionHead('05', 'Comparison', '竞品横向对比')}
    ${comparisonTable([emgrand, ...vehicles])}`;
}

function bubbleNote(points = []) {
  const periods = [...new Set(points.map(point => point.sales?.period).filter(Boolean))];
  const period = periods.length === 1 ? periods[0] : periods.length ? periods.join(' / ') : '最新可比周期';
  return `X 轴为车长，Y 轴为起售价，气泡面积代表 ${period} 销量。`;
}

function basicCard(label, fact) {
  const ok = fact?.status === 'confirmed';
  const isCriticalPolicy = label === '税费及政策环境' && ok;
  return `<article class="basic-card ${ok ? '' : 'unavailable'} ${isCriticalPolicy ? 'critical-policy' : ''}"><div class="basic-card-head"><small>${escapeHtml(label)}</small>${isCriticalPolicy ? '<span class="policy-level">一级政策</span>' : ''}</div><p>${ok ? `${escapeHtml(fact.value)} ${inlineSource(fact.sourceIds, '官方依据')}` : '本项尚未完成可靠来源核验。'}</p>${fact?.note ? `<div class="fact-note"><b>适用边界</b>${escapeHtml(fact.note)}</div>` : ''}</article>`;
}

function bubbleChart(points = []) {
  const usable = points.filter(point => [point.bodyLengthMm?.value, point.price?.amount, point.sales?.value].every(Number.isFinite));
  if (!usable.length) return `<section class="empty-state"><p>暂无三个维度均可用的图表数据。</p></section>`;
  const lengths = usable.map(p => p.bodyLengthMm.value);
  const prices = usable.map(p => p.price.amount);
  const sales = usable.map(p => p.sales.value);
  const currency = usable[0].price.currency || 'MXN';
  const minX = Math.min(...lengths) - 35, maxX = Math.max(...lengths) + 35;
  const minY = Math.floor((Math.min(...prices) - 10000) / 10000) * 10000;
  const maxY = Math.ceil((Math.max(...prices) + 10000) / 10000) * 10000;
  const x = v => 90 + ((v - minX) / (maxX - minX)) * 720;
  const y = v => 300 - ((v - minY) / (maxY - minY)) * 225;
  const r = v => 15 + Math.sqrt(v / Math.max(...sales)) * 23;
  const color = series => series === 'emgrand' ? '#0d7c57' : series === 'primary' ? '#f17c45' : '#9ca7a1';
  const vehicles = vehicleMap();
  const yTicks = [minY, Math.round((minY + maxY) / 2), maxY];
  const circles = usable.map(point => {
    const vehicle = vehicles.get(point.vehicleId);
    const name = vehicle ? `${vehicle.brand} ${vehicle.model}` : point.vehicleId;
    return `<g tabindex="0" aria-label="${escapeHtml(name)}，车长 ${point.bodyLengthMm.value} 毫米，价格 ${point.price.amount} ${currency}，销量 ${point.sales.value} 辆">
      <circle cx="${x(point.bodyLengthMm.value)}" cy="${y(point.price.amount)}" r="${r(point.sales.value)}" fill="${color(point.series)}" fill-opacity=".82" stroke="white" stroke-width="3"><title>${escapeHtml(name)} · ${money(point.price.amount, currency)} · ${number(point.sales.value)} 辆</title></circle>
      <text x="${x(point.bodyLengthMm.value)}" y="${y(point.price.amount) - r(point.sales.value) - 8}" text-anchor="middle" class="bubble-label">${escapeHtml(name)}</text>
      <text x="${x(point.bodyLengthMm.value)}" y="${y(point.price.amount) + 3}" text-anchor="middle" class="bubble-value">${number(point.sales.value)}</text>
    </g>`;
  }).join('');
  return `<section class="chart-card">
    <div class="chart-meta"><span class="legend"><i style="background:var(--green)"></i> EMGRAND</span><span class="legend"><i style="background:var(--orange)"></i> 人工设定竞品</span><span>气泡数字：月销量（辆）</span></div>
    <svg viewBox="0 0 900 370" role="img" aria-label="墨西哥车型价格、车长和销量气泡图">
      ${yTicks.map(t => `<line x1="70" x2="840" y1="${y(t)}" y2="${y(t)}" class="chart-grid"/><text x="60" y="${y(t)+4}" text-anchor="end" class="chart-label">${Math.round(t/1000)}k</text>`).join('')}
      <line x1="70" x2="840" y1="310" y2="310" class="chart-axis"/><line x1="70" x2="70" y1="50" y2="310" class="chart-axis"/>
      <text x="455" y="350" text-anchor="middle" class="chart-label">车身长度（mm）</text><text x="14" y="180" text-anchor="middle" transform="rotate(-90 14 180)" class="chart-label">起售价（${escapeHtml(currency)}）</text>
      <text x="90" y="328" text-anchor="middle" class="chart-label">${Math.round(minX)}</text><text x="810" y="328" text-anchor="middle" class="chart-label">${Math.round(maxX)}</text>
      ${circles}
    </svg>
  </section>`;
}

function localProfile(vehicle) {
  const promo = vehicle.prices.find(item => item.price.priceType === 'promotion')?.price;
  const msrp = vehicle.prices.filter(item => item.price.priceType === 'manufacturer_msrp');
  const finance = first(vehicle.financeOffers);
  const listedPrices = msrp.length ? msrp : vehicle.prices.filter(item => Number.isFinite(item.price?.amount));
  return `<section class="profile-grid">
    <article class="profile-card"><h3>在售版本与价格</h3><div class="mini-list">${listedPrices.map(item => `<div class="mini-row"><span>${escapeHtml(item.price.variantId || item.id)}</span><strong class="fact-value">${money(item.price.amount, item.price.currency)} ${inlineSource(item.price.sourceIds)}</strong></div>`).join('') || '<p class="empty-inline">现金指导价尚未确认。</p>'}${promo ? `<div class="mini-row"><span>活动价</span><strong class="fact-value" style="color:var(--green)">${money(promo.amount, promo.currency)} ${inlineSource(promo.sourceIds)}</strong></div>` : ''}</div></article>
    <article class="profile-card"><h3>金融及促销政策</h3><div class="mini-list"><div class="mini-row"><span>方案</span><strong class="fact-value">${escapeHtml(finance?.title || '待补充')} ${inlineSource(finance?.sourceIds)}</strong></div><div class="mini-row"><span>期限</span><strong>${finance?.termMonths || '—'} 个月</strong></div><div class="mini-row"><span>有效至</span><strong>${finance?.validTo || '待核实'}</strong></div></div></article>
    <article class="profile-card"><h3>售后与质保</h3><div class="mini-list">${vehicle.aftersales.map(item => `<div class="mini-row"><span>${item.type === 'vehicle_warranty' ? '质保' : '道路救援'}</span><strong class="fact-value">${escapeHtml(item.detail.value)} ${inlineSource(item.detail.sourceIds)}</strong></div>`).join('')}</div></article>
    <article class="profile-card"><h3>经销商与服务网络</h3><p class="muted" style="font-size:12px;line-height:1.7">${escapeHtml(factText(state.data.markets.find(m => m.code === vehicle.marketCode).emgrandLocalProfile.dealerAndServiceNetwork))}</p></article>
  </section>`;
}

function vehicleCard(vehicle) {
  const price = vehicle.prices.find(item => item.price.priceType === 'manufacturer_msrp')?.price || vehicle.prices.find(item => Number.isFinite(item.price?.amount))?.price;
  const promo = vehicle.prices.find(item => item.price.priceType === 'promotion')?.price;
  const sale = first(vehicle.salesRecords)?.volume;
  const finance = first(vehicle.financeOffers);
  const warranty = vehicle.aftersales.find(item => item.type === 'vehicle_warranty')?.detail;
  const event = first(vehicle.recentEvents);
  const suggested = vehicle._poolEntry?.decisionStatus === 'suggested';
  const tierLabel = suggested ? 'AI 建议 · 待确认' : vehicle._poolEntry?.tier === 'secondary' ? '人工设定 · 次级' : '人工设定 · 主要';
  return `<article class="vehicle-card">
    <div class="title-row"><div><h3>${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}</h3><div class="sub">${escapeHtml(vehicle.marketCode)} · ${suggested ? '建议竞品' : '正式竞品'}</div></div>${statusTag(!suggested, tierLabel)}</div>
    <div class="vehicle-stats"><div class="stat-cell"><small>公开起售价</small><strong class="fact-value">${money(price?.amount, price?.currency)} ${inlineSource(price?.sourceIds)}</strong></div><div class="stat-cell"><small>${escapeHtml(sale?.period || '销量周期')}</small><strong class="fact-value">${number(sale?.value)} 辆 ${inlineSource(sale?.sourceIds)}</strong></div><div class="stat-cell"><small>金融与促销</small><strong class="fact-value">${promo ? money(promo.amount, promo.currency) : escapeHtml(compact(finance?.title, 18))} ${inlineSource(promo?.sourceIds || finance?.sourceIds)}</strong></div><div class="stat-cell"><small>基础质保</small><strong class="fact-value">${escapeHtml(compact(warranty?.value, 25))} ${inlineSource(warranty?.sourceIds)}</strong></div></div>
    <div class="action-note"><small>${activityType(event).label}</small><p>${escapeHtml(event?.title || finance?.title || '待补充')} ${inlineSource(event?.sourceIds, '原始来源')}</p></div>
    <a class="text-link" href="#/vehicle/${vehicle.id}">查看竞品详情 →</a>
  </article>`;
}

function comparisonTable(vehicles) {
  const rows = [
    ['起售价', v => { const price = v.prices.find(item => item.price.priceType === 'manufacturer_msrp')?.price || v.prices.find(item => Number.isFinite(item.price?.amount))?.price; return money(price?.amount, price?.currency); }],
    ['金融/促销', v => first(v.financeOffers)?.title || '待补充'],
    ['售后质保', v => v.aftersales.find(item => item.type === 'vehicle_warranty')?.detail?.value || '待补充'],
    ['月销量', v => `${number(first(v.salesRecords)?.volume?.value)} 辆`]
  ];
  return `<div class="comparison-wrap"><table class="comparison"><thead><tr><th>指标</th>${vehicles.map(v => `<th>${escapeHtml(v.brand)} ${escapeHtml(v.model)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label, getter]) => `<tr><td>${label}</td>${vehicles.map(v => `<td>${escapeHtml(getter(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function vehicleDetail(id) {
  updateNav('market');
  const vehicle = state.data.vehicles.find(item => item.id === id);
  if (!vehicle) return notFound();
  const market = state.data.markets.find(item => item.code === vehicle.marketCode);
  const recentEvents = vehicle.recentEvents || [];
  const financeEvents = recentEvents.filter(event => activityType(event).key === 'finance');
  const aftersalesEvents = recentEvents.filter(event => activityType(event).key === 'aftersales');
  const marketingEvents = [
    ...(vehicle.marketingActivities || []),
    ...recentEvents.filter(event => activityType(event).key === 'marketing')
  ];
  const price = vehicle.prices.find(item => item.price.priceType === 'manufacturer_msrp')?.price || vehicle.prices.find(item => Number.isFinite(item.price?.amount))?.price;
  const sale = first(vehicle.salesRecords)?.volume;
  const length = vehicle.specifications.find(item => item.key === 'body_length_mm')?.fact;
  const sourceIds = [
    ...vehicle.prices.flatMap(item => item.price.sourceIds || []),
    ...vehicle.financeOffers.flatMap(item => item.sourceIds || []),
    ...vehicle.aftersales.flatMap(item => item.detail.sourceIds || []),
    ...vehicle.salesRecords.flatMap(item => item.volume.sourceIds || []),
    ...vehicle.specifications.flatMap(item => item.fact.sourceIds || []),
    ...recentEvents.flatMap(event => event.sourceIds || []),
    ...(vehicle.marketingActivities || []).flatMap(activity => activity.sourceIds || [])
  ];
  breadcrumb.textContent = `Marketing Buddy / ${MARKET_META[vehicle.marketCode].name} / ${vehicle.brand} ${vehicle.model}`;
  app.innerHTML = `
    <a class="text-link" href="#/market/${vehicle.marketCode}">← 返回${MARKET_META[vehicle.marketCode].name}市场</a>
    <section class="detail-hero">
      <span class="eyebrow" style="color:var(--lime)">Competitor intelligence · verified</span>
      <h1>${escapeHtml(vehicle.model)}</h1><p>${escapeHtml(vehicle.brand)} · ${MARKET_META[vehicle.marketCode].name} · 竞品情报详情</p>
      <div class="detail-kpis"><div class="detail-kpi"><small>公开起售价</small><strong>${money(price?.amount, price?.currency)}</strong></div><div class="detail-kpi"><small>${escapeHtml(sale?.period || '销量周期')}</small><strong>${number(sale?.value)} 辆</strong></div><div class="detail-kpi"><small>车身长度</small><strong>${number(length?.value)} mm</strong></div><div class="detail-kpi"><small>来源数量</small><strong>${new Set(sourceIds).size}</strong></div></div>
    </section>
    <section class="content-grid">
      <article class="content-card"><h2>售价与配置</h2><div class="mini-list">${vehicle.prices.map(item => `<div class="mini-row"><span>${escapeHtml(item.price.variantId || item.id)}${item.price.priceType === 'promotion' ? ' · 活动' : ''}</span><strong class="fact-value">${money(item.price.amount, item.price.currency)} ${inlineSource(item.price.sourceIds)}</strong></div>`).join('')}${vehicle.specifications.map(item => `<div class="mini-row"><span>${escapeHtml(item.label)}</span><strong class="fact-value">${number(item.fact.value)} ${escapeHtml(item.fact.unit)} ${inlineSource(item.fact.sourceIds)}</strong></div>`).join('')}</div></article>
      <article class="content-card"><h2>金融政策</h2>${vehicle.financeOffers.map(offer => `<div class="mini-list"><div class="mini-row"><span>方案</span><strong class="fact-value">${escapeHtml(offer.title)} ${inlineSource(offer.sourceIds)}</strong></div><div class="mini-row"><span>条件</span><strong>${escapeHtml(offer.conditions || '待核实')}</strong></div><div class="mini-row"><span>有效期</span><strong>${offer.validTo || '未确认'}</strong></div></div>`).join('') || '<p class="empty-inline">当前没有已核验的金融方案。</p>'}${embeddedEvents(financeEvents, '当前没有单独的金融活动记录。')}</article>
      <article class="content-card"><h2>保修与售后政策</h2><div class="mini-list">${vehicle.aftersales.map(item => `<div class="mini-row"><span>${escapeHtml(item.type)}</span><strong class="fact-value">${escapeHtml(item.detail.value)} ${inlineSource(item.detail.sourceIds)}</strong></div>`).join('')}</div>${embeddedEvents(aftersalesEvents, '当前没有单独的售后活动记录。')}</article>
      <article class="content-card"><h2>营销活动</h2>${embeddedEvents(marketingEvents, '本轮研究暂未发现独立且可核验的营销活动；后续数据补充后会直接显示在这里。')}</article>
      <article class="content-card"><h2>销量与定位</h2><div class="mini-list"><div class="mini-row"><span>${escapeHtml(sale?.period || '统计期')}</span><strong>${number(sale?.value)} 辆</strong></div><div class="mini-row"><span>与 EMGRAND 的关系</span><strong>${escapeHtml(compact(vehicle.competitiveRelationshipToEmgrand?.value, 90))}</strong></div></div></article>
      <article class="content-card wide"><h2>信息来源</h2>${sourceLinks(sourceIds)}</article>
    </section>`;
}

function poolPage() {
  updateNav('pool');
  breadcrumb.textContent = 'Marketing Buddy / 竞品池';
  const vehicles = vehicleMap();
  app.innerHTML = `
    <section class="hero"><div><span class="eyebrow">Competitor governance</span><h1>竞品池</h1><p>按国家维护人工设定、次级和 AI 建议竞品。第一版仅展示配置结果，不提供账号或复杂后台。</p></div><div class="hero-meta"><strong>${state.data.competitorPools.reduce((n,p)=>n+p.entries.length,0)}</strong><span>当前监测对象</span></div></section>
    <div class="callout"><span>i</span><div><strong>决策规则</strong><p>AI 可以推荐，但不能擅自删除人工设定竞品。AI 建议需给出推荐理由与来源，经人工采纳后才能进入正式监测。</p></div></div>
    ${sectionHead('01', 'Country pools', '四国竞品配置')}
    <section class="pool-list">${state.data.competitorPools.map(pool => {
      const meta = MARKET_META[pool.marketCode];
      return `<article class="pool-group"><div class="pool-header"><h2>${meta.flag} ${meta.name}</h2><span class="tag">${pool.entries.length} 个对象</span></div><div class="pool-entries">${pool.entries.length ? pool.entries.map(entry => { const v = vehicles.get(entry.vehicleId); return `<div class="pool-row"><strong>${escapeHtml(v?.brand || '')} ${escapeHtml(v?.model || entry.vehicleId)}</strong><span>${entry.tier === 'primary' ? '主要竞品' : entry.tier === 'secondary' ? '次级竞品' : 'AI 建议'}</span><span>${entry.origin === 'manual' ? '人工设定' : 'AI 推荐'}</span><span>${entry.monitor ? '● 监测中' : '○ 未监测'}</span></div>`; }).join('') : `<div class="empty-pool">尚未指定竞品，等待当地市场扫描与人工确认。</div>`}</div></article>`;
    }).join('')}</section>`;
}

function notFound() {
  app.innerHTML = `<section class="empty-state"><div class="empty-icon">?</div><h2>没有找到这个页面</h2><p>返回全球总览继续浏览。</p><a class="button" href="#/overview">返回总览</a></section>`;
}

function router() {
  if (!state.data) return;
  window.scrollTo(0, 0);
  const parts = location.hash.replace(/^#\//, '').split('/');
  const [route = 'overview', id] = parts;
  if (route === 'overview') overview();
  else if (route === 'market') marketPage(id || 'MX');
  else if (route === 'vehicle') vehicleDetail(id);
  else if (route === 'pool') poolPage();
  else notFound();
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('#drawerBackdrop').classList.remove('open');
}

async function init() {
  loading();
  try {
    if (window.AUTOINTEL_DATA) {
      state.data = window.AUTOINTEL_DATA;
    } else {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.data = await response.json();
    }
    router();
  } catch (error) {
    app.innerHTML = `<section class="empty-state"><div class="empty-icon">!</div><h2>数据文件未能加载</h2><p>请确认 data 文件夹与 index.html 保持在同一个网站文件夹中。</p></section>`;
    console.error(error);
  }
}

window.addEventListener('hashchange', router);
document.querySelector('#mobileMenu').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.add('open');
  document.querySelector('#drawerBackdrop').classList.add('open');
});
document.querySelector('#drawerBackdrop').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('#drawerBackdrop').classList.remove('open');
});
document.querySelector('#helpButton').addEventListener('click', () => document.querySelector('#helpDialog').showModal());
document.querySelector('#closeHelp').addEventListener('click', () => document.querySelector('#helpDialog').close());

if (!location.hash) location.hash = '#/overview';
init();
