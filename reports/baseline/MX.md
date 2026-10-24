# AutoIntel V1.6｜墨西哥首轮基线研究

> 研究日期：2026-10-24  
> 研究范围：Geely EMGRAND、Kia K3 Sedan、MG5  
> 状态：首轮基线完成；部分字段待专项补充  
> 数据文件：`autointel-v1.6.baseline-mx.json`

## 1. 结论

墨西哥样本已经能够验证 AutoIntel 的核心数据链路：车型版本与价格、促销金融、售后保障、车身长度、月销量、30 天竞争事件和字段级来源都可以按既定 Schema 表达。

截至当前公开数据：

| 车型 | 最低指导价 | 当前公开优惠 | 车身长度 | 2026-09 销量 | 核心质保 |
|---|---:|---:|---:|---:|---|
| Geely EMGRAND 2026 | 299,990 MXN | 264,990 MXN（有条件，至 10 月 30 日） | 4,638 mm | 1,555 | 整车 5 年/150,000 km；动力总成 8 年/250,000 km |
| Kia K3 Sedan 2027 | 304,900 MXN | 最高 36 个月免息（L MT 除外，至 10 月 31 日） | 4,545 mm | 3,753 | 基础 5 年/100,000 km；动力总成 7 年/150,000 km |
| MG5 2027 | 299,900 MXN | 官网特别价 274,900 MXN 起；有效期未在车型页正文确认 | 4,607 mm* | 2,425 | 整车 5 年/100,000 km；动力总成 7 年/150,000 km |

\* MG5 车长暂采用可信第三方车型库，尚待 MG 官方资料复核。

## 2. 市场概况

- INEGI 2026 年 10 月 7 日发布的详细记录显示，墨西哥 2026 年 9 月销售 **129,274 辆**轻型车。
- INEGI 10 月 2 日的先行统计显示，2026 年 1—9 月共销售 **1,144,002 辆**，同比增长 **5.0%**。
- AMDA 引用行业数据称，2026 年 9 月 subcompact 销量为 **28,501 辆**，同比增长 **5.8%**；compact 为 **21,327 辆**，同比增长 **24.1%**。
- INEGI 的车型分类中，EMGRAND 与 Kia K3 Sedan 属于 subcompact，MG5 属于 compact。因此三车可以作为业务竞品比较，但细分口径并非完全一致。

### 2.1 重大政策补充：相关整车税号 50% 进口税率

- 墨西哥《联邦官方公报》于 2025 年 12 月 29 日公布 TIGIE 税率改革，包括 `8703.22.99` 在内的多项整车税号，其一般进口税率列为 **50%**。
- 墨西哥经济部说明该关税方案自 **2026 年 1 月 1 日**起生效，面向与墨西哥没有贸易协定国家的相关商品，并非在法律表述上只针对中国。
- EMGRAND 的官方规格为 1.5L。若墨西哥在售车辆以中国原产 CBU 进口并实际归入 `8703.22.99`，原则上会受到显著进口成本压力。
- 上一条属于有依据的业务推断，不等于已经取得该车型的实际报关税号/NICO。最终适用仍需核对进口商报关资料、原产地与具体进口安排。
- **50% 是进口税率，不等于终端售价必然上涨 50%。** 实际传导还取决于完税价格、费用基数、厂商承担、渠道利润、促销和本地化安排。

## 3. 车型与价格

### 3.1 Geely EMGRAND

官方在售版本：

- GC：299,990 MXN。
- GL：347,990 MXN。
- GF：373,990 MXN。

2026 年 9 月 30 日至 10 月 30 日的官方促销包括：

- GC 在指定 Geely Financial Services 信贷方案下特别价 264,990 MXN。
- GF 奖励最高 60,000 MXN。
- 可选首付 74,800 MXN 起、月供 5,749 MXN 起、0% 开办佣金；公开条款显示平均期限 72 个月、固定年利率 15.99%，须经审批。

### 3.2 Kia K3 Sedan

官方 2027 款版本与指导价：

- L MT：304,900 MXN。
- L AT：335,500 MXN。
- LX MT：358,600 MXN。
- LX AT：372,600 MXN。
- EX AT：400,300 MXN。
- EX PACK AT：435,900 MXN。
- GT LINE AT：477,900 MXN。

2026 年 10 月活动：除 L MT 外，可享最高 36 个月免息并延后至 12 月开始还款。活动条款以 30% 首付、2% 合同佣金等条件计算，10 月 31 日截止。

### 3.3 MG5

官方车型页展示：

- STYLE MT：指导价 299,900 MXN，特别价 274,900 MXN。
- EXCITE MT：指导价 344,000 MXN，特别价 299,000 MXN。
- EXCITE CVT：指导价 378,000 MXN，特别价 328,000 MXN。
- ELEGANCE CVT：指导价 399,000 MXN，特别价 344,000 MXN。

车型页没有在可读取正文中明确特别价有效期，也没有提供可复现的当前金融方案完整条款，因此金融字段仍标为 `unconfirmed`。

## 4. 销量与气泡图输入

INEGI 车型级月度数据：

| 月份（2026） | EMGRAND | Kia K3 Sedan | MG5 |
|---|---:|---:|---:|
| 1 月 | 1,749 | 3,550 | 3,901 |
| 2 月 | 1,423 | 4,143 | 1,094 |
| 3 月 | 1,292 | 4,013 | 2,553 |
| 4 月 | 1,529 | 3,768 | 2,257 |
| 5 月 | 1,938 | 4,444 | 1,991 |
| 6 月 | 1,924 | 4,849 | 2,582 |
| 7 月 | 1,719 | 4,603 | 2,269 |
| 8 月 | 1,546 | 4,129 | 1,809 |
| 9 月 | 1,555 | 3,753 | 2,425 |

首版气泡图采用 2026 年 9 月作为统一销量周期：

- X 轴：EMGRAND 4,638 mm；K3 4,545 mm；MG5 4,607 mm。
- Y 轴：各车型最低厂商指导价，不使用促销价，避免活动条件影响可比性。
- 气泡面积：2026 年 9 月销量。

## 5. 售后保障

### Geely EMGRAND

- 整车：5 年或 150,000 km。
- 动力总成：8 年或 250,000 km。
- 官方车型页说明提供全年 365 天、每天 24 小时道路救援，但当前车型页正文未明确年限。

### Kia K3

- 基础保障：5 年或 100,000 km。
- 动力总成：7 年或 150,000 km。
- Kia 官方保障页说明包含道路救援，具体适用条件以保修政策为准。

### MG5

- 整车：5 年或 100,000 km。
- 动力总成：7 年或 150,000 km。
- Lucky Seven：7 年道路救援，并包含 7 年被盗零部件保障计划。

## 6. 近 30 天竞争动作

1. **EMGRAND 价格促销**：9 月 30 日起，GC 特别价降至 264,990 MXN，GF 奖励最高 60,000 MXN；有效至 10 月 30 日。
2. **K3 金融促销**：10 月 1 日起，K3 Sedan 2027 提供最高 36 个月免息，并延后至 12 月开始还款；有效至 10 月 31 日。
3. **MG 售后能力传播**：MG 10 月 20 日公布其墨西哥授权经销商超过 108 家，零部件中心可在三个工作日内向经销商交付，并继续强调 Lucky Seven 保障。

## 7. 对 EMGRAND 的业务意义

- **价格**：EMGRAND 与 MG5 的最低指导价几乎相同，EMGRAND 仅高 90 MXN；当期有条件特别价则比 MG5 官网特别价低 9,910 MXN，比 K3 最低指导价低 39,910 MXN。
- **尺寸**：EMGRAND 是三车中最长的，较 K3 长 93 mm，较 MG5 长 31 mm；这可支持空间与价值感表达，但不能单靠长度推断实际乘坐空间。
- **销量**：2026 年 9 月 K3 销量约为 EMGRAND 的 2.4 倍，MG5 约为 1.6 倍。EMGRAND 的价格优势尚未转化为同级领先销量。
- **金融**：K3 的免息方案与 EMGRAND 的价格奖励不是同一口径。后续页面必须同时展示优惠价格、年利率、首付、期限和总融资条件，避免只比较月供。
- **售后**：EMGRAND 的动力总成和整车里程保障更长；MG 则持续强调经销商规模、零部件配送和 7 年综合保障，形成另一种信任竞争。
- **关税与供应链**：50% 一般进口税率可能改变中国原产 CBU 的到岸成本、促销空间和定价竞争力。后续必须把实际税号/NICO、原产地、进口商安排和本地组装可能性列为一级验证项。

## 8. 数据冲突与处理

- INEGI 10 月 2 日先行新闻稿给出的 9 月销量为 129,288 辆；10 月 7 日详细记录为 129,274 辆。样本采用更新、更细的 **129,274 辆**作为当月总量，并保留先行稿用于 1—9 月累计和同比。
- MG5 官方规格 PDF 的可读取文本未展示车长；目前用 Autocosmos 的 4,607 mm 作为临时值，并在数据中写明需官方复核。
- MG5 官网显示特别价格，但当前正文未确认有效期；价格保留并附核验提示，不把它解释为长期价格。

## 9. 待补充字段

- EMGRAND 墨西哥实际报关税号/NICO、原产地证明及进口安排，以确认 50% 税率的车型级适用性。
- 墨西哥新车销售渠道结构，而不只是品牌经销商入口。
- Geely 和 Kia 的全国授权网点数量。
- MG5 当前金融方案的完整有效期、首付、利率与期限。
- MG5 车长的厂商官方来源。
- 三车可比配置版本的严格对齐规则。

## 10. 主要来源

- [INEGI：RAIAVL 详细数据](https://www.inegi.org.mx/datosprimarios/iavl/)
- [INEGI：2026 年 9 月先行结果](https://www.inegi.org.mx/app/saladeprensa/noticia/11258)
- [INEGI：车型级交互表](https://www.inegi.org.mx/app/tabulados/interactivos/?bd=RAIAVL&px=RAIAVL_8_9)
- [AMDA：2026 年 9 月细分市场](https://www.amda.mx/todos-los-segmentos-de-vehiculos-nuevos-excepto-deportivos-con-variaciones-positivas-durante-septiembre-de-2026/)
- [Geely México：EMGRAND 车型页](https://www.geelymexico.com/autos-gasolina/vehiculos/emgrand)
- [Geely México：EMGRAND 2026 年 10 月促销](https://www.geelymexico.com/promociones/emgrand/152)
- [Kia México：K3 Sedan 规格与价格](https://www.kia.com/mx/showroom/k3-sedan/specification.html)
- [Kia México：K3 2026 年 10 月促销](https://www.kia.com/mx/shopping-tools/promociones-new/promocion-k3-sedan-hatchback-msi.html)
- [Kia México：保修政策](https://www.kia.com/mx/owners/warranty-recalls/warranty.html)
- [MG Motor México：Nuevo MG5](https://www.mgmotor.com.mx/vehiculos/mg5nuevo)
- [MG Motor México：保修常见问题](https://www.mgmotor.com.mx/preguntas-frecuentes)
- [MG Motor México：Lucky Seven](https://www.mgmotor.com.mx/servicios/lucky-seven)
- [MG Motor México：售后与网络信息](https://www.mgmotor.com.mx/noticia/59)
- [Autocosmos：MG5 尺寸临时来源](https://www.autocosmos.com.mx/catalogo/comparar?v1=173437&v2=173440)
- [墨西哥《联邦官方公报》：TIGIE 多项税号税率改革](https://sidof.segob.gob.mx/notas/docFuente/5777376)
- [墨西哥经济部：战略产业关税方案说明](https://podecobi.economia.gob.mx/noticias/paquete-arancelario-para-proteger-empleos-en-industrias-estrategicas/)
