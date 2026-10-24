# Mandatory research matrix

Complete one country per run. A missing field is allowed; an omitted research lane is not.

| Lane | Required checks | Preferred primary sources | Minimum output |
|---|---|---|---|
| Market | Latest annual/YTD passenger or light-vehicle volume, growth, sedan/segment proxy | statistics office, transport ministry, industry association | period, unit, scope, source |
| Policy & customs | tariff reform, HS/local code, duty, origin, FTA, effective date, exemptions, quotas, import programs, homologation | official gazette, customs/trade ministry, tariff database | rule + affected codes + effective date + scope + caveat |
| Vehicle availability | official local sale status, model year, trims | local brand/model page, official brochure | local name, model year, variants |
| Price | MSRP, dealer price, promotion price, validity | official price list, local brand, authorized dealer | price type, currency, variant, date |
| Finance | down payment, rate, payment, term, fee, eligibility, validity | official promotion terms, captive finance company | conditions and validity; no implied zero rate |
| Warranty & aftersales | vehicle/powertrain warranty, maintenance, roadside assistance, network claims | warranty policy, official aftersales page | coverage, time/km, exclusions if material |
| Sales | latest comparable model volume and period | government registration/sales database, association | model scope, period, unit |
| Marketing activity | campaigns, launches, partnerships, media, activations within 30 days | official newsroom/social, reliable trade press | date, description, evidence, EMGRAND relevance |
| Competitor judgment | price, size, sales and positioning relationship | above evidence | recommendation reason; never auto-adopt |

## Policy/customs search recipe

Search both general policy terms and the model’s likely technical classification. Typical query components:

- local-language terms for tariff, customs duty, import tax, official gazette, passenger vehicle and rules of origin;
- `HS 8703`, relevant engine-displacement or powertrain subheading, and the country’s local tariff extension;
- CBU, CKD/SKD, local assembly, import quota, exemption, temporary measure and trade agreement;
- manufacturer country of origin and any preferential route claimed by the importer.

For Mexico, always include: `DOF`, `TIGIE`, `NICO`, `fracción arancelaria`, `8703`, `CBU`, `paquete arancelario`, `países sin tratado comercial` and `reglas de origen`.

## Decision boundary

The legal rule can be `confirmed` from an official source. Its application to a particular vehicle stays conditional until the actual customs code/NICO, origin and import arrangement are known. Record that distinction in both the JSON note and the human-readable report.

