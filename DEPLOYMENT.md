### Deployment Guide

#### Local development
- Backend
```
python -m pip install -r requirements.txt
uvicorn backend.api:app --host 127.0.0.1 --port 8000
```
- Frontend
```
cd frontend
npm ci
npm run dev
```

#### Docker Compose
```
docker compose up -d --build
```
- Backend: http://localhost:8000/health
- Frontend: http://localhost:3002

#### Environment
- FRONTEND_ORIGIN=http://localhost:3002
- ENABLE_METRICS=true
- VITE_API_URL=http://localhost:8000

#### Smoke curl examples
```
curl -sSf http://localhost:8000/health
curl -sSf http://localhost:8000/api/test
curl -sSf -X POST http://localhost:8000/api/players/analyze -H 'Content-Type: application/json' -d '{"user_id":"test","question":"How am I doing?","include_stats":true}'
curl -sSf -X POST http://localhost:8000/api/drills/recommend -H 'Content-Type: application/json' -d '{"user_id":"test","top_skills":["scoring"],"growth_areas":["defense"],"skill_levels": {"scoring": 0.8}}'
curl -sSf -X POST http://localhost:8000/api/matchmaking/create-teams -H 'Content-Type: application/json' -d '{"players":[{"player_id":1,"player_name":"Alex","game_date":"2024-01-01T00:00:00","points":10,"assists":2,"rebounds":3,"steals":1,"blocks":0,"field_goal_percentage":50,"three_point_percentage":33,"result":"win"}],"team_size":3}'
curl -sSf "http://localhost:8000/api/players/top-winners?time_period_days=30&limit=5"
```