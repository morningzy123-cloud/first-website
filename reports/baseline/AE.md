# Marketing Buddy｜阿联酋（AE）首轮基线研究说明

**研究对象：** Geely EMGRAND 及阿联酋紧凑型/经济型轿车竞品  
**研究日期：** 2026-10-24（Asia/Shanghai）  
**30日监测窗口：** 2026-09-25 至 2026-10-24  
**状态：** 首轮基线已完成，部分字段仍待当地经销商或付费登记数据确认  
**权限边界：** 本包只用于暂存与审核；未修改网站、主数据、GitHub或部署状态。

## 一、执行摘要

1. **EMGRAND在阿联酋正式在售。** Geely UAE/AGMC官网列出EMGRAND，当前展示金融起价 **AED 850/月**；本地车型页和官方宣传册确认1.5L、6AT、GS/GF版本及4,638 mm车长。官方未在公开车型页给出可核验的现金指导价，因此市场上的AED 57,900左右只保留为未确认线索。
2. **当前官方售后优势突出。** Geely UAE公开整车保修为 **7年或250,000公里**，在本轮建议竞品中长于MG的6年/200,000公里、Toyota的3年/100,000公里和Nissan的3年厂家保修加2年延保结构。
3. **政策成本环境相对稳定但不能简化为“10%税”。** GCC联盟外外国货物一般关税为5%；UAE综合税则中87.03乘用车税目为5%；境内汽车销售另适用5% VAT。1.5L汽油两驱私人乘用车在特征上可能对应 **8703 22 11 00 00**，但EMGRAND实际适用仍必须以报关税号、车型年份、原产地证明及进口安排确认。关税和VAT的计税基础不同，不能把两者简单等同为零售价上涨10%。
4. **2025增长、2026回调。** 专业销量数据称2025年阿联酋新车销量约335,772辆，同比增长5.3%；2026年前7个月同比下降22.2%。阿联酋没有便于公众核验的统一车型销量数据库，公开总量存在约30.8万至35.7万辆的口径差异，因此需要统一数据供应商后再做长期趋势。
5. **车队和租赁不能作为附属渠道处理。** 官方页面同时存在零售金融、全包租赁和企业车队方案。Toyota Yaris企业方案从AED 899/月起；Geely有独立Fleet Sales页面；行业媒体援引MG经销商IEM数据称，2021年以来累计交付中约45%来自车队和机构客户。
6. **本轮建议4个竞品，全部仅为 `suggested`：** MG5、Nissan Sunny、Toyota Yaris Sedan、Changan Alsvin。没有任何车型被自动写成`adopted`或`fixed`，阿联酋市场的`primaryCompetitorIds`保持为空，等待人工决定。

## 二、竞品扫描与建议

| 建议车型 | 建议级别 | 当前价格线索 | 推荐理由 | 需要注意 |
|---|---|---:|---|---|
| MG5 | AI suggested | 官方页面起价AED 56,000 | 与EMGRAND价格、车长和中国品牌价值定位最接近；金融促销和车队渗透强 | MG官方页面价格近期从AED 49,900变化到AED 56,000，须按周记录快照 |
| Nissan Sunny | AI suggested | 二级价格指南AED 61,500起 | 公开月度销量线索明显领先；零售、租赁和机构采购认知强 | 阿布扎比/艾因与迪拜/北部酋长国由不同经销商经营，报价和活动不能混用 |
| Toyota Yaris Sedan | AI suggested | 2026款官方AED 64,900起 | 日系品牌、残值、售后与企业车队方案构成基准 | 价格高于EMGRAND；企业保修按合同而非标准零售条款 |
| Changan Alsvin | AI suggested | 二级价格指南约AED 43,900 | 中国品牌低价入门轿车，对EMGRAND形成向下价格压力 | 车身更小；官方现金价、当前保修和销量未完整确认，应作为二级监控 |

### 人工建议

- **优先采纳为主竞品：** MG5、Nissan Sunny。
- **建议作为次级竞品：** Toyota Yaris Sedan。
- **建议作为价格监控车型：** Changan Alsvin。
- 上述建议不是产品决定，需项目负责人确认后才能改变竞品池状态。

## 三、关键车型事实

### Geely EMGRAND

- 正式在售：已确认。
- 本地版本：GS、GF；公开宣传册未明确当前销售年款。
- 动力与尺寸：1.5L直喷、6AT、车长4,638 mm。
- 金融：AED 850/月起；首付、利率、期限、费用和资格未公开。
- 租赁：专项页面显示AED 1,155/月起，含服务、保险、保修、注册、道路救援和VAT；其他车型/下载页显示AED 1,240/月，存在官方页面冲突。
- 保修：7年/250,000公里，以先到者为准，可转让。
- 经销网络：AGMC；官方信息显示迪拜、沙迦、哈伊马角和阿布扎比覆盖，阿布扎比Mussafah设施同时提供销售和售后。
- 现金指导价：公开官方页面未找到；AED 57,900仅为市场线索。
- 车型销量：仅找到2025年2月237辆的二级数据线索，未确认底层登记来源。

### MG5

- 正式在售：已确认。
- 官方起价：AED 56,000。
- 当前金融页面：AED 855/月起，“先开车、明年付款”，含首付支持、免费保养、贴膜、道路救援和注册；仅适用于指定车型并有效至库存售罄，未公开利率和期限。
- Fazaa持卡人：2026 MG5 LUX额外AED 1,000折扣，未列固定结束日期。
- 保修：6年/200,000公里。
- 近期竞争事件：2026-10-21行业媒体援引IEM数据称，2021年以来累计MG交付50,000辆，约45%为车队及机构客户；这是品牌渠道事件，不是MG5车型销量。
- 车型销量：2025年2月196辆的二级线索。

### Nissan Sunny

- 正式在售/价格：2026款在售和AED 61,500起仅由二级价格指南确认；当前Nissan公开页面没有抓取到现金价。
- 保修：3年/100,000公里厂家保修，加赠2年零售延保；Nissan页面对阿联酋延保里程表述为不限里程。
- 经销区域：Al Masaood负责阿布扎比、艾因及Madinat Zayed；Arabian Automobiles负责迪拜及北部酋长国。
- 车型销量：2025年2月685辆的二级线索，是本轮车型中最高。
- 当前金融/营销：未找到Sunny专属、带完整条款和有效期的官方活动。

### Toyota Yaris Sedan

- 正式在售：2026款1.5L E。
- 官方起价：AED 64,900；官方页面月供AED 1,017。
- 企业车队方案：AED 899/月起，含保养合同、延长保修、防锈和注册；资格与合同条件未公开。
- 标准保修：3年/100,000公里；企业销售车辆以采购合同为准。
- 车型销量：2025年2月178辆的二级线索。

### Changan Alsvin

- 正式在售：官方页面列出Advance版本，1.5L DCT，车长4,390 mm。
- 现金价：二级价格指南约AED 43,900，待Union Motors含VAT正式报价确认。
- 金融：在线页面显示1.99%年平息率估算，但同页注明该购买选项当前不可用，不能作为有效促销发布。
- 保修：官方公开保修文章只明确CS/UNI系列，未找到可外推到Alsvin的当前条款。
- 销量：未找到可核验公开车型销量。

## 四、强制研究矩阵完成情况

| 研究通道 | 状态 | 结果 |
|---|---|---|
| 市场规模与趋势 | 已覆盖 | 2025年335,772辆、+5.3%；2026年前7个月-22.2%。无统一公开政府车型销量库，保留口径说明。 |
| 政策与海关 | 已覆盖 | 官方GCC关税同盟、UAE综合税则、VAT指引、CEPA清单、进口文件和注册规则均已检查。 |
| 在售状态 | 已覆盖 | EMGRAND及4个建议竞品均检查当地官网；Sunny年款/现金价仍依赖二级来源。 |
| 价格 | 部分覆盖 | MG5、Yaris官方现金价确认；EMGRAND、Sunny、Alsvin现金价待正式报价。 |
| 金融 | 部分覆盖 | EMGRAND、MG5、Yaris有官方月供/租赁/企业方案；多数页面缺首付、利率、期限、费用和固定有效期。 |
| 保修售后 | 部分覆盖 | Geely、MG、Nissan、Toyota已确认；Alsvin专属保修缺失。 |
| 销量 | 部分覆盖 | 市场总量和趋势可用；车型销量仅有2025年2月二级同口径线索。 |
| 近30日营销活动 | 已尝试 | 找到2026-10-21 MG品牌/渠道事件；未找到EMGRAND、MG5、Sunny、Yaris、Alsvin带明确发布日期的车型级官方活动。当前无日期优惠单独标注。 |
| 竞品判断 | 已完成待审 | 4个AI建议均为`suggested`，未自动采纳。 |

## 五、政策与海关核验记录

### 已确认规则

1. **关税：** UAE ICP说明GCC联盟外外国货物一般税率为5%。Dubai Customs综合税则在87.03乘用车项下列示5%。
2. **可能税号：** EMGRAND为1.5L汽油轿车；若为两驱私人乘用车且属于清关当年或下一年车型，技术特征可能对应`8703 22 11 00 00`，税率5%。这只是基于公开技术参数的分类推断，不是海关预裁定。
3. **VAT：** UAE Federal Tax Authority汽车行业指引确认境内汽车销售适用5% VAT；进口VAT的实际申报和抵扣取决于进口商税务身份和交易结构。
4. **原产地/贸易协定：** 中国未出现在本轮检索到的UAE官方CEPA现行伙伴清单中。中国原产CBU通常按一般税率处理，但仍须核对是否存在其他GCC层面的优惠安排、实际原产地和有效原产地证明。
5. **自由区：** GCC关税同盟说明自由区货物进入本地市场时仍按当时税则征税；自由区适合转口不等于进入阿联酋消费市场免税。
6. **清关与注册：** 官方进口指南要求商业发票、原产地证书、装箱单、HS编码和必要许可；车辆注册需要车辆清关证书、保险并通过各酋长国主管渠道。

### 搜索渠道

- UAE Federal Authority for Identity, Citizenship, Customs & Port Security：GCC Customs Union、Central Customs Tariff System。
- Dubai Customs：Integrated Customs Tariff、车辆进口/估值和CIF说明。
- UAE Federal Tax Authority：Automotive Sector VAT Guide、5% VAT。
- UAE Ministry of Economy and Tourism：CEPA现行伙伴清单、原产地规则。
- UAE Government Portal / Ministry of Industry and Advanced Technology：进口文件、车辆注册、产品合规及进口车辆状态服务。

### 英文搜索词

`UAE customs tariff passenger cars 8703`、`HS 870322 UAE 5%`、`GCC common external tariff`、`UAE vehicle import VAT`、`China UAE CEPA passenger vehicles`、`CBU CKD SKD UAE`、`free zone vehicle import local market duty`、`vehicle conformity certificate UAE`、`vehicle clearance certificate UAE`。

### 阿拉伯语搜索词

`التعرفة الجمركية الإمارات سيارات الركوب 8703`、`رسوم استيراد السيارات 5% الإمارات`、`ضريبة القيمة المضافة السيارات الإمارات`、`شهادة منشأ المركبات`、`سيارات CBU CKD الإمارات`、`المناطق الحرة رسوم السيارات السوق المحلي`、`شهادة مطابقة المركبات الإمارات`。

### 未发现项目

- 未发现针对中国原产普通燃油乘用车的联邦进口配额或专门豁免。
- 未发现可公开核验的EMGRAND专属海关预裁定或实际报关单。
- 未发现EMGRAND在阿联酋本地CKD/SKD组装的可靠官方证据。
- 未发现可把自由区转口待遇直接应用于阿联酋本地零售的依据。

## 六、酋长国、经销商与渠道差异

- **Geely：** AGMC为阿联酋经销商，官方网络跨迪拜、沙迦、哈伊马角和阿布扎比。未发现按酋长国公开列出的EMGRAND统一现金价格差异，但库存、注册、保险和地方促销仍需逐店核对。
- **MG：** IEM为阿联酋独家经销商，展厅覆盖迪拜、阿布扎比、哈伊马角、富查伊拉、艾因和沙迦；服务中心覆盖范围略窄。车型页面和优惠通常为全国口径。
- **Toyota：** Al-Futtaim提供全国零售和企业解决方案；企业车辆的保修和服务按采购合同。
- **Nissan：** 存在明确分区经销结构：Al Masaood负责阿布扎比/艾因，Arabian Automobiles负责迪拜/北部酋长国。任何Sunny价格、保险、金融或服务权益必须保留经销区域字段。
- **注册：** 车辆注册由各酋长国交通主管机构处理，地方费用、牌照和保险成本可能不同；基线没有把某一酋长国的注册成本外推到全国。

## 七、车队与租赁影响

1. 阿联酋经济型轿车不能只按个人零售市场评价。官方品牌页已把Fleet Sales、Business Solutions和全包租赁作为独立产品。
2. Geely EMGRAND同时出现AED 850/月零售金融和AED 1,155/月全包租赁，二者成本口径完全不同。
3. Toyota Yaris企业方案打包保养、延长保修、防锈和注册，对车队采购的总拥有成本比单纯MSRP更重要。
4. 行业研究称2025年经济型车辆占租车市场收入的大部分；该结论来自商业研究机构，只作为结构性参考。
5. 行业媒体援引IEM称MG累计客户中约45%来自车队和机构采购，说明MG5的直接竞争力可能高于零售网页所显示的比例。
6. 后续正式数据应新增渠道字段：`retail / fleet / rental / government / corporate lease`，并禁止把车队批售价和个人零售价混在同一价格字段。

## 八、30日营销监测结果

### 在窗口内确认的相关事件

- **2026-10-21：** 行业媒体报道IEM的MG阿联酋累计交付和车队/机构客户结构。该事件属于品牌与渠道层面，不能计为MG5单车销量或车型活动。

### 当前可见但没有发布日期/有效期的官方优惠

- EMGRAND：AED 850/月起；全包租赁AED 1,155/月起。
- MG5：AED 855/月起，“先开车、明年付款”；Fazaa持卡人额外AED 1,000折扣。
- Toyota Yaris：零售AED 1,017/月；企业方案AED 899/月起。
- Changan Alsvin：1.99%年平息率估算，但购买选项显示当前不可用。

上述页面只能证明“访问日仍可见”，不能证明活动在过去30日新发布。Weekly Update agent应保存首次发现日期、页面快照哈希和最后确认日期，避免把长期页面每周重复报成新活动。

## 九、冲突与推断边界

1. **EMGRAND租赁价冲突：** 专项租赁页AED 1,155/月；车型/宣传册入口AED 1,240/月。合并前必须向AGMC确认当前适用价格、租期和里程。
2. **MG5官方价格变化：** 搜索缓存中出现AED 49,900，当前页面显示AED 56,000。本次采用当前页面的AED 56,000，并要求周度更新保留价格变更时间戳。
3. **市场总量口径冲突：** 不同数据商给出约308,495、335,772和356,963辆。可能包含乘用车/轻型商用车、品牌覆盖或后补数据差异；本报告选用335,772作为单一趋势口径，不混算。
4. **车型销量：** 2025年2月的EMGRAND、MG5、Sunny、Yaris数字来自二级榜单，未公开登记来源；全部为`unconfirmed`。
5. **海关分类：** 1.5L参数只支持推断到8703.22相关分支；没有报关单或海关预裁定就不能把`8703 22 11 00 00`写成EMGRAND已确认税号。
6. **CEPA：** “官方当前CEPA清单中没有中国”不等于永久不存在任何其他优惠路径；必须在每次政策更新中继续核对GCC层面协议和生效时间。

## 十、缺失字段与下一步验证

- EMGRAND当前现金MSRP、GS/GF各版本价格和明确年款。
- EMGRAND AED 850/月的首付、期限、年利率、手续费、提前还款和客户资格。
- EMGRAND全包租赁AED 1,155与AED 1,240冲突的最终有效价。
- EMGRAND实际报关税号、原产地证明、进口商、CIF计税基础和清关路径。
- 2026年EMGRAND、MG5、Sunny、Yaris、Alsvin的同口径车型销量。
- Sunny当前授权经销商现金价与两个区域的促销差异。
- Alsvin当前官方含VAT现金价、专属保修和有效金融方案。
- 过去30日各车型带发布日期的官方社交媒体活动；品牌官网大多没有发布日期。
- 各车型零售与车队/租赁销量拆分。

## 十一、需要人工决定

1. 是否把MG5和Nissan Sunny设为阿联酋主竞品。
2. 是否把Toyota Yaris设为次级竞品、Changan Alsvin设为价格监控车型。
3. 网站是否接受二级车型销量作为“参考值”，或在没有官方/付费登记数据时统一显示“未确认”。
4. 是否购买或接入JATO/MarkLines/Focus2move等统一车型销量数据，以消除不同公开来源的口径冲突。
5. 在取得报关资料前，网站政策卡应写“可能对应8703 22 11 00 00”，不能写“EMGRAND税号已确认”。

## 十二、验证结果

执行：

```text
node outputs/marketing-buddy-research/scripts/validate_submission.mjs work/research-ae/marketing-buddy.ae.json
```

结果：

```text
PASS work/research-ae/marketing-buddy.ae.json
Sources: 34; markets: 4; evidence references resolved.
```

验证器另对尚未研究完成的MX/KZ/SA seed政策字段给出提示，不属于AE提交错误。AE政策字段已完成强制闸门。

## 十三、来源清单

### 政府、海关与税务

- [UAE ICP｜GCC Customs Union](https://icp.gov.ae/en/customs-union-for-gcc/)
- [Dubai Customs｜Integrated Customs Tariff PDF](https://www.dubaicustoms.gov.ae/en/PoliciesAndNotices/Documents/IntegratedCustomsTariff.pdf)
- [UAE Federal Tax Authority｜Automotive Sector VAT Guide](https://tax.gov.ae/DownloadOpenTextFile?fileUrl=en%2FVAT_VAT_Guides%2FAutomotive_Sector%2FAutomotive_Sector_EN_29_06_2021_EN.pdf)
- [UAE Ministry of Economy and Tourism｜CEPA](https://www.moet.gov.ae/en/cepa)
- [UAE Government Portal｜Imports and Exports Guide](https://u.ae/-/media/Information-and-services/Business/UAE-imports-and-exports-guide-eng.pdf)
- [UAE Government Portal｜Registering vehicles](https://u.ae/en/information-and-services/transportation/registering-vehicles)

### Geely / EMGRAND

- [Geely UAE｜Vehicle catalogue](https://www.geely.ae/en/vehicles)
- [Geely UAE｜EMGRAND model page](https://www.geely.ae/en/car/emgrand)
- [Geely UAE｜EMGRAND brochure](https://www.geely.ae/wp-content/uploads/2024/04/Geely-Emgrand-Online-Brochure.pdf)
- [Geely UAE｜Warranty](https://www.geely.ae/en/service-warranty)
- [Geely UAE｜Leasing offers](https://www.geely.ae/en/offers/geely-leasing-offers)
- [Geely UAE｜Fleet sales](https://www.geely.ae/en/fleet-sales)
- [Geely UAE｜Abu Dhabi network expansion](https://www.geely.ae/en/news/geely-uae-unveils-the-future-of-intelligent-mobility-with-state-of-the-art-showroom-and-service-facility-in-abu-dhabi)

### 建议竞品官方来源

- [MG UAE｜MG5](https://www.mg-uae.com/models/mg-5/)
- [MG UAE｜Warranty](https://www.mg-uae.com/owners/warranty)
- [MG UAE｜Drive now, pay next year](https://www.mg-uae.com/offers/new-cars/drive-now-pay-next-year.)
- [MG UAE｜Fazaa offer](https://www.mg-uae.com/offers/new-cars/fazaa-offer/)
- [MG UAE｜IEM network statement](https://www.mg-uae.com/news/mg8-phev-debuts-in-the-uae)
- [Toyota UAE｜Yaris 2026](https://www.toyota.ae/en/new-cars/yaris/)
- [Toyota UAE｜Warranty](https://www.toyota.ae/en/owners/warranty/)
- [Toyota UAE｜Yaris business offer](https://www.toyota.ae/en/offers/business-solutions/business-solutions-yaris/)
- [Nissan Dubai｜Dubai and Northern Emirates](https://en.nissan-dubai.com/)
- [Nissan Abu Dhabi｜Al Masaood distributor](https://en.buyonline.nissan-abudhabi.com/about-us/)
- [Nissan Middle East｜Warranty](https://www.nissan-me.com/owners/nissan-warranty.html)
- [Changan UAE｜Alsvin](https://www.changan.ae/buy-online/alsvin?grade=1)
- [Changan UAE｜Terms](https://www.changan.ae/terms)

### 市场、销量和辅助来源

- [Best Selling Cars Blog｜UAE full year 2025](https://bestsellingcarsblog.com/2026/02/united-arab-emirates-full-year-2025-toyota-hilux-leads-jetour-t2-3/)
- [Focus2move｜UAE market 2026](https://www.focus2move.com/emirates-automotive-market/)
- [iCarTea｜UAE sedan ranking February 2025](https://www.icartea.com/en/car-sales-ranking/uae/model-sedan/2025-02)
- [YallaMotor｜UAE distributors and MG fleet mix](https://www.yallamotor.com/news/uae-car-dealers-kia-mg-and-freelander-2026-55801)
- [Mordor Intelligence｜UAE car rental market](https://www.mordorintelligence.com/industry-reports/united-arab-emirates-car-rental-market)
- [Dubai Car Index｜Sunny price guide](https://dubaicarindex.com/buy/new/nissan/sunny)
- [Dubai Car Index｜Alsvin price guide](https://dubaicarindex.com/buy/new/changan/alsvin)
- [Madena｜MG5 dimensions](https://www.madena.ae/cars/mg/mg-5)

