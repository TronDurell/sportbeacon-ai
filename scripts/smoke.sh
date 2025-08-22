#!/usr/bin/env bash
set -euo pipefail

API_URL="${1:-http://127.0.0.1:8000}"
GREEN=$'\033[32m'; RED=$'\033[31m'; YELLOW=$'\033[33m'; NC=$'\033[0m'

say() { printf "%s\n" "$*"; }
ok()  { printf "%s✔ %s%s\n" "$GREEN" "$*" "$NC"; }
warn(){ printf "%s⚠ %s%s\n" "$YELLOW" "$*" "$NC"; }
fail(){ printf "%s✖ %s%s\n" "$RED" "$*" "$NC"; exit 1; }

wait_for() {
  local url="$1" tries=60
  for ((i=1;i<=tries;i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then ok "ready: $url"; return 0; fi
    sleep 1
  done
  fail "timeout waiting for $url"
}

say "==> Smoke test target: $API_URL"

wait_for "$API_URL/health"

say "-- GET /api/test"
curl -fsS "$API_URL/api/test" | jq -r '.' >/dev/null || fail "/api/test failed"
ok "/api/test OK"

say "-- POST /api/players/analyze"
curl -fsS -X POST "$API_URL/api/players/analyze" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "smoke", "question": "How am I doing?", "include_stats": true}' \
  | jq -r '.' >/dev/null || fail "/api/players/analyze failed"
ok "/api/players/analyze OK"

say "-- POST /api/drills/recommend"
curl -fsS -X POST "$API_URL/api/drills/recommend" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"smoke","top_skills":["scoring"],"growth_areas":["defense"],"skill_levels": {"scoring": 0.8}}' \
  | jq -r '.' >/dev/null || fail "/api/drills/recommend failed"
ok "/api/drills/recommend OK"

say "-- POST /api/matchmaking/create-teams"
curl -fsS -X POST "$API_URL/api/matchmaking/create-teams" \
  -H "Content-Type: application/json" \
  -d '{"players":[{"player_id":1,"player_name":"Alex","game_date":"2024-01-01T00:00:00","points":10,"assists":2,"rebounds":3,"steals":1,"blocks":0,"field_goal_percentage":50,"three_point_percentage":33,"result":"win"}],"team_size":3,"consider_positions":false}' \
  | jq -r '.' >/dev/null || fail "/api/matchmaking/create-teams failed"
ok "/api/matchmaking/create-teams OK"

say "-- GET /api/players/top-winners"
curl -fsS "$API_URL/api/players/top-winners?time_period_days=30&limit=5" \
  | jq -r '.' >/dev/null || fail "/api/players/top-winners failed"
ok "/api/players/top-winners OK"

ok "All smoke checks passed against $API_URL 🎉"