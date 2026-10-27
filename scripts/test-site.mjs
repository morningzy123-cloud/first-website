import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {root,readJson,privacy} from './weekly/core.mjs';

const data=readJson(path.join(root,'data/public.json'));
const elements=new Map();
const element=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},showModal(){},close(){}});
const document={querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);},querySelectorAll(){return [];}};
class Clock extends Date {constructor(...args){super(...(args.length?args:['2026-10-26T02:00:00Z']));} static now(){return Date.parse('2026-10-26T02:00:00Z');}}
const context={window:{MB_DATA:data,addEventListener(){},scrollTo(){}},document,location:{hash:'#/overview'},Intl,Date:Clock,console,setTimeout};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const render=route=>{context.location.hash=route;context.router();return elements.get('#app').innerHTML;};
for(const route of ['#/overview',...data.markets.map(m=>`#/market/${m.code}`),...data.vehicles.map(v=>`#/vehicle/${v.id}`)]) {
  const html=render(route); assert(html.length>500,`Page failed: ${route}`); privacy(html);
  assert(!html.includes('undefined'),'Undefined content rendered');
}
const original=data.markets[0].basics.taxImportAndPolicy.conclusion;
data.markets[0].basics.taxImportAndPolicy.conclusion='DYNAMIC_POLICY_SENTINEL';
assert(render('#/market/MX').includes('DYNAMIC_POLICY_SENTINEL'),'Policy conclusion is still hard-coded');
data.markets[0].basics.taxImportAndPolicy.conclusion=original;
const card=data.globalOverview.countryCards[0];const action=card.importantCompetitorAction.conclusion;
card.importantCompetitorAction.conclusion='DYNAMIC_ACTION_SENTINEL';
assert(render('#/market/MX').includes('DYNAMIC_ACTION_SENTINEL'),'Competitor conclusion is still hard-coded');card.importantCompetitorAction.conclusion=action;
const vehicle=data.vehicles[0];
vehicle.financeOffers=[{title:'EXPIRED_SENTINEL',validTo:'2026-10-25',sourceIds:[],conditions:'expired'},{title:'ACTIVE_SENTINEL',validTo:'2026-10-31',sourceIds:[],conditions:'active'}];
const detail=render(`#/vehicle/${vehicle.id}`);
assert(!detail.includes('EXPIRED_SENTINEL')&&detail.includes('ACTIVE_SENTINEL'),'Offer expiry is not based on current Shanghai date');
const signals=data.globalOverview.highValueSignals;
data.globalOverview.highValueSignals=[{id:'test',title:'POLICY_SIGNAL_SENTINEL',summary:'test',marketCode:'MX',category:'国家政策',date:'2026-10-26',status:'confirmed',sourceIds:[]}];
assert(render('#/overview').includes('POLICY_SIGNAL_SENTINEL'),'Explicit high-value signals are not rendered');
data.globalOverview.highValueSignals=[];assert(!render('#/overview').includes('POLICY_SIGNAL_SENTINEL'),'Empty signal list ignored');data.globalOverview.highValueSignals=signals;
console.log(`PASS: overview, four markets, ${data.vehicles.length} competitors, dynamic conclusions, signals and date-driven expiry`);
