import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const root = path.resolve(import.meta.dirname, '..', '..');
export const config = JSON.parse(fs.readFileSync(path.join(root, 'automation/weekly.config.json'), 'utf8'));
const trust = JSON.parse(fs.readFileSync(path.join(root, 'automation/source-trust.json'), 'utf8')).rules;
// Retain the existing private-name check without literal private names in public source.
const blocked = ['ZW1ncmFuZA==', 'ZW1ncm91bmQ=', '5ZCJ5Yip5bid6LGq', 'YXV0b2ludGVs', 'Z2VlbHk='].map(x => Buffer.from(x, 'base64').toString());
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const writeJson = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); };
export function canonical(value) {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
}
export const hash = value => crypto.createHash('sha256').update(canonical(value)).digest('hex');
export function substantiveHash(value) {
  const copy=structuredClone(value);
  walk(copy,obj=>{ for(const key of ['verifiedAt','observedAt','checkedAt','accessedAt','researchedAt']) delete obj[key]; });
  return hash(copy);
}
export const assert = (condition, message) => { if (!condition) throw new Error(message); };
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const isoDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
export function timestamp(value, asOf = today()) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && Date.parse(value) <= Date.parse(asOf + 'T23:59:59.999+08:00');
}
export function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(url.hostname) && url.hostname.includes('.');
  } catch { return false; }
}
export function privacy(value) {
  let text = (typeof value === 'string' ? value : JSON.stringify(value)).normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').toLowerCase();
  try { text+=' '+decodeURIComponent(text); } catch { /* malformed URI text is still scanned in its original form */ }
  assert(!blocked.some(term => text.includes(term.toLowerCase())), 'Private product identifier in public content');
  assert(!/c级\s*sedan.{0,16}\b(gf|gc)\b/i.test(text),'Internal trim comparison placeholder in public content');
  assert(!/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|github_pat_[a-z0-9_]{20,}|gh[pousr]_[a-z0-9]{20,}|sk-[a-z0-9_-]{30,}/i.test(text), 'Possible credential in public content');
}
export function walk(value, fn, pointer = '$') {
  if (!value || typeof value !== 'object') return;
  fn(value, pointer);
  for (const [key, child] of Object.entries(value)) {
    assert(!['__proto__', 'constructor', 'prototype'].includes(key), `Unsafe key at ${pointer}`);
    walk(child, fn, `${pointer}.${key}`);
  }
}
export function sourceRoles(source, market) {
  if (!source || !safeUrl(source.url)) return [];
  const url = new URL(source.url);
  return [...new Set(trust.filter(rule => (url.hostname === rule.host || url.hostname.endsWith('.' + rule.host)) && rule.markets.includes(market) && (!rule.paths || rule.paths.some(prefix => url.pathname.startsWith(prefix)))).flatMap(rule => rule.roles))];
}
export function validateSnapshot(data) {
  privacy(data);
  assert(data.schemaVersion === 'marketing-buddy-v2-public', 'Unknown public schema');
  assert(data.project?.name === 'Marketing Buddy' && data.project?.scope === 'C级 Sedan', 'Brand or scope changed');
  assert(data.markets?.length === 4 && new Set(data.markets.map(m => m.code)).size === 4, 'Exactly four unique markets required');
  assert(data.vehicles?.length === 10 && new Set(data.vehicles.map(v => v.id)).size === 10, 'Exactly ten unique competitors required');
  const ids = new Set();
  for (const source of data.sources || []) {
    assert(source.id && !ids.has(source.id), `Duplicate or missing source ID: ${source.id}`); ids.add(source.id);
    assert(safeUrl(source.url) && source.title && source.publisher && source.sourceType && timestamp(source.accessedAt), `Invalid source: ${source.id}`);
    assert(Object.keys(config.competitors).includes(source.marketCode), `Unknown source market: ${source.id}`);
  }
  for (const [code, expected] of Object.entries(config.competitors)) {
    assert(data.markets.some(m => m.code === code), `Missing market ${code}`);
    const vehicles = data.vehicles.filter(v => v.marketCode === code).map(v => v.id).sort();
    assert(canonical(vehicles) === canonical([...expected].sort()), `Competitor pool changed in ${code}`);
    const pool = data.competitorPools?.find(p => p.marketCode === code);
    assert(pool && canonical(pool.entries.map(e => e.vehicleId).sort()) === canonical([...expected].sort()), `Pool entries changed in ${code}`);
    assert(pool.entries.every(e => e.decisionStatus === (code === 'AE' ? 'suggested' : 'fixed')), `Governance changed in ${code}`);
    assert(data.globalOverview?.countryCards?.filter(c => c.marketCode === code).length === 1, `Country card missing or duplicated: ${code}`);
  }
  walk(data, (value, pointer) => {
    if (Array.isArray(value.sourceIds)) for (const id of value.sourceIds) assert(ids.has(id), `Broken citation ${id} at ${pointer}`);
    if (value.status === 'confirmed') assert(value.sourceIds?.length, `Confirmed fact without source at ${pointer}`);
    if (value.verifiedAt) assert(timestamp(value.verifiedAt), `Future or invalid verification date at ${pointer}`);
    if ('amount' in value && value.amount !== null) assert(Number.isFinite(value.amount) && value.amount >= 0, `Invalid price at ${pointer}`);
  });
  const signals = data.globalOverview?.highValueSignals || [];
  assert(Array.isArray(signals) && signals.length <= 4, 'At most four high-value signals');
  assert(new Set(signals.map(s => s.id)).size === signals.length, 'Duplicate signal ID');
  return data;
}
export function locate(data, entity, id) {
  const target = entity === 'vehicle' ? data.vehicles.find(v => v.id === id)
    : entity === 'market' ? data.markets.find(m => m.code === id)
    : entity === 'countryCard' ? data.globalOverview.countryCards.find(c => c.marketCode === id)
    : entity === 'overview' && id === 'global' ? data.globalOverview : null;
  assert(target, `Unknown target ${entity}:${id}`); return target;
}
export const getField = (target, field) => field.split('.').reduce((value, key) => value?.[key], target) ?? null;
export function setField(target, field, value) {
  const keys = field.split('.'); let parent = target;
  for (const key of keys.slice(0, -1)) parent = parent[key] ||= {};
  parent[keys.at(-1)] = structuredClone(value);
}
export function allowed(entity, field) {
  return (config[`${entity}Fields`] || []).includes(field);
}
export function targets(data) {
  return [
    ...data.vehicles.flatMap(v => config.vehicleFields.map(field => ({entity:'vehicle',id:v.id,field}))),
    ...data.markets.flatMap(m => config.marketFields.map(field => ({entity:'market',id:m.code,field}))),
    ...data.globalOverview.countryCards.flatMap(c => config.countryCardFields.map(field => ({entity:'countryCard',id:c.marketCode,field}))),
    ...config.overviewFields.map(field => ({entity:'overview',id:'global',field}))
  ].map(target => ({...target, beforeHash:hash(getField(locate(data,target.entity,target.id),target.field))}));
}
export function mergeSources(baseSources, additions) {
  const result = structuredClone(baseSources); const map = new Map(result.map(s => [s.id,s]));
  for (const source of additions || []) {
    assert(source.id && safeUrl(source.url), 'Invalid proposed source');
    const prior = map.get(source.id);
    if (prior) assert(canonical(prior) === canonical(source), `Source ID is immutable; use a new ID: ${source.id}`);
    else { result.push(structuredClone(source)); map.set(source.id, source); }
  }
  return result;
}
function refs(value) {
  const ids = new Set(); walk(value, obj => (obj.sourceIds || []).forEach?.(id => ids.add(id))); return [...ids];
}
function changedRows(oldValue, newValue) {
  if (!Array.isArray(newValue)) return [newValue];
  const oldHashes = new Set((Array.isArray(oldValue) ? oldValue : []).map(hash));
  return newValue.filter(item => !oldHashes.has(hash(item)));
}
function validateEvidence(evidence, sources, market, vehicleId, asOf, requireExcerpt) {
  assert(evidence?.id && evidence.sourceId && ['direct_page','direct_pdf','direct_dataset','forum_post','video_comment'].includes(evidence.kind), 'Evidence must be read directly; search snippets are not evidence');
  const source = sources.get(evidence.sourceId);
  assert(source && source.marketCode === market, `Evidence market mismatch: ${evidence.id}`);
  assert(evidence.url === source.url && safeUrl(evidence.url), `Evidence URL mismatch: ${evidence.id}`);
  assert(timestamp(evidence.checkedAt, asOf) && evidence.checkedAt.slice(0,10) >= asOf, `Evidence must be checked on the run date: ${evidence.id}`);
  assert(evidence.scope?.marketCode === market && (!vehicleId || evidence.scope?.vehicleId === vehicleId), `Evidence scope mismatch: ${evidence.id}`);
  assert(typeof evidence.locator === 'string' && evidence.locator.trim().length >= 3, `Evidence locator missing: ${evidence.id}`);
  if (requireExcerpt) assert(typeof evidence.excerpt === 'string' && evidence.excerpt.trim().length >= 8 && evidence.excerpt.length <= 600, `Short supporting excerpt required: ${evidence.id}`);
  else assert(/^[a-f0-9]{64}$/.test(evidence.excerptHash || ''), `Evidence digest missing: ${evidence.id}`);
  return source;
}
function hasRole(sourceIds, sources, market, roles) {
  return sourceIds.some(id => sourceRoles(sources.get(id), market).some(role => roles.includes(role)));
}
export function validateOperation(base, next, operation, evidenceAll, asOf, requireExcerpt = true) {
  const {entity,id,field,value} = operation;
  assert(allowed(entity,field), `Field not allowed: ${entity}.${field}`);
  const oldTarget = locate(base,entity,id); const oldValue = getField(oldTarget,field);
  assert(operation.beforeHash === hash(oldValue), `Stale data at ${entity}:${id}.${field}`);
  assert(value !== undefined && value !== null, `Use an explicit empty array/object, not null: ${field}`);
  if (operation.reasonType === 'expiry') {
    assert(['financeOffers','marketingActivities','recentEvents','researchV2.dealerOffers','highValueSignals'].includes(field), 'Expiry removal applies only to offers/events/signals');
    assert(Array.isArray(oldValue) && Array.isArray(value), 'Expiry requires arrays');
    assert(value.every(item => oldValue.some(old => hash(old) === hash(item))), 'Expiry operation cannot add or alter rows');
    const removed = oldValue.filter(old => !value.some(item => hash(item) === hash(old)));
    const cutoff=new Date(Date.parse(asOf)-config.signalWindowDays*86400000).toISOString().slice(0,10);
    assert(removed.length > 0 && removed.every(item => (isoDate(item.validTo) && item.validTo < asOf) || (field==='highValueSignals'&&isoDate(item.date)&&item.date<cutoff)), 'Only provably expired rows can be removed without new evidence');
    return;
  }
  assert(operation.reason && operation.review?.verdict === 'supported' && operation.review.scopeMatches === true && operation.review.current === true && operation.review.conflictsResolved === true, `Self-review missing or unresolved: ${operation.changeId}`);
  const sources = new Map(next.sources.map(s => [s.id,s]));
  const target = locate(next,entity,id);
  const market = entity === 'vehicle' ? target.marketCode : entity === 'overview' ? null : id;
  const evidence = (operation.evidenceIds || []).map(eid => {const item=evidenceAll.get(eid); assert(item,`Missing evidence ${eid}`); return item;});
  assert(evidence.length > 0, `No evidence: ${operation.changeId}`);
  for (const item of evidence) validateEvidence(item,sources,market || item.scope?.marketCode,entity === 'vehicle' ? id : null,asOf,requireExcerpt);
  const supported = new Set(evidence.map(item=>item.sourceId));
  for (const row of changedRows(oldValue,value)) {
    const sourceIds = refs(row);
    const rowMarket = market || row?.marketCode;
    if (field !== 'researchV2.audienceProfile' || row?.sourceIds?.length) assert(sourceIds.some(sid=>supported.has(sid)), `Changed row has no matching fresh evidence: ${operation.changeId}`);
    walk(row,(obj)=> {
      if (obj.status === 'confirmed') {
        assert(obj.sourceIds.some(sid=>supported.has(sid)), `Confirmed row missing fresh evidence: ${operation.changeId}`);
        assert(timestamp(obj.verifiedAt,asOf) && obj.verifiedAt.slice(0,10) === asOf, `Confirmed row must record current verification: ${operation.changeId}`);
      }
    });
    if (field === 'basics.taxImportAndPolicy') {
      assert(row.status === 'confirmed' && row.conclusion && isoDate(row.effectiveFrom) && row.applicabilityCaveat, 'Policy requires conclusion, effective date and applicability caveat');
      assert(['in_force','scheduled','proposal'].includes(row.legalStatus), 'Policy must distinguish in-force, scheduled and proposed rules');
      if(row.legalStatus==='in_force') assert(row.effectiveFrom<=asOf,'Future policy cannot be labeled in force');
      if(row.legalStatus==='scheduled') assert(row.effectiveFrom>asOf,'Scheduled policy must have a future effective date');
      assert(hasRole(sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['policy']), 'Policy needs an allowlisted original government/legal source');
      assert(evidence.some(e=>e.kind==='direct_pdf'||e.kind==='direct_page'||e.kind==='direct_dataset'), 'Original policy text must be read');
    }
    if (['basics.summary','importantMarketNews','importantCompetitorAction','entrySummary'].includes(field)) {
      assert(typeof row.value === 'string' && row.value.length <= 900 && row.conclusion, 'Summary needs concise value and conclusion');
      if(row.status==='confirmed') assert(hasRole(sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['policy','sales','local_official','dealer','regional_official']), 'Confirmed summary needs primary evidence');
    }
    if (field === 'prices') {
      const price = row.price;
      assert(price && Number.isFinite(price.amount) && price.amount > 0 && /^[A-Z]{3}$/.test(price.currency) && price.variantId && price.priceType && price.condition, 'Price needs amount, currency, exact variant, price type and tax/fee conditions');
      if(price.status==='confirmed') assert(hasRole(price.sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['local_official','dealer']), 'Confirmed price needs local official/dealer evidence');
    }
    if (field === 'salesRecords') {
      assert(row.volume?.status === 'confirmed' && Number.isInteger(row.volume.value) && row.volume.value >= 0 && row.volume.period && row.volume.metric && row.volume.scopeNote && isoDate(row.volume.periodStart) && isoDate(row.volume.periodEnd) && row.volume.periodStart<=row.volume.periodEnd && row.volume.periodEnd<=asOf, 'Sales need reliable volume, exact period, metric and scope');
      assert(hasRole(sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['sales']), 'Sales must come from an allowlisted original statistical source');
    }
    if (field === 'researchV2.officialSpecifications' || field === 'specifications') {
      assert(hasRole(sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['local_official']), 'Specifications need local official evidence');
      if(field.includes('officialSpecifications')) assert(row.originalText && row.chineseTranslation && row.reference && row.variant, 'Specification translation needs original, translation, locator and variant');
    }
    if (field === 'researchV2.officialSellingPoints') assert(row.localText && row.chineseSummary && hasRole(sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['local_official','regional_official']), 'Selling point needs official original text and Chinese summary');
    if (field === 'aftersales' && row.detail?.status==='confirmed') assert(hasRole(sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['local_official','dealer']), 'Confirmed warranty needs local official/dealer evidence');
    if (['financeOffers','researchV2.dealerOffers','marketingActivities','recentEvents'].includes(field)) {
      assert(row.conditions || row.description, 'Offer/event conditions or description missing');
      if (row.status==='confirmed') assert(hasRole(sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['local_official','dealer']) && isoDate(row.validFrom || row.eventDate), 'Confirmed offer/event needs local evidence and start/event date');
      if (field.includes('Offers') && row.status==='confirmed') assert(isoDate(row.validTo) && row.validTo >= asOf, 'Confirmed offer must have a valid end date');
      if (row.validTo) assert(isoDate(row.validTo), 'Invalid offer expiry');
    }
    if (field === 'researchV2.audienceProfile') assert(row.basis==='hypothesis' && row.claim && row.validationNeed, 'User profiles remain explicit hypotheses with validation needs');
    if (field === 'researchV2.consumerFeedback') {
      assert(Array.isArray(row.samples) && row.sampleSize === row.samples.length && row.limitations && Array.isArray(row.platforms), 'Feedback requires a deduplicated sample register and limitations');
      const sampleIds=new Set(row.samples.map(s=>s.id));
      assert(sampleIds.size===row.samples.length, 'Duplicate consumer sample IDs');
      const independent=new Set(row.samples.map(s=>s.independenceKey));
      assert(independent.size===row.samples.length && !independent.has(undefined), 'Consumer samples must be independently deduplicated');
      for(const sample of row.samples) assert(sample.id && supported.has(sample.sourceId) && ['self_reported_owner','verified_owner','unknown'].includes(sample.ownerStatus) && timestamp(sample.observedAt,asOf), 'Consumer samples need linked direct evidence, owner status and date');
      for(const theme of [...(row.positiveThemes||[]),...(row.negativeThemes||[])]) assert(theme.sampleIds?.length && theme.sampleIds.every(s=>sampleIds.has(s)) && theme.threads===new Set(theme.sampleIds).size, 'Theme counts must match independent sample IDs');
    }
    if (field === 'researchV2.shippingRoutes') {
      assert(rowMarket!=='KZ','KZ has no shipping timeline in the current product scope');
      assert(row.timingStart==='vessel_departure' && row.originPort && row.destinationPort && row.transportMode && row.directOrTransshipment && row.note, 'Shipping route metadata and assumptions missing');
      const stages=[row.seaTransitDays,row.portDwellCustomsReleaseDaysEstimate,row.localDeliveryLaunchPreparationDaysEstimate];
      for(const stage of stages) assert(stage && Number.isFinite(stage.min) && Number.isFinite(stage.max) && stage.min>=0 && stage.max>=stage.min, 'Invalid shipping range');
      assert(row.portDwellCustomsReleaseDaysEstimate.kind==='estimate' && row.localDeliveryLaunchPreparationDaysEstimate.kind==='estimate', 'Customs and local delivery must remain labeled estimates');
      assert(['container','roro','sea_unspecified'].includes(row.transportMode), 'Shipping mode must distinguish container and RoRo evidence');
      assert(row.lowCaseDays===stages.reduce((s,x)=>s+x.min,0) && row.highCaseDays===stages.reduce((s,x)=>s+x.max,0) && row.baseCaseDays>=row.lowCaseDays && row.baseCaseDays<=row.highCaseDays, 'Shipping totals do not match stage ranges');
      assert(row.confidence==='low'||row.confidence==='medium', 'Public route references cannot be high-confidence booked commitments');
      if(!hasRole(sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['carrier'])) assert(row.confidence==='low', 'Forwarder-only shipping must be low confidence');
      if(row.etd?.status==='confirmed') assert(isoDate(row.etd.value)&&hasRole((row.etd.sourceIds||[]).filter(s=>supported.has(s)),sources,rowMarket,['carrier']),'Confirmed ETD needs dated original carrier evidence');
    }
    if (field === 'highValueSignals') {
      assert(row.id && Object.keys(config.competitors).includes(row.marketCode) && row.title && row.summary && isoDate(row.date) && row.date<=asOf && row.date>=new Date(Date.parse(asOf)-config.signalWindowDays*86400000).toISOString().slice(0,10), 'Signal requires current event date and market');
      assert(row.status==='confirmed' && hasRole(sourceIds.filter(s=>supported.has(s)),sources,rowMarket,['policy','sales','local_official','dealer','regional_official','carrier']), 'High-value signals need confirmed primary evidence');
      assert(row.importance>=1 && row.importance<=5, 'Signal importance must be 1–5');
    }
  }
}

export function applySubmission(base, submission) {
  validateSnapshot(base);
  assert(submission.schemaVersion==='marketing-buddy-weekly-submission-v1', 'Unsupported weekly submission');
  const run=submission.run;
  assert(run && /^[a-z0-9][a-z0-9-]{5,79}$/.test(run.id) && isoDate(run.asOf) && run.asOf===today(), 'Run ID and current Shanghai run date required');
  assert(isoDate(run.windowStart)&&isoDate(run.windowEnd)&&run.windowStart<=run.windowEnd&&run.windowEnd===run.asOf,'Research window must end on the run date');
  assert(submission.baseDataHash===hash(base), 'Submission is based on a different website snapshot; inspect latest data again');
  assert(Array.isArray(submission.changes) && submission.changes.length<=config.maxChanges, 'Invalid change list');
  assert(submission.review?.completed===true && submission.review.conflictsSeparated===true && submission.review.privacyChecked===true, 'Final review attestations missing');
  for(const marketCode of Object.keys(config.competitors)) for(const category of config.coverageCategories) {
    const rows=(submission.coverage||[]).filter(row=>row.marketCode===marketCode&&row.category===category);
    assert(rows.length===1,`Missing or duplicate coverage record: ${marketCode}/${category}`);
    const row=rows[0];
    assert(['checked_no_change','updated','not_found','blocked','not_applicable'].includes(row.state)&&row.note,`Incomplete coverage record: ${marketCode}/${category}`);
    if(row.state==='not_applicable') assert(marketCode==='KZ'&&category==='shipping','Only KZ shipping may be not_applicable');
    else assert(Array.isArray(row.queries)&&row.queries.length>0,`Queries/attempts not recorded: ${marketCode}/${category}`);
    if(row.state==='checked_no_change') assert(row.sourceIds?.length,`No-change claim needs checked sources: ${marketCode}/${category}`);
  }
  const evidence = new Map((submission.evidence||[]).map(e=>[e.id,e]));
  assert(evidence.size===(submission.evidence||[]).length, 'Duplicate evidence ID');
  const next=structuredClone(base); next.sources=mergeSources(base.sources,submission.sources);
  const actual=[]; const seen=new Set();
  for(const operation of submission.changes) {
    assert(operation.changeId && !seen.has(operation.changeId), 'Duplicate or absent change ID'); seen.add(operation.changeId);
    const key=`${operation.entity}:${operation.id}.${operation.field}`;
    assert(!actual.some(c=>c.key===key), `Field changed twice: ${key}`);
    assert(allowed(operation.entity,operation.field), `Field not allowed: ${operation.entity}.${operation.field}`);
    const target=locate(next,operation.entity,operation.id);
    assert(operation.beforeHash===hash(getField(locate(base,operation.entity,operation.id),operation.field)), `Stale data at ${key}`);
    if(substantiveHash(getField(target,operation.field))===substantiveHash(operation.value)) continue;
    validateOperation(base,next,operation,evidence,run.asOf,true);
    setField(target,operation.field,operation.value);
    actual.push({...operation,key});
  }
  if(!actual.length) return {data:base,manifest:null,changed:false};
  next.generatedAt=run.asOf;
  next.lastUpdate={runId:run.id,asOf:run.asOf,windowStart:run.windowStart,windowEnd:run.windowEnd};
  validateSnapshot(next);
  const manifest={schemaVersion:'marketing-buddy-weekly-release-v1',run:structuredClone(run),baseDataHash:hash(base),dataHash:hash(next),review:submission.review,
    changes:actual.map(({value,key,...operation})=>({...operation,afterHash:hash(value)})),
    evidence:[...new Set(actual.flatMap(o=>o.evidenceIds||[]))].map(id=>{const {excerpt,...item}=evidence.get(id);return {...item,excerptHash:hash(excerpt)};})};
  privacy(manifest);
  return {data:next,manifest,changed:true};
}

export function validateTransition(base,next,manifest) {
  validateSnapshot(base); validateSnapshot(next);
  assert(manifest?.schemaVersion==='marketing-buddy-weekly-release-v1' && manifest.baseDataHash===hash(base) && manifest.dataHash===hash(next), 'Release manifest does not match before/after data');
  assert(isoDate(manifest.run?.asOf)&&manifest.run.asOf<=today()&&manifest.run.asOf>=new Date(Date.parse(today())-86400000).toISOString().slice(0,10),'Candidate is stale or future dated; regenerate it from current research');
  assert(manifest.review?.completed===true && manifest.review.conflictsSeparated===true && manifest.review.privacyChecked===true, 'Release review missing');
  const expected=structuredClone(base);
  const baseSources=new Map(base.sources.map(s=>[s.id,s]));
  for(const source of next.sources) if(baseSources.has(source.id)) assert(hash(source)===hash(baseSources.get(source.id)), `Existing source modified: ${source.id}`);
  assert(base.sources.every(s=>next.sources.some(n=>n.id===s.id)), 'Existing sources removed');
  expected.sources=structuredClone(next.sources);
  const evidence=new Map((manifest.evidence||[]).map(e=>[e.id,e]));
  const seen=new Set();
  for(const change of manifest.changes||[]) {
    const key=`${change.entity}:${change.id}.${change.field}`; assert(!seen.has(key), 'Duplicate release field'); seen.add(key);
    const value=getField(locate(next,change.entity,change.id),change.field);
    assert(hash(value)===change.afterHash, `Release value mismatch: ${key}`);
    validateOperation(base,next,{...change,value},evidence,manifest.run.asOf,false);
    setField(locate(expected,change.entity,change.id),change.field,value);
  }
  expected.generatedAt=next.generatedAt; expected.lastUpdate=next.lastUpdate;
  assert(hash(expected)===hash(next), 'Unlisted or prohibited public data modification');
  assert(next.generatedAt===manifest.run.asOf && next.lastUpdate?.runId===manifest.run.id, 'Run metadata mismatch');
  return true;
}

export const bundleText = data => `window.MB_DATA = ${JSON.stringify(data)};\n`;
export function validateFiles(repo=root) {
  const data=validateSnapshot(readJson(path.join(repo,'data/public.json')));
  const html=fs.readFileSync(path.join(repo,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(repo,'app.js'),'utf8');
  const bundle=fs.readFileSync(path.join(repo,'data/public.bundle.js'),'utf8');
  assert(bundle===bundleText(data), 'Bundle and public.json differ; regenerate the bundle');
  assert(html.includes('data/public.bundle.js'), 'Public data script missing'); privacy(html+app+bundle);
  return data;
}
