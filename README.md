# SportBeaconAI

Athlete-first tools for grassroots sports: player insights, drill planning, and prototype matchmaking.

This repository is a **bootable local web application** (Vite + FastAPI) plus a tested Python AI library. Phase 3A adds a first playable sports loop: Places, Runs, join, check-in, and private participation history on top of Firebase email/password authentication. It is not a finished product. Payments, public profiles, Groups, Messaging, RecTrac, and production matchmaking remain out of scope.

## Architecture

| Layer | Canonical path | Role |
| --- | --- | --- |
| Frontend | `frontend/` | React 18 + TypeScript + Vite athlete workspace |
| Backend | `backend/api.py` | FastAPI health check and authenticated `/api/me` routes |
| Persistence | Firestore via FastAPI | Private athlete profiles, stats, Places, Runs, and participation, separated by `APP_ENV` |
| AI library | `ai/` | Player insights, drill recommender, matchmaking engine |
| Tests | `tests/` | pytest contract, engine, auth, and emulator tests |

The Node package in `backend/` is **legacy**. It still installs with `npm ci`, but `server.js` is missing and Express is not the active backend. Do not treat a Node install as a backend build.

Legacy React files under `frontend/components`, `frontend/pages`, `frontend/services`, and `frontend/hooks` are not part of the bootable app. The Vite entrypoint is `frontend/src/main.tsx`. Do not import the legacy `frontend/services/authService.ts` token design.

## Project scope (Phase 3A + 3B)

Included:

- Firebase email/password authentication in the Vite app
- Private athlete profile onboarding and editing
- Manual basketball stat persistence
- Authenticated insight generation and drill recommendations from persisted data
- Authenticated basketball Run discovery with Place details
- Authenticated join and check-in, persisted as one participation record per athlete and run
- Private participation history
- Per-run connection visibility consent that starts hidden for every athlete
- "People you played with" limited to co-players from a run both athletes checked into
- Private connection requests, acceptance, decline, removal, blocking, and safety reporting
- Labeled development/staging test Place and Runs (not live municipal data)
- Live FastAPI health check with loading, connected, and error/retry states
- Disabled roadmap labels for later modules
- Frontend lint, type-check, unit tests, and production build
- Python pytest suite for the AI engines, API contracts, authenticated routes, and sports-loop behavior

Not included:

- Google, Apple, phone, or anonymous authentication in the product UI
- Group chat, messaging, Beacon Alerts, notifications, or contact-detail exchange
- Public people search, public rosters, follower counts, or friend suggestions
- Public athlete profiles or public Firestore access
- Payments, RecTrac, TeamSideline, Cloud Functions, Storage, or AI chat
- Maps, geofencing, continuous location, or fake live occupancy
- Live municipal schedules presented as production data

## Python setup

Requires Python 3.11.

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

`requirements-dev.txt` includes runtime dependencies from `requirements.txt` plus pytest and httpx.

## Frontend setup

```powershell
cd frontend
copy .env.example .env
npm ci
```

`.env` is local-only and gitignored. Use `frontend/.env.example` as the template.

## How to start FastAPI

Local development requires an explicit `APP_ENV=development`. Copy `backend/.env.example` for the other local flags, then set the environment before starting the server. Missing, blank, or unrecognized values fail closed: `/api/health` stays up, while `/api/me`, legacy product APIs, and docs return 404.

From the repository root:

```powershell
$env:APP_ENV="development"
.\.venv\Scripts\python.exe -m uvicorn backend.api:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```powershell
curl http://127.0.0.1:8000/api/health
```

Expected JSON includes `status`, `service`, and `version`.

## How to start Vite

In a second terminal:

```powershell
cd frontend
npm run dev
```

The app is served at `http://localhost:5173` and calls `VITE_API_BASE_URL` (default `http://127.0.0.1:8000`).

## Test and build commands

Python (repo root):

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend:

```powershell
cd frontend
npm run type-check
npm run lint
npm test
npm run build
```

`npm test` runs Vitest once. Use `npm run test:watch` for the interactive watcher. `npm run build` writes `frontend/dist`.

## Environment variables

Frontend (`frontend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | FastAPI origin used by the shell. No trailing slash. Example: `http://127.0.0.1:8000` |
| `VITE_FIREBASE_*` | Firebase web app placeholders. Copy `frontend/.env.example` locally. Do not commit real values. |
| `VITE_USE_FIREBASE_EMULATORS` | Set `true` only when the local Auth emulator is running. |

Backend (optional):

| Variable | Purpose |
| --- | --- |
| `CORS_ALLOW_ORIGINS` | Comma-separated explicit browser origins. Default includes local Vite and `https://sportbeacon-ai.vercel.app`. Do not set `*`. |
| `CORS_ALLOW_ORIGIN_REGEX` | Optional override. Default allows SportBeacon Vercel git preview hosts only. Production sets `^$` so preview hosts are not echoed. |
| `ENABLE_EXPERIMENTAL_ROUTES` | Defaults to `false`. Coach, highlight, and extended-schedule routes return 404 until explicitly enabled. |
| `ENABLE_PRODUCT_ROUTES` | Defaults on only for `development` and `test`. Cannot reopen legacy product APIs in staging, production, or an invalid environment. |
| `ENABLE_AUTHENTICATED_PROFILE_ROUTES` | Defaults to `false`. Staging sets `true`. Production stays `false` in this phase. Gates `/api/me` and the Phase 3 Play routes. Ignored when `APP_ENV` is missing or unrecognized. |
| `ENABLE_ATHLETE_CONNECTIONS` | Defaults to `false`. Must be explicitly `true` on top of `ENABLE_AUTHENTICATED_PROFILE_ROUTES` before the Phase 3B connection and safety-report routes answer. Turning the athlete surface on never publishes the social surface with it. |
| `ENABLE_SPORTS_LOOP_FIXTURES` | When true, FastAPI upserts labeled test Place/Run documents. Defaults on for `development` and `staging`. Always off in `production`. Test defaults off unless set. |
| `ENABLE_API_DOCS` | Defaults on for `development`, `test`, and `staging`. Disabled for `production` and for invalid `APP_ENV`. |
| `APP_ENV` | Required. Exactly `development`, `test`, `staging`, or `production`. Missing, blank, `prod`, `preview`, and misspellings fail closed. |

Do not put production URLs, Firebase config values, cloud tokens, or other credentials in Git. Root `env.example` still documents historical product placeholders; those services are not wired into this app.

## Firebase emulators

Auth emulator: `127.0.0.1:9099`. Firestore emulator: `127.0.0.1:8088` (not 8080, which Cloud Run uses).

```powershell
npx -y firebase-tools@latest emulators:exec --only auth,firestore --project sportbeacon-ai ".\.venv\Scripts\python.exe -m pytest tests/test_firestore_emulator.py -q"
```

## Known prototype limitations

- The athlete workspace authenticates with email/password and persists a private profile, basketball stats, and Run participation through FastAPI.
- Play Today uses labeled test Place/Run fixtures in development and staging. Those are not live municipal listings.
- Private athlete connections come only from runs both athletes checked into, are hidden by default, and never exchange contact details. See `docs/phase-3b-athlete-connections.md`.
- Groups, Messaging, and Matchmaking remain roadmap work. See `docs/phase-3-core-sports-loop.md` and `docs/phase-3b-athlete-connection.md`.
- Coach, highlight, media, and extended-schedule paths remain incomplete and are not started with the shell.
- Historical `logs/` files were removed from Git tracking. Local copies may still exist. Do not commit Firebase config values or service-account keys.

## Deployment

Vercel’s GitHub integration owns frontend previews and production deployment. GitHub Actions does **not** deploy with a Vercel token.

Required Vercel project settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

This Vercel project deploys only the Vite frontend. FastAPI runs on separate Cloud Run services:

- Google Cloud project: `sportbeacon-ai` (number `104921686559`)
- Region: `us-east1`
- Staging service: `sportbeacon-api-staging`
- Staging runtime identity: `sportbeacon-api-runtime@sportbeacon-ai.iam.gserviceaccount.com`
- Staging URL: `https://sportbeacon-api-staging-104921686559.us-east1.run.app`
- Production service: `sportbeacon-api`
- Production runtime identity: `sportbeacon-api-prod-runtime@sportbeacon-ai.iam.gserviceaccount.com`

See `docs/cloud-run-deployment.md` to recreate staging or production. Production remains health-only in this phase. Staging may enable authenticated `/api/me` routes.

Vercel Preview may set `VITE_API_BASE_URL` to the staging HTTPS origin. Vercel Production must use the production Cloud Run origin, never staging. Local development still uses `http://127.0.0.1:8000`.

## License

MIT
