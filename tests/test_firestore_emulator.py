"""Firestore emulator tests. Never run against the live Firebase project."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone

import pytest

from backend.athlete_models import AthleteProfileWrite, BasketballStatWrite, HomeArea, SportSkills
from backend.athlete_repository import FirestoreAthleteRepository

pytestmark = pytest.mark.skipif(
    not os.getenv("FIRESTORE_EMULATOR_HOST"),
    reason="Firestore emulator is not running",
)


def _assert_local_emulator() -> str:
    host = os.environ["FIRESTORE_EMULATOR_HOST"]
    if not host.startswith(("127.0.0.1", "localhost")):
        raise RuntimeError("Refusing to run emulator tests against a non-local Firestore host")
    return host


def _firestore_url(path: str) -> str:
    host = _assert_local_emulator()
    return (
        f"http://{host}/v1/projects/sportbeacon-ai/databases/(default)/documents/{path.lstrip('/')}"
    )


def _http_status(url: str, token: str | None = None) -> int:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, headers=headers, method="GET")
    try:
        urllib.request.urlopen(request, timeout=10)
        return 200
    except urllib.error.HTTPError as exc:
        return exc.code


def _auth_emulator_id_token(email: str = "rules-test@example.com") -> str:
    auth_host = os.getenv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099")
    if not auth_host.startswith(("127.0.0.1", "localhost")):
        raise RuntimeError("Refusing to use a non-local Auth emulator host")
    payload = json.dumps(
        {
            "email": email,
            "password": "test-password",
            "returnSecureToken": True,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        f"http://{auth_host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        body = json.loads(response.read().decode("utf-8"))
    token = body.get("idToken")
    if not isinstance(token, str) or not token:
        raise RuntimeError("Auth emulator did not return an ID token")
    return token


def test_anonymous_direct_firestore_access_is_denied():
    status = _http_status(_firestore_url("environments/test/athletes/user-a"))
    assert status in {401, 403}


def test_authenticated_direct_firestore_access_is_denied():
    token = _auth_emulator_id_token()
    status = _http_status(_firestore_url("environments/test/athletes/user-a"), token=token)
    assert status in {401, 403}


def test_backend_writes_stay_on_env_and_uid_path(monkeypatch):
    monkeypatch.setenv("APP_ENV", "test")
    from google.cloud import firestore

    client = firestore.Client(project="sportbeacon-ai")
    repo = FirestoreAthleteRepository(client=client, app_env="test")
    profile = repo.upsert_profile(
        "user-a",
        AthleteProfileWrite(
            displayName="Ada",
            primarySport="basketball",
            sports=["basketball"],
            skillsBySport={"basketball": SportSkills(skill_levels={"shooting": 0.4})},
            homeArea=HomeArea(city="Richmond", region="VA", country="US"),
            onboardingComplete=True,
        ),
    )
    assert profile.visibility == "private"
    snap = (
        client.collection("environments")
        .document("test")
        .collection("athletes")
        .document("user-a")
        .get()
    )
    assert snap.exists
    stray = (
        client.collection("environments")
        .document("production")
        .collection("athletes")
        .document("user-a")
        .get()
    )
    assert not stray.exists
    repo.add_stat(
        "user-a",
        BasketballStatWrite(
            occurredAt=datetime(2024, 4, 1, tzinfo=timezone.utc),
            points=10,
            assists=1,
            rebounds=1,
            steals=0,
            blocks=0,
            field_goal_percentage=40,
            three_point_percentage=30,
            result="win",
        ),
    )
    other_uid = (
        client.collection("environments")
        .document("test")
        .collection("athletes")
        .document("user-b")
        .get()
    )
    assert not other_uid.exists


def test_anonymous_and_authenticated_direct_access_denied_for_places_and_runs():
    token = _auth_emulator_id_token("places-rules-test@example.com")
    for path in (
        "environments/test/places/test-place-richmond-rec-gym",
        "environments/test/runs/test-run-basketball-active",
        "environments/test/runs/test-run-basketball-active/participants/user-a",
    ):
        assert _http_status(_firestore_url(path)) in {401, 403}
        assert _http_status(_firestore_url(path), token=token) in {401, 403}


def test_sports_loop_backend_writes_stay_on_env_path(monkeypatch):
    monkeypatch.setenv("APP_ENV", "test")
    from google.cloud import firestore

    from backend.sports_loop_fixtures import ACTIVE_RUN_ID, PLACE_ID, ensure_sports_loop_fixtures
    from backend.sports_loop_repository import FirestoreSportsLoopRepository
    from backend.sports_loop_models import Participation

    client = firestore.Client(project="sportbeacon-ai")
    repo = FirestoreSportsLoopRepository(client=client, app_env="test")
    now = datetime(2026, 8, 15, 18, 0, tzinfo=timezone.utc)
    ensure_sports_loop_fixtures(repo, now)
    place_snap = (
        client.collection("environments")
        .document("test")
        .collection("places")
        .document(PLACE_ID)
        .get()
    )
    assert place_snap.exists
    stray_place = (
        client.collection("environments")
        .document("production")
        .collection("places")
        .document(PLACE_ID)
        .get()
    )
    assert not stray_place.exists
    joined = repo.commit_join(
        Participation(
            uid="user-a",
            runId=ACTIVE_RUN_ID,
            status="going",
            joinedAt=now,
            runTitle="TEST DATA — Lunch pickup run",
            placeId=PLACE_ID,
            placeName="TEST DATA — Richmond Rec Gym",
            sport="basketball",
            startsAt=now,
            isTestData=True,
        )
    )
    assert joined.status == "going"
    participant = (
        client.collection("environments")
        .document("test")
        .collection("runs")
        .document(ACTIVE_RUN_ID)
        .collection("participants")
        .document("user-a")
        .get()
    )
    assert participant.exists
    history = (
        client.collection("environments")
        .document("test")
        .collection("athletes")
        .document("user-a")
        .collection("participations")
        .document(ACTIVE_RUN_ID)
        .get()
    )
    assert history.exists
    again = repo.commit_join(
        Participation(
            uid="user-a",
            runId=ACTIVE_RUN_ID,
            status="going",
            joinedAt=now,
            runTitle="changed",
            placeId=PLACE_ID,
            placeName="changed",
            sport="basketball",
            startsAt=now,
            isTestData=True,
        )
    )
    assert again.runTitle == joined.runTitle

