import {spawnSync} from 'node:child_process';
const connector=process.argv.includes('--connector');
const results=[{capability:'Node.js 22+',ok:Number(process.versions.node.split('.')[0])>=22,version:process.versions.node}];
for(const binary of ['git',...(connector?[]:['gh'])]) {
  const r=spawnSync(binary,['--version'],{encoding:'utf8',windowsHide:true});
  results.push({capability:binary,ok:!r.error&&r.status===0,version:r.status===0?r.stdout.split('\n')[0].trim():'unavailable'});
}
console.log(JSON.stringify({mode:connector?'GitHub connector, equivalent publication checks required':'GitHub CLI',results,next:'Confirm search access and target-repository permission using the platform connection. Never paste credentials into chat.'},null,2));
if(results.some(r=>!r.ok))process.exitCode=1;
