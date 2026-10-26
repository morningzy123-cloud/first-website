import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,config,readJson,writeJson,hash,assert,validateTransition,bundleText} from './core.mjs';

const args=process.argv.slice(2);
const value=name=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:undefined;};
const candidate=path.resolve(value('candidate')||'.weekly-runs/missing/candidate');
const repo=path.resolve(value('repo')||root);
const journalFile=path.join(candidate,'publish.json');
const lockFile=path.join(repo,'.weekly-publish-lock');
let lock;
let journal;
function run(binary,argv,{json=false,allowFail=false}={}) {
  const result=spawnSync(binary,argv,{cwd:repo,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});
  if(result.error) throw new Error(`${binary} unavailable: ${result.error.message}`);
  if(result.status!==0) { if(allowFail)return null; throw new Error(`${binary} failed: ${(result.stderr||result.stdout||'').trim().slice(0,1600)}`); }
  return json?JSON.parse(result.stdout):result.stdout.trim();
}
const git=(...argv)=>run('git',argv);
const gh=(...argv)=>run('gh',argv);
const api=endpoint=>run('gh',['api',endpoint],{json:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const save=()=>writeJson(journalFile,journal);
function dataScope(base,head) {
  const names=git('diff','--name-only',base,head).split('\n').filter(Boolean);
  assert(names.length>0&&names.every(name=>config.dataFiles.includes(name)), 'Publisher accepts only the three public data files');
}
function failureState(value) { return ['failure','error','cancelled','timed_out','action_required','startup_failure','stale'].includes(value); }
async function waitPreview(sha) {
  const deadline=Date.now()+config.maxWaitSeconds*1000;
  while(Date.now()<deadline) {
    const runs=api(`repos/${config.repository}/actions/runs?head_sha=${sha}&event=pull_request&per_page=30`).workflow_runs;
    const check=runs.filter(r=>r.head_sha===sha&&r.path===config.workflowPath).sort((a,b)=>b.id-a.id)[0];
    const statuses=api(`repos/${config.repository}/commits/${sha}/status`).statuses;
    const vercel=statuses.filter(s=>s.context==='Vercel').sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at))[0];
    if(check&&failureState(check.conclusion)) throw new Error(`Validation failed: ${check.html_url}`);
    if(vercel&&failureState(vercel.state)) throw new Error(`Vercel preview failed: ${vercel.target_url}`);
    if(check?.status==='completed'&&check.conclusion==='success'&&vercel?.state==='success') return;
    console.log('Waiting for exact-commit validation and Vercel preview…');
    await sleep(config.pollSeconds*1000);
  }
  throw new Error('Timed out waiting for validation/preview; resume this candidate later, do not bypass checks');
}
async function verifyProduction(sha) {
  const deadline=Date.now()+config.maxWaitSeconds*1000;
  let latest='Production deployment pending';
  while(Date.now()<deadline) {
    const statuses=api(`repos/${config.repository}/commits/${sha}/status`).statuses;
    const vercel=statuses.filter(s=>s.context==='Vercel').sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at))[0];
    if(vercel&&failureState(vercel.state)) throw new Error(`Production deployment failed: ${vercel.target_url}`);
    if(vercel?.state==='success') {
      try {
        for(const file of config.dataFiles) {
          const response=await fetch(new URL(file+`?weekly=${encodeURIComponent(journal.runId)}`,config.publicUrl),{signal:AbortSignal.timeout(20000),redirect:'error'});
          assert(response.ok,`Production ${file}: HTTP ${response.status}`);
          const remote=Buffer.from(await response.arrayBuffer());
          const local=fs.readFileSync(path.join(candidate,file));
          assert(remote.equals(local),`Production ${file} has not reached the accepted candidate`);
        }
        return;
      } catch(error) { latest=error.message; }
    }
    console.log('Waiting for production content verification…');
    await sleep(config.pollSeconds*1000);
  }
  throw new Error(latest+'; deployment result unconfirmed. Do not report success or blindly roll back');
}

try {
  const result=readJson(path.join(candidate,'result.json'));
  if(!result.changed) { console.log('NO_CHANGE: no commit or deployment required'); process.exit(0); }
  const data=readJson(path.join(candidate,'data/public.json'));
  const manifest=readJson(path.join(candidate,'data/release.json'));
  assert(hash(data)===result.dataHash&&hash(data)===manifest.dataHash,'Candidate hash mismatch');
  assert(fs.readFileSync(path.join(candidate,'data/public.bundle.js'),'utf8')===bundleText(data),'Candidate bundle mismatch');
  if(args.includes('--plan')) {
    const base=readJson(path.join(repo,'data/public.json')); validateTransition(base,data,manifest);
    console.log(JSON.stringify({mode:'plan-only',repository:config.repository,branch:`weekly/${manifest.run.id}`,changes:manifest.changes.length,allowedFiles:config.dataFiles,steps:['data-only branch','exact-commit CI + preview','merge with head SHA','production data hash check']},null,2));
    process.exit(0);
  }
  assert(!fs.existsSync(lockFile),'Another publisher or unfinished run owns .weekly-publish-lock; inspect it before recovery');
  lock=fs.openSync(lockFile,'wx');fs.writeFileSync(lock,JSON.stringify({pid:process.pid,candidate,startedAt:new Date().toISOString()}));
  gh('auth','status');
  const origin=git('remote','get-url','origin');
  assert(new RegExp(`^(https://github\\.com/|git@github\\.com:)${config.repository.replace('/','\\/')}(\\.git)?$`).test(origin),'Wrong origin repository');
  journal=fs.existsSync(journalFile)?readJson(journalFile):{runId:manifest.run.id,dataHash:result.dataHash,repository:config.repository,branch:`weekly/${manifest.run.id}`,state:'preparing'};
  assert(journal.runId===manifest.run.id&&journal.dataHash===result.dataHash&&journal.repository===config.repository,'Publish journal belongs to another candidate');
  if(journal.state==='verified') { console.log(JSON.stringify(journal,null,2)); }
  else {
    if(!journal.commitSha) {
      assert(git('status','--porcelain')==='','Checkout must be clean; retain run files under ignored .weekly-runs');
      git('fetch','origin',config.baseBranch);
      journal.baseSha=git('rev-parse',`origin/${config.baseBranch}`);
      const base=JSON.parse(git('show',`${journal.baseSha}:data/public.json`));
      validateTransition(base,data,manifest);
      save();
      git('switch','-c',journal.branch,`origin/${config.baseBranch}`);
      for(const file of config.dataFiles) {fs.mkdirSync(path.dirname(path.join(repo,file)),{recursive:true});fs.copyFileSync(path.join(candidate,file),path.join(repo,file));}
      git('add','--',...config.dataFiles);
      const staged=git('diff','--cached','--name-only').split('\n').filter(Boolean);
      assert(staged.every(name=>config.dataFiles.includes(name))&&staged.length>0,'Unexpected staged files');
      git('commit','-m',`Update Marketing Buddy data ${manifest.run.asOf} (${manifest.run.id})`);
      journal.commitSha=git('rev-parse','HEAD');journal.state='committed';save();
    }
    dataScope(journal.baseSha,journal.commitSha);
    if(!journal.prNumber) {
      // A repeated push of the same ref is safe; never force a ref or create duplicate PRs.
      git('push','-u','origin',`${journal.commitSha}:refs/heads/${journal.branch}`);
      const existing=run('gh',['pr','list','--repo',config.repository,'--head',journal.branch,'--state','all','--json','number,url,state'],{json:true});
      assert(existing.length<=1,'Multiple PRs found; inspect publishing state');
      if(existing[0]) {journal.prNumber=existing[0].number;journal.prUrl=existing[0].url;}
      else {
        const body=path.join(candidate,'pr-body.md');
        fs.writeFileSync(body,`Update reviewed public market data for ${manifest.run.asOf}.\n\n${manifest.changes.map(c=>`- ${c.entity}:${c.id}.${c.field}`).join('\n')}\n\nOnly public data files change. Private research notes and credentials are excluded.\n`);
        gh('pr','create','--repo',config.repository,'--base',config.baseBranch,'--head',journal.branch,'--title',`Weekly Marketing Buddy update ${manifest.run.asOf}`,'--body-file',body);
        const pr=run('gh',['pr','view',journal.branch,'--repo',config.repository,'--json','number,url'],{json:true});
        journal.prNumber=pr.number;journal.prUrl=pr.url;
      }
      journal.state='pr-open';save();
    }
    let pr=api(`repos/${config.repository}/pulls/${journal.prNumber}`);
    assert(pr.head.sha===journal.commitSha&&pr.base.ref===config.baseBranch,'PR head or base changed');
    if(!pr.merged) {
      assert(pr.state==='open'&&pr.base.sha===journal.baseSha,'Main advanced or PR closed; re-review latest data instead of silently rebasing');
      await waitPreview(journal.commitSha);
      // Recheck the base after waiting; another weekly run must not be overwritten.
      const main=api(`repos/${config.repository}/branches/${config.baseBranch}`);
      assert(main.commit.sha===journal.baseSha,'Main advanced during validation; stop and regenerate from latest data');
      const merged=run('gh',['api','-X','PUT',`repos/${config.repository}/pulls/${journal.prNumber}/merge`,'-f',`sha=${journal.commitSha}`,'-f','merge_method=merge'],{json:true});
      assert(merged.merged,'GitHub did not confirm merge');
      journal.mergeSha=merged.sha;journal.state='merged';save();
    } else { journal.mergeSha=pr.merge_commit_sha;journal.state='merged';save(); }
    await verifyProduction(journal.mergeSha);
    journal.state='verified';journal.verifiedAt=new Date().toISOString();journal.publicUrl=config.publicUrl;save();
    console.log(JSON.stringify(journal,null,2));
  }
} catch(error) {
  if(journal) {journal.lastError=error.message;journal.failedAt=new Date().toISOString();save();}
  console.error('STOP:',error.message);process.exitCode=1;
} finally {
  if(lock!==undefined) {fs.closeSync(lock);fs.unlinkSync(lockFile);}
}
