from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

CANONICAL_SPORTS = frozenset({"basketball", "tennis"})
FORBIDDEN_IDENTITY_FIELDS = frozenset(
    {"uid", "user_id", "owner_id", "player_id", "email"}
)


def reject_identity_fields(payload: Dict[str, Any]) -> None:
    present = sorted(FORBIDDEN_IDENTITY_FIELDS.intersection(payload.keys()))
    if present:
        raise ValueError("Identity fields are not allowed in the request body")


class HomeArea(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city: str = Field(min_length=1, max_length=80)
    region: str = Field(min_length=1, max_length=80)
    country: str = Field(min_length=2, max_length=80)


class SportSkills(BaseModel):
    model_config = ConfigDict(extra="forbid")

    skill_levels: Dict[str, float] = Field(default_factory=dict)
    growth_areas: List[str] = Field(default_factory=list, max_length=12)
    top_skills: List[str] = Field(default_factory=list, max_length=12)

    @field_validator("skill_levels")
    @classmethod
    def _bounded_levels(cls, value: Dict[str, float]) -> Dict[str, float]:
        if len(value) > 20:
            raise ValueError("Too many skill_levels")
        cleaned: Dict[str, float] = {}
        for key, raw in value.items():
            name = str(key).strip().lower()
            if not name or len(name) > 40:
                raise ValueError("Invalid skill name")
            level = float(raw)
            if level < 0 or level > 1:
                raise ValueError("skill_levels must be between 0 and 1")
            cleaned[name] = level
        return cleaned

    @field_validator("growth_areas", "top_skills")
    @classmethod
    def _normalize_labels(cls, value: List[str]) -> List[str]:
        items = [item.strip().lower() for item in value if item and item.strip()]
        return items[:12]


class TrainingPreferences(BaseModel):
    model_config = ConfigDict(extra="forbid")

    days_per_week: Optional[int] = Field(default=None, ge=1, le=7)
    available_days: List[str] = Field(default_factory=list, max_length=7)
    max_session_minutes: Optional[int] = Field(default=None, ge=15, le=180)


class AthleteProfileWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    displayName: str = Field(min_length=1, max_length=80)
    bio: Optional[str] = Field(default=None, max_length=280)
    primarySport: str
    sports: List[str] = Field(min_length=1, max_length=8)
    skillsBySport: Dict[str, SportSkills] = Field(default_factory=dict)
    trainingPreferences: TrainingPreferences = Field(default_factory=TrainingPreferences)
    homeArea: HomeArea
    travelRadiusMiles: Optional[int] = Field(default=None, ge=1, le=300)
    onboardingComplete: bool = False

    @field_validator("primarySport")
    @classmethod
    def _canonical_primary(cls, value: str) -> str:
        sport = value.strip().lower()
        if sport not in CANONICAL_SPORTS:
            raise ValueError("Unsupported primarySport")
        return sport

    @field_validator("sports")
    @classmethod
    def _canonical_sports(cls, value: List[str]) -> List[str]:
        sports = []
        for item in value:
            sport = item.strip().lower()
            if sport not in CANONICAL_SPORTS:
                raise ValueError("Unsupported sport")
            if sport not in sports:
                sports.append(sport)
        if not sports:
            raise ValueError("sports is required")
        return sports

    @model_validator(mode="after")
    def _primary_in_sports(self) -> "AthleteProfileWrite":
        if self.primarySport not in self.sports:
            raise ValueError("primarySport must be included in sports")
        extra = set(self.skillsBySport) - set(self.sports)
        if extra:
            raise ValueError("skillsBySport contains sports that are not selected")
        return self


class AthleteProfile(AthleteProfileWrite):
    schemaVersion: Literal[1] = 1
    visibility: Literal["private"] = "private"
    createdAt: datetime
    updatedAt: datetime


class StatSource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["manual"] = "manual"


class BasketballStatWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    occurredAt: datetime
    points: float = Field(ge=0, le=200)
    assists: float = Field(ge=0, le=50)
    rebounds: float = Field(ge=0, le=80)
    steals: float = Field(ge=0, le=30)
    blocks: float = Field(ge=0, le=30)
    field_goal_percentage: float = Field(ge=0, le=100)
    three_point_percentage: float = Field(ge=0, le=100)
    result: Literal["win", "loss"]
    source: StatSource = Field(default_factory=StatSource)

    @field_validator("occurredAt")
    @classmethod
    def _aware_past(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("occurredAt must be timezone-aware")
        now = datetime.now(timezone.utc)
        if value.astimezone(timezone.utc) > now:
            raise ValueError("occurredAt cannot be in the future")
        return value


class BasketballStat(BasketballStatWrite):
    schemaVersion: Literal[1] = 1
    sport: Literal["basketball"] = "basketball"
    statId: str
    createdAt: datetime
    updatedAt: datetime


class DrillControls(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_recommendations: int = Field(default=5, ge=1, le=10)
    min_difficulty: str = "Beginner"
    max_difficulty: str = "Advanced"


class MeResponse(BaseModel):
    authenticated: bool = True


class StatsListResponse(BaseModel):
    items: List[BasketballStat]
    nextCursor: Optional[str] = None
