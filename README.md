# Marketing Buddy V1.6 四国上线版

这是 Marketing Buddy（原 AutoIntel）EMGRAND V1.6 的四国营销情报网站。

## 当前包含

- EMGRAND 全球总览
- 四国市场入口
- 墨西哥、哈萨克斯坦、沙特阿拉伯、阿联酋首轮基线
- 价格 × 车身长度 × 销量气泡图
- 四国正式竞品与待确认 AI 建议竞品详情
- 四国竞品池
- 高精小金毛助手 Logo
- 金融政策、保修政策与营销活动旁的即时来源链接
- 金融、保修和营销活动分别归入对应的竞品详情模块
- 关键来源跳转和明确的待补数据状态
- 墨西哥 2026 年相关整车税号 50% 一般进口税率一级政策提醒

## 本地打开方式

直接双击 `index.html` 即可在浏览器中审阅，不需要安装程序，也不需要启动服务器。

## 数据说明

- 原始数据：`data/autointel-v1.6.global.json`
- 离线网页数据包：`data/autointel-v1.6.bundle.js`
- 四国均已完成首轮公开信息基线研究，合计 111 个可追溯来源。
- 阿联酋竞品保持 AI 建议状态，等待人工确认后才能转为正式竞品。
- 各国 EMGRAND 车型税号及具体进口安排仍需企业报关资料核对。
- GitHub `main` 分支更新后由 Vercel 自动发布。

## Research Skill 数据流程

研究 agent 使用 `marketing-buddy-research` Skill 搜索并提交暂存数据；它不能直接修改本网站。数据必须先通过格式、来源、政策覆盖和可比性检查，再由主工作流审核合并、重新生成 `bundle.js` 并运行页面测试。周度更新使用仓库中的 `skills/marketing-buddy-weekly-update`，只有符合自动发布边界的纯数据变更才可进入部署流程。
