from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.api import create_app
from backend.athlete_repository import InMemoryAthleteRepository
from backend.sports_loop_fixtures import (
    ACTIVE_RUN_ID,
    CANCELLED_RUN_ID,
    COMPLETED_RUN_ID,
    PLACE_ID,
    UPCOMING_RUN_ID,
    build_test_place,
    build_test_runs,
    ensure_sports_loop_fixtures,
)
from backend.sports_loop_models import Place, Run
from backend.sports_loop_repository import InMemorySportsLoopRepository
from backend.sports_loop_service import CHECK_IN_LEAD, compute_run_status

NOW = datetime(2026, 8, 15, 18, 0, tzinfo=timezone.utc)


class FakeVerifier:
    def __init__(self) -> None:
        self.uid_for_token = {
            "header.user-a.sig": "user-a",
            "header.user-b.sig": "user-b",
        }

    def verify_id_token(self, token: str) -> str:
        uid = self.uid_for_token.get(token)
        if not uid:
            raise ValueError("unknown")
        return uid


def _auth(token: str = "header.user-a.sig") -> dict:
    return {"Authorization": f"Bearer {token}"}


def _app_client(monkeypatch, extra=None, now=NOW):
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("ENABLE_SPORTS_LOOP_FIXTURES", "false")
    for key, value in (extra or {}).items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)
    app = create_app()
    app.state.token_verifier = FakeVerifier()
    app.state.athlete_repository = InMemoryAthleteRepository()
    repo = InMemorySportsLoopRepository()
    app.state.sports_loop_repository = repo
    app.state.sports_loop_clock = lambda: now
    return TestClient(app), repo


def _seed(repo: InMemorySportsLoopRepository, now=NOW) -> None:
    ensure_sports_loop_fixtures(repo, now)


def test_place_and_run_serialization_round_trip(monkeypatch):
    _, repo = _app_client(monkeypatch)
    place = build_test_place(NOW)
    run = build_test_runs(NOW)[0]
    stored_place = Place.model_validate(repo.upsert_place(place).model_dump())
    stored_run = Run.model_validate(repo.upsert_run(run).model_dump())
    assert stored_place.id == PLACE_ID
    assert stored_place.isTestData is True
    assert stored_place.city == "Richmond"
    assert stored_run.sport == "basketball"
    assert stored_run.placeId == PLACE_ID
    assert stored_run.startsAt.tzinfo is not None


def test_run_status_boundaries_use_server_utc(monkeypatch):
    start = NOW
    end = NOW + timedelta(hours=2)
    run = Run(
        id="boundary-run-status-1",
        sport="basketball",
        placeId=PLACE_ID,
        title="Boundary",
        startsAt=start,
        endsAt=end,
        status="scheduled",
        createdBy="test",
        createdAt=NOW,
        updatedAt=NOW,
    )
    assert compute_run_status(run, start - timedelta(seconds=1)) == "upcoming"
    assert compute_run_status(run, start) == "active"
    assert compute_run_status(run, end) == "active"
    assert compute_run_status(run, end + timedelta(seconds=1)) == "completed"
    cancelled = run.model_copy(update={"status": "cancelled"})
    assert compute_run_status(cancelled, start) == "cancelled"


def test_timezone_aware_comparison_does_not_use_naive_local_clock(monkeypatch):
    eastern = datetime(2026, 8, 15, 14, 0, tzinfo=timezone(timedelta(hours=-4)))
    run = Run(
        id="timezone-run-status",
        sport="basketball",
        placeId=PLACE_ID,
        title="TZ",
        startsAt=NOW,
        endsAt=NOW + timedelta(hours=1),
        status="scheduled",
        createdBy="test",
        createdAt=NOW,
        updatedAt=NOW,
    )
    assert eastern.astimezone(timezone.utc) == NOW
    assert compute_run_status(run, eastern) == "active"


def test_unauthenticated_sports_loop_operations_fail(monkeypatch):
    client, repo = _app_client(monkeypatch)
    _seed(repo)
    assert client.get("/api/runs").status_code == 401
    assert client.get(f"/api/runs/{ACTIVE_RUN_ID}").status_code == 401
    assert client.post(f"/api/runs/{ACTIVE_RUN_ID}/join").status_code == 401
    assert client.post(f"/api/runs/{ACTIVE_RUN_ID}/check-in").status_code == 401
    assert client.get("/api/me/participation").status_code == 401


def test_discovery_returns_active_and_upcoming_with_place(monkeypatch):
    client, repo = _app_client(monkeypatch)
    _seed(repo)
    response = client.get("/api/runs", headers=_auth())
    assert response.status_code == 200, response.text
    body = response.json()
    ids = {item["id"] for item in body["items"]}
    assert ACTIVE_RUN_ID in ids
    assert UPCOMING_RUN_ID in ids
    assert COMPLETED_RUN_ID not in ids
    assert CANCELLED_RUN_ID not in ids
    active = next(item for item in body["items"] if item["id"] == ACTIVE_RUN_ID)
    assert active["status"] == "active"
    assert active["place"]["name"].startswith("TEST DATA")
    assert active["place"]["city"] == "Richmond"
    assert active["isTestData"] is True
    assert active["myParticipation"] is None
    upcoming = next(item for item in body["items"] if item["id"] == UPCOMING_RUN_ID)
    assert upcoming["status"] == "upcoming"


def test_join_is_idempotent_and_persists(monkeypatch):
    client, repo = _app_client(monkeypatch)
    _seed(repo)
    first = client.post(f"/api/runs/{UPCOMING_RUN_ID}/join", headers=_auth())
    second = client.post(f"/api/runs/{UPCOMING_RUN_ID}/join", headers=_auth())
    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert first.json()["myParticipation"]["status"] == "going"
    assert second.json()["myParticipation"]["joinedAt"] == first.json()["myParticipation"]["joinedAt"]
    stored = repo.get_participation(UPCOMING_RUN_ID, "user-a")
    assert stored is not None
    assert stored.status == "going"
    listed = client.get("/api/runs", headers=_auth())
    upcoming = next(item for item in listed.json()["items"] if item["id"] == UPCOMING_RUN_ID)
    assert upcoming["myParticipation"]["status"] == "going"
    history = client.get("/api/me/participation", headers=_auth())
    assert history.status_code == 200
    assert history.json()["items"][0]["runId"] == UPCOMING_RUN_ID
    assert history.json()["items"][0]["placeName"].startswith("TEST DATA")


def test_duplicate_join_does_not_create_second_record(monkeypatch):
    client, repo = _app_client(monkeypatch)
    _seed(repo)
    client.post(f"/api/runs/{ACTIVE_RUN_ID}/join", headers=_auth())
    client.post(f"/api/runs/{ACTIVE_RUN_ID}/join", headers=_auth())
    matches = [
        item
        for item in repo.list_participations("user-a")
        if item.runId == ACTIVE_RUN_ID
    ]
    assert len(matches) == 1


def test_athlete_cannot_mutate_another_athletes_participation(monkeypatch):
    client, repo = _app_client(monkeypatch)
    _seed(repo)
    joined = client.post(f"/api/runs/{ACTIVE_RUN_ID}/join", headers=_auth("header.user-a.sig"))
    assert joined.status_code == 200
    impersonate = client.post(
        f"/api/runs/{ACTIVE_RUN_ID}/join",
        headers=_auth("header.user-a.sig"),
        json={"uid": "user-b"},
    )
    assert impersonate.status_code == 400
    other = client.get(f"/api/runs/{ACTIVE_RUN_ID}", headers=_auth("header.user-b.sig"))
    assert other.status_code == 200
    assert other.json()["myParticipation"] is None
    other_join = client.post(f"/api/runs/{ACTIVE_RUN_ID}/join", headers=_auth("header.user-b.sig"))
    assert other_join.status_code == 200
    assert repo.get_participation(ACTIVE_RUN_ID, "user-a").status == "going"
    assert repo.get_participation(ACTIVE_RUN_ID, "user-b").status == "going"
    history_b = client.get("/api/me/participation", headers=_auth("header.user-b.sig"))
    assert all(item["runId"] != "user-a" for item in history_b.json()["items"])
    assert history_b.json()["items"][0]["status"] == "going"


def test_unknown_run_cannot_be_joined_or_checked_in(monkeypatch):
    client, _ = _app_client(monkeypatch)
    missing = "missing-run-id-xx"
    assert client.get(f"/api/runs/{missing}", headers=_auth()).status_code == 404
    assert client.post(f"/api/runs/{missing}/join", headers=_auth()).status_code == 404
    assert client.post(f"/api/runs/{missing}/check-in", headers=_auth()).status_code == 404


def test_completed_and_cancelled_runs_cannot_be_joined(monkeypatch):
    client, repo = _app_client(monkeypatch)
    _seed(repo)
    completed = client.post(f"/api/runs/{COMPLETED_RUN_ID}/join", headers=_auth())
    cancelled = client.post(f"/api/runs/{CANCELLED_RUN_ID}/join", headers=_auth())
    assert completed.status_code == 409
    assert cancelled.status_code == 409
    assert "traceback" not in completed.text.lower()
    assert "firestore" not in completed.text.lower()


def test_check_in_window_and_idempotency(monkeypatch):
    client, repo = _app_client(monkeypatch)
    _seed(repo)
    too_early = client.post(f"/api/runs/{UPCOMING_RUN_ID}/check-in", headers=_auth())
    assert too_early.status_code == 409
    first = client.post(f"/api/runs/{ACTIVE_RUN_ID}/check-in", headers=_auth())
    second = client.post(f"/api/runs/{ACTIVE_RUN_ID}/check-in", headers=_auth())
    assert first.status_code == 200, first.text
    assert second.status_code == 200
    assert first.json()["myParticipation"]["status"] == "checked_in"
    assert second.json()["myParticipation"]["checkedInAt"] == first.json()["myParticipation"]["checkedInAt"]
    stored = repo.get_participation(ACTIVE_RUN_ID, "user-a")
    assert stored is not None
    assert stored.checkedInAt is not None
    history = client.get("/api/me/participation", headers=_auth())
    assert history.json()["items"][0]["status"] == "checked_in"


def test_check_in_opens_at_lead_time(monkeypatch):
    lead_now = NOW + timedelta(hours=3) - CHECK_IN_LEAD
    client, repo = _app_client(monkeypatch, now=lead_now)
    _seed(repo)
    # Fixtures rebuild relative to lead_now, so re-seed an upcoming run with absolute times.
    place = build_test_place(NOW)
    repo.upsert_place(place)
    upcoming = Run(
        id="lead-time-run-checkin",
        sport="basketball",
        placeId=PLACE_ID,
        title="Lead window",
        startsAt=NOW + timedelta(hours=3),
        endsAt=NOW + timedelta(hours=5),
        status="scheduled",
        createdBy="test",
        createdAt=NOW,
        updatedAt=NOW,
    )
    repo.upsert_run(upcoming)
    allowed = client.post("/api/runs/lead-time-run-checkin/check-in", headers=_auth())
    assert allowed.status_code == 200, allowed.text
    assert allowed.json()["myParticipation"]["status"] == "checked_in"


def test_check_in_rejected_after_end(monkeypatch):
    client, repo = _app_client(monkeypatch, now=NOW + timedelta(minutes=76))
    place = build_test_place(NOW)
    repo.upsert_place(place)
    run = Run(
        id="ended-run-check-in1",
        sport="basketball",
        placeId=PLACE_ID,
        title="Ended",
        startsAt=NOW - timedelta(minutes=45),
        endsAt=NOW + timedelta(minutes=75),
        status="scheduled",
        createdBy="test",
        createdAt=NOW,
        updatedAt=NOW,
    )
    repo.upsert_run(run)
    response = client.post("/api/runs/ended-run-check-in1/check-in", headers=_auth())
    assert response.status_code == 409


def test_join_then_check_in_history_survives(monkeypatch):
    client, repo = _app_client(monkeypatch)
    _seed(repo)
    client.post(f"/api/runs/{ACTIVE_RUN_ID}/join", headers=_auth())
    client.post(f"/api/runs/{ACTIVE_RUN_ID}/check-in", headers=_auth())
    history = client.get("/api/me/participation", headers=_auth())
    assert history.status_code == 200
    item = history.json()["items"][0]
    assert item["status"] == "checked_in"
    assert item["runTitle"].startswith("TEST DATA")


def test_fixtures_are_labeled_test_data(monkeypatch):
    client, _ = _app_client(
        monkeypatch,
        extra={"ENABLE_SPORTS_LOOP_FIXTURES": "true"},
    )
    response = client.get("/api/runs", headers=_auth())
    assert response.status_code == 200
    assert response.json()["items"]
    assert all(item["isTestData"] is True for item in response.json()["items"])
    assert all("TEST DATA" in item["title"] for item in response.json()["items"])


def test_staging_allowlist_exposes_authenticated_runs_and_hides_legacy(monkeypatch):
    client, repo = _app_client(
        monkeypatch,
        extra={
            "APP_ENV": "staging",
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_SPORTS_LOOP_FIXTURES": "false",
            "ENABLE_EXPERIMENTAL_ROUTES": "false",
            "ENABLE_API_DOCS": "false",
            "CORS_ALLOW_ORIGINS": "https://sportbeacon-ai.vercel.app",
        },
    )
    _seed(repo)
    assert client.get("/api/runs").status_code == 401
    listed = client.get("/api/runs", headers=_auth())
    assert listed.status_code == 200, listed.text
    assert client.post("/api/drills/recommend", json={"user_id": "x"}).status_code == 404
    preflight = client.options(
        f"/api/runs/{ACTIVE_RUN_ID}/join",
        headers={
            "Origin": "https://sportbeacon-ai.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert preflight.status_code in {200, 204}
    assert preflight.headers.get("access-control-allow-origin") == "https://sportbeacon-ai.vercel.app"


def test_invalid_app_env_hides_sports_loop_routes(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.setenv("ENABLE_AUTHENTICATED_PROFILE_ROUTES", "true")
    monkeypatch.setenv("ENABLE_PRODUCT_ROUTES", "true")
    client = TestClient(create_app())
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/runs").status_code == 404
    assert client.post(f"/api/runs/{ACTIVE_RUN_ID}/join", headers=_auth()).status_code == 404
    assert client.get("/api/me/participation", headers=_auth()).status_code == 404
