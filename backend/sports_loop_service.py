from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Callable, List, Optional

from .athlete_models import HomeArea
from .runtime_env import env_flag, parse_app_env
from .sports_loop_fixtures import ensure_sports_loop_fixtures
from .sports_loop_models import (
    MyParticipationView,
    Participation,
    ParticipationHistoryItem,
    Place,
    PlaceSummary,
    Run,
    RunComputedStatus,
    RunView,
)
from .sports_loop_repository import SportsLoopRepository

logger = logging.getLogger("sportbeacon.sports_loop")

DISCOVERY_SPORT = "basketball"
DISCOVERY_AHEAD = timedelta(days=7)
CHECK_IN_LEAD = timedelta(minutes=30)
Clock = Callable[[], datetime]


class SportsLoopError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def sports_loop_fixtures_enabled() -> bool:
    env = parse_app_env()
    if env is None or env == "production":
        return False
    flag = env_flag("ENABLE_SPORTS_LOOP_FIXTURES")
    if flag is not None:
        return flag
    return env in {"development", "staging"}


def compute_run_status(run: Run, now: datetime) -> RunComputedStatus:
    if run.status == "cancelled":
        return "cancelled"
    if now > run.endsAt:
        return "completed"
    if run.startsAt <= now <= run.endsAt:
        return "active"
    return "upcoming"


def check_in_is_open(run: Run, now: datetime) -> bool:
    status = compute_run_status(run, now)
    if status in {"cancelled", "completed"}:
        return False
    return (run.startsAt - CHECK_IN_LEAD) <= now <= run.endsAt


class SportsLoopService:
    def __init__(self, repo: SportsLoopRepository, clock: Optional[Clock] = None) -> None:
        self._repo = repo
        self._clock = clock or utc_now

    def _now(self) -> datetime:
        stamp = self._clock()
        if stamp.tzinfo is None or stamp.utcoffset() is None:
            return stamp.replace(tzinfo=timezone.utc)
        return stamp.astimezone(timezone.utc)

    def ensure_fixtures_if_enabled(self) -> None:
        if not sports_loop_fixtures_enabled():
            return
        ensure_sports_loop_fixtures(self._repo, self._now())

    def discover_runs(
        self,
        uid: str,
        *,
        sport: str = DISCOVERY_SPORT,
        home_area: Optional[HomeArea] = None,
    ) -> List[RunView]:
        self.ensure_fixtures_if_enabled()
        now = self._now()
        horizon = now + DISCOVERY_AHEAD
        views: List[RunView] = []
        for run in self._repo.list_runs_by_sport(sport):
            status = compute_run_status(run, now)
            if status in {"cancelled", "completed"}:
                continue
            if run.startsAt > horizon:
                continue
            if run.visibility != "authenticated":
                continue
            place = self._repo.get_place(run.placeId)
            if place is None:
                logger.warning("discover_missing_place", extra={"run_id": run.id})
                continue
            participation = self._repo.get_participation(run.id, uid)
            views.append(_to_run_view(run, place, participation, now))
        views.sort(key=lambda item: (_home_rank(item, home_area), item.startsAt, item.id))
        return views

    def get_run(self, uid: str, run_id: str) -> RunView:
        self.ensure_fixtures_if_enabled()
        run, place = self._require_run_and_place(run_id)
        participation = self._repo.get_participation(run.id, uid)
        return _to_run_view(run, place, participation, self._now())

    def join(self, uid: str, run_id: str) -> RunView:
        self.ensure_fixtures_if_enabled()
        run, place = self._require_run_and_place(run_id)
        now = self._now()
        status = compute_run_status(run, now)
        if status in {"cancelled", "completed"}:
            logger.warning("join_rejected", extra={"run_id": run_id, "reason": status})
            raise SportsLoopError(409, "This run is not open to join")
        record = _participation_snapshot(uid, run, place, status="going", joined_at=now, checked_in_at=None)
        stored = self._repo.commit_join(record)
        return _to_run_view(run, place, stored, now)

    def check_in(self, uid: str, run_id: str) -> RunView:
        self.ensure_fixtures_if_enabled()
        run, place = self._require_run_and_place(run_id)
        now = self._now()
        if not check_in_is_open(run, now):
            status = compute_run_status(run, now)
            logger.warning("check_in_rejected", extra={"run_id": run_id, "reason": status})
            raise SportsLoopError(409, "Check-in is not available for this run yet")

        def _create() -> Participation:
            return _participation_snapshot(
                uid, run, place, status="checked_in", joined_at=now, checked_in_at=now
            )

        stored = self._repo.commit_check_in(uid, run.id, now, _create)
        return _to_run_view(run, place, stored, now)

    def list_history(self, uid: str) -> List[ParticipationHistoryItem]:
        self.ensure_fixtures_if_enabled()
        items = []
        for record in self._repo.list_participations(uid):
            items.append(
                ParticipationHistoryItem(
                    runId=record.runId,
                    runTitle=record.runTitle,
                    placeId=record.placeId,
                    placeName=record.placeName,
                    sport=record.sport,
                    startsAt=record.startsAt,
                    status=record.status,
                    joinedAt=record.joinedAt,
                    checkedInAt=record.checkedInAt,
                    isTestData=record.isTestData,
                )
            )
        return items

    def _require_run_and_place(self, run_id: str) -> tuple[Run, Place]:
        run = self._repo.get_run(run_id)
        if run is None:
            logger.warning("run_not_found", extra={"run_id": run_id})
            raise SportsLoopError(404, "Run not found")
        place = self._repo.get_place(run.placeId)
        if place is None:
            logger.warning("run_place_missing", extra={"run_id": run_id})
            raise SportsLoopError(404, "Run not found")
        return run, place


def _participation_snapshot(
    uid: str,
    run: Run,
    place: Place,
    *,
    status: str,
    joined_at: datetime,
    checked_in_at: Optional[datetime],
) -> Participation:
    return Participation(
        uid=uid,
        runId=run.id,
        status=status,
        joinedAt=joined_at,
        checkedInAt=checked_in_at,
        runTitle=run.title,
        placeId=place.id,
        placeName=place.name,
        sport=run.sport,
        startsAt=run.startsAt,
        isTestData=run.isTestData or place.isTestData,
    )


def _to_run_view(
    run: Run,
    place: Place,
    participation: Optional[Participation],
    now: datetime,
) -> RunView:
    mine = None
    if participation is not None:
        mine = MyParticipationView(
            status=participation.status,
            joinedAt=participation.joinedAt,
            checkedInAt=participation.checkedInAt,
        )
    return RunView(
        id=run.id,
        sport=run.sport,
        placeId=run.placeId,
        title=run.title,
        startsAt=run.startsAt,
        endsAt=run.endsAt,
        status=compute_run_status(run, now),
        visibility=run.visibility,
        isTestData=run.isTestData or place.isTestData,
        capacity=run.capacity,
        checkInOpen=check_in_is_open(run, now),
        place=PlaceSummary(
            id=place.id,
            name=place.name,
            city=place.city,
            region=place.region,
            country=place.country,
            entranceNotes=place.entranceNotes,
            isTestData=place.isTestData,
        ),
        myParticipation=mine,
    )


def _home_rank(item: RunView, home_area: Optional[HomeArea]) -> tuple[int, int]:
    if home_area is None:
        return (1, 1)
    city_match = item.place.city.strip().lower() == home_area.city.strip().lower()
    region_match = item.place.region.strip().lower() == home_area.region.strip().lower()
    return (0 if city_match else 1, 0 if region_match else 1)
