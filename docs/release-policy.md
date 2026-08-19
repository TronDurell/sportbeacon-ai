# SportBeaconAI Release Policy

## Policy

SportBeaconAI uses an explicit production-promotion workflow.

Merging accepted engineering work to `main` establishes the trusted code baseline, but it does **not** by itself authorize a Vercel Production release.

The intended path is:

`feature branch → CI → Vercel Preview → Cloud Run staging → human acceptance → main → explicit production candidate → explicit promotion`

## Vercel Git behavior

`vercel.json` disables automatic Git deployments for `main` only. Unspecified feature branches remain eligible for Vercel Preview deployments.

This keeps Preview deployments available for pull-request acceptance while preventing ordinary merges to `main` from automatically replacing the public production frontend.

## Production release gate

A frontend production release requires an explicit release decision after all of the following are true:

1. The accepted pull request is merged.
2. `main` is healthy and protected checks are green.
3. The intended backend production capability is compatible with the frontend being released.
4. Production configuration and IAM have been reviewed for the release.
5. A production candidate is built from the verified `main` checkout.
6. The candidate is inspected and smoke-tested before promotion.

## Recommended release procedure

From a clean repository checkout:

```powershell
git switch main
git pull --ff-only
git rev-parse HEAD
```

Confirm the SHA is the intended release SHA.

Create a candidate deployment without changing production traffic:

```powershell
vercel deploy
```

Inspect and test the returned candidate URL. Useful checks include:

```powershell
vercel inspect <candidate-url>
vercel logs --deployment <candidate-url> --level error --limit 50
```

Only after acceptance, explicitly promote the exact candidate:

```powershell
vercel promote <candidate-url> --yes
vercel promote status
```

Then verify the public production deployment and application behavior.

## Rollback

If a promoted frontend release causes a regression, use the established Vercel rollback process to return production traffic to the last known-good deployment. Record the rollback deployment and reason in the relevant release record or pull request.

Backend Cloud Run production remains a separate release gate. Promoting a Vercel frontend does not authorize Cloud Run production deployment, Firebase policy changes, IAM changes, or production data migrations.

## Rules

- Do not use a merge to `main` as implicit production authorization.
- Do not promote a Vercel Preview whose backend dependencies are unavailable in production.
- Do not expose staging TEST DATA fixtures in production.
- Do not bypass CI, branch protection, or human acceptance gates.
- Do not create service-account key files for deployment automation.
- Prefer keyless authenticated tooling and existing platform identities.
