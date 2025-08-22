## 0.1.0-rc – 2025-08-22

- New: Health endpoint and Prometheus metrics (/health, /metrics)
- New: Centralized API base URL via VITE_API_URL; legacy fallback supported
- New: Dockerfiles for backend/frontend and docker-compose stack
- New: CI workflows for backend smoke and frontend typecheck/build
- New: Deployment docs and smoke script
- Fix: CORS configured via FRONTEND_ORIGIN
- Fix: Env files for frontend and backend with sane defaults
- Fix: README ports and quickstart