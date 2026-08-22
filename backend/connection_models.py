from __future__ import annotations

import hashlib
import secrets
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

ConnectionVisibility = Literal["hidden", "visible_to_run", "open_to_connect"]
ConnectionStatus = Literal["pending", "accepted", "declined", "removed", "blocked"]
CoPlayerConnectionState = Literal[
    "none",
    "pending_outgoing",
    "pending_incoming",
    "accepted",
    "declined",
    "removed",
]
ConnectionDirection = Literal["incoming", "outgoing", "mutual"]
SafetyReasonCode = Literal[
    "harassment",
    "unsafe_behavior",
    "impersonation",
    "unwanted_contact",
    "other",
]

DEFAULT_CONNECTION_VISIBILITY: ConnectionVisibility = "hidden"
DISCOVERABLE_VISIBILITIES = frozenset({"visible_to_run", "open_to_connect"})
ELIGIBLE_PARTICIPATION_STATUSES = frozenset({"checked_in", "completed"})
# Only these two states can start a new request cycle, and only on later verified
# shared play. "blocked" is permanently terminal in this phase.
REOPENABLE_STATUSES = frozenset({"declined", "removed"})
OPAQUE_ID_PATTERN = r"^[a-f0-9]{32}$"
PAIR_KEY_PATTERN = r"^[a-f0-9]{64}$"
SAFE_DISPLAY_NAME_FALLBACK = "SportBeacon athlete"
# Domain separator so a pair key cannot collide with any other digest this app stores.
_PAIR_KEY_DOMAIN = "sportbeacon:athlete-connection:v1"


def new_opaque_id() -> str:
    """Random server-created identifier. Never derived from a UID, email, or profile."""
    return secrets.token_hex(16)


def canonical_pair_key(uid_a: str, uid_b: str) -> str:
    """One-way canonical identity for an unordered athlete pair.

    Deterministic so relationship creation is a single-document transaction, and
    one-way so the value can never be turned back into member UIDs.
    """
    first, second = sorted([uid_a, uid_b])
    digest = hashlib.sha256(f"{_PAIR_KEY_DOMAIN}:{first}\x00{second}".encode("utf-8"))
    return digest.hexdigest()


def canonical_members(uid_a: str, uid_b: str) -> List[str]:
    return sorted([uid_a, uid_b])


class AthleteConnection(BaseModel):
    """Server-only relationship record. Member UIDs never reach a client."""

    model_config = ConfigDict(extra="forbid")

    pairKey: str = Field(pattern=PAIR_KEY_PATTERN)
    connectionId: str = Field(pattern=OPAQUE_ID_PATTERN)
    members: List[str] = Field(min_length=2, max_length=2)
    requesterUid: str = Field(min_length=1, max_length=128)
    recipientUid: str = Field(min_length=1, max_length=128)
    status: ConnectionStatus
    qualifyingRunId: str = Field(min_length=8, max_length=80)
    qualifyingPlaceId: str = Field(min_length=8, max_length=80)
    createdAt: datetime
    updatedAt: datetime
    acceptedAt: Optional[datetime] = None
    declinedAt: Optional[datetime] = None
    removedAt: Optional[datetime] = None
    blockedAt: Optional[datetime] = None
    blockedBy: Optional[str] = None
    # Request-cycle audit. A Phase 3B document written before reconnection existed
    # has none of these, so it deserializes as a first cycle with no prior state.
    requestCycle: int = Field(default=1, ge=1)
    lastRequestedAt: Optional[datetime] = None
    previousStatus: Optional[ConnectionStatus] = None
    previousStatusAt: Optional[datetime] = None
    isTestData: bool = False

    @field_validator("members")
    @classmethod
    def _sorted_distinct_members(cls, value: List[str]) -> List[str]:
        cleaned = [item.strip() for item in value]
        if any(not item for item in cleaned):
            raise ValueError("members must be non-empty uids")
        if cleaned[0] == cleaned[1]:
            raise ValueError("members must be two distinct athletes")
        if cleaned != sorted(cleaned):
            raise ValueError("members must be stored in canonical order")
        return cleaned

    @model_validator(mode="after")
    def _members_match_roles(self) -> "AthleteConnection":
        if set(self.members) != {self.requesterUid, self.recipientUid}:
            raise ValueError("members must match the requester and recipient")
        if self.pairKey != canonical_pair_key(self.requesterUid, self.recipientUid):
            raise ValueError("pairKey must be canonical for the member pair")
        if self.blockedBy is not None and self.blockedBy not in self.members:
            raise ValueError("blockedBy must be a member")
        if self.previousStatus is not None and self.previousStatus not in REOPENABLE_STATUSES:
            raise ValueError("only a declined or removed cycle can precede a new request")
        return self

    def other_member(self, uid: str) -> str:
        first, second = self.members
        return second if uid == first else first

    def is_member(self, uid: str) -> bool:
        return uid in self.members


class SafetyReport(BaseModel):
    """Server-only record. Never returned to any client."""

    model_config = ConfigDict(extra="forbid")

    reportId: str = Field(pattern=OPAQUE_ID_PATTERN)
    reporterUid: str = Field(min_length=1, max_length=128)
    subjectUid: str = Field(min_length=1, max_length=128)
    reasonCode: SafetyReasonCode
    details: Optional[str] = Field(default=None, max_length=500)
    connectionPairKey: Optional[str] = Field(default=None, pattern=PAIR_KEY_PATTERN)
    runId: str = Field(min_length=8, max_length=80)
    placeId: str = Field(min_length=8, max_length=80)
    createdAt: datetime
    isTestData: bool = False

    @model_validator(mode="after")
    def _distinct_parties(self) -> "SafetyReport":
        if self.reporterUid == self.subjectUid:
            raise ValueError("A report cannot name the reporter as the subject")
        return self


class ConnectionConsentWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    visibility: ConnectionVisibility


class ConnectionConsentView(BaseModel):
    runId: str
    visibility: ConnectionVisibility
    updatedAt: Optional[datetime] = None


class ConnectionRequestWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    candidateId: str = Field(pattern=OPAQUE_ID_PATTERN)


class CoPlayerView(BaseModel):
    """Minimum safe projection of another athlete on a shared run."""

    candidateId: str
    displayName: str
    connectionState: CoPlayerConnectionState
    canRequest: bool
    connectionId: Optional[str] = None
    runId: str
    placeId: str
    placeName: str
    isTestData: bool = False


class CoPlayerListResponse(BaseModel):
    runId: str
    myVisibility: ConnectionVisibility
    discoverable: bool
    items: List[CoPlayerView]
    isTestData: bool = False


class ConnectionView(BaseModel):
    connectionId: str
    displayName: str
    status: ConnectionStatus
    direction: ConnectionDirection
    runId: str
    placeId: str
    createdAt: datetime
    updatedAt: datetime
    acceptedAt: Optional[datetime] = None
    isTestData: bool = False


class ConnectionListResponse(BaseModel):
    incoming: List[ConnectionView] = Field(default_factory=list)
    outgoing: List[ConnectionView] = Field(default_factory=list)
    accepted: List[ConnectionView] = Field(default_factory=list)


class SafetyReportWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reasonCode: SafetyReasonCode
    details: Optional[str] = Field(default=None, max_length=500)
    connectionId: Optional[str] = Field(default=None, pattern=OPAQUE_ID_PATTERN)
    runId: Optional[str] = Field(default=None, min_length=8, max_length=80)
    candidateId: Optional[str] = Field(default=None, pattern=OPAQUE_ID_PATTERN)

    @model_validator(mode="after")
    def _exactly_one_subject_reference(self) -> "SafetyReportWrite":
        by_connection = self.connectionId is not None
        by_candidate = self.runId is not None and self.candidateId is not None
        if by_connection and (self.runId is not None or self.candidateId is not None):
            raise ValueError("Provide either connectionId or runId with candidateId")
        if not by_connection and not by_candidate:
            raise ValueError("Provide either connectionId or runId with candidateId")
        if self.details is not None and not self.details.strip():
            raise ValueError("details cannot be blank")
        return self


class SafetyReportReceipt(BaseModel):
    status: Literal["received"] = "received"
