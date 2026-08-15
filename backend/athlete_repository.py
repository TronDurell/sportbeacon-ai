from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional, Protocol, Tuple
from uuid import uuid4

from .athlete_models import AthleteProfile, AthleteProfileWrite, BasketballStat, BasketballStatWrite
from .runtime_env import require_app_env


class AthleteRepository(Protocol):
    def get_profile(self, uid: str) -> Optional[AthleteProfile]:
        ...

    def upsert_profile(self, uid: str, payload: AthleteProfileWrite) -> AthleteProfile:
        ...

    def add_stat(self, uid: str, payload: BasketballStatWrite) -> BasketballStat:
        ...

    def list_stats(self, uid: str, *, limit: int, cursor: Optional[str]) -> Tuple[List[BasketballStat], Optional[str]]:
        ...


def _now() -> datetime:
    return datetime.now(timezone.utc)


class InMemoryAthleteRepository:
    def __init__(self) -> None:
        self.profiles: Dict[str, AthleteProfile] = {}
        self.stats: Dict[str, List[BasketballStat]] = {}

    def get_profile(self, uid: str) -> Optional[AthleteProfile]:
        return self.profiles.get(uid)

    def upsert_profile(self, uid: str, payload: AthleteProfileWrite) -> AthleteProfile:
        existing = self.profiles.get(uid)
        stamp = _now()
        created = existing.createdAt if existing else stamp
        profile = AthleteProfile(
            **payload.model_dump(),
            schemaVersion=1,
            visibility="private",
            createdAt=created,
            updatedAt=stamp,
        )
        self.profiles[uid] = profile
        return profile

    def add_stat(self, uid: str, payload: BasketballStatWrite) -> BasketballStat:
        stamp = _now()
        record = BasketballStat(
            **payload.model_dump(),
            schemaVersion=1,
            sport="basketball",
            statId=uuid4().hex,
            createdAt=stamp,
            updatedAt=stamp,
        )
        self.stats.setdefault(uid, []).append(record)
        return record

    def list_stats(
        self, uid: str, *, limit: int, cursor: Optional[str]
    ) -> Tuple[List[BasketballStat], Optional[str]]:
        items = list(reversed(self.stats.get(uid, [])))
        start = 0
        if cursor:
            for idx, item in enumerate(items):
                if item.statId == cursor:
                    start = idx + 1
                    break
        window = items[start : start + limit]
        next_cursor = window[-1].statId if start + limit < len(items) and window else None
        return window, next_cursor


class FirestoreAthleteRepository:
    def __init__(self, client=None, app_env: Optional[str] = None) -> None:
        if client is None:
            from .firebase_admin_app import get_firestore_client

            client = get_firestore_client()
        self._client = client
        self._app_env = app_env or require_app_env()

    def _athlete_ref(self, uid: str):
        return (
            self._client.collection("environments")
            .document(self._app_env)
            .collection("athletes")
            .document(uid)
        )

    def get_profile(self, uid: str) -> Optional[AthleteProfile]:
        snapshot = self._athlete_ref(uid).get()
        if not snapshot.exists:
            return None
        return AthleteProfile.model_validate(snapshot.to_dict())

    def upsert_profile(self, uid: str, payload: AthleteProfileWrite) -> AthleteProfile:
        ref = self._athlete_ref(uid)
        snapshot = ref.get()
        stamp = _now()
        created = stamp
        if snapshot.exists:
            existing = AthleteProfile.model_validate(snapshot.to_dict())
            created = existing.createdAt
        profile = AthleteProfile(
            **payload.model_dump(),
            schemaVersion=1,
            visibility="private",
            createdAt=created,
            updatedAt=stamp,
        )
        ref.set(profile.model_dump())
        return profile

    def add_stat(self, uid: str, payload: BasketballStatWrite) -> BasketballStat:
        stamp = _now()
        stat_id = uuid4().hex
        record = BasketballStat(
            **payload.model_dump(),
            schemaVersion=1,
            sport="basketball",
            statId=stat_id,
            createdAt=stamp,
            updatedAt=stamp,
        )
        self._athlete_ref(uid).collection("stats").document(stat_id).set(record.model_dump())
        return record

    def list_stats(
        self, uid: str, *, limit: int, cursor: Optional[str]
    ) -> Tuple[List[BasketballStat], Optional[str]]:
        query = (
            self._athlete_ref(uid)
            .collection("stats")
            .order_by("occurredAt", direction="DESCENDING")
            .limit(limit + 1)
        )
        if cursor:
            cursor_doc = self._athlete_ref(uid).collection("stats").document(cursor).get()
            if cursor_doc.exists:
                query = query.start_after(cursor_doc)
        docs = list(query.stream())
        has_more = len(docs) > limit
        docs = docs[:limit]
        items = [BasketballStat.model_validate(doc.to_dict()) for doc in docs]
        next_cursor = items[-1].statId if has_more and items else None
        return items, next_cursor
