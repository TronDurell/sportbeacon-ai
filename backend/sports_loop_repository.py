from __future__ import annotations

from datetime import datetime
from threading import Lock
from typing import Callable, Dict, List, Optional, Protocol, Tuple

from .runtime_env import require_app_env
from .sports_loop_models import Participation, Place, Run


class SportsLoopRepository(Protocol):
    def upsert_place(self, place: Place) -> Place: ...

    def get_place(self, place_id: str) -> Optional[Place]: ...

    def upsert_run(self, run: Run) -> Run: ...

    def get_run(self, run_id: str) -> Optional[Run]: ...

    def list_runs_by_sport(self, sport: str, *, limit: int = 50) -> List[Run]: ...

    def get_participation(self, run_id: str, uid: str) -> Optional[Participation]: ...

    def commit_join(self, record: Participation) -> Participation: ...

    def commit_check_in(
        self,
        uid: str,
        run_id: str,
        now: datetime,
        create: Callable[[], Participation],
    ) -> Participation: ...

    def list_participations(self, uid: str, *, limit: int = 50) -> List[Participation]: ...


class InMemorySportsLoopRepository:
    def __init__(self) -> None:
        self.places: Dict[str, Place] = {}
        self.runs: Dict[str, Run] = {}
        self._participants: Dict[Tuple[str, str], Participation] = {}
        self._lock = Lock()

    def upsert_place(self, place: Place) -> Place:
        self.places[place.id] = place
        return place

    def get_place(self, place_id: str) -> Optional[Place]:
        return self.places.get(place_id)

    def upsert_run(self, run: Run) -> Run:
        self.runs[run.id] = run
        return run

    def get_run(self, run_id: str) -> Optional[Run]:
        return self.runs.get(run_id)

    def list_runs_by_sport(self, sport: str, *, limit: int = 50) -> List[Run]:
        matched = [item for item in self.runs.values() if item.sport == sport]
        matched.sort(key=lambda item: item.startsAt)
        return matched[:limit]

    def get_participation(self, run_id: str, uid: str) -> Optional[Participation]:
        return self._participants.get((run_id, uid))

    def commit_join(self, record: Participation) -> Participation:
        with self._lock:
            existing = self._participants.get((record.runId, record.uid))
            if existing is not None:
                return existing
            self._participants[(record.runId, record.uid)] = record
            return record

    def commit_check_in(
        self,
        uid: str,
        run_id: str,
        now: datetime,
        create: Callable[[], Participation],
    ) -> Participation:
        with self._lock:
            existing = self._participants.get((run_id, uid))
            if existing is not None and existing.checkedInAt is not None:
                return existing
            if existing is not None:
                updated = existing.model_copy(
                    update={"status": "checked_in", "checkedInAt": now}
                )
                self._participants[(run_id, uid)] = updated
                return updated
            created = create()
            self._participants[(created.runId, created.uid)] = created
            return created

    def list_participations(self, uid: str, *, limit: int = 50) -> List[Participation]:
        items = [item for item in self._participants.values() if item.uid == uid]
        items.sort(key=lambda item: item.startsAt, reverse=True)
        return items[:limit]


class FirestoreSportsLoopRepository:
    def __init__(self, client=None, app_env: Optional[str] = None) -> None:
        if client is None:
            from .firebase_admin_app import get_firestore_client

            client = get_firestore_client()
        self._client = client
        self._app_env = app_env or require_app_env()

    def _env_ref(self):
        return self._client.collection("environments").document(self._app_env)

    def _place_ref(self, place_id: str):
        return self._env_ref().collection("places").document(place_id)

    def _run_ref(self, run_id: str):
        return self._env_ref().collection("runs").document(run_id)

    def _participant_ref(self, run_id: str, uid: str):
        return self._run_ref(run_id).collection("participants").document(uid)

    def _athlete_participation_ref(self, uid: str, run_id: str):
        return (
            self._env_ref()
            .collection("athletes")
            .document(uid)
            .collection("participations")
            .document(run_id)
        )

    def upsert_place(self, place: Place) -> Place:
        self._place_ref(place.id).set(place.model_dump())
        return place

    def get_place(self, place_id: str) -> Optional[Place]:
        snapshot = self._place_ref(place_id).get()
        if not snapshot.exists:
            return None
        return Place.model_validate(snapshot.to_dict())

    def upsert_run(self, run: Run) -> Run:
        self._run_ref(run.id).set(run.model_dump())
        return run

    def get_run(self, run_id: str) -> Optional[Run]:
        snapshot = self._run_ref(run_id).get()
        if not snapshot.exists:
            return None
        return Run.model_validate(snapshot.to_dict())

    def list_runs_by_sport(self, sport: str, *, limit: int = 50) -> List[Run]:
        query = self._env_ref().collection("runs").where("sport", "==", sport).limit(limit)
        return [Run.model_validate(doc.to_dict()) for doc in query.stream()]

    def get_participation(self, run_id: str, uid: str) -> Optional[Participation]:
        snapshot = self._participant_ref(run_id, uid).get()
        if not snapshot.exists:
            return None
        return Participation.model_validate(snapshot.to_dict())

    def commit_join(self, record: Participation) -> Participation:
        from google.cloud import firestore

        participant_ref = self._participant_ref(record.runId, record.uid)
        athlete_ref = self._athlete_participation_ref(record.uid, record.runId)
        transaction = self._client.transaction()

        @firestore.transactional
        def _txn(txn):
            snapshot = participant_ref.get(transaction=txn)
            if snapshot.exists:
                return Participation.model_validate(snapshot.to_dict())
            payload = record.model_dump()
            txn.set(participant_ref, payload)
            txn.set(athlete_ref, payload)
            return record

        return _txn(transaction)

    def commit_check_in(
        self,
        uid: str,
        run_id: str,
        now: datetime,
        create: Callable[[], Participation],
    ) -> Participation:
        from google.cloud import firestore

        participant_ref = self._participant_ref(run_id, uid)
        athlete_ref = self._athlete_participation_ref(uid, run_id)
        transaction = self._client.transaction()

        @firestore.transactional
        def _txn(txn):
            snapshot = participant_ref.get(transaction=txn)
            if snapshot.exists:
                existing = Participation.model_validate(snapshot.to_dict())
                if existing.checkedInAt is not None:
                    return existing
                updated = existing.model_copy(
                    update={"status": "checked_in", "checkedInAt": now}
                )
                payload = updated.model_dump()
                txn.set(participant_ref, payload)
                txn.set(athlete_ref, payload)
                return updated
            created = create()
            payload = created.model_dump()
            txn.set(participant_ref, payload)
            txn.set(athlete_ref, payload)
            return created

        return _txn(transaction)

    def list_participations(self, uid: str, *, limit: int = 50) -> List[Participation]:
        query = (
            self._env_ref()
            .collection("athletes")
            .document(uid)
            .collection("participations")
            .order_by("startsAt", direction="DESCENDING")
            .limit(limit)
        )
        return [Participation.model_validate(doc.to_dict()) for doc in query.stream()]
