---
name: marketing-buddy-research
description: Research and structure country-level automotive market intelligence for Marketing Buddy, including vehicles, prices, sales, finance, warranty, marketing activity, import tariffs, customs classification, origin and trade-agreement checks. Use when an agent is asked to collect or update Marketing Buddy market data; do not use it to redesign, publish, deploy, or directly modify the website.
---

# Marketing Buddy Research

Produce reviewable evidence and structured data for one target country at a time. The research agent is a data supplier, not the website owner.

## Required inputs

Before researching, obtain:

- target country and country code;
- fixed EMGRAND and competitor list;
- current `autointel-v1.6.schema.json`;
- current seed or baseline JSON;
- reporting date and 30-day monitoring window.

Do not change a fixed competitor, product structure, page layout, GitHub repository, or deployment state.

## Research workflow

1. Read [references/research-matrix.md](references/research-matrix.md) and cover every mandatory lane. A country baseline is incomplete until the policy/customs lane has been attempted.
2. Search in the country’s official language plus English. Start with primary official sources, then use reliable secondary sources only to fill gaps or locate primary documents.
3. Separate published facts from inference. A vehicle-specific customs classification is not confirmed merely because engine displacement appears to match a tariff heading.
4. Store every confirmed fact with `sourceIds`; store every source with URL, publisher, type, language, publication date when available, and access time.
5. Use `unconfirmed` for a credible lead that still needs verification. Use `not_found` only after recording the official channels and search terms attempted.
6. Read [references/submission-contract.md](references/submission-contract.md) before preparing the handoff package.

## Mandatory policy/customs gate

For each country, explicitly check:

- official gazette and trade/customs authority;
- HS/tariff heading and local extension such as NICO;
- current general import duty and effective dates;
- country of origin and applicable FTA or preferential agreement;
- quotas, exemptions, temporary programs, local-assembly treatment and special importer arrangements;
- likely vehicle impact, with a clear boundary between official rule and analyst inference.

If no material policy is found, report the searches performed. Never treat “no news result” as “no policy.”

## Evidence rules

- Prefer government, customs, regulator, industry association, official brand, official price list/PDF, promotion terms and warranty terms.
- Do not infer local price, model year, equipment, warranty or sales from another country.
- Distinguish MSRP, dealer price and promotion price.
- Finance requires rate, down payment, term, fees, validity and eligibility when available.
- Sales requires period, unit, geography and model scope.
- Policy requires effective date, legal scope, affected tariff codes and exceptions.
- Do not equate an import duty percentage with the same percentage change in retail price.
- If sources conflict, retain the conflict note and prefer the newer, more specific primary source.

## Output and authority boundary

Return only a staged research package:

- `marketing-buddy.<country-code>.json`
- `Marketing_Buddy_<country-code>_研究说明.md`
- a validation result produced by `scripts/validate_submission.mjs`

The agent must not copy data into the live website folder. The owning workflow validates the package, previews the diff, requests human approval for judgment calls, merges approved data, regenerates the browser bundle and runs website tests.
