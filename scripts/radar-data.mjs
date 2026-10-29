import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {privacy,safeUrl} from './weekly/core.mjs';
export const root=path.resolve(import.meta.dirname,'..');
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const hosts=['hmm21.com','hapag-lloyd.com','imo.org','maersk.com','maersk.com.cn','saso.gov.sa','gso.org.sa','dubaicustoms.gov.ae','mwani.com.qa','customs.gov.qa','chineseshipping.com.cn','tj.gov.cn','cma-cgm.com','dof.gob.mx','segob.gob.mx','beijing.gov.cn','coscoshipping.com','cosco.co.jp','sunat.gob.pe','gob.pe','chileatiende.gob.cl','subrei.gob.cl','fesco.com','kdts.kz','gov.kz','eaeunion.org','gov.uz','lex.uz','utk.uz','maritime.dot.gov'];
export const bundle=data=>`window.MB_RADAR_DATA = ${JSON.stringify(data)};\n`;
export function validate(data){
 privacy(data);
 check(data.schemaVersion==='marketing-buddy-export-radar-v1','Unknown radar schema');
 check(date(data.asOf)&&data.asOf<=today(),'Radar date is invalid or future-dated');
 check(data.origin?.coords?.join(',')==='117.75,38.98','Origin must remain Tianjin');
 check(data.methodology?.length>50,'Estimate methodology required');
 const expected=['SA','AE','QA','MX','PE','CL','KZ','UZ'];
 const unique=(items,label)=>{check(Array.isArray(items),`${label} must be an array`);const ids=new Set();for(const i of items){check(typeof i.id==='string'&&/^[A-Za-z0-9_-]+$/.test(i.id)&&!ids.has(i.id),`Invalid/duplicate ${label} ID`);ids.add(i.id);}return ids;};
 const sources=unique(data.sources,'source'),routes=unique(data.routes,'route');unique(data.risks,'risk');
 check(Array.isArray(data.briefRiskIds)&&data.briefRiskIds.length<=3&&new Set(data.briefRiskIds).size===data.briefRiskIds.length&&data.briefRiskIds.every(id=>data.risks.some(r=>r.id===id)),'Brief must contain up to three distinct existing risk IDs');
 check(data.countries.length===8&&new Set(data.countries.map(c=>c.code)).size===8&&data.countries.every(c=>expected.includes(c.code)),'Exactly eight unique radar countries required');
 for(const s of data.sources){
  check(safeUrl(s.url)&&hosts.some(h=>new URL(s.url).hostname===h||new URL(s.url).hostname.endsWith('.'+h)),`Unreviewed source host ${s.id}`);
  check(s.title&&s.publisher&&s.supports&&['primary','reference_only'].includes(s.kind),`Source attribution missing ${s.id}`);
  check(['direct_page','direct_pdf','indexed_only','search_extract_only_direct_fetch_failed'].includes(s.retrieval),`Unknown retrieval ${s.id}`);
  check(date(s.checkedAt)&&s.checkedAt<=data.asOf&&(!s.publishedAt||(date(s.publishedAt)&&s.publishedAt<=s.checkedAt)),`Invalid source dates ${s.id}`);
  check(s.kind!=='primary'||['direct_page','direct_pdf'].includes(s.retrieval),`Indexed page cannot be primary evidence ${s.id}`);
 }
 const refs=(ids,label)=>check(Array.isArray(ids)&&ids.every(id=>sources.has(id)),`Unknown source at ${label}`);
 for(const c of data.countries){check(c.name&&c.flag&&c.summary&&c.planningNote,'Country copy missing');check(routes.has(c.defaultRouteId)&&data.routes.find(r=>r.id===c.defaultRouteId).countryCode===c.code,`Invalid default route ${c.code}`);}
 for(const r of data.routes){
  check(expected.includes(r.countryCode)&&r.name&&r.assumptions&&r.conclusion,'Route metadata missing');
  check(['rail_container','roro','sea_container'].includes(r.mode),'Unsupported transport mode');
  check(!['KZ','UZ'].includes(r.countryCode)||r.mode==='rail_container','Landlocked market cannot use a sea-only route');
  check(['conditional','reference_only'].includes(r.availability)&&['low','medium'].includes(r.confidence),'Unbooked route cannot be a confirmed commitment');
  refs(r.sourceIds,r.id);check(r.sourceIds.length>0,'Route needs source basis');
  check(r.waypoints.length>=3&&r.waypoints[0].type==='origin'&&r.waypoints[0].coords.join(',')===data.origin.coords.join(','),'Route must start in Tianjin');
  for(const p of r.waypoints)check(p.name&&['origin','transit','port','hub','border','destination'].includes(p.type)&&p.coords.length===2&&p.coords.every(Number.isFinite)&&Math.abs(p.coords[0])<=180&&Math.abs(p.coords[1])<=90,'Invalid map coordinates');
  check(r.waypoints.at(-1).type==='destination','Final map point must be a destination');
  unique(r.segments,'stage');check(r.segments.length>=3&&r.segments.at(-1).id==='local','Local delivery must be separate and last');
  for(const s of r.segments){check(s.basis==='estimate'&&s.basisNote&&s.label,'All unbooked stages need estimate labels and reasoning');check(Number.isInteger(s.min)&&Number.isInteger(s.max)&&s.min>=0&&s.max>=s.min&&s.max<=180,'Invalid stage range');refs(s.sourceIds,r.id+':'+s.id);}
 }
 for(const r of data.risks){
  check(r.title&&r.summary&&r.action&&r.legalStatus,'Risk conclusion/action/scope missing');
  check(['policy','transport'].includes(r.category)&&['high','watch'].includes(r.level),'Invalid risk category');
  check(['confirmed','pending'].includes(r.evidenceStatus),'Evidence review state missing');
  check(date(r.checkedAt)&&r.checkedAt<=data.asOf&&(!r.expiresAt||(date(r.expiresAt)&&r.expiresAt>=r.checkedAt)),'Invalid risk dates');
  check(r.countryCodes.length>0&&r.countryCodes.every(c=>expected.includes(c)),'Risk country scope required');
  check(Array.isArray(r.routeIds)&&r.routeIds.every(id=>routes.has(id)&&r.countryCodes.includes(data.routes.find(x=>x.id===id).countryCode)),'Risk route scope mismatch');
  refs(r.sourceIds,r.id);check(r.sourceIds.length>0,'Risk source required');
  if(r.evidenceStatus==='confirmed')check(r.sourceIds.some(id=>data.sources.find(s=>s.id===id).kind==='primary'),'Confirmed risk requires directly read primary evidence');
 }
 return data;
}
export function checkFiles(directory=root){
 const data=validate(JSON.parse(fs.readFileSync(path.join(directory,'data/radar.json'),'utf8')));
 check(fs.readFileSync(path.join(directory,'data/radar.bundle.js'),'utf8')===bundle(data),'Radar bundle differs from JSON; run --build');
 for(const file of ['radar.js','radar.css'])privacy(fs.readFileSync(path.join(directory,file),'utf8'));
 return data;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const file=process.argv.includes('--file')?process.argv[process.argv.indexOf('--file')+1]:'data/radar.json';
 const data=validate(JSON.parse(fs.readFileSync(path.resolve(root,file),'utf8')));
 if(process.argv.includes('--build')){check(path.resolve(root,file)===path.join(root,'data/radar.json'),'Build only from reviewed data/radar.json');fs.writeFileSync(path.join(root,'data/radar.bundle.js'),bundle(data));}
 if(!process.argv.includes('--file'))checkFiles();
 console.log(`PASS: radar ${data.countries.length} countries, ${data.routes.length} routes, ${data.risks.length} risks, ${data.sources.length} sources; estimates and scope validated`);
}
