import fs from 'node:fs';
import path from 'node:path';
import { root, config, readJson, writeJson, hash, today, targets, applySubmission, validateFiles, validateTransition, bundleText, assert } from './core.mjs';

const [command,...args]=process.argv.slice(2);
const option=name=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:undefined;};
const repo=path.resolve(option('repo')||root);
const dataPath=path.join(repo,'data/public.json');
try {
  if(command==='inspect') {
    const data=validateFiles(repo),asOf=today();
    const id=`${asOf}-weekly-${Date.now().toString(36)}`;
    const out=path.resolve(option('out')||path.join(repo,'.weekly-runs',id));
    writeJson(path.join(out,'context.json'),{runId:id,asOf,baseDataHash:hash(data),repository:config.repository,targets:targets(data)});
    writeJson(path.join(out,'submission.json'),{
      schemaVersion:'marketing-buddy-weekly-submission-v1',run:{id,asOf,windowStart:new Date(Date.parse(asOf)-7*86400000).toISOString().slice(0,10),windowEnd:asOf},
      baseDataHash:hash(data),sources:[],evidence:[],changes:[],issues:[],coverage:Object.keys(config.competitors).flatMap(marketCode=>config.coverageCategories.map(category=>({marketCode,category,state:marketCode==='KZ'&&category==='shipping'?'not_applicable':'pending',queries:[],sourceIds:[],note:marketCode==='KZ'&&category==='shipping'?'本版本未要求 KZ 海运时间轴':''}))),
      review:{completed:false,conflictsSeparated:false,privacyChecked:false}
    });
    console.log(JSON.stringify({out,submission:path.join(out,'submission.json'),baseDataHash:hash(data)},null,2));
  } else if(command==='prepare') {
    assert(option('submission'),'--submission is required');
    const submissionPath=path.resolve(option('submission'));
    const submission=readJson(submissionPath),base=readJson(dataPath);
    const result=applySubmission(base,submission);
    const out=path.resolve(option('out')||path.join(path.dirname(submissionPath),'candidate'));
    assert(out!==repo&&!repo.startsWith(out+path.sep),'Candidate must not replace the checkout directory');
    writeJson(path.join(out,'result.json'),{changed:result.changed,runId:submission.run.id,baseDataHash:hash(base),dataHash:hash(result.data)});
    if(result.changed) {
      writeJson(path.join(out,'data/public.json'),result.data);
      fs.writeFileSync(path.join(out,'data/public.bundle.js'),bundleText(result.data));
      writeJson(path.join(out,'data/release.json'),result.manifest);
      validateTransition(base,result.data,result.manifest);
    }
    const issues=(submission.issues||[]).map(item=>typeof item==='string'?item:JSON.stringify(item));
    const report=`# Marketing Buddy 每周更新结果\n\n运行：${submission.run.id}\n\n日期：${submission.run.asOf}（Asia/Shanghai）\n\n状态：${result.changed?'候选数据已生成，尚未发布':'未发现可发布的实质变化，网站保持原版本'}\n\n## 接受的变化\n\n${result.manifest?.changes.map(c=>`- ${c.entity}:${c.id}.${c.field}：${c.reason}`).join('\n')||'- 无'}\n\n## 未采用与待核实\n\n${issues.map(i=>'- '+i).join('\n')||'- 无'}\n\n## 检索覆盖\n\n\`\`\`json\n${JSON.stringify(submission.coverage||[],null,2)}\n\`\`\`\n\n发布结果见 publish.json；此研究报告保留在私有运行目录。\n`;
    fs.writeFileSync(path.join(out,'run-report.md'),report);
    console.log(JSON.stringify({out,changed:result.changed,changes:result.manifest?.changes.length||0},null,2));
  } else if(command==='validate') {
    const data=validateFiles(repo);
    console.log(`PASS: 4 markets, 10 competitors, ${data.sources.length} sources; data and bundle match`);
  } else {
    console.log('Usage:\n  node scripts/weekly/weekly.mjs inspect [--repo PATH] [--out PRIVATE_RUN_DIR]\n  node scripts/weekly/weekly.mjs prepare --submission FILE [--repo PATH] [--out CANDIDATE_DIR]\n  node scripts/weekly/weekly.mjs validate [--repo PATH]');
    if(command) process.exitCode=1;
  }
} catch(error) { console.error('STOP:',error.message); process.exitCode=1; }
