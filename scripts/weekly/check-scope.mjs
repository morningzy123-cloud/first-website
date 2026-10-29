import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {root,config,readJson,assert,validateTransition} from './core.mjs';
import {checkFiles as checkRadar} from '../radar-data.mjs';

const base=process.argv[2];
if(!base||!/^[a-f0-9]{40}$/.test(base)) throw new Error('Pass an exact base commit SHA');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim();
const files=git('diff','--name-only',base,'HEAD').split('\n').filter(Boolean);
const dataOnly=files.length>0&&files.every(file=>config.dataFiles.includes(file));
const radarOnly=files.length>0&&files.every(file=>['data/radar.json','data/radar.bundle.js'].includes(file));
if(process.env.WEEKLY_HEAD_REF?.startsWith('radar-weekly/')) assert(radarOnly,'Radar weekly branch can only change radar JSON and its generated bundle');
if(radarOnly) {
  checkRadar();
  const old=JSON.parse(git('show',`${base}:data/radar.json`));
  const current=readJson(path.join(root,'data/radar.json'));
  const strip=value=>JSON.stringify(value,(key,item)=>['asOf','checkedAt'].includes(key)?undefined:item);
  assert(strip(old)!==strip(current),'Timestamp-only radar update must not publish');
  assert(!process.env.WEEKLY_HEAD_REF?.startsWith('weekly/'),'Use a separate radar-weekly branch, not the four-market updater');
  console.log('PASS: radar-only data update, source/estimate validation and non-empty substantive change');
} else if(dataOnly) {
  const old=JSON.parse(git('show',`${base}:data/public.json`));
  const current=readJson(path.join(root,'data/public.json'));
  const manifest=readJson(path.join(root,'data/release.json'));
  validateTransition(old,current,manifest);
  console.log('PASS: weekly data-only change has valid provenance and immutable scope');
} else {
  // Infrastructure changes are reviewed separately; the unattended publisher rejects them.
  assert(!process.argv.includes('--weekly-only')&&!process.env.WEEKLY_HEAD_REF?.startsWith('weekly/'),'Weekly publisher cannot modify application code, tools or configuration');
  console.log('Infrastructure/UI change: full validation applies; unattended weekly publisher cannot merge this scope');
}
