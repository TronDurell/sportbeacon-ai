from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, Protocol

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .athlete_models import CANONICAL_SPORTS, FORBIDDEN_IDENTITY_FIELDS
from .connection_models import (
    DEFAULT_CONNECTION_VISIBILITY,
    OPAQUE_ID_PATTERN,
    ConnectionVisibility,
)

RunStoredStatus = Literal["scheduled", "cancelled"]
RunComputedStatus = Literal["upcoming", "active", "completed", "cancelled"]
ParticipationStatus = Literal["going", "checked_in", "completed", "withdrawn"]
RunVisibility = Literal["authenticated"]


class ExternalProviderRef(BaseModel):
    """Optional adapter pointer. Never required on canonical Place or Run documents."""

    model_config = ConfigDict(extra="forbid")

    provider: str = Field(min_length=1, max_length=40)
    externalId: str = Field(min_length=1, max_length=120)
    sourceMetadata: Dict[str, str] = Field(default_factory=dict)


class Place(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=8, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    city: str = Field(min_length=1, max_length=80)
    region: str = Field(min_length=1, max_length=80)
    country: str = Field(min_length=2, max_length=80)
    sportCapabilities: List[str] = Field(min_length=1, max_length=8)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    entranceNotes: Optional[str] = Field(default=None, max_length=280)
    isTestData: bool = False
    externalRefs: List[ExternalProviderRef] = Field(default_factory=list, max_length=8)
    createdAt: datetime
    updatedAt: datetime

    @field_validator("sportCapabilities")
    @classmethod
    def _canonical_sports(cls, value: List[str]) -> List[str]:
        sports: List[str] = []
        for item in value:
            sport = item.strip().lower()
            if sport not in CANONICAL_SPORTS:
                raise ValueError("Unsupported sport")
            if sport not in sports:
                sports.append(sport)
        if not sports:
            raise ValueError("sportCapabilities is required")
        return sports

    @field_validator("id")
    @classmethod
    def _id_shape(cls, value: str) -> str:
        return _require_resource_id(value)


class Run(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=8, max_length=80)
    sport: str
    placeId: str = Field(min_length=8, max_length=80)
    title: str = Field(min_length=1, max_length=160)
    startsAt: datetime
    endsAt: datetime
    status: RunStoredStatus = "scheduled"
    createdBy: str = Field(min_length=1, max_length=80)
    capacity: Optional[int] = Field(default=None, ge=2, le=200)
    visibility: RunVisibility = "authenticated"
    isTestData: bool = False
    externalRefs: List[ExternalProviderRef] = Field(default_factory=list, max_length=8)
    createdAt: datetime
    updatedAt: datetime

    @field_validator("id", "placeId")
    @classmethod
    def _id_shape(cls, value: str) -> str:
        return _require_resource_id(value)

    @field_validator("sport")
    @classmethod
    def _canonical_sport(cls, value: str) -> str:
        sport = value.strip().lower()
        if sport not in CANONICAL_SPORTS:
            raise ValueError("Unsupported sport")
        return sport

    @field_validator("startsAt", "endsAt", "createdAt", "updatedAt")
    @classmethod
    def _aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Timestamps must be timezone-aware")
        return value


class Participation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    uid: str = Field(min_length=1, max_length=128)
    runId: str = Field(min_length=8, max_length=80)
    status: ParticipationStatus
    joinedAt: datetime
    checkedInAt: Optional[datetime] = None
    runTitle: str = Field(min_length=1, max_length=160)
    placeId: str = Field(min_length=8, max_length=80)
    placeName: str = Field(min_length=1, max_length=120)
    sport: str
    startsAt: datetime
    isTestData: bool = False
    # Phase 3B consent. Absent on Phase 3A documents, so every stored record and
    # every new record starts hidden until the athlete explicitly opts in.
    connectionVisibility: ConnectionVisibility = DEFAULT_CONNECTION_VISIBILITY
    connectionVisibilityUpdatedAt: Optional[datetime] = None
    # Random per-run identifier assigned lazily the first time the athlete leaves
    # hidden. Never derived from the uid, so co-players cannot reverse it.
    candidateId: Optional[str] = Field(default=None, pattern=OPAQUE_ID_PATTERN)

    @field_validator("runId", "placeId")
    @classmethod
    def _id_shape(cls, value: str) -> str:
        return _require_resource_id(value)

    @field_validator("sport")
    @classmethod
    def _canonical_sport(cls, value: str) -> str:
        sport = value.strip().lower()
        if sport not in CANONICAL_SPORTS:
            raise ValueError("Unsupported sport")
        return sport


class PlaceSummary(BaseModel):
    id: str
    name: str
    city: str
    region: str
    country: str
    entranceNotes: Optional[str] = None
    isTestData: bool = False


class MyParticipationView(BaseModel):
    status: ParticipationStatus
    joinedAt: datetime
    checkedInAt: Optional[datetime] = None


class RunView(BaseModel):
    id: str
    sport: str
    placeId: str
    title: str
    startsAt: datetime
    endsAt: datetime
    status: RunComputedStatus
    visibility: RunVisibility
    isTestData: bool = False
    capacity: Optional[int] = None
    checkInOpen: bool = False
    place: PlaceSummary
    myParticipation: Optional[MyParticipationView] = None


class RunListResponse(BaseModel):
    items: List[RunView]
    sport: str = "basketball"
    isTestData: bool = False


class ParticipationHistoryItem(BaseModel):
    runId: str
    runTitle: str
    placeId: str
    placeName: str
    sport: str
    startsAt: datetime
    status: ParticipationStatus
    joinedAt: datetime
    checkedInAt: Optional[datetime] = None
    isTestData: bool = False


class ParticipationHistoryResponse(BaseModel):
    items: List[ParticipationHistoryItem]


class ProviderAdapter(Protocol):
    """Future boundary: providers never own SportBeacon Place/Run identity."""

    def provider_name(self) -> str: ...


def reject_sports_loop_identity_fields(payload: Dict[str, Any]) -> None:
    present = sorted(FORBIDDEN_IDENTITY_FIELDS.intersection(payload.keys()))
    if present:
        raise ValueError("Identity fields are not allowed in the request body")


def _require_resource_id(value: str) -> str:
    cleaned = value.strip()
    if len(cleaned) < 8 or len(cleaned) > 80:
        raise ValueError("Invalid resource id")
    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-")
    if any(char not in allowed for char in cleaned):
        raise ValueError("Invalid resource id")
    return cleaned
