const DATA_URL = './data/public.json';

const MARKET_META = {
  MX: { flag: '🇲🇽', name: '墨西哥', shipping: true },
  KZ: { flag: '🇰🇿', name: '哈萨克斯坦', shipping: false },
  SA: { flag: '🇸🇦', name: '沙特阿拉伯', shipping: true },
  AE: { flag: '🇦🇪', name: '阿联酋', shipping: true }
};

const state = { data: null };
const app = document.querySelector('#app');
const breadcrumb = document.querySelector('#breadcrumb');

const redact = (value = '') => String(value);

const escapeHtml = (value = '') => redact(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const compact = (value, max = 130) => {
  const text = redact(value || '');
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const number = value => Number.isFinite(value) ? new Intl.NumberFormat('zh-CN').format(value) : '待研究';
const money = (amount, currency) => Number.isFinite(amount)
  ? new Intl.NumberFormat('zh-CN', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount)
  : '待研究';

const sourceMap = () => new Map((state.data.sources || []).map(source => [source.id, source]));
const vehicleMap = () => new Map((state.data.vehicles || []).map(vehicle => [vehicle.id, vehicle]));
const first = items => Array.isArray(items) ? items[0] : undefined;
const localToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const activeOffer = item => (!item.validFrom || item.validFrom <= localToday()) && (!item.validTo || item.validTo >= localToday());

function loading() {
  app.innerHTML = `<div class="loading"><div></div><div></div><div></div></div>`;
}

function updateNav(route) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.route === route));
}

function sourceLink(sourceIds = [], label = '查看来源') {
  const ids = Array.isArray(sourceIds) ? sourceIds : [sourceIds];
  const sources = [...new Map(ids.map(id => sourceMap().get(id)).filter(Boolean).map(source => [source.url, source])).values()];
  return sources.length
    ? sources.map((source, index) => `<a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}${sources.length > 1 ? ` ${index + 1}` : ''} <span>↗</span></a>`).join(' ')
    : `<span class="source-missing">来源待补</span>`;
}

function statusPill(status = 'not_found', suggested = false) {
  if (suggested) return `<span class="status-pill suggested">AI 建议</span>`;
  if (status === 'confirmed') return `<span class="status-pill confirmed">已核验</span>`;
  if (status === 'unconfirmed') return `<span class="status-pill pending">待复核</span>`;
  return `<span class="status-pill empty">待研究</span>`;
}

function sectionTitle(kicker, title, note = '') {
  return `<div class="section-title"><div><span>${escapeHtml(kicker)}</span><h2>${escapeHtml(title)}</h2></div>${note ? `<p>${escapeHtml(note)}</p>` : ''}</div>`;
}

function reportConfidence() {
  const facts = [];
  for (const market of state.data.markets || []) {
    const card = marketCard(market.code);
    facts.push(card?.importantMarketNews, card?.importantCompetitorAction, market.basics?.taxImportAndPolicy);
  }
  const valid = facts.filter(fact => fact && fact.status !== 'not_found');
  if (!valid.length) return { score: 0, completeness: 0, tone: 'caution', label: '暂无可评估事实', updatedAt: '待更新' };
  const sources = sourceMap();
  const evidenceScore = valid.reduce((sum, fact) => {
    const status = fact.status === 'confirmed' ? .95 : fact.status === 'unconfirmed' ? .45 : .1;
    const sourceQuality = (fact.sourceIds || []).map(id => sources.get(id)?.sourceType).map(type =>
      /^official|government|regulator|customs|statistical/.test(type || '') ? 1
        : /association|carrier/.test(type || '') ? .85
        : /news|industry/.test(type || '') ? .65 : .45);
    const source = sourceQuality.length ? Math.max(...sourceQuality) : .1;
    const ageDays = fact.verifiedAt ? (Date.now() - Date.parse(fact.verifiedAt)) / 86400000 : Infinity;
    const freshness = ageDays <= 7 ? 1 : ageDays <= 30 ? .8 : .55;
    return sum + status * .45 + source * .4 + freshness * .15;
  }, 0) / valid.length;
  const vehicles = state.data.vehicles || [];
  const coveredModules = vehicles.reduce((sum, vehicle) => sum
    + Number(Boolean(vehicle.prices?.length))
    + Number(Boolean(vehicle.salesRecords?.length))
    + Number(Boolean(vehicle.researchV2?.officialSpecifications?.length || vehicle.specifications?.length))
    + Number(Boolean(vehicle.researchV2?.dealerOffers?.length || vehicle.financeOffers?.length || vehicle.marketingActivities?.length || vehicle.recentEvents?.length))
    + Number(Boolean(vehicle.researchV2?.consumerFeedback?.sampleSize)), 0);
  const shippingTracks = 3; // 墨西哥、沙特、阿联酋的路线周期均等待研究报告补充。
  const completedShippingTracks = (state.data.markets || []).filter(market => market.researchV2?.shippingRoutes?.length).length;
  const completeness = Math.round(((coveredModules + completedShippingTracks) / (vehicles.length * 5 + shippingTracks)) * 100);
  const score = Math.max(0, Math.min(95, Math.round(evidenceScore * 100)));
  const dates = valid.map(fact => fact.verifiedAt).filter(Boolean).sort().reverse();
  return { score, completeness, tone: score > 80 ? 'good' : score >= 60 ? 'standard' : 'caution', label: score > 80 ? '较高可信' : score >= 60 ? '基础可用' : '仍需补强', updatedAt: dates[0]?.slice(0, 10) || '待更新' };
}

function keyMarketFact(code) {
  const card = marketCard(code);
  return card?.importantMarketNews?.status !== 'not_found'
    ? card.importantMarketNews
    : card?.importantCompetitorAction;
}

function signalCategory(item) {
  const text = `${item.title || ''} ${item.description || ''}`;
  if (/免息|折扣|优惠|奖励|月供|首付|offer|金融|价格/i.test(text)) return '重大营销动作';
  if (/上市|发布|推出|launch|首发|新款/i.test(text)) return '新车 / 上市动作';
  if (/政策|关税|法规|准入|税/i.test(text)) return '国家政策变化';
  return '竞品重大动作';
}

function highValueSignals() {
  const collected = Array.isArray(state.data.globalOverview.highValueSignals) ? [...state.data.globalOverview.highValueSignals] : [];
  if (!Array.isArray(state.data.globalOverview.highValueSignals)) {
  for (const vehicle of state.data.vehicles || []) {
    const events = [...(vehicle.recentEvents || []), ...(vehicle.marketingActivities || [])];
    for (const event of events) collected.push({
      marketCode: vehicle.marketCode,
      brand: vehicle.brand,
      model: vehicle.model,
      category: signalCategory(event),
      title: event.title,
      summary: event.description || event.whyItMatters || event.conditions,
      date: event.eventDate || event.validFrom || event.validTo || '',
      sourceIds: event.sourceIds || []
    });
  }
  }
  const seen = new Set();
  const today = localToday();
  const cutoff = new Date(Date.parse(today) - 30 * 86400000).toISOString().slice(0, 10);
  return collected
    .filter(item => item.title && item.status !== 'unconfirmed' && item.date >= cutoff && item.date <= today && activeOffer(item) && !seen.has(redact(item.title)) && seen.add(redact(item.title)))
    .sort((a, b) => (b.importance || 3) - (a.importance || 3) || (b.date || '').localeCompare(a.date || ''))
    .slice(0, 4);
}

function signalList() {
  const signals = highValueSignals();
  if (!signals.length) return emptyResearch('本期暂无已核验且仍有时效的重大情报。');
  return signals.map((signal, index) => {
    const meta = MARKET_META[signal.marketCode];
    return `<article class="signal-item">
      <span class="signal-index">0${index + 1}</span>
      <div class="signal-copy"><div class="signal-meta"><span>${escapeHtml(signal.category)}</span><span>${meta?.flag || ''} ${escapeHtml(meta?.name || signal.marketCode)} · ${escapeHtml(signal.brand)}</span><time>${escapeHtml(signal.date || '日期待核实')}</time></div><h3>${escapeHtml(signal.title)}</h3><p>${escapeHtml(compact(signal.summary || '详细影响等待进一步核验。', 150))}</p></div>
      <div class="signal-action">${sourceLink(signal.sourceIds, '原始来源')}<a href="#/market/${signal.marketCode}">相关市场 →</a></div>
    </article>`;
  }).join('');
}

function countryEntryCard(market) {
  const meta = MARKET_META[market.code];
  const fact = marketCard(market.code)?.entrySummary || keyMarketFact(market.code);
  const pool = state.data.competitorPools.find(item => item.marketCode === market.code);
  return `<a class="market-entry-card" href="#/market/${market.code}">
    <div class="market-entry-top"><span class="country-flag">${meta.flag}</span><span>${market.code}</span></div>
    <h3>${escapeHtml(meta.name)}</h3>
    <p>${escapeHtml(compact(fact?.value || fact?.note || '等待下一轮研究更新。', 115))}</p>
    <div class="market-entry-foot"><span>${pool?.entries?.length || 0} 个重点竞品</span><strong>进入国家详情 →</strong></div>
  </a>`;
}

function getPrice(vehicle) {
  const prices = [...(vehicle?.prices || [])].map(item => item.price).filter(price => Number.isFinite(price?.amount)).sort((a,b) => (b.observedAt || b.verifiedAt || '').localeCompare(a.observedAt || a.verifiedAt || ''));
  return prices.find(price => price.status === 'confirmed') || prices[0];
}

function getSale(vehicle) {
  return [...(vehicle?.salesRecords || [])].sort((a,b) => (b.volume?.periodEnd || b.volume?.period || '').localeCompare(a.volume?.periodEnd || a.volume?.period || ''))[0]?.volume;
}

function getOffer(vehicle) {
  const local = vehicle?.researchV2?.dealerOffers?.find(activeOffer);
  if (local) return { title: `${local.variant || '当地报价'}：${Number.isFinite(local.offerPrice) ? money(local.offerPrice, local.currency) : Number.isFinite(local.monthlyPayment) ? `月供 ${money(local.monthlyPayment, local.currency)}` : '条件待核实'}` };
  return vehicle?.financeOffers?.find(activeOffer) || vehicle?.recentEvents?.find(activeOffer) || null;
}

function marketCard(code) {
  return state.data.globalOverview.countryCards.find(card => card.marketCode === code);
}

function newsItems() {
  const items = [];
  for (const market of state.data.markets) {
    const card = marketCard(market.code);
    const meta = MARKET_META[market.code];
    if (card?.importantMarketNews?.status !== 'not_found') {
      items.push({ marketCode: market.code, country: meta.name, flag: meta.flag, category: '市场变化', title: `${meta.name}市场重要变化`, fact: card.importantMarketNews });
    }
    if (card?.importantCompetitorAction?.status !== 'not_found') {
      items.push({ marketCode: market.code, country: meta.name, flag: meta.flag, category: '竞品行动', title: `${meta.name}竞品最新动作`, fact: card.importantCompetitorAction });
    }
  }
  return items.sort((a, b) => (b.fact.verifiedAt || '').localeCompare(a.fact.verifiedAt || '')).slice(0, 6);
}

function overview() {
  updateNav('overview');
  breadcrumb.textContent = 'Marketing Buddy / C级 Sedan / 情报总览';
  const confidence = reportConfidence();
  app.innerHTML = `
    <section class="page-hero overview-hero">
      <div class="hero-copy">
        <span class="hero-kicker">MARKETING BUDDY · C-CLASS SEDAN</span>
        <h1>重要的事，<br><em>一眼看清。</em></h1>
        <p>只保留会影响定价、上市节奏、竞争策略和物流安排的市场情报。</p>
      </div>
      <aside class="confidence-card">
        <span>CORE FACT CONFIDENCE · 核心摘要可信度</span>
        <div class="confidence-score"><strong>${confidence.score}</strong><small>%</small></div>
        <b>${escapeHtml(confidence.label)} · 规则估算</b>
        <div class="confidence-bar ${confidence.tone}"><i style="width:${confidence.score}%"></i></div>
        <p>当前仅评估四国市场、政策与竞品摘要的已收录事实；不是全站准确率。</p>
        <small class="confidence-criteria">绿色 &gt;80：较高可信 · 蓝色 60–80：基础可用</small>
        <small class="confidence-method">判断依据：来源级别 40% · 核验状态 45% · 更新时效 15%。仅评核心摘要，不代表全站事实准确率。</small>
        <div class="completeness-mini"><span>信息完整度</span><strong>${confidence.completeness}%</strong><p>衡量内容全不全，不判断真伪。</p></div>
        <time>最近核验 ${escapeHtml(confidence.updatedAt)}</time>
      </aside>
    </section>

    ${sectionTitle('01 · INTELLIGENCE BRIEF', '本期高价值情报', '跨市场选择最重要的竞品动作、营销活动、新车发布或政策变化，不按国家平均分配。')}
    <section class="signal-list">${signalList()}</section>

    ${sectionTitle('02 · COUNTRY ENTRIES', '各国情报入口', '每张卡片展示当前最重要的信息，点击进入国家详情。')}
    <section class="market-entry-grid">${state.data.markets.map(countryEntryCard).join('')}</section>

    <section class="principle-strip"><strong>信息准入原则</strong><span>影响价格</span><span>影响上市</span><span>影响竞争</span><span>影响物流</span><p>缺少可靠来源的销量和排名不展示。</p></section>`;
}

function newsCard(item, featured = false) {
  const date = item.fact.verifiedAt ? item.fact.verifiedAt.slice(0, 10) : '日期待核实';
  return `<article class="news-card ${featured ? 'featured' : ''}">
    <div class="news-meta"><span>${item.flag} ${escapeHtml(item.country)}</span><span>${escapeHtml(item.category)}</span><time>${escapeHtml(date)}</time></div>
    <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(compact(item.fact.value || item.fact.note, featured ? 220 : 150))}</p>
    <div class="news-footer"><a href="#/market/${item.marketCode}">查看国家详情 →</a>${sourceLink(item.fact.sourceIds)}</div>
  </article>`;
}

function marketPage(code) {
  updateNav('markets');
  const market = state.data.markets.find(item => item.code === code) || state.data.markets[0];
  const meta = MARKET_META[market.code];
  const card = marketCard(market.code);
  const pool = state.data.competitorPools.find(item => item.marketCode === market.code);
  const entries = pool?.entries || [];
  breadcrumb.textContent = `Marketing Buddy / 国家市场 / ${meta.name}`;
  app.innerHTML = `
    <section class="page-hero country-hero">
      <div class="hero-copy"><span class="hero-kicker">COUNTRY INTELLIGENCE · ${market.code}</span><h1>${meta.flag} ${meta.name}<br><em>C级 Sedan 市场</em></h1><p>${escapeHtml(compact(market.basics?.summary?.value, 190))}</p></div>
      <div class="country-switcher">${state.data.markets.map(item => `<a class="${item.code === market.code ? 'active' : ''}" href="#/market/${item.code}">${MARKET_META[item.code].flag} ${MARKET_META[item.code].name}</a>`).join('')}</div>
    </section>

    ${sectionTitle('01 · WHAT MATTERS', '当地重要变化', '只呈现会影响业务判断的市场、政策和竞品变化。')}
    <section class="highlight-grid">${summaryCard('市场变化', market.code, card?.importantMarketNews)}${policyCard(market.code, market.basics?.taxImportAndPolicy)}${summaryCard('竞品动作', market.code, card?.importantCompetitorAction)}</section>

    ${meta.shipping ? `${sectionTitle('02 · LAUNCH LOGISTICS', '发运周期参考', '从开航计时；海上段为公开航线参考，清关与配送为计划估算。')}${shippingPreview(market)}` : ''}

    ${sectionTitle(meta.shipping ? '03 · COMPETITORS' : '02 · COMPETITORS', '重点竞品', market.code === 'AE' ? '四个 AI 建议竞品继续保留，尚未自动转为正式竞品。' : '进入车型详情查看报价、促销、配置、消费者评价和销量。')}
    <section class="competitor-grid">${entries.map(entry => competitorCard(entry)).join('')}</section>`;
}

function highlightCard(label, fact) {
  const status = fact?.status || 'not_found';
  return `<article class="highlight-card"><div class="card-top"><span>${escapeHtml(label)}</span>${statusPill(status)}</div><p>${escapeHtml(compact(fact?.value || fact?.note || '等待下一轮研究。', 190))}</p>${sourceLink(fact?.sourceIds)}</article>`;
}

function summaryCard(label, code, fact) {
  const conclusion = fact?.conclusion || compact(fact?.value || '等待可靠资料形成结论。', 52);
  const detail = compact(fact?.value || fact?.note || '等待下一轮研究。', 145);
  return `<article class="highlight-card summary-card"><div class="card-top"><span>${escapeHtml(label)}</span>${statusPill(fact?.status || 'not_found')}</div><div class="summary-conclusion"><small>先看结论</small><strong>${escapeHtml(conclusion)}</strong></div><p class="summary-detail">${escapeHtml(detail)}</p>${sourceLink(fact?.sourceIds)}</article>`;
}

function policyCard(code, fact) {
  const conclusion = fact?.conclusion || compact(fact?.value || '政策影响仍需确认。', 52);
  const legalLabel = { in_force: '已生效', scheduled: '已公布，待生效', proposal: '提案，尚未生效' }[fact?.legalStatus];
  const detail = compact(`${legalLabel ? `${legalLabel} · ` : ''}${fact?.value || fact?.note || '等待下一轮研究。'}`, 190);
  return `<article class="highlight-card policy-card"><div class="card-top"><span>政策环境</span>${statusPill(fact?.status || 'not_found')}</div><div class="policy-conclusion"><small>先看结论</small><strong>${escapeHtml(conclusion)}</strong></div><p class="policy-detail">${escapeHtml(detail)}</p>${sourceLink(fact?.sourceIds)}</article>`;
}

function shippingPreview(market) {
  const meta = MARKET_META[market.code];
  const route = market.researchV2?.shippingRoutes?.[0];
  if (!route) return `<section class="shipping-card">${emptyResearch('尚无可靠航线周期；待取得承运人船期和目的港清关记录。')}</section>`;
  const range = days => days ? `${days.min}–${days.max} 天` : '待核实';
  return `<section class="shipping-card">
    <div class="shipping-route-head"><div><span>${meta.flag} ${escapeHtml(route.originPort)} → ${escapeHtml(route.destinationPort)}</span><strong>从船期 / 开航开始计算 · 规划参考</strong></div>${statusPill('unconfirmed')}</div>
    <div class="shipping-line">
      <div class="shipping-stage"><i>01</i><span>船期 / 开航</span><strong>${escapeHtml(route.etd?.value || '实际 ETD 待确认')}</strong><small>${route.etd?.status === 'confirmed' ? '已确认开航日' : '计时起点 · 待确认'}</small></div><div class="shipping-arrow">→</div>
      <div class="shipping-stage"><i>02</i><span>海上运输</span><strong>${range(route.seaTransitDays)}</strong><small>公开航线参考</small></div><div class="shipping-arrow">→</div>
      <div class="shipping-stage"><i>03</i><span>等待 / 清关放行</span><strong>${range(route.portDwellCustomsReleaseDaysEstimate)}</strong><small>研究估算</small></div><div class="shipping-arrow">→</div>
      <div class="shipping-stage"><i>04</i><span>配送与上市准备</span><strong>${range(route.localDeliveryLaunchPreparationDaysEstimate)}</strong><small>计划假设</small></div>
    </div>
    <div class="shipping-scenarios"><span>低位：${escapeHtml(route.lowCaseDays)} 天</span><span>基准：${escapeHtml(route.baseCaseDays)} 天</span><span>高位：${escapeHtml(route.highCaseDays)} 天</span></div>
    <p class="review-rule">${escapeHtml(route.note)} ${sourceLink(route.sourceIds, '航线线索')}</p>
  </section>`;
}

function competitorCard(entry) {
  const vehicle = vehicleMap().get(entry.vehicleId);
  if (!vehicle) return '';
  const price = getPrice(vehicle);
  const sale = getSale(vehicle);
  const offer = getOffer(vehicle);
  const suggested = entry.decisionStatus === 'suggested';
  return `<article class="competitor-card">
    <div class="competitor-head"><div><span>${escapeHtml(vehicle.brand)}</span><h3>${escapeHtml(vehicle.model)}</h3></div>${statusPill(vehicle.researchStatus, suggested)}</div>
    <div class="competitor-data"><div><small>${price?.status === 'confirmed' ? '当地公开价格' : '价格线索 · 待复核'}</small><strong>${money(price?.amount, price?.currency)}</strong></div><div><small>${escapeHtml(sale?.period || '销量')}</small><strong>${Number.isFinite(sale?.value) ? `${number(sale.value)} 辆` : '暂无可靠数据'}</strong></div></div>
    <div class="offer-line"><small>当前优惠 / 动作</small><p>${escapeHtml(compact(offer?.title || '等待 Web AI 补充当地经销商活动。', 90))}</p></div>
    <a class="primary-link" href="#/vehicle/${vehicle.id}">查看完整竞品详情 →</a>
  </article>`;
}

function vehicleSections(vehicle) {
  const offers = vehicle.financeOffers || [];
  const events = [...(vehicle.recentEvents || []), ...(vehicle.marketingActivities || [])];
  return [
    { key: 'performance', no: '01', title: '销量及价格变化', kicker: 'PRICE & SALES', description: '先看当地公开价格、价格变动证据和可靠销量。', body: performanceContent(vehicle) },
    { key: 'offers', no: '02', title: '当地优惠与促销', kicker: 'DEALER OFFERS', description: '经销商报价、金融政策、现金优惠和有效期。', body: dealerOfferContent(vehicle, offers, events) },
    { key: 'selling-points', no: '03', title: '当地官网核心卖点', kicker: 'OFFICIAL SELLING POINTS', description: '当地官网如何定义这款车，以及重点宣传哪些价值。', body: officialSellingContent(vehicle) },
    { key: 'reviews', no: '04', title: '当地消费者真实评价', kicker: 'CONSUMER VOICE', description: '论坛、社交媒体与视频评论中的有限样本线索。', body: reviewContent(vehicle) },
    { key: 'profile', no: '05', title: '用户画像', kicker: 'AUDIENCE PROFILE', description: '目标用户、购车动机、使用场景与决策阻力。', body: userProfileContent(vehicle) },
    { key: 'specs', no: '06', title: '官方配置表及中文翻译', kicker: 'OFFICIAL SPECIFICATIONS', description: '最后查看官方 PDF、配置原文、页码与中文翻译。', body: specificationContent(vehicle) }
  ];
}

function vehicleDetail(id) {
  updateNav('markets');
  const vehicle = state.data.vehicles.find(item => item.id === id);
  if (!vehicle) return notFound();
  const meta = MARKET_META[vehicle.marketCode];
  const pool = state.data.competitorPools.find(item => item.marketCode === vehicle.marketCode);
  const entry = pool?.entries?.find(item => item.vehicleId === vehicle.id);
  const suggested = entry?.decisionStatus === 'suggested';
  const price = getPrice(vehicle);
  const sale = getSale(vehicle);
  const sections = vehicleSections(vehicle);
  breadcrumb.textContent = `Marketing Buddy / ${meta.name} / ${redact(vehicle.brand)} ${redact(vehicle.model)}`;
  app.innerHTML = `
    <a class="back-link" href="#/market/${vehicle.marketCode}">← 返回${meta.name}市场</a>
    <section class="detail-hero">
      <div><span class="hero-kicker">COMPETITOR DETAIL · ${vehicle.marketCode}</span><h1>${escapeHtml(vehicle.brand)}<br><em>${escapeHtml(vehicle.model)}</em></h1><p>${meta.flag} ${meta.name} · ${vehicle.modelYear || '当前年款'} · 数据结构 V2</p></div>
      <div class="detail-summary">${statusPill(vehicle.researchStatus, suggested)}<div><small>${price?.status === 'confirmed' ? '当地公开价格' : '价格线索 · 待复核'}</small><strong>${money(price?.amount, price?.currency)}</strong></div><div><small>${escapeHtml(sale?.period || '销量')}</small><strong>${Number.isFinite(sale?.value) ? `${number(sale.value)} 辆` : '暂无可靠数据'}</strong></div></div>
    </section>

    <div class="single-page-note"><span>单页竞品档案</span><p>除官方配置表外，所有内容直接展开，便于连续浏览和比较。</p></div>
    <section class="detail-sections">
      ${sections.filter(section => section.key !== 'specs').map(section => detailSection(section.no, section.title, section.kicker, section.body)).join('')}
      ${collapsedDetailSection(sections.find(section => section.key === 'specs'))}
    </section>`;
}

function detailSection(no, title, kicker, body) {
  return `<article class="detail-section"><header><div><span>${no} · ${escapeHtml(kicker)}</span><h2>${escapeHtml(title)}</h2></div></header>${body}</article>`;
}

function collapsedDetailSection(section) {
  return `<details class="detail-section spec-collapse"><summary><div><span>${section.no} · ${escapeHtml(section.kicker)}</span><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.description)}</p></div><b>展开配置表 ＋</b></summary><div class="spec-collapse-body">${section.body}</div></details>`;
}

function userProfileContent(vehicle) {
  const profiles = vehicle.researchV2?.audienceProfile || [];
  if (profiles.length) return `<div class="profile-card"><div class="profile-status"><span>研究假设 · 待消费者样本验证</span><p>现有样本不足以确认画像；以下为后续访谈的验证方向。</p></div><div class="single-detail-column">${profiles.map(item => `<div class="offer-block"><strong>${escapeHtml(item.claim)}</strong><p>${escapeHtml(item.validationNeed || '需更多独立用户访谈与评论交叉验证。')}</p>${sourceLink(item.sourceIds || [], '线索来源')}</div>`).join('')}</div></div>`;
  const hasOffers = Boolean(vehicle.financeOffers?.length || vehicle.marketingActivities?.length || vehicle.recentEvents?.length);
  return `<div class="profile-card">
    <div class="profile-status"><span>研究假设 · 待消费者样本验证</span><p>这不是已确认事实；后续需要用评论、论坛及经销商访谈验证。</p></div>
    <div class="profile-grid">
      <div><small>核心人群</small><strong>城市通勤与家庭用车人群</strong><p>以主流家用轿车需求作为初步假设。</p></div>
      <div><small>购车阶段</small><strong>首购或预算型换购</strong><p>需结合当地车主样本确认。</p></div>
      <div><small>主要动机</small><strong>空间、可靠性与日常使用成本</strong><p>等待当地官网卖点和真实评论交叉验证。</p></div>
      <div><small>价格敏感度</small><strong>${hasOffers ? '可能关注首付、月供及现金优惠' : '待研究'}</strong><p>${hasOffers ? '依据当地促销频率形成的推断，不代表已确认用户偏好。' : '暂无足够促销或评论证据。'}</p></div>
    </div>
    <div class="profile-tags"><span>城市通勤</span><span>家庭使用</span><span>价格敏感</span><span>售后保障</span></div>
  </div>`;
}

function dealerOfferContent(vehicle, offers, events) {
  const v2 = (vehicle.researchV2?.dealerOffers || []).filter(activeOffer);
  const legacy = [...offers, ...events].filter(activeOffer);
  const offerRows = [...v2.map(item => ({ ...item, title: `${item.variant || item.channel}：${Number.isFinite(item.offerPrice) ? money(item.offerPrice, item.currency) : Number.isFinite(item.monthlyPayment) ? `月供 ${money(item.monthlyPayment, item.currency)}` : '详情待核实'}`, conditions: `${item.channel}；${item.conditions || ''}。报价条件待核实。` })), ...legacy].slice(0, 5).map(item => `<div class="offer-block"><div><span>${escapeHtml(item.validTo || item.eventDate || '有效期待核实')}</span>${sourceLink(item.sourceIds)}</div><strong>${escapeHtml(item.title || '活动')}</strong><p>${escapeHtml(compact(item.conditions || item.description || item.whyItMatters || '', 180))}</p></div>`).join('');
  const warranty = (vehicle.aftersales || []).map(item => `<li><span>${escapeHtml(item.type)}</span><strong>${escapeHtml(item.detail?.value || item.detail?.note || '待研究')}</strong>${sourceLink(item.detail?.sourceIds)}</li>`).join('');
  return `<div class="single-detail-column"><h3>优惠与促销</h3>${offerRows || emptyResearch('当前没有已核验活动。')}</div>${warranty ? `<div class="warranty-strip"><h3>售后参考</h3><ul>${warranty}</ul></div>` : ''}`;
}

function performanceContent(vehicle) {
  const prices = vehicle.prices || [];
  const records = vehicle.salesRecords || [];
  const priceRows = prices.map(item => `<div class="data-row"><div><small>${escapeHtml(item.price?.priceType || 'price')}</small><strong>${escapeHtml(item.price?.variantId || item.id)}</strong></div><b>${money(item.price?.amount, item.price?.currency)}</b>${sourceLink(item.price?.sourceIds)}</div>`).join('');
  const salesRows = records.map(record => `<div class="sales-row"><div><span>${escapeHtml(record.volume?.period || '统计期')}</span><small>${escapeHtml(record.volume?.unit || 'vehicles')} · ${escapeHtml(record.volume?.status || 'unknown')}</small></div><strong>${number(record.volume?.value)} 辆</strong>${sourceLink(record.volume?.sourceIds)}</div>`).join('');
  const secondary = (vehicle.researchV2?.priceNotes || []).slice(0, 3).map(item => `<div class="data-row"><div><small>待复核价格线索</small><strong>${escapeHtml(item.variant || '版本待确认')}</strong></div><b>${money(item.amount, item.currency)}</b>${sourceLink(item.sourceIds)}</div>`).join('');
  return `<div class="detail-columns"><div><h3>公开价格与变化</h3>${priceRows || emptyResearch('暂无可核验官方价格。')}${secondary}<div class="trend-note"><strong>价格变化</strong><p>不同版本的价格不是涨跌。需同一版本、相同口径的历史记录才能判断变化。</p></div></div><div><h3>销量与市场表现</h3>${salesRows || emptyResearch('暂无可靠公开销量；网站不会展示估算值。')}</div></div><p class="review-rule">第三方报价均标为待复核；不同版本、统计周期和数据口径不得直接比较。</p>`;
}

function specificationContent(vehicle) {
  const translated = vehicle.researchV2?.officialSpecifications || [];
  if (translated.length) return `<div class="single-detail-column">${translated.map(item => `<div class="offer-block"><div><span>${escapeHtml(item.variant || item.modelYear || '官方配置')}</span>${sourceLink(item.sourceIds, '官方文件')}</div><strong>${escapeHtml(item.chineseTranslation)}</strong><p>${escapeHtml(item.originalText)}</p><small>${escapeHtml(item.reference || '')}</small></div>`).join('')}</div>`;
  const specs = vehicle.specifications || [];
  if (!specs.length) return emptyResearch('尚未取得当地官方 PDF 或配置器资料。');
  return `<div class="spec-table"><div class="spec-head"><span>项目</span><span>当地公开值</span><span>中文说明 / 来源</span></div>${specs.map(item => `<div class="spec-row"><span>${escapeHtml(item.label || item.key)}</span><strong>${escapeHtml(item.fact?.value)} ${escapeHtml(item.fact?.unit || '')}</strong><span>${sourceLink(item.fact?.sourceIds, '原始依据')}</span></div>`).join('')}</div><p class="review-rule">原文及逐项中文翻译仍待补齐。</p>`;
}

function officialSellingContent(vehicle) {
  const points = vehicle.researchV2?.officialSellingPoints || [];
  if (!points.length) return emptyResearch('当地官网卖点尚未取得可核验原文。');
  return `<div class="single-detail-column">${points.map(item => `<div class="offer-block"><div><span>当地官网</span>${sourceLink(item.sourceIds, '官方来源')}</div><strong>${escapeHtml(item.chineseSummary)}</strong><p>${escapeHtml(item.localText)}</p><small>${escapeHtml(item.relatedSpec || '')}</small></div>`).join('')}</div>`;
}

function reviewContent(vehicle) {
  const feedback = vehicle.researchV2?.consumerFeedback;
  if (!feedback?.sampleSize) return reviewPlaceholder();
  const themes = [...(feedback.positiveThemes || []), ...(feedback.negativeThemes || [])].slice(0, 5);
  return `<div class="single-detail-column"><h3>有限样本线索 · ${feedback.sampleSize} 条 / 帖</h3>${themes.map(item => `<div class="offer-block"><strong>${escapeHtml(item.theme)}</strong><p>仅 ${escapeHtml(item.threads || 1)} 条讨论支持，不能视为高频评价。</p>${sourceLink(item.sourceIds, '原帖')}</div>`).join('')}</div><p class="review-rule">平台：${escapeHtml((feedback.platforms || []).join('、'))}。${escapeHtml(feedback.limitations || '样本不足，仍需核验。')}</p>`;
}

function reviewPlaceholder() {
  return `<div class="review-layout"><div class="review-column positive"><span>高频好评</span>${emptyResearch('等待论坛、社交平台及视频评论样本。')}</div><div class="review-column negative"><span>高频差评与争议</span>${emptyResearch('至少 5 条独立评价才标记为高频。')}</div></div><p class="review-rule">允许匿名短引文；必须记录平台、样本数量、时间范围，并排除疑似广告和重复内容。</p>`;
}

function salesContent(vehicle) {
  const records = vehicle.salesRecords || [];
  if (!records.length) return emptyResearch('暂无可靠公开销量；网站不会展示估算值。');
  return `<div class="sales-list">${records.map(record => `<div class="sales-row"><div><span>${escapeHtml(record.volume?.period || '统计期')}</span><small>${escapeHtml(record.volume?.unit || 'vehicles')} · ${escapeHtml(record.volume?.status || 'unknown')}</small></div><strong>${number(record.volume?.value)} 辆</strong>${sourceLink(record.volume?.sourceIds)}</div>`).join('')}</div><p class="review-rule">不同统计周期和口径不得直接比较；二级数据库必须保留“待复核”状态。</p>`;
}

function emptyResearch(message) {
  return `<div class="empty-research"><span>待研究</span><p>${escapeHtml(message)}</p></div>`;
}

function notFound() {
  app.innerHTML = `<section class="not-found"><strong>404</strong><h1>没有找到这个页面</h1><a href="#/overview">返回情报总览</a></section>`;
}

function router() {
  if (!state.data) return;
  window.scrollTo(0, 0);
  const [route = 'overview', id, subsection] = location.hash.replace(/^#\//, '').split('/');
  if (route === 'overview') overview();
  else if (route === 'market') marketPage(id || 'MX');
  else if (route === 'vehicle') vehicleDetail(id, subsection);
  else notFound();
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('#drawerBackdrop').classList.remove('open');
}

async function init() {
  loading();
  try {
    if (window.MB_DATA) state.data = window.MB_DATA;
    else {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.data = await response.json();
    }
    router();
  } catch (error) {
    app.innerHTML = `<section class="not-found"><strong>!</strong><h1>数据加载失败</h1><p>请确认 data 文件夹与网站文件保持在同一目录。</p></section>`;
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
