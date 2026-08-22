from __future__ import annotations

from datetime import datetime, timedelta, timezone

from .sports_loop_models import Place, Run
from .sports_loop_repository import SportsLoopRepository

PLACE_ID = "test-place-richmond-rec-gym"
ACTIVE_RUN_ID = "test-run-basketball-active"
# Two further check-in-open sessions at the same place. Reconnecting after a decline
# or a removal requires a *later* run both athletes checked into, so a two-account
# acceptance run needs more than one open session to exercise the lifecycle without
# hand-editing Firestore. They are ordinary labeled TEST DATA runs: no athlete is
# invented, nobody is auto-joined, and consent still starts hidden on each of them.
SECOND_ACTIVE_RUN_ID = "test-run-basketball-active-second"
THIRD_ACTIVE_RUN_ID = "test-run-basketball-active-third"
UPCOMING_RUN_ID = "test-run-basketball-upcoming"
COMPLETED_RUN_ID = "test-run-basketball-completed"
CANCELLED_RUN_ID = "test-run-basketball-cancelled"
FIXTURE_CREATED_BY = "sportbeacon-fixture"


def build_test_place(now: datetime) -> Place:
    return Place(
        id=PLACE_ID,
        name="TEST DATA — Richmond Rec Gym",
        city="Richmond",
        region="VA",
        country="US",
        sportCapabilities=["basketball"],
        latitude=37.5407,
        longitude=-77.4360,
        entranceNotes="Main gym entrance on the recreation center side. Test venue only.",
        isTestData=True,
        createdAt=now,
        updatedAt=now,
    )


def build_test_runs(now: datetime, place_id: str = PLACE_ID) -> list[Run]:
    stamp = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    return [
        Run(
            id=ACTIVE_RUN_ID,
            sport="basketball",
            placeId=place_id,
            title="TEST DATA — Lunch pickup run",
            startsAt=stamp - timedelta(minutes=45),
            endsAt=stamp + timedelta(minutes=75),
            status="scheduled",
            createdBy=FIXTURE_CREATED_BY,
            visibility="authenticated",
            isTestData=True,
            createdAt=stamp,
            updatedAt=stamp,
        ),
        Run(
            id=SECOND_ACTIVE_RUN_ID,
            sport="basketball",
            placeId=place_id,
            title="TEST DATA — Second pickup run (later session)",
            startsAt=stamp - timedelta(minutes=30),
            endsAt=stamp + timedelta(minutes=90),
            status="scheduled",
            createdBy=FIXTURE_CREATED_BY,
            visibility="authenticated",
            isTestData=True,
            createdAt=stamp,
            updatedAt=stamp,
        ),
        Run(
            id=THIRD_ACTIVE_RUN_ID,
            sport="basketball",
            placeId=place_id,
            title="TEST DATA — Third pickup run (latest session)",
            startsAt=stamp - timedelta(minutes=15),
            endsAt=stamp + timedelta(minutes=105),
            status="scheduled",
            createdBy=FIXTURE_CREATED_BY,
            visibility="authenticated",
            isTestData=True,
            createdAt=stamp,
            updatedAt=stamp,
        ),
        Run(
            id=UPCOMING_RUN_ID,
            sport="basketball",
            placeId=place_id,
            title="TEST DATA — Evening open gym",
            startsAt=stamp + timedelta(hours=3),
            endsAt=stamp + timedelta(hours=5),
            status="scheduled",
            createdBy=FIXTURE_CREATED_BY,
            visibility="authenticated",
            isTestData=True,
            createdAt=stamp,
            updatedAt=stamp,
        ),
        Run(
            id=COMPLETED_RUN_ID,
            sport="basketball",
            placeId=place_id,
            title="TEST DATA — Yesterday's completed run",
            startsAt=stamp - timedelta(hours=26),
            endsAt=stamp - timedelta(hours=24),
            status="scheduled",
            createdBy=FIXTURE_CREATED_BY,
            visibility="authenticated",
            isTestData=True,
            createdAt=stamp,
            updatedAt=stamp,
        ),
        Run(
            id=CANCELLED_RUN_ID,
            sport="basketball",
            placeId=place_id,
            title="TEST DATA — Cancelled run",
            startsAt=stamp + timedelta(hours=1),
            endsAt=stamp + timedelta(hours=3),
            status="cancelled",
            createdBy=FIXTURE_CREATED_BY,
            visibility="authenticated",
            isTestData=True,
            createdAt=stamp,
            updatedAt=stamp,
        ),
    ]


def ensure_sports_loop_fixtures(repo: SportsLoopRepository, now: datetime) -> None:
    """Idempotently upsert labeled test Place/Runs. Never call in production."""
    place = build_test_place(now)
    existing_place = repo.get_place(place.id)
    if existing_place is not None:
        place = existing_place.model_copy(
            update={
                "name": place.name,
                "city": place.city,
                "region": place.region,
                "country": place.country,
                "sportCapabilities": place.sportCapabilities,
                "latitude": place.latitude,
                "longitude": place.longitude,
                "entranceNotes": place.entranceNotes,
                "isTestData": True,
                "updatedAt": now,
            }
        )
    repo.upsert_place(place)
    for run in build_test_runs(now, place.id):
        existing = repo.get_run(run.id)
        if existing is not None:
            run = existing.model_copy(
                update={
                    "sport": run.sport,
                    "placeId": run.placeId,
                    "title": run.title,
                    "startsAt": run.startsAt,
                    "endsAt": run.endsAt,
                    "status": run.status,
                    "visibility": run.visibility,
                    "isTestData": True,
                    "updatedAt": now,
                }
            )
        repo.upsert_run(run)
