# Cloud Run staging deployment

Recreate the SportBeacon FastAPI **staging** service from this repository. This is not a production runbook.

## Target

| Item | Value |
| --- | --- |
| Google Cloud project ID | `sportbeacon-ai` |
| Project number | `104921686559` |
| Region | `us-east1` |
| Service | `sportbeacon-api-staging` |
| Runtime identity | `sportbeacon-api-runtime@sportbeacon-ai.iam.gserviceaccount.com` |
| Staging URL | `https://sportbeacon-api-staging-104921686559.us-east1.run.app` |

Production traffic must use a **separate** Cloud Run service later. Do not point Vercel Production at this staging service.

## Required APIs

Enable only what source-build and Cloud Run need:

```powershell
gcloud config set project sportbeacon-ai
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## Runtime identity

Use a dedicated **keyless** service account for Cloud Run. Do not reuse the default Compute Engine account, Firebase Admin, or Firebase Automations.

```powershell
gcloud iam service-accounts describe sportbeacon-api-runtime@sportbeacon-ai.iam.gserviceaccount.com
```

If it does not exist:

```powershell
gcloud iam service-accounts create sportbeacon-api-runtime `
  --display-name="SportBeacon API Cloud Run runtime" `
  --description="Keyless runtime identity for the SportBeacon FastAPI service"
```

Do **not** create, download, or commit a JSON service-account key. Cloud Run impersonates this account without a key file. Phase 2A does not need extra project roles on this identity.

Allow the Cloud Run service agent to use the runtime account (IAM on this new account only):

```powershell
gcloud iam service-accounts add-iam-policy-binding sportbeacon-api-runtime@sportbeacon-ai.iam.gserviceaccount.com `
  --member="serviceAccount:service-104921686559@serverless-robot-prod.iam.gserviceaccount.com" `
  --role="roles/iam.serviceAccountUser"
```

## Source build and deploy

From the repository root. The `Dockerfile` listens on `$PORT` (Cloud Run default `8080`).

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
  --set-env-vars "CORS_ALLOW_ORIGINS=https://sportbeacon-ai.vercel.app,ENABLE_EXPERIMENTAL_ROUTES=false"
```

| Setting | Value |
| --- | --- |
| CPU | 1 |
| Memory | 1 GiB |
| Minimum instances | 0 |
| Maximum instances | 2 |
| Container port | `$PORT` (8080) |

`.dockerignore` and `.gcloudignore` keep frontend, docs, tests, local env files, and Git metadata out of the image.

## Non-secret environment variables

| Variable | Staging value |
| --- | --- |
| `CORS_ALLOW_ORIGINS` | `https://sportbeacon-ai.vercel.app` |
| `ENABLE_EXPERIMENTAL_ROUTES` | `false` |

Preview CORS is the code default regex for SportBeacon Vercel git hosts:

```text
^https://sportbeacon-ai-git-[a-z0-9-]+-trondurells-projects\.vercel\.app$
```

Do not set `CORS_ALLOW_ORIGINS=*`. Do not put secrets, Firebase config, or API keys in Cloud Run env for this service.

## Health check

```powershell
curl.exe -i https://sportbeacon-api-staging-104921686559.us-east1.run.app/api/health
```

Expect HTTP 200 and JSON with `status`, `service`, and `version`.

Allowed-origin checks:

```powershell
curl.exe -i -H "Origin: https://sportbeacon-ai.vercel.app" https://sportbeacon-api-staging-104921686559.us-east1.run.app/api/health
curl.exe -i -H "Origin: https://evil.example" https://sportbeacon-api-staging-104921686559.us-east1.run.app/api/health
```

The production origin must receive `access-control-allow-origin`. An unrelated origin must not be echoed.

## Describe and rollback

```powershell
gcloud run services describe sportbeacon-api-staging --project sportbeacon-ai --region us-east1
gcloud run revisions list --service sportbeacon-api-staging --project sportbeacon-ai --region us-east1
gcloud run services update-traffic sportbeacon-api-staging --to-revisions REVISION=100 --project sportbeacon-ai --region us-east1
```

Replace `REVISION` with a previous ready revision name. Do not roll staging traffic onto a production service that does not exist yet.
