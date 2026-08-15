from typing import Optional

from fastapi.testclient import TestClient

from backend.api import create_app
from backend.models import API_VERSION, SERVICE_NAME


DRILL_PAYLOAD = {
    "user_id": "player-1",
    "skill_levels": {"shooting": 0.4, "defense": 0.6},
    "growth_areas": ["shooting"],
    "top_skills": ["defense"],
    "max_recommendations": 3,
    "min_difficulty": "Beginner",
    "max_difficulty": "Advanced",
}

INVALID_APP_ENVS = (None, "", "   ", "preview", "prodction", "prod")
PERMISSIVE_FLAGS = {
    "ENABLE_PRODUCT_ROUTES": "true",
    "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
    "ENABLE_API_DOCS": "true",
    "ENABLE_EXPERIMENTAL_ROUTES": "true",
}
HIDDEN_PATHS = ("/api/me", "/api/drills/recommend", "/docs", "/openapi.json", "/api/runs")
STAGING_ORIGIN = "https://sportbeacon-ai.vercel.app"
PREVIEW_ORIGIN = (
    "https://sportbeacon-ai-git-feat-firebase-au-30ec74-trondurells-projects.vercel.app"
)
UNRELATED_ORIGIN = "https://evil.example"


def _client(monkeypatch, app_env: Optional[str], extra: Optional[dict] = None) -> TestClient:
    if app_env is None:
        monkeypatch.delenv("APP_ENV", raising=False)
    else:
        monkeypatch.setenv("APP_ENV", app_env)
    for key, value in (extra or {}).items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)
    return TestClient(create_app())


def _assert_health_closed_surface(client: TestClient) -> None:
    health = client.get("/api/health")
    assert health.status_code == 200, health.text
    body = health.json()
    assert body == {"status": "ok", "service": SERVICE_NAME, "version": API_VERSION}
    assert "APP_ENV" not in health.text
    assert "firebase" not in health.text.lower()
    assert client.get("/api/me").status_code == 404
    assert client.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 404
    assert client.get("/api/runs").status_code == 404
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def test_invalid_app_env_missing_fails_closed(monkeypatch):
    _assert_health_closed_surface(_client(monkeypatch, None))


def test_invalid_app_env_blank_fails_closed(monkeypatch):
    _assert_health_closed_surface(_client(monkeypatch, ""))


def test_invalid_app_env_whitespace_fails_closed(monkeypatch):
    _assert_health_closed_surface(_client(monkeypatch, "   "))


def test_invalid_app_env_preview_fails_closed(monkeypatch):
    _assert_health_closed_surface(_client(monkeypatch, "preview"))


def test_invalid_app_env_prodction_fails_closed(monkeypatch):
    _assert_health_closed_surface(_client(monkeypatch, "prodction"))


def test_invalid_app_env_prod_alias_fails_closed(monkeypatch):
    _assert_health_closed_surface(_client(monkeypatch, "prod"))


def test_invalid_app_env_ignores_permissive_flags(monkeypatch):
    for app_env in INVALID_APP_ENVS:
        _assert_health_closed_surface(_client(monkeypatch, app_env, extra=PERMISSIVE_FLAGS))
        client = _client(monkeypatch, app_env, extra=PERMISSIVE_FLAGS)
        for path in HIDDEN_PATHS:
            method = "POST" if path == "/api/drills/recommend" else "GET"
            if method == "POST":
                assert client.post(path, json=DRILL_PAYLOAD).status_code == 404
            else:
                assert client.get(path).status_code == 404
            preflight = client.options(
                path,
                headers={
                    "Origin": STAGING_ORIGIN,
                    "Access-Control-Request-Method": "GET" if method == "GET" else "POST",
                },
            )
            assert preflight.status_code == 404, path


def test_recognized_development_keeps_controlled_local_behavior(monkeypatch):
    client = _client(monkeypatch, "development")
    assert client.get("/api/health").status_code == 200
    assert client.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 200
    assert client.get("/openapi.json").status_code == 200
    # Product routes default on locally, so /api/me is reachable and auth-gated.
    assert client.get("/api/me").status_code == 401
    closed = _client(
        monkeypatch,
        "development",
        extra={
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "false",
            "ENABLE_API_DOCS": "false",
        },
    )
    assert closed.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 404
    assert closed.get("/api/me").status_code == 404
    assert closed.get("/api/runs").status_code == 404
    assert closed.get("/docs").status_code == 404
    auth_only = _client(
        monkeypatch,
        "development",
        extra={
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
        },
    )
    assert auth_only.get("/api/me").status_code == 401
    assert auth_only.get("/api/runs").status_code == 401
    assert auth_only.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 404


def test_recognized_test_keeps_intentional_product_behavior(monkeypatch):
    client = _client(monkeypatch, "test")
    assert client.get("/api/health").status_code == 200
    assert client.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 200
    assert client.get("/api/me").status_code == 401
    gated = _client(
        monkeypatch,
        "test",
        extra={
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
        },
    )
    assert gated.get("/api/me").status_code == 401
    assert gated.get("/api/runs").status_code == 401
    assert gated.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 404


def test_recognized_staging_hides_legacy_even_when_product_flag_true(monkeypatch):
    client = _client(
        monkeypatch,
        "staging",
        extra={
            "ENABLE_PRODUCT_ROUTES": "true",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_API_DOCS": "false",
            "CORS_ALLOW_ORIGINS": STAGING_ORIGIN,
        },
    )
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/me").status_code == 401
    assert client.get("/api/runs").status_code == 401
    assert client.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 404
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def test_recognized_production_hides_legacy_even_when_flags_true(monkeypatch):
    client = _client(
        monkeypatch,
        "production",
        extra={
            "ENABLE_PRODUCT_ROUTES": "true",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_API_DOCS": "true",
            "CORS_ALLOW_ORIGINS": STAGING_ORIGIN,
            "CORS_ALLOW_ORIGIN_REGEX": "^$",
        },
    )
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/me").status_code == 401
    assert client.get("/api/runs").status_code == 401
    assert client.post("/api/drills/recommend", json=DRILL_PAYLOAD).status_code == 404
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def _preflight(client: TestClient, path: str, origin: str, method: str = "GET"):
    return client.options(
        path,
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": method,
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )


def test_staging_preflight_allows_enabled_me_and_hides_disabled_surfaces(monkeypatch):
    client = _client(
        monkeypatch,
        "staging",
        extra={
            "ENABLE_PRODUCT_ROUTES": "true",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_API_DOCS": "false",
            "CORS_ALLOW_ORIGINS": STAGING_ORIGIN,
        },
    )
    allowed = _preflight(client, "/api/me", STAGING_ORIGIN)
    assert allowed.status_code in {200, 204}
    assert allowed.headers.get("access-control-allow-origin") == STAGING_ORIGIN

    runs = _preflight(client, "/api/runs", STAGING_ORIGIN)
    assert runs.status_code in {200, 204}
    assert runs.headers.get("access-control-allow-origin") == STAGING_ORIGIN

    preview = _preflight(client, "/api/me", PREVIEW_ORIGIN)
    assert preview.status_code in {200, 204}
    assert preview.headers.get("access-control-allow-origin") == PREVIEW_ORIGIN

    unrelated = _preflight(client, "/api/me", UNRELATED_ORIGIN)
    assert unrelated.headers.get("access-control-allow-origin") != UNRELATED_ORIGIN

    for path, method in (
        ("/api/drills/recommend", "POST"),
        ("/docs", "GET"),
        ("/openapi.json", "GET"),
        ("/api/definitely-missing", "GET"),
    ):
        response = _preflight(client, path, STAGING_ORIGIN, method)
        assert response.status_code == 404, path
        assert response.headers.get("access-control-allow-origin") != STAGING_ORIGIN


def test_production_preflight_hides_disabled_surfaces(monkeypatch):
    client = _client(
        monkeypatch,
        "production",
        extra={
            "ENABLE_PRODUCT_ROUTES": "true",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "false",
            "ENABLE_API_DOCS": "true",
            "CORS_ALLOW_ORIGINS": STAGING_ORIGIN,
            "CORS_ALLOW_ORIGIN_REGEX": "^$",
        },
    )
    for path, method in (
        ("/api/me", "GET"),
        ("/api/drills/recommend", "POST"),
        ("/docs", "GET"),
        ("/openapi.json", "GET"),
        ("/api/definitely-missing", "GET"),
    ):
        response = _preflight(client, path, STAGING_ORIGIN, method)
        assert response.status_code == 404, path
    health = _preflight(client, "/api/health", STAGING_ORIGIN)
    assert health.status_code in {200, 204}
    assert health.headers.get("access-control-allow-origin") == STAGING_ORIGIN
    preview = _preflight(client, "/api/health", PREVIEW_ORIGIN)
    assert preview.headers.get("access-control-allow-origin") != PREVIEW_ORIGIN
    unrelated = _preflight(client, "/api/health", UNRELATED_ORIGIN)
    assert unrelated.headers.get("access-control-allow-origin") != UNRELATED_ORIGIN
