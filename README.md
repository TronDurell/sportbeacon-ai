# SportBeaconAI

Athlete-first tools for grassroots sports: player insights, drill planning, and prototype matchmaking.

This repository is a **bootable local web application** (Vite + FastAPI) plus a tested Python AI library. It is not a production-ready product. Authentication, persistence, payments, coach AI, media processing, and production matchmaking are out of scope for the current shell.

## Architecture

| Layer | Canonical path | Role |
| --- | --- | --- |
| Frontend | `frontend/` | React 18 + TypeScript + Vite shell |
| Backend | `backend/api.py` | FastAPI API (`GET /api/health` and existing AI endpoints) |
| AI library | `ai/` | Player insights, drill recommender, matchmaking engine |
| Tests | `tests/` | pytest contract and engine tests |

The Node package in `backend/` is **legacy**. It still installs with `npm ci`, but `server.js` is missing and Express is not the active backend. Do not treat a Node install as a backend build.

Legacy React files under `frontend/components`, `frontend/pages`, `frontend/services`, and `frontend/hooks` are not part of the bootable app. The Vite entrypoint is `frontend/src/main.tsx`.

## Project scope (current shell)

Included:

- SportBeaconAI header and navigation
- Live FastAPI health check with loading, connected, and error/retry states
- Cards for Player Insights, Drill Planning, and prototype Matchmaking
- Frontend lint, type-check, unit tests, and production build
- Python pytest suite for the AI engines and API contracts

Not included:

- Firebase authentication or Firestore
- Payments
- Production matchmaking UI
- Coach LLM, extended schedules, or media processing
- Fake athlete statistics or claims that unwired features work

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

From the repository root:

```powershell
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
npm test -- --run
npm run build
```

`npm run build` writes `frontend/dist`.

## Environment variables

Frontend (`frontend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | FastAPI origin used by the shell. No trailing slash. Example: `http://127.0.0.1:8000` |

Backend (optional):

| Variable | Purpose |
| --- | --- |
| `CORS_ALLOW_ORIGINS` | Comma-separated explicit browser origins. Default is local Vite (`http://localhost:5173`, `http://127.0.0.1:5173`, and the matching preview ports). Do not set `*`. |

Do not put production URLs, Firebase keys, cloud tokens, or other credentials in the frontend shell. Root `env.example` still documents historical product placeholders; those services are not wired into this Phase 1 app.

## Known prototype limitations

- The UI only verifies backend reachability. Insight, drill, and matchmaking APIs exist but are not driven from the shell.
- Matchmaking is a prototype team-balancing endpoint, not a live product flow.
- Coach, highlight, media, and extended-schedule paths remain incomplete and are not started with the shell.
- GitHub Actions deploy-to-Vercel on `main` is not a verified application deploy. A successful frontend job means lint, type-check, tests, and `frontend/dist` were produced; it does not mean hosting credentials or a production runtime are configured.
- Historical `logs/` files were removed from Git tracking. Local copies may still exist. A Firebase web API key is not automatically a secret, but Google API key restrictions, Firebase Security Rules, and App Check should still be verified. Rotate only credentials that are actually private.

## License

MIT
