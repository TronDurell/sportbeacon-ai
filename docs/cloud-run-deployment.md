# Cloud Run FastAPI deployment

Recreate the SportBeacon FastAPI **staging** and **production** services from this repository. Staging and production must remain separate Cloud Run services with separate runtime identities. Do not point Vercel Production at staging.

## Shared target

| Item | Value |
| --- | --- |
| Google Cloud project ID | `sportbeacon-ai` |
| Project number | `104921686559` |
| Region | `us-east1` |

## Staging

| Item | Value |
| --- | --- |
| Service | `sportbeacon-api-staging` |
| Runtime identity | `sportbeacon-api-runtime@sportbeacon-ai.iam.gserviceaccount.com` |
| Staging URL | `https://sportbeacon-api-staging-104921686559.us-east1.run.app` |

Staging keeps unauthenticated product APIs closed even if `ENABLE_PRODUCT_ROUTES=true`. Experimental coach, highlight, and extended-schedule routes stay disabled. Phase 2B staging enables authenticated `/api/me` routes only when `APP_ENV=staging` and `ENABLE_AUTHENTICATED_PROFILE_ROUTES=true`. Missing or unrecognized `APP_ENV` values fail closed to health-only.

Non-secret staging environment (also in `deploy/cloud-run-staging.env.example`):

```text
APP_ENV=staging
ENABLE_PRODUCT_ROUTES=false
ENABLE_AUTHENTICATED_PROFILE_ROUTES=true
ENABLE_EXPERIMENTAL_ROUTES=false
ENABLE_API_DOCS=false
GOOGLE_CLOUD_PROJECT=sportbeacon-ai
CORS_ALLOW_ORIGINS=https://sportbeacon-ai.vercel.app
```

Preview CORS continues to use the code default regex for SportBeacon Vercel git hosts. The staging runtime identity needs `roles/datastore.user` so FastAPI can persist private athlete documents. Do not grant Firestore roles to the production runtime.

## Production

| Item | Value |
| --- | --- |
| Service | `sportbeacon-api` |
| Runtime identity | `sportbeacon-api-prod-runtime@sportbeacon-ai.iam.gserviceaccount.com` |
| Expected URL | `https://sportbeacon-api-104921686559.us-east1.run.app` |

Confirm the live URL with `gcloud run services describe` after deploy. Do not assume a URL until Cloud Run reports Ready.

### Production security boundary

When `APP_ENV=production`, the service is **health-only**:

- `GET /api/health` remains public and returns HTTP 200.
- CORS preflight for `/api/health` is allowed from `https://sportbeacon-ai.vercel.app` only.
- All other API routes return 404, including insights, drills, matchmaking, coach, highlight, media, and extended-schedule paths.
- `/docs`, `/redoc`, and `/openapi.json` are disabled.
- Vercel preview origins are not echoed.
- Unrelated origins are not echoed.
- `ENABLE_PRODUCT_ROUTES=true` does not open unauthenticated product APIs in staging or production.
- Authenticated `/api/me` routes stay closed unless `APP_ENV` is recognized and `ENABLE_AUTHENTICATED_PROFILE_ROUTES=true`. Production keeps that flag false in this phase, so production stays health-only.
- Missing, blank, or unrecognized `APP_ENV` values fail closed: health remains 200 and every other surface, including `/api/me` and docs, returns 404. Flags cannot reopen those surfaces.
- `ENABLE_EXPERIMENTAL_ROUTES` remains `false`.

Non-secret production environment (also in `deploy/cloud-run-production.env.example`):

```text
APP_ENV=production
ENABLE_PRODUCT_ROUTES=false
ENABLE_EXPERIMENTAL_ROUTES=false
ENABLE_API_DOCS=false
CORS_ALLOW_ORIGINS=https://sportbeacon-ai.vercel.app
CORS_ALLOW_ORIGIN_REGEX=^$
```

## Required APIs

Enable only what source-build and Cloud Run need:

```powershell
gcloud config set project sportbeacon-ai
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## Runtime identities

Use dedicated **keyless** service accounts. Do not reuse the default Compute Engine account, App Engine default, Firebase Admin, or Firebase Automations. Do not grant Owner or Editor. Do not grant Firebase or Firestore roles for this health-only API.

```powershell
gcloud iam service-accounts describe sportbeacon-api-runtime@sportbeacon-ai.iam.gserviceaccount.com
gcloud iam service-accounts describe sportbeacon-api-prod-runtime@sportbeacon-ai.iam.gserviceaccount.com
```

If a dedicated account does not exist:

```powershell
gcloud iam service-accounts create sportbeacon-api-runtime `
  --display-name="SportBeacon API Cloud Run staging runtime" `
  --description="Keyless runtime identity for the SportBeacon FastAPI staging service"

gcloud iam service-accounts create sportbeacon-api-prod-runtime `
  --display-name="SportBeacon API Cloud Run production runtime" `
  --description="Keyless runtime identity for the SportBeacon FastAPI production service"
```

Do **not** create, download, or commit a JSON service-account key. Cloud Run impersonates these accounts without a key file. The health-only production service currently needs no application-level Google Cloud roles.

Allow the Cloud Run service agent to use each runtime account (IAM on the new accounts only):

```powershell
gcloud iam service-accounts add-iam-policy-binding sportbeacon-api-runtime@sportbeacon-ai.iam.gserviceaccount.com `
  --member="serviceAccount:service-104921686559@serverless-robot-prod.iam.gserviceaccount.com" `
  --role="roles/iam.serviceAccountUser"

gcloud iam service-accounts add-iam-policy-binding sportbeacon-api-prod-runtime@sportbeacon-ai.iam.gserviceaccount.com `
  --member="serviceAccount:service-104921686559@serverless-robot-prod.iam.gserviceaccount.com" `
  --role="roles/iam.serviceAccountUser"
```

## Source build and deploy

From the repository root. The `Dockerfile` listens on `$PORT` (Cloud Run default `8080`).

| Setting | Value |
| --- | --- |
| CPU | 1 |
| Memory | 1 GiB |
| Minimum instances | 0 |
| Maximum instances | 2 |
| Container port | `$PORT` (8080) |

`.dockerignore` and `.gcloudignore` keep frontend, docs, deploy templates, tests, local env files, and Git metadata out of the image.

### Staging

```powershell
gcloud run deploy sportbeacon-api-staging `
  --source . `
  --project sportbeacon-ai `
  --region us-east1 `
  --service-account sportbeacon-api-runtime@sportbeacon-ai.iam.gserviceaccount.com `
  --allow-unauthenticated `
  --min-instances 0 `
  --max-instances 2 `
  --cpu 1 `
  --memory 1Gi `
  --port 8080 `
  --set-env-vars "APP_ENV=staging,ENABLE_AUTHENTICATED_PROFILE_ROUTES=true,ENABLE_PRODUCT_ROUTES=false,ENABLE_EXPERIMENTAL_ROUTES=false,ENABLE_API_DOCS=false,GOOGLE_CLOUD_PROJECT=sportbeacon-ai,CORS_ALLOW_ORIGINS=https://sportbeacon-ai.vercel.app"
```

Preview CORS is the code default regex for SportBeacon Vercel git hosts:

```text
^https://sportbeacon-ai-git-[a-z0-9-]+-trondurells-projects\.vercel\.app$
```

### Production

Deploy from a clean checkout of the merged `main` SHA that contains the health-only safety boundary.

```powershell
gcloud run deploy sportbeacon-api `
  --source . `
  --project sportbeacon-ai `
  --region us-east1 `
  --service-account sportbeacon-api-prod-runtime@sportbeacon-ai.iam.gserviceaccount.com `
  --allow-unauthenticated `
  --min-instances 0 `
  --max-instances 2 `
  --cpu 1 `
  --memory 1Gi `
  --port 8080 `
  --set-env-vars "APP_ENV=production,ENABLE_PRODUCT_ROUTES=false,ENABLE_AUTHENTICATED_PROFILE_ROUTES=false,ENABLE_EXPERIMENTAL_ROUTES=false,ENABLE_API_DOCS=false,CORS_ALLOW_ORIGINS=https://sportbeacon-ai.vercel.app,CORS_ALLOW_ORIGIN_REGEX=^$"
```

Do not set `CORS_ALLOW_ORIGINS=*`. Do not put secrets, Firebase config, or API keys in Cloud Run env for these services.

## Health and route-gate verification

### Staging

```powershell
curl.exe -i https://sportbeacon-api-staging-104921686559.us-east1.run.app/api/health
curl.exe -i -H "Origin: https://sportbeacon-ai.vercel.app" https://sportbeacon-api-staging-104921686559.us-east1.run.app/api/health
curl.exe -i -H "Origin: https://evil.example" https://sportbeacon-api-staging-104921686559.us-east1.run.app/api/health
```

Expect HTTP 200 JSON with `status`, `service`, and `version`. The production origin must receive `access-control-allow-origin`. An unrelated origin must not be echoed.

### Production

Replace the URL with the verified production origin:

```powershell
curl.exe -i https://sportbeacon-api-104921686559.us-east1.run.app/api/health
curl.exe -i https://sportbeacon-api-104921686559.us-east1.run.app/docs
curl.exe -i https://sportbeacon-api-104921686559.us-east1.run.app/openapi.json
curl.exe -i -X POST https://sportbeacon-api-104921686559.us-east1.run.app/api/insights/analyze -H "Content-Type: application/json" -d "[{\"player_id\":1,\"player_name\":\"A\",\"game_date\":\"2024-04-01T20:00:00\",\"points\":18,\"assists\":5,\"rebounds\":6,\"steals\":1,\"blocks\":1,\"field_goal_percentage\":48,\"three_point_percentage\":35,\"result\":\"win\"}]"
curl.exe -i -X POST https://sportbeacon-api-104921686559.us-east1.run.app/api/drills/recommend -H "Content-Type: application/json" -d "{\"user_id\":\"player-1\",\"skill_levels\":{\"shooting\":0.4},\"growth_areas\":[\"shooting\"],\"top_skills\":[\"defense\"],\"min_difficulty\":\"Beginner\",\"max_difficulty\":\"Advanced\"}"
curl.exe -i -X POST https://sportbeacon-api-104921686559.us-east1.run.app/api/matchmaking/balance -H "Content-Type: application/json" -d "{\"team_size\":3,\"consider_positions\":true,\"players\":[]}"
curl.exe -i -H "Origin: https://sportbeacon-ai.vercel.app" https://sportbeacon-api-104921686559.us-east1.run.app/api/health
curl.exe -i -H "Origin: https://sportbeacon-ai-git-feat-cloud-run-f-ddbf56-trondurells-projects.vercel.app" https://sportbeacon-api-104921686559.us-east1.run.app/api/health
curl.exe -i -H "Origin: https://evil.example" https://sportbeacon-api-104921686559.us-east1.run.app/api/health
```

Expect `/api/health` HTTP 200, documentation and product routes HTTP 404, production origin CORS echoed, preview and unrelated origins not echoed.

## Vercel Production environment

Preview `VITE_API_BASE_URL` must continue to use the staging Cloud Run origin. Production must use the production Cloud Run origin only.

1. Inspect Production `VITE_API_BASE_URL` without printing other environment values.
2. Stop if it already contains an unexpected non-local URL.
3. Set Production only: `VITE_API_BASE_URL=<verified sportbeacon-api origin>`.
4. Do not change Preview or Development values.
5. Redeploy Production from the exact merged `main` SHA through Git integration. Do not deploy a dirty local worktree.

## Describe and rollback

```powershell
gcloud run services describe sportbeacon-api-staging --project sportbeacon-ai --region us-east1
gcloud run services describe sportbeacon-api --project sportbeacon-ai --region us-east1
gcloud run revisions list --service sportbeacon-api --project sportbeacon-ai --region us-east1
gcloud run services update-traffic sportbeacon-api --to-revisions REVISION=100 --project sportbeacon-ai --region us-east1
```

Replace `REVISION` with a previous ready revision name.

If Vercel Production fails after connecting the API:

- Restore the previous Production `VITE_API_BASE_URL` value (absent/local fallback).
- Roll back to the prior known-good Vercel production deployment.
- Leave Cloud Run available for diagnosis.
- Do not point production at staging.
