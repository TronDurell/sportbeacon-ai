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


def test_direct_access_denied_for_connection_and_report_collections():
    token = _auth_emulator_id_token("connections-rules-test@example.com")
    pair_key = "a" * 64
    for path in (
        "environments/test/athleteConnections",
        f"environments/test/athleteConnections/{pair_key}",
        "environments/test/safetyReports",
        f"environments/test/safetyReports/{'b' * 32}",
    ):
        assert _http_status(_firestore_url(path)) in {401, 403}
        assert _http_status(_firestore_url(path), token=token) in {401, 403}


def test_connection_writes_stay_on_the_environment_path(monkeypatch):
    monkeypatch.setenv("APP_ENV", "test")
    from google.cloud import firestore

    from backend.connection_models import (
        AthleteConnection,
        SafetyReport,
        canonical_members,
        canonical_pair_key,
        new_opaque_id,
    )
    from backend.connection_repository import FirestoreConnectionRepository
    from backend.sports_loop_fixtures import ACTIVE_RUN_ID, PLACE_ID

    client = firestore.Client(project="sportbeacon-ai")
    repo = FirestoreConnectionRepository(client=client, app_env="test")
    now = datetime(2026, 8, 15, 18, 0, tzinfo=timezone.utc)
    pair_key = canonical_pair_key("user-a", "user-b")

    def _create(current):
        assert current is None
        return AthleteConnection(
            pairKey=pair_key,
            connectionId=new_opaque_id(),
            members=canonical_members("user-a", "user-b"),
            requesterUid="user-a",
            recipientUid="user-b",
            status="pending",
            qualifyingRunId=ACTIVE_RUN_ID,
            qualifyingPlaceId=PLACE_ID,
            createdAt=now,
            updatedAt=now,
            isTestData=True,
        )

    created = repo.apply_connection_transition(pair_key, _create)
    assert created is not None and created.status == "pending"

    def _idempotent(current):
        assert current is not None
        return None

    assert repo.apply_connection_transition(pair_key, _idempotent).connectionId == (
        created.connectionId
    )
    stored = (
        client.collection("environments")
        .document("test")
        .collection("athleteConnections")
        .document(pair_key)
        .get()
    )
    assert stored.exists
    stray = (
        client.collection("environments")
        .document("production")
        .collection("athleteConnections")
        .document(pair_key)
        .get()
    )
    assert not stray.exists
    assert [item.connectionId for item in repo.list_connections_for_member("user-a")] == [
        created.connectionId
    ]
    assert repo.list_connections_for_member("user-c") == []

    report = SafetyReport(
        reportId=new_opaque_id(),
        reporterUid="user-b",
        subjectUid="user-a",
        reasonCode="unwanted_contact",
        details="emulator test only",
        connectionPairKey=pair_key,
        runId=ACTIVE_RUN_ID,
        placeId=PLACE_ID,
        createdAt=now,
        isTestData=True,
    )
    repo.add_safety_report(report)
    report_snap = (
        client.collection("environments")
        .document("test")
        .collection("safetyReports")
        .document(report.reportId)
        .get()
    )
    assert report_snap.exists
    stray_report = (
        client.collection("environments")
        .document("production")
        .collection("safetyReports")
        .document(report.reportId)
        .get()
    )
    assert not stray_report.exists


def test_connection_consent_persists_on_both_participation_documents(monkeypatch):
    monkeypatch.setenv("APP_ENV", "test")
    from google.cloud import firestore

    from backend.connection_models import new_opaque_id
    from backend.sports_loop_fixtures import (
        ACTIVE_RUN_ID,
        PLACE_ID,
        ensure_sports_loop_fixtures,
    )
    from backend.sports_loop_models import Participation
    from backend.sports_loop_repository import FirestoreSportsLoopRepository

    client = firestore.Client(project="sportbeacon-ai")
    repo = FirestoreSportsLoopRepository(client=client, app_env="test")
    now = datetime(2026, 8, 15, 18, 0, tzinfo=timezone.utc)
    ensure_sports_loop_fixtures(repo, now)
    repo.commit_join(
        Participation(
            uid="user-consent",
            runId=ACTIVE_RUN_ID,
            status="checked_in",
            joinedAt=now,
            checkedInAt=now,
            runTitle="TEST DATA — Lunch pickup run",
            placeId=PLACE_ID,
            placeName="TEST DATA — Richmond Rec Gym",
            sport="basketball",
            startsAt=now,
            isTestData=True,
        )
    )
    stored = repo.get_participation(ACTIVE_RUN_ID, "user-consent")
    assert stored.connectionVisibility == "hidden"
    assert stored.candidateId is None

    updated = repo.commit_connection_consent(
        "user-consent", ACTIVE_RUN_ID, "open_to_connect", now, new_opaque_id
    )
    assert updated is not None
    assert updated.connectionVisibility == "open_to_connect"
    assert updated.candidateId is not None
    mirrored = (
        client.collection("environments")
        .document("test")
        .collection("athletes")
        .document("user-consent")
        .collection("participations")
        .document(ACTIVE_RUN_ID)
        .get()
    )
    assert mirrored.to_dict()["candidateId"] == updated.candidateId
    roster = repo.list_run_participants(ACTIVE_RUN_ID)
    assert any(item.uid == "user-consent" for item in roster)
    # Consent for an athlete with no participation cannot be forged.
    assert (
        repo.commit_connection_consent(
            "user-never-played", ACTIVE_RUN_ID, "open_to_connect", now, new_opaque_id
        )
        is None
    )

