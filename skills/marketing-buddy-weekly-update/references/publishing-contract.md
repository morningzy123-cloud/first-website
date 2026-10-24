# Publishing contract

The repository default branch is the production source. Vercel deploys that branch automatically.

## Automatic path

```text
research delta
  → update canonical JSON
  → regenerate browser bundle
  → validate data and source references
  → run route/content tests
  → commit eligible data-only diff to production branch
  → wait for deployment
  → verify public URL and expected generatedAt
```

## Review path

Create a dated review branch when any governed item is present. Commit the staged changes and report the branch or pull request. Do not merge or deploy the governed change until a human approves it.

## Failure behavior

- Before commit: stop and leave production untouched.
- Build/deploy failure: rely on the hosting provider’s previous successful deployment, report the failed commit and do not force-push.
- Health-check mismatch: mark the run failed and request review; do not conceal the mismatch by rewriting history.

## Required weekly report

- run date and previous/current commit SHA;
- markets and sources checked;
- published changes;
- expired items;
- held items and reasons;
- tests run and result;
- deployment status and URL;
- next required human action, or “none”.

