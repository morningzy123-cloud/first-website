# Marketing Buddy · C级 Sedan

四国市场与竞品情报公开站。包含墨西哥、哈萨克斯坦、沙特阿拉伯、阿联酋；阿联酋四款车型仍标为“AI 建议”。

页面是静态网站，直接打开 `index.html` 或由 Vercel 托管。数据文件为 `data/public.json`，离线打开时使用 `data/public.bundle.js`。两者必须来自同一次审核导出，不能分别手工修改。

首页的“可信度”是核心摘要证据的规则估算，不代表全站统计准确率；“信息完整度”衡量栏目覆盖。无原始统计口径的销量不显示。物流时间轴是上市计划参考，实际船期与清关须按具体批次复核。

更新流程：外部研究报告先进入私有审核区，核对原始来源、市场适用、时效、来源冲突与敏感信息，再重新生成公开包。研究代理不得直接把原始报告推送为公开数据。

每周更新 Skill、数据协议和发布工具已放在本仓库。用户从 [开始使用](automation/README.md) 阅读；AI 从 [Skill 入口](skills/marketing-buddy-weekly-update/SKILL.md) 开始。发布仍使用现有 GitHub → Vercel 链路。

`data/public.json` 是唯一数据源，bundle 由工具同步生成；`data/release.json` 在首次实际周更时由工具生成。原始报告和运行日志保留在已忽略的 `.weekly-runs/`，不要用 Vercel CLI 把整个私有工作目录上传。
