from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.api import create_app
from backend.athlete_repository import InMemoryAthleteRepository


class FakeVerifier:
    def __init__(self) -> None:
        self.uid_for_token = {
            "header.user-a.sig": "user-a",
            "header.user-b.sig": "user-b",
        }

    def verify_id_token(self, token: str) -> str:
        if token == "expired.token.sig":
            raise ValueError("expired")
        if token == "invalid.token.sig":
            raise ValueError("invalid")
        uid = self.uid_for_token.get(token)
        if not uid:
            raise ValueError("unknown")
        return uid


def _app_client(monkeypatch, extra=None):
    monkeypatch.setenv("APP_ENV", "test")
    for key, value in (extra or {}).items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)
    app = create_app()
    app.state.token_verifier = FakeVerifier()
    app.state.athlete_repository = InMemoryAthleteRepository()
    return TestClient(app), app.state.athlete_repository


def _auth(uid_token: str) -> dict:
    return {"Authorization": f"Bearer {uid_token}"}


PROFILE = {
    "displayName": "Ada Athlete",
    "bio": "Pickup basketball",
    "primarySport": "basketball",
    "sports": ["basketball"],
    "skillsBySport": {
        "basketball": {
            "skill_levels": {"shooting": 0.4, "defense": 0.6},
            "growth_areas": ["shooting"],
            "top_skills": ["defense"],
        }
    },
    "trainingPreferences": {"days_per_week": 3, "available_days": ["monday"], "max_session_minutes": 60},
    "homeArea": {"city": "Richmond", "region": "VA", "country": "US"},
    "travelRadiusMiles": 15,
    "onboardingComplete": True,
}

STAT = {
    "occurredAt": datetime(2024, 4, 1, 20, 0, tzinfo=timezone.utc).isoformat(),
    "points": 18,
    "assists": 5,
    "rebounds": 6,
    "steals": 1,
    "blocks": 1,
    "field_goal_percentage": 48,
    "three_point_percentage": 35,
    "result": "win",
    "source": {"kind": "manual"},
}


def test_missing_token_returns_401(monkeypatch):
    client, _ = _app_client(monkeypatch)
    response = client.get("/api/me")
    assert response.status_code == 401
    assert response.headers.get("www-authenticate", "").lower().startswith("bearer")


def test_malformed_token_returns_401(monkeypatch):
    client, _ = _app_client(monkeypatch)
    response = client.get("/api/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert response.status_code == 401


def test_invalid_and_expired_tokens_return_401(monkeypatch):
    client, _ = _app_client(monkeypatch)
    invalid = client.get("/api/me", headers=_auth("invalid.token.sig"))
    expired = client.get("/api/me", headers=_auth("expired.token.sig"))
    assert invalid.status_code == 401
    assert expired.status_code == 401


def test_valid_token_extracts_uid(monkeypatch):
    client, _ = _app_client(monkeypatch)
    response = client.get("/api/me", headers=_auth("header.user-a.sig"))
    assert response.status_code == 200
    assert response.json()["authenticated"] is True


def test_profile_create_read_update_and_server_timestamps(monkeypatch):
    client, repo = _app_client(monkeypatch)
    created = client.put("/api/me/profile", headers=_auth("header.user-a.sig"), json=PROFILE)
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["visibility"] == "private"
    assert body["createdAt"]
    assert body["updatedAt"]
    first_created = body["createdAt"]
    read = client.get("/api/me/profile", headers=_auth("header.user-a.sig"))
    assert read.status_code == 200
    updated_payload = dict(PROFILE)
    updated_payload["displayName"] = "Ada Updated"
    updated = client.put("/api/me/profile", headers=_auth("header.user-a.sig"), json=updated_payload)
    assert updated.status_code == 200
    assert updated.json()["displayName"] == "Ada Updated"
    assert updated.json()["createdAt"] == first_created
    assert updated.json()["updatedAt"] != first_created
    stored = repo.get_profile("user-a")
    assert stored is not None
    assert stored.displayName == "Ada Updated"


def test_user_cannot_access_another_users_data(monkeypatch):
    client, _ = _app_client(monkeypatch)
    client.put("/api/me/profile", headers=_auth("header.user-a.sig"), json=PROFILE)
    other = client.get("/api/me/profile", headers=_auth("header.user-b.sig"))
    assert other.status_code == 404
    stats = client.get("/api/me/stats", headers=_auth("header.user-b.sig"))
    assert stats.status_code == 200
    assert stats.json()["items"] == []


def test_body_identity_fields_are_forbidden(monkeypatch):
    client, _ = _app_client(monkeypatch)
    payload = dict(PROFILE)
    payload["uid"] = "user-b"
    response = client.put("/api/me/profile", headers=_auth("header.user-a.sig"), json=payload)
    assert response.status_code in {400, 422}
    drills = client.post(
        "/api/me/drills/recommend",
        headers=_auth("header.user-a.sig"),
        json={"user_id": "user-b"},
    )
    assert drills.status_code == 400


def test_stat_validation_and_bounded_listing(monkeypatch):
    client, _ = _app_client(monkeypatch)
    client.put("/api/me/profile", headers=_auth("header.user-a.sig"), json=PROFILE)
    ok = client.post("/api/me/stats/basketball", headers=_auth("header.user-a.sig"), json=STAT)
    assert ok.status_code == 200, ok.text
    future = dict(STAT)
    future["occurredAt"] = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    assert client.post("/api/me/stats/basketball", headers=_auth("header.user-a.sig"), json=future).status_code == 422
    unknown = dict(STAT)
    unknown["soccerGoals"] = 4
    assert client.post("/api/me/stats/basketball", headers=_auth("header.user-a.sig"), json=unknown).status_code == 422
    listed = client.get("/api/me/stats?limit=1", headers=_auth("header.user-a.sig"))
    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1
    too_big = client.get("/api/me/stats?limit=500", headers=_auth("header.user-a.sig"))
    assert too_big.status_code == 422
    identity_stat = dict(STAT)
    identity_stat["player_id"] = "user-b"
    assert (
        client.post("/api/me/stats/basketball", headers=_auth("header.user-a.sig"), json=identity_stat).status_code
        == 422
    )


def test_staging_without_auth_flag_hides_me_routes(monkeypatch):
    client, _ = _app_client(
        monkeypatch,
        extra={
            "APP_ENV": "staging",
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "false",
            "ENABLE_EXPERIMENTAL_ROUTES": "false",
            "ENABLE_API_DOCS": "false",
        },
    )
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/me").status_code == 404
    assert client.get("/api/me", headers=_auth("header.user-a.sig")).status_code == 404


def test_insights_and_drills_use_persisted_caller_data(monkeypatch):
    client, _ = _app_client(monkeypatch)
    client.put("/api/me/profile", headers=_auth("header.user-a.sig"), json=PROFILE)
    empty = client.post("/api/me/insights", headers=_auth("header.user-a.sig"))
    assert empty.status_code == 422
    client.post("/api/me/stats/basketball", headers=_auth("header.user-a.sig"), json=STAT)
    insights = client.post("/api/me/insights", headers=_auth("header.user-a.sig"))
    assert insights.status_code == 200, insights.text
    assert "top_skills" in insights.json()
    body = client.post("/api/me/insights", headers=_auth("header.user-a.sig"), json={"stats": [STAT]})
    assert body.status_code == 400
    drills = client.post("/api/me/drills/recommend", headers=_auth("header.user-a.sig"), json={})
    assert drills.status_code == 200, drills.text
    assert drills.json()["user_id"] == "user-a"


def test_staging_allowlist_hides_legacy_and_requires_auth(monkeypatch):
    client, _ = _app_client(
        monkeypatch,
        extra={
            "APP_ENV": "staging",
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_EXPERIMENTAL_ROUTES": "false",
            "ENABLE_API_DOCS": "false",
            "CORS_ALLOW_ORIGINS": "https://sportbeacon-ai.vercel.app",
        },
    )
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/me").status_code == 401
    assert client.get("/api/me", headers=_auth("header.user-a.sig")).status_code == 200
    assert client.post("/api/drills/recommend", json=PROFILE).status_code == 404
    assert client.post("/api/matchmaking/create-teams", json={"team_size": 3, "players": []}).status_code == 404
    assert client.get("/docs").status_code == 404
    preflight = client.options(
        "/api/me",
        headers={
            "Origin": "https://sportbeacon-ai.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert preflight.status_code in {200, 204}
    allowed_headers = preflight.headers.get("access-control-allow-headers", "").lower()
    assert "authorization" in allowed_headers
    assert "content-type" in allowed_headers


def test_injected_verifier_and_repository_are_used(monkeypatch):
    client, repo = _app_client(monkeypatch)
    client.put("/api/me/profile", headers=_auth("header.user-a.sig"), json=PROFILE)
    assert "user-a" in repo.profiles
    assert "user-b" not in repo.profiles


def test_production_allowlist_with_auth_flag_still_hides_legacy(monkeypatch):
    client, _ = _app_client(
        monkeypatch,
        extra={
            "APP_ENV": "production",
            "ENABLE_PRODUCT_ROUTES": "true",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_EXPERIMENTAL_ROUTES": "false",
            "ENABLE_API_DOCS": "true",
            "CORS_ALLOW_ORIGINS": "https://sportbeacon-ai.vercel.app",
            "CORS_ALLOW_ORIGIN_REGEX": "^$",
        },
    )
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/me").status_code == 401
    assert client.get("/api/me", headers=_auth("header.user-a.sig")).status_code == 200
    assert client.post("/api/drills/recommend", json=PROFILE).status_code == 404
    assert client.get("/docs").status_code == 404

