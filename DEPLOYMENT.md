# Deployment Guide

## Serverless Frontend (Vercel or Netlify)

- Set environment variable `VITE_API_URL` to your public backend URL (e.g., `https://api.example.com`).
- Build the app (`npm run build`) and deploy the `dist` folder.
- Ensure SPA fallback is enabled to `/index.html`.

## Backend (Render/Railway/Fly.io)

- Expose port 8000
- Health endpoint: `/health`
- Metrics endpoint: `/metrics`
- Required envs (see `.env.example` in repo root):
  - `FRONTEND_ORIGIN` (default `http://localhost:3002`)
  - `UVICORN_HOST=0.0.0.0`
  - `UVICORN_PORT=8000`
  - Optional: `SENTRY_DSN`

### Docker Compose (Local)

- Run `docker compose up --build`
- Frontend: http://localhost:3002
- Backend: http://localhost:8000

