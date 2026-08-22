"""Phase 3B — private athlete connections derived from verified shared play.

Every test here asserts one row of the privacy and authorization matrix.
"""

from __future__ import annotations

import json
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import pytest
from fastapi.testclient import TestClient

from backend.api import create_app
from backend.athlete_models import AthleteProfileWrite, HomeArea, SportSkills
from backend.athlete_repository import InMemoryAthleteRepository
from backend.connection_models import (
    AthleteConnection,
    SafetyReportWrite,
    canonical_pair_key,
    new_opaque_id,
)
from backend.connection_repository import InMemoryConnectionRepository
from backend.connection_service import AthleteConnectionService
from backend.sports_loop_fixtures import (
    ACTIVE_RUN_ID,
    PLACE_ID,
    SECOND_ACTIVE_RUN_ID,
    THIRD_ACTIVE_RUN_ID,
    UPCOMING_RUN_ID,
    ensure_sports_loop_fixtures,
)
from backend.sports_loop_models import Participation, Run
from backend.sports_loop_repository import InMemorySportsLoopRepository

NOW = datetime(2026, 8, 15, 18, 0, tzinfo=timezone.utc)
SECOND_RUN_ID = "test-run-basketball-second-gym"
OPAQUE_ID = re.compile(r"^[a-f0-9]{32}$")

TOKENS = {
    "header.user-a.sig": "user-a",
    "header.user-b.sig": "user-b",
    "header.user-c.sig": "user-c",
}
DISPLAY_NAMES = {"user-a": "Ada", "user-b": "Bode", "user-c": "Cleo"}
EMAILS = {"user-a": "ada@example.com", "user-b": "bode@example.com"}

PRIVATE_KEYS = frozenset(
    {
        "uid",
        "email",
        "phone",
        "phoneNumber",
        "provider",
        "authProvider",
        "homeArea",
        "members",
        "pairKey",
        "requesterUid",
        "recipientUid",
        "blockedBy",
        "reporterUid",
        "subjectUid",
        "bio",
        "skillsBySport",
    }
)


class FakeVerifier:
    def verify_id_token(self, token: str) -> str:
        uid = TOKENS.get(token)
        if not uid:
            raise ValueError("unknown")
        return uid


class MovingClock:
    """Server clock the tests advance explicitly.

    Reconnecting after a decline or a removal is gated on check-in evidence
    recorded *after* that ending, so a frozen clock cannot express the sequence
    at all. Advancing it also lets a test prove that a same-instant check-in is
    not "later".
    """

    def __init__(self, start: datetime) -> None:
        self.now = start

    def __call__(self) -> datetime:
        return self.now

    def advance(self, **delta: int) -> datetime:
        self.now = self.now + timedelta(**delta)
        return self.now


def _auth(token: str = "header.user-a.sig") -> Dict[str, str]:
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
    athletes = InMemoryAthleteRepository()
    sports = InMemorySportsLoopRepository()
    connections = InMemoryConnectionRepository()
    app.state.athlete_repository = athletes
    app.state.sports_loop_repository = sports
    app.state.connection_repository = connections
    app.state.sports_loop_clock = MovingClock(now)
    ensure_sports_loop_fixtures(sports, now)
    sports.upsert_run(
        Run(
            id=SECOND_RUN_ID,
            sport="basketball",
            placeId=PLACE_ID,
            title="TEST DATA — Second gym run",
            startsAt=now - timedelta(minutes=30),
            endsAt=now + timedelta(minutes=90),
            status="scheduled",
            createdBy="sportbeacon-fixture",
            isTestData=True,
            createdAt=now,
            updatedAt=now,
        )
    )
    for uid, name in DISPLAY_NAMES.items():
        athletes.upsert_profile(
            uid,
            AthleteProfileWrite(
                displayName=name,
                bio=f"{name} plays pickup",
                primarySport="basketball",
                sports=["basketball"],
                skillsBySport={"basketball": SportSkills(skill_levels={"shooting": 0.5})},
                homeArea=HomeArea(city="Richmond", region="VA", country="US"),
                onboardingComplete=True,
            ),
        )
    return TestClient(app), sports, connections, athletes


def _gate_client(monkeypatch, env: Dict[str, Optional[str]]) -> TestClient:
    """Route-gate only client. The fake verifier keeps Firebase out of the test."""
    for key, value in env.items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)
    app = create_app()
    app.state.token_verifier = FakeVerifier()
    app.state.athlete_repository = InMemoryAthleteRepository()
    app.state.sports_loop_repository = InMemorySportsLoopRepository()
    app.state.connection_repository = InMemoryConnectionRepository()
    return TestClient(app)


def _clock(client: TestClient) -> MovingClock:
    return client.app.state.sports_loop_clock


def _check_in(client: TestClient, token: str, run_id: str = ACTIVE_RUN_ID) -> None:
    response = client.post(f"/api/runs/{run_id}/check-in", headers=_auth(token))
    assert response.status_code == 200, response.text


def _join(client: TestClient, token: str, run_id: str = UPCOMING_RUN_ID) -> None:
    response = client.post(f"/api/runs/{run_id}/join", headers=_auth(token))
    assert response.status_code == 200, response.text


def _set_visibility(
    client: TestClient, token: str, visibility: str, run_id: str = ACTIVE_RUN_ID
):
    return client.put(
        f"/api/runs/{run_id}/me/connection-consent",
        headers=_auth(token),
        json={"visibility": visibility},
    )


def _co_players(client: TestClient, token: str, run_id: str = ACTIVE_RUN_ID):
    return client.get(f"/api/runs/{run_id}/co-players", headers=_auth(token))


def _open_pair(client: TestClient, run_id: str = ACTIVE_RUN_ID) -> Dict[str, str]:
    """Both athletes check in and open themselves to connection on one run."""
    _check_in(client, "header.user-a.sig", run_id)
    _check_in(client, "header.user-b.sig", run_id)
    assert _set_visibility(client, "header.user-a.sig", "open_to_connect", run_id).status_code == 200
    assert _set_visibility(client, "header.user-b.sig", "open_to_connect", run_id).status_code == 200
    a_view = _co_players(client, "header.user-a.sig", run_id).json()
    b_view = _co_players(client, "header.user-b.sig", run_id).json()
    return {
        "b_candidate": a_view["items"][0]["candidateId"],
        "a_candidate": b_view["items"][0]["candidateId"],
    }


def _candidate_id(sports: InMemorySportsLoopRepository, run_id: str, uid: str) -> str:
    record = sports.get_participation(run_id, uid)
    assert record is not None and record.candidateId is not None
    return record.candidateId


def _open_both_on_run(client: TestClient, run_id: str) -> None:
    _check_in(client, "header.user-a.sig", run_id)
    _check_in(client, "header.user-b.sig", run_id)
    assert _set_visibility(client, "header.user-a.sig", "open_to_connect", run_id).status_code == 200
    assert _set_visibility(client, "header.user-b.sig", "open_to_connect", run_id).status_code == 200


def _request(client: TestClient, token: str, candidate_id: str, run_id: str = ACTIVE_RUN_ID):
    return client.post(
        f"/api/runs/{run_id}/connection-requests",
        headers=_auth(token),
        json={"candidateId": candidate_id},
    )


def _walk(payload: Any, keys: List[str], values: List[str]) -> None:
    if isinstance(payload, dict):
        for key, value in payload.items():
            keys.append(key)
            _walk(value, keys, values)
    elif isinstance(payload, list):
        for item in payload:
            _walk(item, keys, values)
    elif isinstance(payload, str):
        values.append(payload)


def _assert_no_private_material(payload: Any) -> None:
    keys: List[str] = []
    values: List[str] = []
    _walk(payload, keys, values)
    leaked_keys = PRIVATE_KEYS.intersection(keys)
    assert not leaked_keys, f"private keys leaked: {sorted(leaked_keys)}"
    blob = json.dumps(payload)
    for uid in TOKENS.values():
        assert uid not in blob, f"uid {uid} leaked"
    for email in EMAILS.values():
        assert email not in blob
    assert "@" not in blob
    assert "Richmond, VA" not in blob


# --------------------------------------------------------------- default hidden


def test_participation_without_consent_field_defaults_to_hidden():
    """A Phase 3A document has no consent field, so it deserializes as hidden."""
    legacy = Participation.model_validate(
        {
            "uid": "user-a",
            "runId": ACTIVE_RUN_ID,
            "status": "checked_in",
            "joinedAt": NOW,
            "checkedInAt": NOW,
            "runTitle": "TEST DATA — Lunch pickup run",
            "placeId": PLACE_ID,
            "placeName": "TEST DATA — Richmond Rec Gym",
            "sport": "basketball",
            "startsAt": NOW,
            "isTestData": True,
        }
    )
    assert legacy.connectionVisibility == "hidden"
    assert legacy.candidateId is None


def test_new_check_in_starts_hidden_and_is_not_discoverable(monkeypatch):
    client, sports, _, _ = _app_client(monkeypatch)
    _check_in(client, "header.user-a.sig")
    _check_in(client, "header.user-b.sig")
    stored = sports.get_participation(ACTIVE_RUN_ID, "user-a")
    assert stored is not None
    assert stored.connectionVisibility == "hidden"
    assert stored.candidateId is None
    listing = _co_players(client, "header.user-a.sig")
    assert listing.status_code == 200, listing.text
    body = listing.json()
    assert body["myVisibility"] == "hidden"
    assert body["discoverable"] is False
    assert body["items"] == []


def test_hidden_athlete_cannot_see_a_visible_co_player(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    _check_in(client, "header.user-a.sig")
    _check_in(client, "header.user-b.sig")
    assert _set_visibility(client, "header.user-b.sig", "open_to_connect").status_code == 200
    hidden_view = _co_players(client, "header.user-a.sig").json()
    assert hidden_view["items"] == []
    assert hidden_view["discoverable"] is False


def test_visible_athlete_cannot_see_a_hidden_co_player(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    _check_in(client, "header.user-a.sig")
    _check_in(client, "header.user-b.sig")
    assert _set_visibility(client, "header.user-a.sig", "visible_to_run").status_code == 200
    view = _co_players(client, "header.user-a.sig").json()
    assert view["discoverable"] is True
    assert view["items"] == []


def test_visibility_can_be_revoked_back_to_hidden(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    assert candidates["b_candidate"]
    assert _set_visibility(client, "header.user-b.sig", "hidden").status_code == 200
    assert _co_players(client, "header.user-a.sig").json()["items"] == []
    reopened = _set_visibility(client, "header.user-b.sig", "open_to_connect")
    assert reopened.status_code == 200
    again = _co_players(client, "header.user-a.sig").json()["items"]
    assert len(again) == 1
    assert again[0]["candidateId"] == candidates["b_candidate"]


def test_consent_change_never_creates_a_connection(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    _open_pair(client)
    assert connections.list_connections_for_member("user-a") == []
    listed = client.get("/api/me/connections", headers=_auth()).json()
    assert listed == {"incoming": [], "outgoing": [], "accepted": []}


# ------------------------------------------------------------ mutual visibility


def test_mutual_visibility_reveals_only_safe_display_identity(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    _check_in(client, "header.user-a.sig")
    _check_in(client, "header.user-b.sig")
    assert _set_visibility(client, "header.user-a.sig", "visible_to_run").status_code == 200
    assert _set_visibility(client, "header.user-b.sig", "visible_to_run").status_code == 200
    a_body = _co_players(client, "header.user-a.sig").json()
    b_body = _co_players(client, "header.user-b.sig").json()
    assert [item["displayName"] for item in a_body["items"]] == ["Bode"]
    assert [item["displayName"] for item in b_body["items"]] == ["Ada"]
    entry = a_body["items"][0]
    assert entry["connectionState"] == "none"
    assert entry["canRequest"] is False, "visible_to_run must not permit a request"
    assert entry["runId"] == ACTIVE_RUN_ID
    assert entry["placeId"] == PLACE_ID
    assert set(entry) == {
        "candidateId",
        "displayName",
        "connectionState",
        "canRequest",
        "connectionId",
        "runId",
        "placeId",
        "placeName",
        "isTestData",
    }
    _assert_no_private_material(a_body)
    _assert_no_private_material(b_body)


def test_open_to_connect_permits_a_request(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    _open_pair(client)
    entry = _co_players(client, "header.user-a.sig").json()["items"][0]
    assert entry["canRequest"] is True


def test_athlete_without_a_profile_gets_a_safe_fallback_name(monkeypatch):
    client, _, _, athletes = _app_client(monkeypatch)
    athletes.profiles.pop("user-b")
    _open_pair(client)
    entry = _co_players(client, "header.user-a.sig").json()["items"][0]
    assert entry["displayName"] == "SportBeacon athlete"


# ------------------------------------------------------------------ eligibility


def test_going_participant_is_ineligible_for_connections(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    _check_in(client, "header.user-a.sig")
    assert _set_visibility(client, "header.user-a.sig", "open_to_connect").status_code == 200
    _join(client, "header.user-b.sig", UPCOMING_RUN_ID)
    denied = _set_visibility(client, "header.user-b.sig", "open_to_connect", UPCOMING_RUN_ID)
    assert denied.status_code == 403
    assert "verified check-in" in denied.json()["detail"]
    assert _co_players(client, "header.user-b.sig", UPCOMING_RUN_ID).status_code == 403


def test_going_participant_is_not_listed_to_a_checked_in_athlete(monkeypatch):
    client, sports, _, _ = _app_client(monkeypatch)
    _check_in(client, "header.user-a.sig")
    assert _set_visibility(client, "header.user-a.sig", "open_to_connect").status_code == 200
    _join(client, "header.user-b.sig", ACTIVE_RUN_ID)
    # Force a candidate id onto the going record to prove status, not data, gates it.
    going = sports.get_participation(ACTIVE_RUN_ID, "user-b")
    sports._participants[(ACTIVE_RUN_ID, "user-b")] = going.model_copy(
        update={"connectionVisibility": "open_to_connect", "candidateId": new_opaque_id()}
    )
    assert _co_players(client, "header.user-a.sig").json()["items"] == []


def test_completed_participation_is_eligible(monkeypatch):
    client, sports, _, _ = _app_client(monkeypatch)
    _check_in(client, "header.user-a.sig")
    _check_in(client, "header.user-b.sig")
    for uid in ("user-a", "user-b"):
        record = sports.get_participation(ACTIVE_RUN_ID, uid)
        sports._participants[(ACTIVE_RUN_ID, uid)] = record.model_copy(
            update={"status": "completed"}
        )
    assert _set_visibility(client, "header.user-a.sig", "open_to_connect").status_code == 200
    assert _set_visibility(client, "header.user-b.sig", "open_to_connect").status_code == 200
    assert len(_co_players(client, "header.user-a.sig").json()["items"]) == 1


def test_unrelated_run_participation_cannot_discover_or_connect(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    _check_in(client, "header.user-c.sig", SECOND_RUN_ID)
    assert _set_visibility(
        client, "header.user-c.sig", "open_to_connect", SECOND_RUN_ID
    ).status_code == 200
    assert _co_players(client, "header.user-c.sig", ACTIVE_RUN_ID).status_code == 403
    stolen = _request(client, "header.user-c.sig", candidates["b_candidate"], ACTIVE_RUN_ID)
    assert stolen.status_code == 403
    assert _co_players(client, "header.user-c.sig", SECOND_RUN_ID).json()["items"] == []


def test_unknown_run_is_not_found(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    missing = "missing-run-id-xx"
    assert _co_players(client, "header.user-a.sig", missing).status_code == 404
    assert _set_visibility(client, "header.user-a.sig", "hidden", missing).status_code == 404


# --------------------------------------------------------------- authentication


def test_missing_token_is_rejected_on_every_connection_route(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    connection_id = new_opaque_id()
    calls = [
        ("put", f"/api/runs/{ACTIVE_RUN_ID}/me/connection-consent", {"visibility": "hidden"}),
        ("get", f"/api/runs/{ACTIVE_RUN_ID}/co-players", None),
        ("post", f"/api/runs/{ACTIVE_RUN_ID}/connection-requests", {"candidateId": new_opaque_id()}),
        ("get", "/api/me/connections", None),
        ("post", f"/api/me/connections/{connection_id}/accept", None),
        ("post", f"/api/me/connections/{connection_id}/decline", None),
        ("post", f"/api/me/connections/{connection_id}/remove", None),
        ("post", f"/api/me/connections/{connection_id}/block", None),
        ("post", "/api/me/safety-reports", {"connectionId": connection_id, "reasonCode": "other"}),
    ]
    for method, path, body in calls:
        response = getattr(client, method)(path, json=body) if body else getattr(client, method)(path)
        assert response.status_code == 401, f"{method.upper()} {path} -> {response.status_code}"
        assert response.headers.get("www-authenticate", "").lower().startswith("bearer")


@pytest.mark.parametrize("token", ["not-a-jwt", "invalid.token.sig", ""])
def test_malformed_and_invalid_tokens_are_rejected(monkeypatch, token):
    client, _, _, _ = _app_client(monkeypatch)
    response = client.get(
        f"/api/runs/{ACTIVE_RUN_ID}/co-players", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401


def test_identity_fields_in_a_transition_body_are_rejected(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    created = _request(client, "header.user-a.sig", candidates["b_candidate"])
    connection_id = created.json()["connectionId"]
    spoofed = client.post(
        f"/api/me/connections/{connection_id}/accept",
        headers=_auth("header.user-b.sig"),
        json={"uid": "user-a"},
    )
    assert spoofed.status_code == 400
    consent_spoof = client.put(
        f"/api/runs/{ACTIVE_RUN_ID}/me/connection-consent",
        headers=_auth("header.user-a.sig"),
        json={"visibility": "hidden", "uid": "user-b"},
    )
    assert consent_spoof.status_code == 422


# ---------------------------------------------------------------- candidate ids


def test_candidate_ids_are_opaque_and_do_not_reveal_uids(monkeypatch):
    client, sports, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    b_candidate = candidates["b_candidate"]
    assert OPAQUE_ID.fullmatch(b_candidate)
    assert "user-b" not in b_candidate
    stored = sports.get_participation(ACTIVE_RUN_ID, "user-b")
    assert stored.candidateId == b_candidate
    _check_in(client, "header.user-b.sig", SECOND_RUN_ID)
    assert _set_visibility(
        client, "header.user-b.sig", "open_to_connect", SECOND_RUN_ID
    ).status_code == 200
    second = sports.get_participation(SECOND_RUN_ID, "user-b")
    assert second.candidateId != b_candidate, "candidate ids must be per-run, not per-athlete"


def test_candidate_id_is_stable_across_visibility_changes(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    first = candidates["b_candidate"]
    assert _set_visibility(client, "header.user-b.sig", "visible_to_run").status_code == 200
    assert _co_players(client, "header.user-a.sig").json()["items"][0]["candidateId"] == first


def test_pair_key_is_canonical_and_one_way():
    forward = canonical_pair_key("user-a", "user-b")
    reversed_order = canonical_pair_key("user-b", "user-a")
    assert forward == reversed_order
    assert re.fullmatch(r"[a-f0-9]{64}", forward)
    assert "user-a" not in forward and "user-b" not in forward
    assert forward != canonical_pair_key("user-a", "user-c")


# ------------------------------------------------------------- request creation


def test_self_request_is_rejected(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    response = _request(client, "header.user-a.sig", candidates["a_candidate"])
    assert response.status_code == 400
    assert "yourself" in response.json()["detail"]


def test_request_to_visible_only_target_is_refused(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    assert _set_visibility(client, "header.user-b.sig", "visible_to_run").status_code == 200
    response = _request(client, "header.user-a.sig", candidates["b_candidate"])
    assert response.status_code == 403
    assert response.json()["detail"] == "That athlete is not available to connect from this run"


def test_request_from_hidden_caller_is_refused(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    assert _set_visibility(client, "header.user-a.sig", "hidden").status_code == 200
    response = _request(client, "header.user-a.sig", candidates["b_candidate"])
    assert response.status_code == 403
    assert "run visibility" in response.json()["detail"]


def test_unknown_candidate_id_returns_the_same_generic_message(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    _open_pair(client)
    response = _request(client, "header.user-a.sig", new_opaque_id())
    assert response.status_code == 404
    assert response.json()["detail"] == "That athlete is not available to connect from this run"


def test_request_creates_one_pending_relationship(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    created = _request(client, "header.user-a.sig", candidates["b_candidate"])
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["status"] == "pending"
    assert body["direction"] == "outgoing"
    assert body["displayName"] == "Bode"
    assert body["runId"] == ACTIVE_RUN_ID
    assert body["placeId"] == PLACE_ID
    assert OPAQUE_ID.fullmatch(body["connectionId"])
    _assert_no_private_material(body)
    stored = connections.list_connections_for_member("user-a")
    assert len(stored) == 1
    assert stored[0].members == ["user-a", "user-b"]
    assert stored[0].pairKey == canonical_pair_key("user-a", "user-b")


def test_duplicate_request_is_idempotent(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    first = _request(client, "header.user-a.sig", candidates["b_candidate"])
    second = _request(client, "header.user-a.sig", candidates["b_candidate"])
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["connectionId"] == second.json()["connectionId"]
    assert len(connections.list_connections_for_member("user-a")) == 1


def test_reversed_duplicate_request_is_idempotent(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    forward = _request(client, "header.user-a.sig", candidates["b_candidate"])
    reverse = _request(client, "header.user-b.sig", candidates["a_candidate"])
    assert forward.status_code == 200
    assert reverse.status_code == 200
    assert forward.json()["connectionId"] == reverse.json()["connectionId"]
    assert reverse.json()["direction"] == "incoming", "the original requester is preserved"
    assert len(connections.list_connections_for_member("user-b")) == 1


def test_concurrent_requests_cannot_create_two_relationships(monkeypatch):
    client, sports, connections, athletes = _app_client(monkeypatch)
    candidates = _open_pair(client)

    def _send(uid: str, candidate_id: str):
        service = AthleteConnectionService(
            sports, connections, athletes, clock=lambda: NOW
        )
        return service.request_connection(uid, ACTIVE_RUN_ID, candidate_id)

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [
            pool.submit(_send, "user-a", candidates["b_candidate"]),
            pool.submit(_send, "user-b", candidates["a_candidate"]),
        ]
        views = [future.result() for future in futures]
    assert views[0].connectionId == views[1].connectionId
    assert len(connections.list_connections_for_member("user-a")) == 1
    assert len(connections.list_connections_for_member("user-b")) == 1


def test_a_second_qualifying_run_does_not_duplicate_the_relationship(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    _request(client, "header.user-a.sig", candidates["b_candidate"])
    second = _open_pair(client, SECOND_RUN_ID)
    again = _request(client, "header.user-a.sig", second["b_candidate"], SECOND_RUN_ID)
    assert again.status_code == 200
    assert again.json()["runId"] == ACTIVE_RUN_ID, "the original qualifying run is retained"
    assert len(connections.list_connections_for_member("user-a")) == 1


# ------------------------------------------------------------------- lifecycle


def test_incoming_and_outgoing_requests_are_scoped_to_the_caller(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    _request(client, "header.user-a.sig", candidates["b_candidate"])
    requester = client.get("/api/me/connections", headers=_auth("header.user-a.sig")).json()
    recipient = client.get("/api/me/connections", headers=_auth("header.user-b.sig")).json()
    assert len(requester["outgoing"]) == 1
    assert requester["incoming"] == []
    assert requester["outgoing"][0]["displayName"] == "Bode"
    assert len(recipient["incoming"]) == 1
    assert recipient["outgoing"] == []
    assert recipient["incoming"][0]["displayName"] == "Ada"
    outsider = client.get("/api/me/connections", headers=_auth("header.user-c.sig")).json()
    assert outsider == {"incoming": [], "outgoing": [], "accepted": []}
    _assert_no_private_material(requester)
    _assert_no_private_material(recipient)


def test_only_the_recipient_can_accept(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    requester = client.post(
        f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-a.sig")
    )
    assert requester.status_code == 403
    outsider = client.post(
        f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-c.sig")
    )
    assert outsider.status_code == 404, "a non-member cannot even learn the id exists"
    accepted = client.post(
        f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig")
    )
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["status"] == "accepted"
    assert accepted.json()["direction"] == "mutual"
    assert accepted.json()["acceptedAt"] is not None


def test_accepting_twice_is_safe(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    first = client.post(
        f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig")
    )
    second = client.post(
        f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig")
    )
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["acceptedAt"] == second.json()["acceptedAt"]
    assert len(connections.list_connections_for_member("user-a")) == 1


def test_both_athletes_see_the_accepted_connection(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    client.post(f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig"))
    for token, expected in (("header.user-a.sig", "Bode"), ("header.user-b.sig", "Ada")):
        body = client.get("/api/me/connections", headers=_auth(token)).json()
        assert len(body["accepted"]) == 1
        assert body["accepted"][0]["displayName"] == expected
        assert body["incoming"] == [] and body["outgoing"] == []
    listing = _co_players(client, "header.user-a.sig").json()["items"][0]
    assert listing["connectionState"] == "accepted"
    assert listing["canRequest"] is False


def test_only_the_recipient_can_decline_and_the_same_run_cannot_retry(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    assert (
        client.post(
            f"/api/me/connections/{connection_id}/decline", headers=_auth("header.user-a.sig")
        ).status_code
        == 403
    )
    declined = client.post(
        f"/api/me/connections/{connection_id}/decline", headers=_auth("header.user-b.sig")
    )
    assert declined.status_code == 200
    assert declined.json()["status"] == "declined"
    again = client.post(
        f"/api/me/connections/{connection_id}/decline", headers=_auth("header.user-b.sig")
    )
    assert again.status_code == 200, "declining twice is safe"
    assert (
        client.post(
            f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig")
        ).status_code
        == 409
    )
    both = client.get("/api/me/connections", headers=_auth("header.user-a.sig")).json()
    assert both == {"incoming": [], "outgoing": [], "accepted": []}
    entry = _co_players(client, "header.user-a.sig").json()["items"][0]
    assert entry["connectionState"] == "declined"
    assert entry["canRequest"] is False


def test_either_athlete_can_remove_an_accepted_connection(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    client.post(f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig"))
    removed = client.post(
        f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig")
    )
    assert removed.status_code == 200
    assert removed.json()["status"] == "removed"
    for token in ("header.user-a.sig", "header.user-b.sig"):
        body = client.get("/api/me/connections", headers=_auth(token)).json()
        assert body == {"incoming": [], "outgoing": [], "accepted": []}
    again = client.post(
        f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-b.sig")
    )
    assert again.status_code == 200, "removing twice is safe"


def test_remove_requires_an_accepted_connection(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    response = client.post(
        f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig")
    )
    assert response.status_code == 409


# ---------------------------------------------------------------------- blocking


def test_block_supersedes_a_pending_request(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    blocked = client.post(
        f"/api/me/connections/{connection_id}/block", headers=_auth("header.user-b.sig")
    )
    assert blocked.status_code == 200
    assert blocked.json()["status"] == "blocked"
    record = connections.get_connection(canonical_pair_key("user-a", "user-b"))
    assert record.status == "blocked"
    assert record.blockedBy == "user-b"
    assert record.blockedAt is not None
    assert (
        client.post(
            f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig")
        ).status_code
        == 409
    )


def test_block_supersedes_an_accepted_connection(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    client.post(f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig"))
    blocked = client.post(
        f"/api/me/connections/{connection_id}/block", headers=_auth("header.user-a.sig")
    )
    assert blocked.status_code == 200
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).status == "blocked"
    for token in ("header.user-a.sig", "header.user-b.sig"):
        assert client.get("/api/me/connections", headers=_auth(token)).json() == {
            "incoming": [],
            "outgoing": [],
            "accepted": [],
        }


def test_blocked_pair_is_invisible_to_each_other(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    client.post(f"/api/me/connections/{connection_id}/block", headers=_auth("header.user-b.sig"))
    assert _co_players(client, "header.user-a.sig").json()["items"] == []
    assert _co_players(client, "header.user-b.sig").json()["items"] == []


def test_blocked_relationship_cannot_be_recreated_through_another_run(monkeypatch):
    client, sports, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    client.post(f"/api/me/connections/{connection_id}/block", headers=_auth("header.user-b.sig"))
    _open_both_on_run(client, SECOND_RUN_ID)
    second_candidate = _candidate_id(sports, SECOND_RUN_ID, "user-b")
    assert _co_players(client, "header.user-a.sig", SECOND_RUN_ID).json()["items"] == []
    retry = _request(client, "header.user-a.sig", second_candidate, SECOND_RUN_ID)
    assert retry.status_code == 403
    assert retry.json()["detail"] == "That athlete is not available to connect from this run"
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).status == "blocked"
    assert len(connections.list_connections_for_member("user-a")) == 1


def test_blocking_twice_is_safe_and_no_unblock_route_exists(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    first = client.post(
        f"/api/me/connections/{connection_id}/block", headers=_auth("header.user-b.sig")
    )
    second = client.post(
        f"/api/me/connections/{connection_id}/block", headers=_auth("header.user-b.sig")
    )
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["updatedAt"] == second.json()["updatedAt"]
    for path in ("unblock", "un-block"):
        response = client.post(
            f"/api/me/connections/{connection_id}/{path}", headers=_auth("header.user-b.sig")
        )
        assert response.status_code == 404


# ------------------------------------------------ reconnection after later play


def _connect_and_accept(client: TestClient, run_id: str = ACTIVE_RUN_ID) -> str:
    """The accepted state the two-account checklist reaches before a removal."""
    candidates = _open_pair(client, run_id)
    connection_id = _request(
        client, "header.user-a.sig", candidates["b_candidate"], run_id
    ).json()["connectionId"]
    accepted = client.post(
        f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig")
    )
    assert accepted.status_code == 200, accepted.text
    return connection_id


def _seed_participation_without_check_in(
    sports: InMemorySportsLoopRepository, run_id: str, uid: str
) -> None:
    """A completed record carrying no server check-in stamp.

    Eligible to be seen, but no proof of *when* the athlete played, so it can
    never satisfy the later-shared-play gate.
    """
    run = sports.get_run(run_id)
    place = sports.get_place(run.placeId)
    sports.commit_join(
        Participation(
            uid=uid,
            runId=run_id,
            status="completed",
            joinedAt=run.startsAt,
            checkedInAt=None,
            runTitle=run.title,
            placeId=place.id,
            placeName=place.name,
            sport=run.sport,
            startsAt=run.startsAt,
            isTestData=True,
        )
    )


def test_removed_connection_cannot_reopen_on_the_same_run(monkeypatch):
    client, sports, connections, _ = _app_client(monkeypatch)
    connection_id = _connect_and_accept(client)
    _clock(client).advance(minutes=1)
    removed = client.post(
        f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig")
    )
    assert removed.json()["status"] == "removed"
    entry = _co_players(client, "header.user-a.sig").json()["items"][0]
    assert entry["connectionState"] == "removed"
    assert entry["canRequest"] is False, "the run they already used cannot reopen it"
    retry = _request(client, "header.user-a.sig", _candidate_id(sports, ACTIVE_RUN_ID, "user-b"))
    assert retry.status_code == 403
    assert retry.json()["detail"] == "That athlete is not available to connect from this run"
    record = connections.get_connection(canonical_pair_key("user-a", "user-b"))
    assert record.status == "removed"
    assert record.requestCycle == 1


def test_declined_request_cannot_reopen_on_the_same_run(monkeypatch):
    client, sports, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    _clock(client).advance(minutes=1)
    client.post(f"/api/me/connections/{connection_id}/decline", headers=_auth("header.user-b.sig"))
    assert _co_players(client, "header.user-a.sig").json()["items"][0]["canRequest"] is False
    retry = _request(client, "header.user-a.sig", _candidate_id(sports, ACTIVE_RUN_ID, "user-b"))
    assert retry.status_code == 403
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).requestCycle == 1


def test_a_run_played_before_the_ending_cannot_reopen_a_relationship(monkeypatch):
    """A different run is not enough: it has to be a run they played *afterwards*."""
    client, sports, connections, _ = _app_client(monkeypatch)
    _open_both_on_run(client, SECOND_RUN_ID)
    connection_id = _connect_and_accept(client)
    _clock(client).advance(minutes=5)
    client.post(f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig"))
    older = _co_players(client, "header.user-a.sig", SECOND_RUN_ID).json()["items"][0]
    assert older["canRequest"] is False
    retry = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, SECOND_RUN_ID, "user-b"),
        SECOND_RUN_ID,
    )
    assert retry.status_code == 403
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).status == "removed"


def test_removed_connection_reopens_after_a_later_verified_shared_run(monkeypatch):
    client, sports, connections, _ = _app_client(monkeypatch)
    connection_id = _connect_and_accept(client)
    pair_key = canonical_pair_key("user-a", "user-b")
    original = connections.get_connection(pair_key)
    _clock(client).advance(minutes=1)
    client.post(f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig"))
    removed_at = connections.get_connection(pair_key).removedAt

    _clock(client).advance(minutes=10)
    _open_both_on_run(client, SECOND_ACTIVE_RUN_ID)
    listing = _co_players(client, "header.user-a.sig", SECOND_ACTIVE_RUN_ID).json()["items"][0]
    assert listing["connectionState"] == "removed"
    assert listing["canRequest"] is True, "playing together again earns one new request"

    reopened = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
        SECOND_ACTIVE_RUN_ID,
    )
    assert reopened.status_code == 200, reopened.text
    body = reopened.json()
    assert body["status"] == "pending"
    assert body["direction"] == "outgoing"
    assert body["connectionId"] == connection_id, "the opaque client id survives a new cycle"
    assert body["runId"] == SECOND_ACTIVE_RUN_ID, "the new qualifying run is recorded"
    assert body["acceptedAt"] is None
    _assert_no_private_material(body)

    record = connections.get_connection(pair_key)
    assert record.status == "pending"
    assert record.requestCycle == 2
    assert record.lastRequestedAt == _clock(client).now
    assert record.previousStatus == "removed"
    assert record.previousStatusAt == removed_at
    assert record.removedAt is None and record.acceptedAt is None
    assert record.qualifyingRunId == SECOND_ACTIVE_RUN_ID
    assert record.qualifyingPlaceId == PLACE_ID
    assert record.pairKey == pair_key, "the pair document is reused, never recreated"
    assert record.connectionId == original.connectionId
    assert record.createdAt == original.createdAt
    assert len(connections.list_connections_for_member("user-a")) == 1

    accepted = client.post(
        f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig")
    )
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["status"] == "accepted"


def test_declined_request_reopens_with_the_reversed_requester(monkeypatch):
    """The athlete who declined may be the one who asks on the next cycle."""
    client, sports, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    _clock(client).advance(minutes=1)
    client.post(f"/api/me/connections/{connection_id}/decline", headers=_auth("header.user-b.sig"))

    _clock(client).advance(minutes=10)
    _open_both_on_run(client, SECOND_ACTIVE_RUN_ID)
    reopened = _request(
        client,
        "header.user-b.sig",
        _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-a"),
        SECOND_ACTIVE_RUN_ID,
    )
    assert reopened.status_code == 200, reopened.text
    assert reopened.json()["direction"] == "outgoing"
    assert reopened.json()["displayName"] == "Ada"
    assert reopened.json()["connectionId"] == connection_id

    record = connections.get_connection(canonical_pair_key("user-a", "user-b"))
    assert record.requesterUid == "user-b"
    assert record.recipientUid == "user-a"
    assert record.previousStatus == "declined"
    assert record.requestCycle == 2
    assert set(record.members) == {"user-a", "user-b"}

    lists_a = client.get("/api/me/connections", headers=_auth("header.user-a.sig")).json()
    assert len(lists_a["incoming"]) == 1 and lists_a["outgoing"] == []
    assert (
        client.post(
            f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-b.sig")
        ).status_code
        == 403
    ), "the athlete who asked this time cannot answer their own request"
    assert (
        client.post(
            f"/api/me/connections/{connection_id}/accept", headers=_auth("header.user-a.sig")
        ).status_code
        == 200
    )


def test_reopening_needs_a_server_check_in_stamp_on_both_sides(monkeypatch):
    client, sports, connections, _ = _app_client(monkeypatch)
    connection_id = _connect_and_accept(client)
    _clock(client).advance(minutes=1)
    client.post(f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig"))
    _clock(client).advance(minutes=10)

    for uid in ("user-a", "user-b"):
        _seed_participation_without_check_in(sports, THIRD_ACTIVE_RUN_ID, uid)
    for token in ("header.user-a.sig", "header.user-b.sig"):
        assert (
            _set_visibility(client, token, "open_to_connect", THIRD_ACTIVE_RUN_ID).status_code == 200
        )
    assert _co_players(client, "header.user-a.sig", THIRD_ACTIVE_RUN_ID).json()["items"][0][
        "canRequest"
    ] is False
    neither = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, THIRD_ACTIVE_RUN_ID, "user-b"),
        THIRD_ACTIVE_RUN_ID,
    )
    assert neither.status_code == 403

    # One real later check-in is still not enough: both athletes must prove it.
    _seed_participation_without_check_in(sports, SECOND_ACTIVE_RUN_ID, "user-b")
    _check_in(client, "header.user-a.sig", SECOND_ACTIVE_RUN_ID)
    for token in ("header.user-a.sig", "header.user-b.sig"):
        assert (
            _set_visibility(client, token, "open_to_connect", SECOND_ACTIVE_RUN_ID).status_code
            == 200
        )
    one_sided = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
        SECOND_ACTIVE_RUN_ID,
    )
    assert one_sided.status_code == 403
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).status == "removed"


def test_a_check_in_recorded_before_the_removal_never_becomes_later(monkeypatch):
    """Check-in is stamped once, so replaying it cannot manufacture new evidence."""
    client, sports, connections, _ = _app_client(monkeypatch)
    connection_id = _connect_and_accept(client)
    _clock(client).advance(minutes=1)
    _open_both_on_run(client, SECOND_ACTIVE_RUN_ID)
    stamped_at = sports.get_participation(SECOND_ACTIVE_RUN_ID, "user-a").checkedInAt
    # The connection ends in the same instant the pair checked into the later run.
    client.post(f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig"))
    same_instant = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
        SECOND_ACTIVE_RUN_ID,
    )
    assert same_instant.status_code == 403, "evidence has to be newer, not simultaneous"

    _clock(client).advance(minutes=5)
    _check_in(client, "header.user-a.sig", SECOND_ACTIVE_RUN_ID)
    _check_in(client, "header.user-b.sig", SECOND_ACTIVE_RUN_ID)
    assert sports.get_participation(SECOND_ACTIVE_RUN_ID, "user-a").checkedInAt == stamped_at
    assert (
        _request(
            client,
            "header.user-a.sig",
            _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
            SECOND_ACTIVE_RUN_ID,
        ).status_code
        == 403
    )

    _open_both_on_run(client, THIRD_ACTIVE_RUN_ID)
    genuinely_later = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, THIRD_ACTIVE_RUN_ID, "user-b"),
        THIRD_ACTIVE_RUN_ID,
    )
    assert genuinely_later.status_code == 200, genuinely_later.text
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).requestCycle == 2


def test_going_on_a_later_run_never_reopens_a_removed_connection(monkeypatch):
    client, sports, connections, _ = _app_client(monkeypatch)
    connection_id = _connect_and_accept(client)
    _clock(client).advance(minutes=1)
    client.post(f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig"))
    _clock(client).advance(minutes=10)
    _join(client, "header.user-a.sig", THIRD_ACTIVE_RUN_ID)
    _join(client, "header.user-b.sig", THIRD_ACTIVE_RUN_ID)
    assert (
        _set_visibility(
            client, "header.user-a.sig", "open_to_connect", THIRD_ACTIVE_RUN_ID
        ).status_code
        == 403
    )
    # Force consent onto both going records to prove status, not data shape, gates it.
    for uid in ("user-a", "user-b"):
        record = sports.get_participation(THIRD_ACTIVE_RUN_ID, uid)
        sports._participants[(THIRD_ACTIVE_RUN_ID, uid)] = record.model_copy(
            update={"connectionVisibility": "open_to_connect", "candidateId": new_opaque_id()}
        )
    forced = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, THIRD_ACTIVE_RUN_ID, "user-b"),
        THIRD_ACTIVE_RUN_ID,
    )
    assert forced.status_code == 403
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).status == "removed"


def test_reopening_still_requires_the_target_to_be_open_to_connect(monkeypatch):
    client, sports, connections, _ = _app_client(monkeypatch)
    connection_id = _connect_and_accept(client)
    _clock(client).advance(minutes=1)
    client.post(f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig"))
    _clock(client).advance(minutes=10)
    _check_in(client, "header.user-a.sig", SECOND_ACTIVE_RUN_ID)
    _check_in(client, "header.user-b.sig", SECOND_ACTIVE_RUN_ID)
    assert (
        _set_visibility(
            client, "header.user-a.sig", "open_to_connect", SECOND_ACTIVE_RUN_ID
        ).status_code
        == 200
    )
    assert (
        _set_visibility(
            client, "header.user-b.sig", "visible_to_run", SECOND_ACTIVE_RUN_ID
        ).status_code
        == 200
    )
    listed = _co_players(client, "header.user-a.sig", SECOND_ACTIVE_RUN_ID).json()["items"][0]
    assert listed["canRequest"] is False
    refused = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
        SECOND_ACTIVE_RUN_ID,
    )
    assert refused.status_code == 403
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).status == "removed"

    assert (
        _set_visibility(
            client, "header.user-b.sig", "open_to_connect", SECOND_ACTIVE_RUN_ID
        ).status_code
        == 200
    )
    allowed = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
        SECOND_ACTIVE_RUN_ID,
    )
    assert allowed.status_code == 200, allowed.text


def test_duplicate_and_concurrent_later_run_requests_stay_idempotent(monkeypatch):
    client, sports, connections, athletes = _app_client(monkeypatch)
    connection_id = _connect_and_accept(client)
    _clock(client).advance(minutes=1)
    client.post(f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig"))
    _clock(client).advance(minutes=10)
    _open_both_on_run(client, SECOND_ACTIVE_RUN_ID)

    def _send(uid: str, candidate_id: str):
        service = AthleteConnectionService(
            sports, connections, athletes, clock=_clock(client)
        )
        return service.request_connection(uid, SECOND_ACTIVE_RUN_ID, candidate_id)

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [
            pool.submit(_send, "user-a", _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b")),
            pool.submit(_send, "user-b", _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-a")),
        ]
        views = [future.result() for future in futures]
    assert views[0].connectionId == views[1].connectionId == connection_id
    record = connections.get_connection(canonical_pair_key("user-a", "user-b"))
    assert record.status == "pending"
    assert record.requestCycle == 2, "two reversed requests are one new cycle, not two"
    assert len(connections.list_connections_for_member("user-a")) == 1
    assert len(connections.list_connections_for_member("user-b")) == 1

    repeat = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
        SECOND_ACTIVE_RUN_ID,
    )
    assert repeat.status_code == 200
    assert repeat.json()["connectionId"] == connection_id
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).requestCycle == 2


def test_blocked_relationship_cannot_reopen_on_any_later_run(monkeypatch):
    client, sports, connections, _ = _app_client(monkeypatch)
    connection_id = _connect_and_accept(client)
    _clock(client).advance(minutes=1)
    blocked = client.post(
        f"/api/me/connections/{connection_id}/block", headers=_auth("header.user-b.sig")
    )
    assert blocked.json()["status"] == "blocked"
    for run_id in (SECOND_ACTIVE_RUN_ID, THIRD_ACTIVE_RUN_ID):
        _clock(client).advance(minutes=10)
        _open_both_on_run(client, run_id)
        assert _co_players(client, "header.user-a.sig", run_id).json()["items"] == []
        assert _co_players(client, "header.user-b.sig", run_id).json()["items"] == []
        for token, other in (("header.user-a.sig", "user-b"), ("header.user-b.sig", "user-a")):
            retry = _request(client, token, _candidate_id(sports, run_id, other), run_id)
            assert retry.status_code == 403
            assert (
                retry.json()["detail"] == "That athlete is not available to connect from this run"
            )
    record = connections.get_connection(canonical_pair_key("user-a", "user-b"))
    assert record.status == "blocked"
    assert record.requestCycle == 1
    assert record.previousStatus is None


def test_a_declined_relationship_can_still_be_blocked_before_it_reopens(monkeypatch):
    client, sports, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    _clock(client).advance(minutes=1)
    client.post(f"/api/me/connections/{connection_id}/decline", headers=_auth("header.user-b.sig"))
    blocked = client.post(
        f"/api/me/connections/{connection_id}/block", headers=_auth("header.user-b.sig")
    )
    assert blocked.status_code == 200
    assert blocked.json()["status"] == "blocked"
    _clock(client).advance(minutes=10)
    _open_both_on_run(client, SECOND_ACTIVE_RUN_ID)
    retry = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
        SECOND_ACTIVE_RUN_ID,
    )
    assert retry.status_code == 403
    assert connections.get_connection(canonical_pair_key("user-a", "user-b")).status == "blocked"


def test_documents_written_before_reconnection_existed_stay_compatible(monkeypatch):
    """A Phase 3B document has no cycle fields, so it loads as an untouched first cycle."""
    legacy = AthleteConnection.model_validate(
        {
            "pairKey": canonical_pair_key("user-a", "user-b"),
            "connectionId": new_opaque_id(),
            "members": sorted(["user-a", "user-b"]),
            "requesterUid": "user-a",
            "recipientUid": "user-b",
            "status": "removed",
            "qualifyingRunId": ACTIVE_RUN_ID,
            "qualifyingPlaceId": PLACE_ID,
            "createdAt": NOW,
            "updatedAt": NOW,
            "acceptedAt": NOW,
            "isTestData": True,
        }
    )
    assert legacy.requestCycle == 1
    assert legacy.lastRequestedAt is None
    assert legacy.previousStatus is None
    assert legacy.previousStatusAt is None
    assert legacy.removedAt is None, "the old document never recorded one"

    client, sports, connections, _ = _app_client(monkeypatch)
    connections.apply_connection_transition(legacy.pairKey, lambda _current: legacy)
    _clock(client).advance(minutes=10)
    _open_both_on_run(client, SECOND_ACTIVE_RUN_ID)
    reopened = _request(
        client,
        "header.user-a.sig",
        _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
        SECOND_ACTIVE_RUN_ID,
    )
    assert reopened.status_code == 200, reopened.text
    assert reopened.json()["connectionId"] == legacy.connectionId
    record = connections.get_connection(legacy.pairKey)
    assert record.requestCycle == 2
    assert record.previousStatus == "removed"
    # With no removedAt to measure against, updatedAt is the boundary that stood.
    assert record.previousStatusAt == legacy.updatedAt
    assert len(connections.list_connections_for_member("user-a")) == 1


def test_a_blocked_cycle_can_never_be_recorded_as_a_previous_state():
    with pytest.raises(ValueError):
        AthleteConnection(
            pairKey=canonical_pair_key("user-a", "user-b"),
            connectionId=new_opaque_id(),
            members=sorted(["user-a", "user-b"]),
            requesterUid="user-a",
            recipientUid="user-b",
            status="pending",
            qualifyingRunId=ACTIVE_RUN_ID,
            qualifyingPlaceId=PLACE_ID,
            createdAt=NOW,
            updatedAt=NOW,
            requestCycle=2,
            previousStatus="blocked",
        )


def test_a_reopened_cycle_leaks_no_private_material_or_audit_fields(monkeypatch, caplog):
    client, sports, connections, _ = _app_client(monkeypatch)
    connection_id = _connect_and_accept(client)
    with caplog.at_level(logging.DEBUG):
        _clock(client).advance(minutes=1)
        client.post(
            f"/api/me/connections/{connection_id}/remove", headers=_auth("header.user-a.sig")
        )
        _clock(client).advance(minutes=10)
        _open_both_on_run(client, SECOND_ACTIVE_RUN_ID)
        listing = _co_players(client, "header.user-a.sig", SECOND_ACTIVE_RUN_ID).json()
        reopened = _request(
            client,
            "header.user-a.sig",
            _candidate_id(sports, SECOND_ACTIVE_RUN_ID, "user-b"),
            SECOND_ACTIVE_RUN_ID,
        ).json()
        lists = client.get("/api/me/connections", headers=_auth("header.user-b.sig")).json()
    for payload in (listing, reopened, lists):
        _assert_no_private_material(payload)
        blob = json.dumps(payload)
        for audit_field in ("requestCycle", "lastRequestedAt", "previousStatus", "previousStatusAt"):
            assert audit_field not in blob, f"{audit_field} is server-only"
    record = connections.get_connection(canonical_pair_key("user-a", "user-b"))
    assert record.requestCycle == 2
    blob = " ".join(
        entry.getMessage() + " " + " ".join(str(value) for value in entry.__dict__.values())
        for entry in caplog.records
    )
    for forbidden in list(TOKENS.values()) + list(TOKENS) + list(EMAILS.values()):
        assert forbidden not in blob
    for name in DISPLAY_NAMES.values():
        assert name not in blob


# ------------------------------------------------------------------ safety path


def test_safety_report_by_connection_returns_only_a_receipt(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    connection_id = _request(client, "header.user-a.sig", candidates["b_candidate"]).json()[
        "connectionId"
    ]
    response = client.post(
        "/api/me/safety-reports",
        headers=_auth("header.user-b.sig"),
        json={
            "connectionId": connection_id,
            "reasonCode": "unwanted_contact",
            "details": "Kept asking after I said no.",
        },
    )
    assert response.status_code == 200, response.text
    assert response.json() == {"status": "received"}
    assert len(connections.safety_reports) == 1
    stored = connections.safety_reports[0]
    assert stored.reporterUid == "user-b"
    assert stored.subjectUid == "user-a"
    assert stored.runId == ACTIVE_RUN_ID
    assert stored.createdAt is not None


def test_safety_report_by_candidate_is_authorized_against_shared_play(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    ok = client.post(
        "/api/me/safety-reports",
        headers=_auth("header.user-a.sig"),
        json={
            "runId": ACTIVE_RUN_ID,
            "candidateId": candidates["b_candidate"],
            "reasonCode": "unsafe_behavior",
        },
    )
    assert ok.status_code == 200
    assert connections.safety_reports[0].subjectUid == "user-b"
    outsider = client.post(
        "/api/me/safety-reports",
        headers=_auth("header.user-c.sig"),
        json={
            "runId": ACTIVE_RUN_ID,
            "candidateId": candidates["b_candidate"],
            "reasonCode": "unsafe_behavior",
        },
    )
    assert outsider.status_code == 403
    assert len(connections.safety_reports) == 1


def test_safety_report_validation_rejects_bad_payloads(monkeypatch):
    client, _, connections, _ = _app_client(monkeypatch)
    candidates = _open_pair(client)
    bad_payloads = [
        {"reasonCode": "other"},
        {"reasonCode": "not-a-reason", "connectionId": new_opaque_id()},
        {"reasonCode": "other", "connectionId": new_opaque_id(), "runId": ACTIVE_RUN_ID},
        {"reasonCode": "other", "runId": ACTIVE_RUN_ID},
        {"reasonCode": "other", "candidateId": candidates["b_candidate"]},
        {"reasonCode": "other", "connectionId": "not-opaque"},
        {
            "reasonCode": "other",
            "runId": ACTIVE_RUN_ID,
            "candidateId": candidates["b_candidate"],
            "details": "x" * 501,
        },
    ]
    for payload in bad_payloads:
        response = client.post("/api/me/safety-reports", headers=_auth(), json=payload)
        assert response.status_code == 422, payload
    unknown = client.post(
        "/api/me/safety-reports",
        headers=_auth(),
        json={"connectionId": new_opaque_id(), "reasonCode": "other"},
    )
    assert unknown.status_code == 404
    assert connections.safety_reports == []


def test_reports_have_no_client_read_surface(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    for path in ("/api/me/safety-reports", "/api/me/safety-reports/all"):
        assert client.get(path, headers=_auth()).status_code in {404, 405}


def test_a_report_cannot_name_the_reporter_as_the_subject():
    with pytest.raises(ValueError):
        SafetyReportWrite(reasonCode="other")


# ------------------------------------------------------------------- log hygiene


def test_logs_never_contain_uids_emails_or_display_names(monkeypatch, caplog):
    client, _, _, _ = _app_client(monkeypatch)
    with caplog.at_level(logging.DEBUG):
        candidates = _open_pair(client)
        _join(client, "header.user-c.sig", UPCOMING_RUN_ID)
        _set_visibility(client, "header.user-c.sig", "open_to_connect", UPCOMING_RUN_ID)
        _request(client, "header.user-a.sig", new_opaque_id())
        _set_visibility(client, "header.user-b.sig", "visible_to_run")
        _request(client, "header.user-a.sig", candidates["b_candidate"])
        client.post(
            "/api/me/safety-reports",
            headers=_auth(),
            json={
                "runId": ACTIVE_RUN_ID,
                "candidateId": candidates["b_candidate"],
                "reasonCode": "harassment",
                "details": "sensitive free text",
            },
        )
    blob = " ".join(
        record.getMessage() + " " + " ".join(str(value) for value in record.__dict__.values())
        for record in caplog.records
    )
    assert blob.strip(), "expected the connection surface to log something"
    for forbidden in list(TOKENS.values()) + list(TOKENS) + list(EMAILS.values()):
        assert forbidden not in blob, f"{forbidden} appeared in logs"
    for name in DISPLAY_NAMES.values():
        assert name not in blob
    assert "sensitive free text" not in blob
    assert candidates["b_candidate"] not in blob


# ---------------------------------------------------------- environment gating


@pytest.mark.parametrize("connections_flag", [None, "false", "true"])
def test_production_hides_every_connection_route(monkeypatch, connections_flag):
    """Even with the Phase 2B/3A athlete surface open, production stays 404 here."""
    client = _gate_client(
        monkeypatch,
        {
            "APP_ENV": "production",
            "ENABLE_PRODUCT_ROUTES": "true",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_ATHLETE_CONNECTIONS": connections_flag,
            "CORS_ALLOW_ORIGINS": "https://sportbeacon-ai.vercel.app",
            "CORS_ALLOW_ORIGIN_REGEX": "^$",
        },
    )
    connection_id = new_opaque_id()
    assert client.get("/api/health").status_code == 200
    # Phase 2B/3A stays reachable and auth-gated; only Phase 3B is hidden.
    assert client.get("/api/me", headers=_auth()).status_code == 200
    # Unauthenticated probes separate "the gate refused" (404) from "auth applies" (401).
    expected = 401 if connections_flag == "true" else 404
    for path in (f"/api/runs/{ACTIVE_RUN_ID}/co-players", "/api/me/connections"):
        assert client.get(path).status_code == expected
    for path in (
        f"/api/runs/{ACTIVE_RUN_ID}/connection-requests",
        f"/api/me/connections/{connection_id}/accept",
        f"/api/me/connections/{connection_id}/block",
        "/api/me/safety-reports",
    ):
        assert client.post(path, json={}).status_code == expected
    if connections_flag != "true":
        preflight = client.options(
            f"/api/runs/{ACTIVE_RUN_ID}/co-players",
            headers={
                "Origin": "https://sportbeacon-ai.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert preflight.status_code == 404


def test_enabling_the_phase_3a_flag_alone_does_not_publish_connections(monkeypatch):
    """The Phase 3B surface requires its own explicit production authorization."""
    client = _gate_client(
        monkeypatch,
        {
            "APP_ENV": "staging",
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_ATHLETE_CONNECTIONS": None,
        },
    )
    assert client.get("/api/me").status_code == 401
    assert client.get("/api/runs").status_code == 401
    assert client.get(f"/api/runs/{ACTIVE_RUN_ID}/co-players").status_code == 404
    assert client.get("/api/me/connections").status_code == 404


@pytest.mark.parametrize("app_env", [None, "", "preview", "prod"])
def test_invalid_app_env_hides_connection_routes(monkeypatch, app_env):
    client = _gate_client(
        monkeypatch,
        {
            "APP_ENV": app_env,
            "ENABLE_PRODUCT_ROUTES": "true",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_ATHLETE_CONNECTIONS": "true",
        },
    )
    assert client.get("/api/health").status_code == 200
    assert client.get(f"/api/runs/{ACTIVE_RUN_ID}/co-players", headers=_auth()).status_code == 404
    assert client.get("/api/me/connections", headers=_auth()).status_code == 404


@pytest.mark.parametrize("connections_flag", ["false", "off", "0"])
def test_kill_switch_hides_only_the_connection_surface(monkeypatch, connections_flag):
    client, _, _, _ = _app_client(
        monkeypatch,
        extra={
            "APP_ENV": "staging",
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_ATHLETE_CONNECTIONS": connections_flag,
        },
    )
    assert client.get("/api/runs", headers=_auth()).status_code == 200
    assert client.get("/api/me/participation", headers=_auth()).status_code == 200
    assert client.get(f"/api/runs/{ACTIVE_RUN_ID}/co-players", headers=_auth()).status_code == 404
    assert client.get("/api/me/connections", headers=_auth()).status_code == 404
    assert client.post("/api/me/safety-reports", headers=_auth(), json={}).status_code == 404


def test_staging_allowlist_exposes_connections_and_still_hides_legacy(monkeypatch):
    client, _, _, _ = _app_client(
        monkeypatch,
        extra={
            "APP_ENV": "staging",
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_ATHLETE_CONNECTIONS": "true",
            "ENABLE_EXPERIMENTAL_ROUTES": "false",
            "ENABLE_API_DOCS": "false",
            "CORS_ALLOW_ORIGINS": "https://sportbeacon-ai.vercel.app",
        },
    )
    assert client.get(f"/api/runs/{ACTIVE_RUN_ID}/co-players").status_code == 401
    _check_in(client, "header.user-a.sig")
    assert _co_players(client, "header.user-a.sig").status_code == 200
    assert client.get("/api/me/connections", headers=_auth()).status_code == 200
    assert client.post("/api/drills/recommend", json={"user_id": "x"}).status_code == 404
    assert client.get("/docs").status_code == 404
    preflight = client.options(
        f"/api/runs/{ACTIVE_RUN_ID}/connection-requests",
        headers={
            "Origin": "https://sportbeacon-ai.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert preflight.status_code in {200, 204}
    assert (
        preflight.headers.get("access-control-allow-origin")
        == "https://sportbeacon-ai.vercel.app"
    )


def test_malformed_connection_ids_fail_closed(monkeypatch):
    client, _, _, _ = _app_client(
        monkeypatch,
        extra={
            "APP_ENV": "staging",
            "ENABLE_PRODUCT_ROUTES": "false",
            "ENABLE_AUTHENTICATED_PROFILE_ROUTES": "true",
            "ENABLE_ATHLETE_CONNECTIONS": "true",
        },
    )
    for bad in ("short", "../../etc/passwd", "A" * 32, new_opaque_id() + "0"):
        response = client.post(
            f"/api/me/connections/{bad}/accept", headers=_auth("header.user-a.sig")
        )
        assert response.status_code == 404, bad


# ------------------------------------------------------- environment isolation


class _RecordingDoc:
    def __init__(self, path: List[str]) -> None:
        self.path = path

    def collection(self, name: str) -> "_RecordingCollection":
        return _RecordingCollection(self.path + [name])

    def set(self, payload):  # pragma: no cover - path capture only
        _WRITES.append(("/".join(self.path), payload))


class _RecordingCollection:
    def __init__(self, path: List[str]) -> None:
        self.path = path

    def document(self, name: str) -> _RecordingDoc:
        return _RecordingDoc(self.path + [name])


class _RecordingClient:
    def collection(self, name: str) -> _RecordingCollection:
        return _RecordingCollection([name])


_WRITES: List[Any] = []


@pytest.mark.parametrize("app_env", ["test", "staging"])
def test_connection_documents_stay_under_the_environment_namespace(app_env):
    from backend.connection_repository import FirestoreConnectionRepository

    _WRITES.clear()
    repo = FirestoreConnectionRepository(client=_RecordingClient(), app_env=app_env)
    report = _sample_report()
    repo.add_safety_report(report)
    assert _WRITES
    path, _ = _WRITES[0]
    assert path == f"environments/{app_env}/safetyReports/{report.reportId}"
    assert "environments/production" not in path or app_env == "production"


def _sample_report():
    from backend.connection_models import SafetyReport

    return SafetyReport(
        reportId=new_opaque_id(),
        reporterUid="user-a",
        subjectUid="user-b",
        reasonCode="other",
        runId=ACTIVE_RUN_ID,
        placeId=PLACE_ID,
        createdAt=NOW,
        isTestData=True,
    )


def test_relationship_model_rejects_non_canonical_or_self_pairs():
    with pytest.raises(ValueError):
        AthleteConnection(
            pairKey=canonical_pair_key("user-a", "user-a"),
            connectionId=new_opaque_id(),
            members=["user-a", "user-a"],
            requesterUid="user-a",
            recipientUid="user-a",
            status="pending",
            qualifyingRunId=ACTIVE_RUN_ID,
            qualifyingPlaceId=PLACE_ID,
            createdAt=NOW,
            updatedAt=NOW,
        )
    with pytest.raises(ValueError):
        AthleteConnection(
            pairKey=canonical_pair_key("user-a", "user-c"),
            connectionId=new_opaque_id(),
            members=["user-a", "user-b"],
            requesterUid="user-a",
            recipientUid="user-b",
            status="pending",
            qualifyingRunId=ACTIVE_RUN_ID,
            qualifyingPlaceId=PLACE_ID,
            createdAt=NOW,
            updatedAt=NOW,
        )


def test_phase_3a_participation_surface_is_unchanged(monkeypatch):
    client, _, _, _ = _app_client(monkeypatch)
    _check_in(client, "header.user-a.sig")
    history = client.get("/api/me/participation", headers=_auth()).json()["items"]
    assert history[0]["status"] == "checked_in"
    assert "candidateId" not in history[0]
    assert "connectionVisibility" not in history[0]
    run_view = client.get(f"/api/runs/{ACTIVE_RUN_ID}", headers=_auth()).json()
    assert set(run_view["myParticipation"]) == {"status", "joinedAt", "checkedInAt"}
    _assert_no_private_material(run_view)
