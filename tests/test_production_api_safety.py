from typing import Optional

from fastapi.testclient import TestClient

from backend.api import create_app
from backend.models import API_VERSION, SERVICE_NAME


PROD_ORIGIN = "https://sportbeacon-ai.vercel.app"
PREVIEW_ORIGIN = (
    "https://sportbeacon-ai-git-feat-cloud-run-f-ddbf56-trondurells-projects.vercel.app"
)
UNRELATED_ORIGIN = "https://evil.example"

INSIGHT_PAYLOAD = [
    {
        "player_id": 1,
        "player_name": "John Smith",
        "game_date": "2024-04-01T20:00:00",
        "points": 18,
        "assists": 5,
        "rebounds": 6,
        "steals": 1,
        "blocks": 1,
        "field_goal_percentage": 48.0,
        "three_point_percentage": 35.0,
        "result": "win",
    }
]

DRILL_PAYLOAD = {
    "user_id": "player-1",
    "skill_levels": {"shooting": 0.4, "defense": 0.6},
    "growth_areas": ["shooting"],
    "top_skills": ["defense"],
    "max_recommendations": 3,
    "min_difficulty": "Beginner",
    "max_difficulty": "Advanced",
}

MATCHMAKING_PAYLOAD = {
    "team_size": 3,
    "consider_positions": True,
    "players": [
        {
            "player_id": idx,
            "player_name": name,
            "game_date": f"2024-04-0{idx}T20:00:00",
            "points": 20 + idx,
            "assists": 5,
            "rebounds": 6,
            "steals": 1,
            "blocks": 1,
            "field_goal_percentage": 48.0,
            "three_point_percentage": 35.0,
            "result": "win",
        }
        for idx, name in enumerate(["A", "B", "C", "D", "E", "F"], start=1)
    ],
}


def _production_client(monkeypatch, extra: Optional[dict] = None) -> TestClient:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ENABLE_PRODUCT_ROUTES", "false")
    monkeypatch.setenv("ENABLE_EXPERIMENTAL_ROUTES", "false")
    monkeypatch.setenv("ENABLE_API_DOCS", "false")
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", PROD_ORIGIN)
    monkeypatch.setenv("CORS_ALLOW_ORIGIN_REGEX", "^$")
    for key, value in (extra or {}).items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)
    return TestClient(create_app())


def test_production_health_returns_200(monkeypatch):
    client = _production_client(monkeypatch)
    response = client.get("/api/health")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == SERVICE_NAME
    assert body["version"] == API_VERSION


def test_production_health_cors_allows_production_origin(monkeypatch):
    client = _production_client(monkeypatch)
    response = client.get("/api/health", headers={"Origin": PROD_ORIGIN})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == PROD_ORIGIN


def test_production_health_preflight_allows_production_origin(monkeypatch):
    client = _production_client(monkeypatch)
    response = client.options(
        "/api/health",
        headers={
            "Origin": PROD_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code in {200, 204}
    assert response.headers.get("access-control-allow-origin") == PROD_ORIGIN


def test_production_rejects_vercel_preview_origin(monkeypatch):
    client = _production_client(monkeypatch)
    response = client.get("/api/health", headers={"Origin": PREVIEW_ORIGIN})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") != PREVIEW_ORIGIN


def test_production_rejects_unrelated_origin(monkeypatch):
    client = _production_client(monkeypatch)
    response = client.get("/api/health", headers={"Origin": UNRELATED_ORIGIN})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") != UNRELATED_ORIGIN


def test_production_insights_return_404(monkeypatch):
    client = _production_client(monkeypatch)
    for path in ("/api/insights/analyze", "/api/players/analyze"):
        response = client.post(path, json=INSIGHT_PAYLOAD)
        assert response.status_code == 404, response.text


def test_production_drill_recommendations_return_404(monkeypatch):
    client = _production_client(monkeypatch)
    response = client.post("/api/drills/recommend", json=DRILL_PAYLOAD)
    assert response.status_code == 404, response.text


def test_production_matchmaking_returns_404(monkeypatch):
    client = _production_client(monkeypatch)
    for path in ("/api/matchmaking/balance", "/api/matchmaking/create-teams"):
        response = client.post(path, json=MATCHMAKING_PAYLOAD)
        assert response.status_code == 404, response.text


def test_production_experimental_endpoints_return_404(monkeypatch):
    client = _production_client(monkeypatch)
    highlight = client.post("/api/highlights/tag?game_id=g1", json=[])
    coach = client.post(
        "/api/coach/ask",
        json={
            "user_id": "u1",
            "question": "How do I shoot?",
            "include_stats": False,
            "context": None,
        },
    )
    media = client.post("/api/media/upload", json={"uri": "gs://example/object"})
    for response in (highlight, coach, media):
        assert response.status_code == 404, response.text


def test_production_api_documentation_endpoints_return_404(monkeypatch):
    client = _production_client(monkeypatch)
    for path in ("/docs", "/redoc", "/openapi.json"):
        response = client.get(path)
        assert response.status_code == 404, response.text


def test_production_missing_configuration_fails_closed(monkeypatch):
    client = _production_client(
        monkeypatch,
        extra={
            "ENABLE_PRODUCT_ROUTES": None,
            "ENABLE_EXPERIMENTAL_ROUTES": None,
            "ENABLE_API_DOCS": None,
            "CORS_ALLOW_ORIGINS": None,
            "CORS_ALLOW_ORIGIN_REGEX": None,
        },
    )
    assert client.get("/api/health").status_code == 200
    assert client.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 404
    assert client.get("/docs").status_code == 404
    preview = client.get("/api/health", headers={"Origin": PREVIEW_ORIGIN})
    assert preview.headers.get("access-control-allow-origin") != PREVIEW_ORIGIN
    allowed = client.get("/api/health", headers={"Origin": PROD_ORIGIN})
    assert allowed.headers.get("access-control-allow-origin") == PROD_ORIGIN


def test_production_authenticated_profile_routes_stay_closed_when_flag_false(monkeypatch):
    client = _production_client(monkeypatch)
    assert client.get("/api/me").status_code == 404
    assert client.get("/api/me/profile").status_code == 404


def test_production_ignores_product_route_flag_without_auth(monkeypatch):
    client = _production_client(
        monkeypatch,
        extra={"ENABLE_PRODUCT_ROUTES": "true", "ENABLE_API_DOCS": "true"},
    )
    assert client.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 404
    assert client.get("/docs").status_code == 404


def test_non_production_product_routes_remain_available(monkeypatch):
    monkeypatch.setenv("APP_ENV", "test")
    client = TestClient(create_app())
    drills = client.post("/api/drills/recommend", json=DRILL_PAYLOAD)
    insights = client.post("/api/players/analyze", json=INSIGHT_PAYLOAD)
    matchmaking = client.post("/api/matchmaking/create-teams", json=MATCHMAKING_PAYLOAD)
    assert drills.status_code == 200, drills.text
    assert insights.status_code == 200, insights.text
    assert matchmaking.status_code == 200, matchmaking.text
    docs = client.get("/openapi.json")
    assert docs.status_code == 200
    preview = client.get("/api/health", headers={"Origin": PREVIEW_ORIGIN})
    assert preview.headers.get("access-control-allow-origin") == PREVIEW_ORIGIN
