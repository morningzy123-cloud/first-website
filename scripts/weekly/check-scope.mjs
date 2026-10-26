import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {root,config,readJson,assert,validateTransition} from './core.mjs';

const base=process.argv[2];
if(!base||!/^[a-f0-9]{40}$/.test(base)) throw new Error('Pass an exact base commit SHA');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim();
const files=git('diff','--name-only',base,'HEAD').split('\n').filter(Boolean);
const dataOnly=files.length>0&&files.every(file=>config.dataFiles.includes(file));
if(dataOnly) {
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
