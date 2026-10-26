# 数据协议与页面映射

版本：`marketing-buddy-weekly-submission-v1`。使用仓库最新工具；先执行 `inspect` 获取当前快照和字段 hash，不手写 hash、不沿用上一周的提交文件。所有路径均相对于克隆的网站仓库。

## 三层文件

1. 私有 `submission.json`：研究事实、短证据、字段变化、覆盖记录、待核实项和自审。由 AI 生成，留 `.weekly-runs/<run-id>/`。
2. 候选 `candidate/data/`：`prepare` 自动生成 `public.json`、`public.bundle.js`、`release.json`。不得分别手改 JSON 和 bundle。
3. 发布到仓库的也是以上三个公开数据文件。`release.json`只含本次变更字段、来源定位、核验记录和证据摘要 hash；原始证据短句、报告、查询日志不进入公开仓库。

脚本检查结构和记录是否一致；证据 hash 只用于追溯，不证明事实真实。AI 必须实际读原文并判断是否支持新值。

## submission 顶层

| 字段 | 要求 |
|---|---|
| `schemaVersion` | 固定 `marketing-buddy-weekly-submission-v1` |
| `run.id` | inspect 生成的小写日期/字母/数字/短横线 ID；同一运行重试保留，重新研究生成新 ID |
| `run.asOf` | 本次实际研究日 `YYYY-MM-DD`，Asia/Shanghai；不能用固定示例日期 |
| `run.windowStart/windowEnd` | 搜索窗口，末日等于 asOf；漏跑时从上次成功运行补查 |
| `baseDataHash` | inspect 返回的整个 public.json 规范化 hash |
| `sources` | 仅新增来源；已登记 ID 可直接引用，不修改其 URL/登记内容。新版本页面可用新 ID。来源字段见下方 |
| `evidence` | 每条本次直接读取的证据；禁止 search_snippet |
| `changes` | 通过复核的字段操作；冲突不放进这里 |
| `issues` | 未核实、冲突、缺口、访问失败；写原因与后续动作 |
| `coverage` | 每国 × 7 类：offers/selling_points/specifications/consumer_feedback/sales/policy/shipping，共 28 条。KZ/shipping 可为 not_applicable |
| `review` | 实际自查后填写 `completed:true, conflictsSeparated:true, privacyChecked:true` |

`coverage` 每条有 `marketCode/category/state/queries/sourceIds/note`。状态可为 `checked_no_change/updated/not_found/blocked/not_applicable`；checked_no_change 需列实际查过的来源，其他状态不能冒充无变化。查询失败记录 attempted query 和失败原因。inspect 的 pending 必须处理完。

## 来源登记

来源字段为 `id/url/title/publisher/sourceType/marketCode/accessedAt/language`，可加 `publishedAt/notes`。URL 必须是直接的 https 来源页面/文件，不是搜索结果页、登录凭据 URL 或本地文件。accessedAt 为实际访问时间。

官方域名权限由 `automation/source-trust.json` 决定。研究者写 `sourceType:official_model_page` 不会让未知网站自动成为官方。来源允许列表只能在用户授权的工具维护中修改，周更不得改它。

## 直接证据

每条 evidence 包含：

- `id`：本次唯一 ID。
- `sourceId/url`：必须和来源登记一致。
- `kind`：direct_page、direct_pdf、direct_dataset、forum_post 或 video_comment。
- `checkedAt`：本次实际打开原文的时间，建议 ISO 8601 `+08:00`；日期须为 asOf。
- `excerpt`：支持事实的短原文/数值片段，8–600 字符；总引用保持克制，不复制整页。
- `locator`：段落、配置版本、PDF 页/表格、数据行/下载文件、评论定位等。
- `scope.marketCode`，车型证据另需 `scope.vehicleId`。建议再写年款、版本、城市与口径。

summary 需要多来源时列多条 evidence。搜索摘要、AI 生成的答案和不可访问页面的猜测不能填成 direct_page。若网页不支持具体值，即使来源很权威也不能采用。

## 单条 change

每项包含 `changeId/entity/id/field/beforeHash/value/reason/evidenceIds/review`。

- `entity` 为 vehicle、market、countryCard 或 overview；id 为固定车型 ID、国家代码或 overview 的 global。
- `field` 必须为下表中的完整字段名；不允许任意 JSON 路径、数组序号或新增车型。
- `beforeHash` 从 context.json 对应字段取得，防止覆盖别人的更新。
- `value` 是**整个字段的新值**，数组替换时保留仍有效的旧行；无关字段不提交。
- `reason` 简短说明实质变化，禁止内部策略或敏感比较。
- `evidenceIds` 列本次支持变化的证据；字段里新改的每条事实也须有匹配的 sourceIds。
- `review` 为 `verdict:supported, scopeMatches:true, current:true, conflictsResolved:true`，只在实际核验后设置。

已有旧行完全不变时无需重新提供新证据；改了金额、条件、状态或原文，就要对应的新证据和 verifiedAt。不得为了通过而统一刷新旧行时间。只改核验日期不会形成发布；无变化不提交。

## 页面字段

| 页面 | entity / field | 新值要求 |
|---|---|---|
| 首页重大情报 | overview/global/highValueSignals | 最多 4 项；id、marketCode、category、title、summary、date、importance(1–5)、status:confirmed、sourceIds、verifiedAt，可加 validTo；最近 30 天且仍有效的事件 |
| 首页国家入口 | countryCard/国家/entrySummary | 该国一句市场状态；含 value、conclusion、status、sourceIds、verifiedAt。不要复制首页重大事件 |
| 国家页市场/竞品卡 | countryCard/国家/importantMarketNews、importantCompetitorAction | 同上，先一句 conclusion，再简短 value 及来源 |
| 国家简介 | market/国家/basics.summary | 简短、当前市场状态的事实对象；同上 |
| 政策卡 | market/国家/basics.taxImportAndPolicy | status:confirmed、conclusion、value、sourceIds、verifiedAt、effectiveFrom、legalStatus、applicabilityCaveat；legalStatus 为 in_force/scheduled/proposal，严格匹配生效日期 |
| 发运时间轴 | market/国家/researchV2.shippingRoutes | 路线数组，格式见下文；仅 MX/SA/AE，KZ不新增海运时间轴 |
| 竞品价格 | vehicle/车型/prices | `{id,price:{status,amount,currency,priceType,variantId,condition,observedAt,verifiedAt,sourceIds}}` 数组；当前准确版本在前，必要时保留同口径历史行 |
| 竞品销量 | vehicle/车型/salesRecords | `{id,volume:{status:confirmed,value,unit,period,periodStart,periodEnd,metric,scopeNote,verifiedAt,sourceIds}}`；value 为非负整数，不能晚于研究日 |
| 金融方案 | vehicle/车型/financeOffers | 具名方案数组：id、title、provider、conditions、validFrom、validTo、status、verifiedAt、sourceIds；条款完整才 confirmed |
| 当地门店优惠 | vehicle/车型/researchV2.dealerOffers | channel、city、dealer、variant、currency、listPrice/offerPrice/monthlyPayment、conditions、validFrom/To、status、sourceIds、verifiedAt；未知条件须 unconfirmed |
| 事件/营销活动 | vehicle/车型/recentEvents、marketingActivities | id、title、eventDate、description、whyItMatters、status、sourceIds、verifiedAt；有期限加 validFrom/To |
| 保修/售后 | vehicle/车型/aftersales | `{id,type,detail:{status,value,verifiedAt,sourceIds}}`；明确适用版本和期限条件 |
| 官网卖点 | vehicle/车型/researchV2.officialSellingPoints | localText、chineseSummary、relatedSpec、status、sourceIds、verifiedAt；区域宣传需说明区域范围 |
| 配置及中文 | vehicle/车型/researchV2.officialSpecifications | originalText、chineseTranslation、reference、modelYear、variant、status、sourceIds、verifiedAt；当地官方依据，默认折叠显示 |
| 简单规格 | vehicle/车型/specifications | `{key,label,fact:{status,value,unit,verifiedAt,sourceIds}}`；仅保留可由当地官方核验的项目 |
| 评论 | vehicle/车型/researchV2.consumerFeedback | 对象：sampleSize/platforms/samples/positiveThemes/negativeThemes/limitations，见下文 |
| 用户画像 | vehicle/车型/researchV2.audienceProfile | `{claim,basis:hypothesis,validationNeed,sourceIds}` 数组；不把少量评论升级为人口画像事实 |
| 未核实价格线索 | vehicle/车型/researchV2.priceNotes | `{variant,amount,currency,sourceIds,note}`；仅参考，不能升级成官方价格 |

UI 从以上数据读取摘要与日期。不要为了更新这些内容修改 app.js。若字段还不能承载新需求，记录维护建议，先发布已有协议能承载的可靠内容。

## 消费者对象

`samples` 每项为 `{id,sourceId,independenceKey,ownerStatus,observedAt}`；ownerStatus 为 self_reported_owner/verified_owner/unknown。independenceKey 是匿名去重键，不发布个人身份。sampleSize 等于 samples 数量。主题项为 `{theme,threads,sampleIds,sourceIds}`，threads 必须等于独立 sampleIds 个数；主题里的引用要对应本次实际读取的证据。现有旧版样本不会凭空补成完整样本，补研究后才替换。

## 发运路线对象

字段：originPort、destinationPort、timingStart:vessel_departure、transportMode(container/roro/sea_unspecified)、directOrTransshipment、etd、seaTransitDays、portDwellCustomsReleaseDaysEstimate、localDeliveryLaunchPreparationDaysEstimate、lowCaseDays/baseCaseDays/highCaseDays、confidence、note、sourceIds。

etd 为 `{value:null或日期,status:unconfirmed或confirmed}`；confirmed 时还需承运人原始依据的 sourceIds 和本次 verifiedAt。三个阶段均有 min/max；清关和配送阶段还需 `kind:estimate`。低位=三段 min 合计，高位=三段 max 合计，基准介于其间。公开参考只能 low/medium，只有货代参考且无承运人原始依据时为 low。note 写局势、转运、假设和未决条件，不将集装箱参考伪装成整车滚装交期。

## 自动到期清理

明确 validTo 早于 asOf 的优惠/活动可不重新搜索就撤下。使用 `reasonType:expiry`，提交旧数组删去过期行后的新数组；允许字段为 financeOffers、marketingActivities、recentEvents、researchV2.dealerOffers。highValueSignals 可删过期或已超 30 天的事件。不得添加/改写其他行，不得把无截止日等同过期。

## 私有异常与公开范围

issues 可以详细记冲突和检索限制，但不能包含访问令牌。公开 value、reason、source URL 与 release manifest 必须只含可公开的市场信息。提交脚本校验失败时先核对来源与映射；不得改规则来让错误数据通过。协议与 UI/工具本身的升级另行维护。
