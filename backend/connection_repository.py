from __future__ import annotations

from copy import deepcopy
from threading import Lock
from typing import Callable, Dict, List, Optional, Protocol

from .connection_models import AthleteConnection, SafetyReport
from .runtime_env import require_app_env

# Phase 3B relationship volume is fixture-scale, so the caller's own relationship
# set is filtered in the service instead of adding a composite index.
MAX_CONNECTIONS = 200

ConnectionMutation = Callable[[Optional[AthleteConnection]], Optional[AthleteConnection]]


class ConnectionRepository(Protocol):
    def get_connection(self, pair_key: str) -> Optional[AthleteConnection]: ...

    def apply_connection_transition(
        self, pair_key: str, mutate: ConnectionMutation
    ) -> Optional[AthleteConnection]:
        """Atomically read, validate, and write one relationship document.

        ``mutate`` receives the current record (or ``None``) and returns the record
        to persist, or ``None`` to leave the stored state untouched.
        """

    def list_connections_for_member(
        self, uid: str, *, limit: int = MAX_CONNECTIONS
    ) -> List[AthleteConnection]: ...

    def add_safety_report(self, report: SafetyReport) -> SafetyReport: ...


class InMemoryConnectionRepository:
    def __init__(self) -> None:
        self._connections: Dict[str, AthleteConnection] = {}
        self.safety_reports: List[SafetyReport] = []
        self._lock = Lock()

    def get_connection(self, pair_key: str) -> Optional[AthleteConnection]:
        return self._connections.get(pair_key)

    def apply_connection_transition(
        self, pair_key: str, mutate: ConnectionMutation
    ) -> Optional[AthleteConnection]:
        with self._lock:
            current = self._connections.get(pair_key)
            updated = mutate(deepcopy(current) if current is not None else None)
            if updated is None:
                return current
            self._connections[pair_key] = updated
            return updated

    def list_connections_for_member(
        self, uid: str, *, limit: int = MAX_CONNECTIONS
    ) -> List[AthleteConnection]:
        items = [item for item in self._connections.values() if item.is_member(uid)]
        items.sort(key=lambda item: (item.updatedAt, item.connectionId), reverse=True)
        return items[:limit]

    def add_safety_report(self, report: SafetyReport) -> SafetyReport:
        with self._lock:
            self.safety_reports.append(report)
            return report


class FirestoreConnectionRepository:
    def __init__(self, client=None, app_env: Optional[str] = None) -> None:
        if client is None:
            from .firebase_admin_app import get_firestore_client

            client = get_firestore_client()
        self._client = client
        self._app_env = app_env or require_app_env()

    def _env_ref(self):
        return self._client.collection("environments").document(self._app_env)

    def _connection_ref(self, pair_key: str):
        return self._env_ref().collection("athleteConnections").document(pair_key)

    def _safety_report_ref(self, report_id: str):
        return self._env_ref().collection("safetyReports").document(report_id)

    def get_connection(self, pair_key: str) -> Optional[AthleteConnection]:
        snapshot = self._connection_ref(pair_key).get()
        if not snapshot.exists:
            return None
        return AthleteConnection.model_validate(snapshot.to_dict())

    def apply_connection_transition(
        self, pair_key: str, mutate: ConnectionMutation
    ) -> Optional[AthleteConnection]:
        from google.cloud import firestore

        ref = self._connection_ref(pair_key)
        transaction = self._client.transaction()

        @firestore.transactional
        def _txn(txn):
            snapshot = ref.get(transaction=txn)
            current = (
                AthleteConnection.model_validate(snapshot.to_dict()) if snapshot.exists else None
            )
            updated = mutate(current)
            if updated is None:
                return current
            txn.set(ref, updated.model_dump())
            return updated

        return _txn(transaction)

    def list_connections_for_member(
        self, uid: str, *, limit: int = MAX_CONNECTIONS
    ) -> List[AthleteConnection]:
        query = (
            self._env_ref()
            .collection("athleteConnections")
            .where("members", "array_contains", uid)
            .limit(limit)
        )
        items = [AthleteConnection.model_validate(doc.to_dict()) for doc in query.stream()]
        items.sort(key=lambda item: (item.updatedAt, item.connectionId), reverse=True)
        return items

    def add_safety_report(self, report: SafetyReport) -> SafetyReport:
        self._safety_report_ref(report.reportId).set(report.model_dump())
        return report
