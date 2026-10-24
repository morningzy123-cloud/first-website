# Submission and website-ingestion contract

## Research-agent deliverables

1. Structured JSON compatible with the current project schema.
2. Markdown research notes containing:
   - executive findings;
   - mandatory-lane checklist;
   - policy/customs search log;
   - conflicts and inference boundaries;
   - missing fields;
   - decisions requiring a human;
   - source list.
3. Validator output from:

```text
node scripts/validate_submission.mjs <data.json>
```

## Controlled ingestion flow

```text
Research agent
  → staged JSON + notes only
  → syntax and evidence validator
  → schema/source/date/comparability review
  → human review of conflicts, tariff applicability and AI competitor suggestions
  → approved merge into master data
  → regenerate offline browser bundle
  → website route/content regression tests
  → local review or separately authorized publication
```

## Automatic rejection conditions

- invalid JSON;
- source ID does not exist;
- confirmed fact has no source;
- confirmed numeric/text fact has no verification time;
- unknown market code;
- missing market policy/customs field;
- fixed competitor removed or changed;
- imported content includes website code or deployment instructions;
- data overwrites an existing market without a reviewed diff.

## Human-review conditions

- vehicle-specific tariff classification is inferred rather than proven by customs documents;
- official sources conflict;
- promotion remains visible after expiry;
- sales periods or model scopes are not directly comparable;
- an AI-suggested competitor would become adopted/fixed;
- a policy conclusion could materially change price or market strategy.

Research agents never upload directly to the website. “Upload” means submit to the staging area; only the owning workflow may merge approved data into the master dataset.

