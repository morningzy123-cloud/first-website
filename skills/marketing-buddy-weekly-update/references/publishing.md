# 自动发布、权限与故障处理

## 一次性准备

运行环境需要联网检索、Node.js 22+、Git；脚本自动发布模式另需 GitHub CLI (`gh`)。若平台已有 GitHub 连接器，可以采用下方等效流程，不要求把令牌发到聊天中。

GitHub 账户/应用应能访问 `morningzy123-cloud/first-website`，具有该仓库 Contents 写入、Pull requests 写入，以及 Actions/Checks/Commit statuses/Metadata 读取权限。分支保护按仓库设置执行，不绕过审批。不要索要全账户或其他仓库权限。

用户在平台账户连接页或秘密变量中完成授权；gh可通过已有登录或 GH_TOKEN 使用权限。令牌只保存在平台秘密设置里，不放 Skill、报告、URL、命令参数、Git remote 或仓库文件。Git 推送也要能使用已授权凭据；gh环境可一次执行 `gh auth setup-git`。此操作由用户授权的首次接入流程完成。

网站已通过 `main → Vercel` 自动部署，不需要额外创建网站，也不需要另配 Vercel 发布密钥。定时任务由用户在另一 AI 平台设置；本 Skill 本身不创建任务或保证后台执行。

## 本次运行

从网站仓库根目录执行（路径有空格时加引号）：

```text
node scripts/weekly/weekly.mjs inspect
```

它返回 `.weekly-runs/<run-id>/submission.json`，AI完成研究后填写，再执行：

```text
node scripts/weekly/weekly.mjs prepare --submission ".weekly-runs/<run-id>/submission.json"
node scripts/weekly/publish.mjs --candidate ".weekly-runs/<run-id>/candidate" --plan
```

上面只生成/检查候选。真实变化且用户/定时任务有发布授权时：

```text
node scripts/weekly/publish.mjs --candidate ".weekly-runs/<run-id>/candidate"
```

脚本的行为：

1. 检查 origin、工作区、最新 main 和候选 baseDataHash。只允许指定的三个数据文件；不强推，不修改 UI 或工具。
2. 创建 `weekly/<run-id>` 分支、提交数据、创建 PR；运行日志放在候选目录 `publish.json`。
3. 对**PR实际提交 SHA**等待 `.github/workflows/validate.yml` 成功，并等待 Vercel Preview 成功；main 期间有新提交则停止。
4. 使用预期 PR head SHA 合并，避免把别人后来追加的改动一起发布。
5. 等待合并提交的 Vercel 正式部署成功，再逐文件比对正式网址的 public.json、bundle、release.json 与候选一致，才写 `state:verified`。

预览和正式站各最多等待 10 分钟，每次查询间隔 15 秒。后台执行器应保留运行进程与私有输出，前台长任务保持适当进度提示。网络超时不证明失败或成功，不能循环创建部署。

没有实质变化时 prepare 返回 changed:false；不创建提交/PR，不触发部署。数据中只改核验时间也不会发布。运行报告仍要诚实记录检查过和未检查的范围。

## 连接器等效发布模式

当 `gh` 不可用、但平台 GitHub 连接器可创建分支/提交/PR和合并时，照以下顺序执行，不擅自安装工具或降低检查：

1. 读最新 main 的 SHA与树，和候选 baseDataHash 核对，运行相同 prepare、validateTransition 与 --plan 检查。
2. 基于该 main 树只替换三个公开数据文件，创建以该 main SHA为父提交的提交和唯一周更分支。不要从旧树重建整个仓库，也不 force update。
3. 按分支查询已有 PR，避免重复创建。记录 runId/baseSha/branch/commitSha/prNumber/prUrl/dataHash。
4. 核对 PR head未变、base仍为读过的 main；读取对应提交的 Actions 工作流（指定路径、head SHA、结论 success）及 Vercel Preview success，失败/未知停止。
5. 再读 main，仍是原SHA时以 expected head SHA合并。若连接器不支持这些必要检查/合并前置条件，则只留下候选与PR，告诉用户当前平台能力不足以无人值守发布。
6. 查询合并提交的 Vercel状态，再请求正式站三份数据文件并比对字节/hash；记录 verified。只看到静态HTTP200首页不够。
7. Codex若提供 PR 附件能力，创建PR后附到本次任务。结果报告给用户，不发消息给其他人。

## 中断与重试

有 `publish.json` 的运行，使用同一个候选路径重跑。脚本会核查已有 PR；合并已成功但来不及写日志时，会读PR恢复状态。若发布记录已 verified，直接返回该结果。

若在本地创建提交前中断，可能留下脏工作区或已存在分支；先检查实际状态，不删除用户修改、不 reset --hard。`.weekly-publish-lock` 用来防重入，只有确认原进程已结束且状态已核实才能处理残留锁。两个定时任务不要同时运行。

CI失败：保留PR和私有异常报告；不禁用校验，不自动合并。main已更新：重新获取快照和字段hash，重新核验冲突并生成新候选；不要静默覆盖。

Vercel构建失败通常保留旧线上版本，但必须实际核对。网络不可达/缓存不一致：报告“上线未确认”，不要把它当内容错误盲目回滚。已确认发布内容错误时停止后续自动发布，给出上一正常提交和恢复方案；通过正常修复PR恢复数据，涉及工具/工作流修复时请求项目维护授权，不重写历史。

## 审核与公开边界

自动发布只处理已有范围内的数据。新增国家/竞品、改变AE治理、改Logo/UI、信任新的官方域名、关闭检查、改仓库/Vercel设置、删除历史、购买服务都不属于周更权限。将建议和原因交用户，其他独立的可靠数据可以照常更新。
