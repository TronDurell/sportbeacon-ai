from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Callable, List, Optional, Tuple

from .athlete_repository import AthleteRepository
from .connection_models import (
    DEFAULT_CONNECTION_VISIBILITY,
    DISCOVERABLE_VISIBILITIES,
    ELIGIBLE_PARTICIPATION_STATUSES,
    REOPENABLE_STATUSES,
    SAFE_DISPLAY_NAME_FALLBACK,
    AthleteConnection,
    ConnectionConsentView,
    ConnectionDirection,
    ConnectionListResponse,
    ConnectionStatus,
    ConnectionView,
    ConnectionVisibility,
    CoPlayerConnectionState,
    CoPlayerListResponse,
    CoPlayerView,
    SafetyReport,
    SafetyReportReceipt,
    SafetyReportWrite,
    canonical_members,
    canonical_pair_key,
    new_opaque_id,
)
from .connection_repository import MAX_CONNECTIONS, ConnectionRepository
from .sports_loop_models import Participation, Place, Run
from .sports_loop_repository import SportsLoopRepository

logger = logging.getLogger("sportbeacon.connections")

Clock = Callable[[], datetime]
MAX_RUN_PARTICIPANTS = 200

# One shared message for every "this athlete is not reachable from this run" outcome
# so a caller can never probe whether an unrelated private athlete exists.
CANDIDATE_UNAVAILABLE = "That athlete is not available to connect from this run"
CONNECTION_NOT_FOUND = "Connection not found"
NEEDS_VERIFIED_PLAY = "Connecting requires a verified check-in for this run"
NEEDS_VISIBILITY = "Choose your run visibility before connecting with a co-player"
SELF_REQUEST_REJECTED = "You cannot send yourself a connection request"
RECIPIENT_ONLY = "Only the athlete who received this request can respond to it"
NOT_PENDING = "This request is no longer pending"
NOT_ACCEPTED = "This connection is not active"


class AthleteConnectionError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def participation_is_eligible(record: Optional[Participation]) -> bool:
    """Only a verified check-in or a completed run proves shared play."""
    return record is not None and record.status in ELIGIBLE_PARTICIPATION_STATUSES


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def terminal_boundary(record: AthleteConnection) -> datetime:
    """The instant the current declined/removed cycle ended.

    Falls back to ``updatedAt`` so a document written before the marker existed
    still gets a server timestamp to measure new shared play against, rather than
    an absent boundary that anything could clear.
    """
    marker = record.declinedAt if record.status == "declined" else record.removedAt
    return as_utc(marker or record.updatedAt)


def check_in_is_newer_than(record: Participation, boundary: datetime) -> bool:
    """Server-authoritative proof that this athlete played again after the boundary.

    ``checkedInAt`` is stamped from the server clock inside the check-in
    transaction and is never accepted from a request body, so a client cannot
    move it. A ``completed`` record carrying no check-in evidence proves nothing
    and does not qualify.
    """
    if record.checkedInAt is None:
        return False
    return as_utc(record.checkedInAt) > boundary


class AthleteConnectionService:
    def __init__(
        self,
        sports_repo: SportsLoopRepository,
        connection_repo: ConnectionRepository,
        athlete_repo: AthleteRepository,
        clock: Optional[Clock] = None,
        id_factory: Callable[[], str] = new_opaque_id,
    ) -> None:
        self._sports = sports_repo
        self._connections = connection_repo
        self._athletes = athlete_repo
        self._clock = clock or utc_now
        self._new_id = id_factory

    def _now(self) -> datetime:
        stamp = self._clock()
        if stamp.tzinfo is None or stamp.utcoffset() is None:
            return stamp.replace(tzinfo=timezone.utc)
        return stamp.astimezone(timezone.utc)

    # ------------------------------------------------------------------ consent

    def set_run_visibility(
        self, uid: str, run_id: str, visibility: ConnectionVisibility
    ) -> ConnectionConsentView:
        self._require_run(run_id)
        self._require_eligible_participation(uid, run_id)
        stored = self._sports.commit_connection_consent(
            uid, run_id, visibility, self._now(), self._new_id
        )
        if stored is None:
            raise AthleteConnectionError(403, NEEDS_VERIFIED_PLAY)
        return ConnectionConsentView(
            runId=run_id,
            visibility=stored.connectionVisibility,
            updatedAt=stored.connectionVisibilityUpdatedAt,
        )

    def get_run_visibility(self, uid: str, run_id: str) -> ConnectionConsentView:
        self._require_run(run_id)
        mine = self._sports.get_participation(run_id, uid)
        if mine is None:
            return ConnectionConsentView(runId=run_id, visibility=DEFAULT_CONNECTION_VISIBILITY)
        return ConnectionConsentView(
            runId=run_id,
            visibility=mine.connectionVisibility,
            updatedAt=mine.connectionVisibilityUpdatedAt,
        )

    # --------------------------------------------------------------- discovery

    def list_co_players(self, uid: str, run_id: str) -> CoPlayerListResponse:
        run, place = self._require_run(run_id)
        mine = self._require_eligible_participation(uid, run_id)
        discoverable = mine.connectionVisibility in DISCOVERABLE_VISIBILITIES
        response = CoPlayerListResponse(
            runId=run_id,
            myVisibility=mine.connectionVisibility,
            discoverable=discoverable,
            items=[],
            isTestData=run.isTestData or place.isTestData,
        )
        if not discoverable:
            # Visibility is mutual: a hidden athlete is not shown and does not see.
            return response
        for other in self._eligible_visible_co_participants(uid, run_id):
            relationship = self._connections.get_connection(canonical_pair_key(uid, other.uid))
            if relationship is not None and relationship.status == "blocked":
                continue
            state = _co_player_state(relationship, uid)
            response.items.append(
                CoPlayerView(
                    candidateId=other.candidateId or "",
                    displayName=self._safe_display_name(other.uid),
                    connectionState=state,
                    canRequest=(
                        other.connectionVisibility == "open_to_connect"
                        and (
                            relationship is None
                            or self._may_reopen(relationship, run_id, mine, other)
                        )
                    ),
                    connectionId=relationship.connectionId if relationship else None,
                    runId=run_id,
                    placeId=place.id,
                    placeName=place.name,
                    isTestData=other.isTestData,
                )
            )
        response.items.sort(key=lambda item: (item.displayName.lower(), item.candidateId))
        return response

    # ------------------------------------------------------------- lifecycle

    def request_connection(self, uid: str, run_id: str, candidate_id: str) -> ConnectionView:
        run, place = self._require_run(run_id)
        mine = self._require_eligible_participation(uid, run_id)
        if mine.connectionVisibility not in DISCOVERABLE_VISIBILITIES:
            raise AthleteConnectionError(403, NEEDS_VISIBILITY)
        if mine.candidateId is not None and mine.candidateId == candidate_id:
            raise AthleteConnectionError(400, SELF_REQUEST_REJECTED)
        target = self._resolve_candidate(uid, run_id, candidate_id)
        if target.connectionVisibility != "open_to_connect":
            logger.info("connection_request_rejected", extra={"run_id": run_id, "reason": "not_open"})
            raise AthleteConnectionError(403, CANDIDATE_UNAVAILABLE)
        pair_key = canonical_pair_key(uid, target.uid)
        now = self._now()
        is_test_data = run.isTestData or place.isTestData

        def _mutate(current: Optional[AthleteConnection]) -> Optional[AthleteConnection]:
            if current is None:
                return AthleteConnection(
                    pairKey=pair_key,
                    connectionId=self._new_id(),
                    members=canonical_members(uid, target.uid),
                    requesterUid=uid,
                    recipientUid=target.uid,
                    status="pending",
                    qualifyingRunId=run.id,
                    qualifyingPlaceId=place.id,
                    createdAt=now,
                    updatedAt=now,
                    requestCycle=1,
                    lastRequestedAt=now,
                    isTestData=is_test_data,
                )
            if current.status not in REOPENABLE_STATUSES:
                # Blocked stays blocked, and a live pending or accepted relationship
                # absorbs duplicate, reversed, and concurrent requests. All of them
                # converge on the single canonical document, so no second
                # relationship and no second pending cycle can appear.
                return None
            if not self._may_reopen(current, run.id, mine, target):
                # The previous cycle's run, an older run, or missing check-in
                # evidence never reopens a relationship.
                raise AthleteConnectionError(403, CANDIDATE_UNAVAILABLE)
            reopened = current.model_copy(
                update={
                    "status": "pending",
                    # Roles follow the athlete who asked this time, so a reversed
                    # reconnection is a genuine new request, not a revived old one.
                    "requesterUid": uid,
                    "recipientUid": target.uid,
                    "qualifyingRunId": run.id,
                    "qualifyingPlaceId": place.id,
                    "requestCycle": current.requestCycle + 1,
                    "lastRequestedAt": now,
                    "previousStatus": current.status,
                    "previousStatusAt": terminal_boundary(current),
                    # The new cycle carries no outcome yet.
                    "acceptedAt": None,
                    "declinedAt": None,
                    "removedAt": None,
                    "updatedAt": now,
                    "isTestData": current.isTestData or is_test_data,
                }
            )
            # Rewriting the roles must never break the pair identity they belong to.
            return AthleteConnection.model_validate(reopened.model_dump())

        stored = self._connections.apply_connection_transition(pair_key, _mutate)
        if stored is None:
            raise AthleteConnectionError(409, CANDIDATE_UNAVAILABLE)
        if stored.status == "blocked":
            # A blocked pair can never be revived, including through another run.
            logger.info("connection_request_rejected", extra={"run_id": run_id, "reason": "blocked"})
            raise AthleteConnectionError(403, CANDIDATE_UNAVAILABLE)
        return self._to_connection_view(stored, uid)

    def list_connections(self, uid: str) -> ConnectionListResponse:
        response = ConnectionListResponse()
        for record in self._connections.list_connections_for_member(uid, limit=MAX_CONNECTIONS):
            if record.status == "pending":
                view = self._to_connection_view(record, uid)
                if record.recipientUid == uid:
                    response.incoming.append(view)
                else:
                    response.outgoing.append(view)
            elif record.status == "accepted":
                response.accepted.append(self._to_connection_view(record, uid))
        return response

    def accept(self, uid: str, connection_id: str) -> ConnectionView:
        def _mutate(
            current: Optional[AthleteConnection], now: datetime
        ) -> Optional[AthleteConnection]:
            if current.status == "accepted" and current.recipientUid == uid:
                return None
            if current.recipientUid != uid:
                raise AthleteConnectionError(403, RECIPIENT_ONLY)
            if current.status != "pending":
                raise AthleteConnectionError(409, NOT_PENDING)
            return current.model_copy(
                update={"status": "accepted", "acceptedAt": now, "updatedAt": now}
            )

        return self._transition(uid, connection_id, _mutate)

    def decline(self, uid: str, connection_id: str) -> ConnectionView:
        def _mutate(
            current: Optional[AthleteConnection], now: datetime
        ) -> Optional[AthleteConnection]:
            if current.status == "declined" and current.recipientUid == uid:
                return None
            if current.recipientUid != uid:
                raise AthleteConnectionError(403, RECIPIENT_ONLY)
            if current.status != "pending":
                raise AthleteConnectionError(409, NOT_PENDING)
            return current.model_copy(
                update={"status": "declined", "declinedAt": now, "updatedAt": now}
            )

        return self._transition(uid, connection_id, _mutate)

    def remove(self, uid: str, connection_id: str) -> ConnectionView:
        def _mutate(
            current: Optional[AthleteConnection], now: datetime
        ) -> Optional[AthleteConnection]:
            if current.status == "removed":
                return None
            if current.status != "accepted":
                raise AthleteConnectionError(409, NOT_ACCEPTED)
            return current.model_copy(
                update={"status": "removed", "removedAt": now, "updatedAt": now}
            )

        return self._transition(uid, connection_id, _mutate)

    def block(self, uid: str, connection_id: str) -> ConnectionView:
        def _mutate(
            current: Optional[AthleteConnection], now: datetime
        ) -> Optional[AthleteConnection]:
            if current.status == "blocked":
                return None
            # Blocking supersedes pending and accepted state in one transition.
            return current.model_copy(
                update={
                    "status": "blocked",
                    "blockedAt": now,
                    "blockedBy": uid,
                    "updatedAt": now,
                }
            )

        return self._transition(uid, connection_id, _mutate)

    # ---------------------------------------------------------------- safety

    def submit_safety_report(self, uid: str, payload: SafetyReportWrite) -> SafetyReportReceipt:
        if payload.connectionId is not None:
            record = self._find_own_connection(uid, payload.connectionId)
            subject_uid = record.other_member(uid)
            run_id = record.qualifyingRunId
            place_id = record.qualifyingPlaceId
            pair_key: Optional[str] = record.pairKey
            is_test_data = record.isTestData
        else:
            run_id = payload.runId or ""
            run, place = self._require_run(run_id)
            self._require_eligible_participation(uid, run_id)
            target = self._resolve_candidate(uid, run_id, payload.candidateId or "")
            subject_uid = target.uid
            place_id = place.id
            pair_key = None
            is_test_data = run.isTestData or place.isTestData
        details = payload.details.strip() if payload.details else None
        report = SafetyReport(
            reportId=self._new_id(),
            reporterUid=uid,
            subjectUid=subject_uid,
            reasonCode=payload.reasonCode,
            details=details,
            connectionPairKey=pair_key,
            runId=run_id,
            placeId=place_id,
            createdAt=self._now(),
            isTestData=is_test_data,
        )
        self._connections.add_safety_report(report)
        logger.info("safety_report_received", extra={"run_id": run_id, "reason": payload.reasonCode})
        # The receipt never echoes report content back to any client.
        return SafetyReportReceipt()

    # --------------------------------------------------------------- internals

    def _transition(
        self,
        uid: str,
        connection_id: str,
        mutate: Callable[[AthleteConnection, datetime], Optional[AthleteConnection]],
    ) -> ConnectionView:
        record = self._find_own_connection(uid, connection_id)
        now = self._now()

        def _guarded(current: Optional[AthleteConnection]) -> Optional[AthleteConnection]:
            if current is None or not current.is_member(uid):
                raise AthleteConnectionError(404, CONNECTION_NOT_FOUND)
            return mutate(current, now)

        stored = self._connections.apply_connection_transition(record.pairKey, _guarded)
        if stored is None:
            raise AthleteConnectionError(404, CONNECTION_NOT_FOUND)
        return self._to_connection_view(stored, uid)

    def _find_own_connection(self, uid: str, connection_id: str) -> AthleteConnection:
        """Resolve an opaque id only inside the caller's own relationship set.

        A caller can therefore never name a relationship they are not a member of,
        and an unknown id is indistinguishable from someone else's relationship.
        """
        for record in self._connections.list_connections_for_member(uid, limit=MAX_CONNECTIONS):
            if record.connectionId == connection_id:
                return record
        raise AthleteConnectionError(404, CONNECTION_NOT_FOUND)

    def _require_run(self, run_id: str) -> Tuple[Run, Place]:
        run = self._sports.get_run(run_id)
        if run is None:
            raise AthleteConnectionError(404, "Run not found")
        place = self._sports.get_place(run.placeId)
        if place is None:
            logger.warning("connection_run_place_missing", extra={"run_id": run_id})
            raise AthleteConnectionError(404, "Run not found")
        return run, place

    def _require_eligible_participation(self, uid: str, run_id: str) -> Participation:
        mine = self._sports.get_participation(run_id, uid)
        if mine is None or not participation_is_eligible(mine):
            logger.info(
                "connection_participation_ineligible",
                extra={"run_id": run_id, "reason": mine.status if mine else "absent"},
            )
            raise AthleteConnectionError(403, NEEDS_VERIFIED_PLAY)
        return mine

    def _eligible_visible_co_participants(self, uid: str, run_id: str) -> List[Participation]:
        found: List[Participation] = []
        for record in self._sports.list_run_participants(run_id, limit=MAX_RUN_PARTICIPANTS):
            if record.uid == uid:
                continue
            if not participation_is_eligible(record):
                continue
            if record.connectionVisibility not in DISCOVERABLE_VISIBILITIES:
                continue
            if not record.candidateId:
                continue
            found.append(record)
        return found

    def _resolve_candidate(self, uid: str, run_id: str, candidate_id: str) -> Participation:
        for record in self._eligible_visible_co_participants(uid, run_id):
            if record.candidateId == candidate_id:
                if self._is_blocked_pair(uid, record.uid):
                    raise AthleteConnectionError(403, CANDIDATE_UNAVAILABLE)
                return record
        logger.info("connection_candidate_unresolved", extra={"run_id": run_id})
        raise AthleteConnectionError(404, CANDIDATE_UNAVAILABLE)

    def _may_reopen(
        self,
        record: AthleteConnection,
        run_id: str,
        mine: Participation,
        theirs: Participation,
    ) -> bool:
        """New verified shared play: a later run both athletes provably played again.

        Callers have already established mutual visibility, eligible participation,
        that the target chose ``open_to_connect``, and that neither athlete blocked
        the other. This adds the anti-harassment gate on top: a genuinely later run,
        proven by server-stamped check-in evidence on both sides.
        """
        if record.status not in REOPENABLE_STATUSES:
            return False
        if run_id == record.qualifyingRunId:
            # The run that produced the previous cycle can never reopen it.
            return False
        boundary = terminal_boundary(record)
        return check_in_is_newer_than(mine, boundary) and check_in_is_newer_than(theirs, boundary)

    def _is_blocked_pair(self, uid_a: str, uid_b: str) -> bool:
        record = self._connections.get_connection(canonical_pair_key(uid_a, uid_b))
        return record is not None and record.status == "blocked"

    def _safe_display_name(self, uid: str) -> str:
        """Project only the display name. No email, home area, or profile copy."""
        profile = self._athletes.get_profile(uid)
        if profile is None:
            return SAFE_DISPLAY_NAME_FALLBACK
        name = profile.displayName.strip()
        return name or SAFE_DISPLAY_NAME_FALLBACK

    def _to_connection_view(self, record: AthleteConnection, uid: str) -> ConnectionView:
        return ConnectionView(
            connectionId=record.connectionId,
            displayName=self._safe_display_name(record.other_member(uid)),
            status=record.status,
            direction=_direction(record.status, record.requesterUid == uid),
            runId=record.qualifyingRunId,
            placeId=record.qualifyingPlaceId,
            createdAt=record.createdAt,
            updatedAt=record.updatedAt,
            acceptedAt=record.acceptedAt,
            isTestData=record.isTestData,
        )


def _direction(status: ConnectionStatus, caller_is_requester: bool) -> ConnectionDirection:
    if status == "pending":
        return "outgoing" if caller_is_requester else "incoming"
    return "mutual"


def _co_player_state(
    relationship: Optional[AthleteConnection], uid: str
) -> CoPlayerConnectionState:
    if relationship is None:
        return "none"
    if relationship.status == "pending":
        return "pending_outgoing" if relationship.requesterUid == uid else "pending_incoming"
    if relationship.status == "accepted":
        return "accepted"
    if relationship.status == "declined":
        return "declined"
    return "removed"
