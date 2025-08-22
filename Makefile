.PHONY: dev-backend dev-frontend compose-up compose-down smoke

dev-backend:
	uvicorn backend.api:app --host 127.0.0.1 --port 8000

dev-frontend:
	cd frontend && npm run dev

compose-up:
	docker compose up -d --build

compose-down:
	docker compose down -v

smoke:
	./scripts/smoke.sh http://127.0.0.1:8000