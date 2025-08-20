#!/usr/bin/env bash
set -euo pipefail
exec uvicorn backend.api:app --host "${UVICORN_HOST:-0.0.0.0}" --port "${UVICORN_PORT:-8000}"

