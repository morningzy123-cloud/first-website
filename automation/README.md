# Marketing Buddy 每周更新：开始使用

准备日期：2026-10-26。你可以把交接 ZIP 交给另一个具有联网检索与 GitHub操作能力的 AI。无需把这段聊天转发给它。

## 你只需做三步

1. **给另一个 AI 更新包与首次指令。** 上传 ZIP，复制 [FIRST_RUN_PROMPT.md](FIRST_RUN_PROMPT.md) 的正文。它会先检查环境和权限、完成工具演练，然后按授权进行首次真实更新。有 Skill 安装功能就安装 marketing-buddy-weekly-update；没有就让它读取 SKILL.md 和 references，效果依赖它能否运行工具与操作仓库。
2. **在该平台连接 GitHub。** 只开放 morningzy123-cloud/first-website 仓库；允许内容与PR写入，允许读取检查和状态。通过平台账户连接或秘密变量授权，不在聊天里发送密钥。现有 Vercel 与 main 已连接，通常无需重新登录 Vercel。
3. **在该平台设置每周任务。** 首次接入成功后，任务正文使用 [WEEKLY_TASK_PROMPT.md](WEEKLY_TASK_PROMPT.md)。时间由你选，例如每周一北京时间09:00。确认该平台后台任务也能使用搜索、运行工具和GitHub连接，并能保留运行文件。

这里没有替你创建另一平台的定时任务；在它那里保存并启用后才会按周运行。只支持聊天而没有后台执行/仓库写入的 AI 可以出研究报告，不能独立完成自动上线。

## 每周你会收到什么

一条简短结果：已更新上线、无可发布变化，或未完成。附最重要的变化、待核实项、网站与PR链接及研究报告位置。没有实质变化就不会为了“显示更新”反复部署。证据有冲突的项目留待核实，其他可靠内容照常更新。

## 给 AI 的文件入口

- Skill：[../skills/marketing-buddy-weekly-update/SKILL.md](../skills/marketing-buddy-weekly-update/SKILL.md)
- 搜索范围与核验：[research-rules.md](../skills/marketing-buddy-weekly-update/references/research-rules.md)
- 报告字段与页面映射：[data-contract.md](../skills/marketing-buddy-weekly-update/references/data-contract.md)
- 报告输出：[report-format.md](../skills/marketing-buddy-weekly-update/references/report-format.md)
- 发布与重试：[publishing.md](../skills/marketing-buddy-weekly-update/references/publishing.md)
- 网站工具：scripts/weekly/；配置：automation/weekly.config.json 与 source-trust.json。

## 发布范围

周更只改变三份公开数据文件，保留品牌、金毛形象、蓝色UI、四国和既有竞品池。新增国家或竞品、修改UI/规则、账户设置或历史清理需要另行安排。当前公开仓库的旧历史不是本更新包的清理目标。

### 新增竞品（范围变更，需人工授权）

新增车型不是周更操作，周更通道会拒绝（`check-scope` 对非 `weekly/*` 分支只做完整校验）。正确做法是一次独立 PR，同时改动：

1. `automation/weekly.config.json` 的 `competitors[市场]` 加入车型 ID；
2. `data/public.json` 的 `vehicles` 加入完整车型对象、`competitorPools[市场].entries` 加入同 ID（`fixed`）；
3. 若官方域名未在 `automation/source-trust.json`，补一条主机规则，否则价格/配置无法标为 confirmed；
4. 用 `bundleText(data)` 重新生成 `data/public.bundle.js`，不要手改 bundle；
5. `release.json` 保持上一次周更的清单，不要为范围变更伪造周更记录。

竞品总数由配置推导，不要再写死数字。合并后下一次周更会自动把新车型纳入 28 项覆盖记录。

自动检查会限制数据范围、证据记录、日期、引用和发布状态；事实真伪仍需要执行研究的 AI 认真读原文。不要将“脚本通过”理解为全站信息100%准确。
