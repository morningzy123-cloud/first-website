---
name: marketing-buddy-weekly-update
description: Run a guarded weekly data refresh for the Marketing Buddy automotive intelligence website, validate evidence and website behavior, then publish eligible data-only changes through its GitHub-to-Vercel deployment path. Use for scheduled or manually triggered weekly updates after the baseline website is live; do not use for redesigns, schema migrations, competitor governance decisions, or unsupported policy conclusions.
---

# Marketing Buddy Weekly Update

Refresh the live website without redesigning it. Work from the current repository state, change structured data only unless the user separately authorizes code changes, and keep the previously deployed version available when validation fails.

## Before the run

Read:

- `automation/weekly-update.config.json` in the website repository;
- [references/update-policy.md](references/update-policy.md);
- [references/publishing-contract.md](references/publishing-contract.md).

Require authenticated access to the configured GitHub repository and public web research. Normal data updates rely on the existing Vercel Git integration; do not store credentials in files or commits.

## Weekly sequence

1. Fetch the current default branch and record its commit SHA.
2. Read the current global JSON, source catalog and last update log.
3. For each configured market, research only material changes since the last successful run while preserving still-valid baseline facts.
4. Apply the same evidence rules as the `marketing-buddy-research` skill. Policy/customs checks remain mandatory even when no change is found.
5. Expire promotions whose validity ended; do not silently delete their evidence. Record the change in the weekly report.
6. Update the canonical JSON, regenerate the browser bundle and update `generatedAt` and `researchRun`.
7. Run the repository’s data validator and website regression tests.
8. Classify the diff using the publishing policy.
9. Publish eligible data-only changes. Hold governed or ambiguous changes on a review branch and do not merge them automatically.
10. Confirm the deployment completed and the public URL serves the new data. Return a concise weekly report.

## Stop conditions

Do not publish when:

- a validator or website test fails;
- a confirmed fact lacks a resolvable source;
- an official source conflict changes the conclusion;
- a promotion’s validity or market scope cannot be determined;
- the run would add/remove/adopt a competitor;
- a tariff or regulatory rule is being applied to a specific vehicle without the required classification/origin evidence;
- the change touches schema, layout, application code, secrets or deployment configuration.

On failure, leave the current live version unchanged, preserve the staged report and state exactly what needs human review. Never force-push, reset history or hide a failed run.

## Output

Each successful run produces:

- updated canonical JSON and browser bundle;
- `reports/weekly/YYYY-MM-DD.md`;
- a Git commit or review branch according to policy;
- deployment status and public URL.

