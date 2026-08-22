from __future__ import annotations

import json
from typing import Annotated, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Path, Request

from .athlete_models import reject_identity_fields
from .athlete_repository import AthleteRepository
from .connection_models import (
    ConnectionConsentView,
    ConnectionConsentWrite,
    ConnectionListResponse,
    ConnectionRequestWrite,
    ConnectionView,
    CoPlayerListResponse,
    SafetyReportReceipt,
    SafetyReportWrite,
)
from .connection_repository import ConnectionRepository, FirestoreConnectionRepository
from .connection_service import AthleteConnectionError, AthleteConnectionService
from .me_routes import get_athlete_repository
from .sports_loop_repository import SportsLoopRepository
from .sports_loop_routes import get_sports_loop_repository
from .token_auth import AuthenticatedUser, get_current_user

connections_router = APIRouter(tags=["athlete-connections"])

RunId = Annotated[str, Path(min_length=8, max_length=80, pattern=r"^[A-Za-z0-9_-]{8,80}$")]
ConnectionId = Annotated[str, Path(min_length=32, max_length=32, pattern=r"^[a-f0-9]{32}$")]


def get_connection_repository(request: Request) -> ConnectionRepository:
    repo = getattr(request.app.state, "connection_repository", None)
    if repo is None:
        repo = FirestoreConnectionRepository()
        request.app.state.connection_repository = repo
    return repo


def get_connection_service(
    request: Request,
    sports_repo: SportsLoopRepository = Depends(get_sports_loop_repository),
    connection_repo: ConnectionRepository = Depends(get_connection_repository),
    athlete_repo: AthleteRepository = Depends(get_athlete_repository),
) -> AthleteConnectionService:
    clock = getattr(request.app.state, "sports_loop_clock", None)
    return AthleteConnectionService(sports_repo, connection_repo, athlete_repo, clock=clock)


def _raise_connection_error(exc: AthleteConnectionError) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None


@connections_router.put(
    "/api/runs/{run_id}/me/connection-consent", response_model=ConnectionConsentView
)
async def set_connection_consent(
    run_id: RunId,
    payload: ConnectionConsentWrite,
    user: AuthenticatedUser = Depends(get_current_user),
    service: AthleteConnectionService = Depends(get_connection_service),
) -> ConnectionConsentView:
    try:
        return service.set_run_visibility(user.uid, run_id, payload.visibility)
    except AthleteConnectionError as exc:
        _raise_connection_error(exc)


@connections_router.get("/api/runs/{run_id}/co-players", response_model=CoPlayerListResponse)
async def list_co_players(
    run_id: RunId,
    user: AuthenticatedUser = Depends(get_current_user),
    service: AthleteConnectionService = Depends(get_connection_service),
) -> CoPlayerListResponse:
    try:
        return service.list_co_players(user.uid, run_id)
    except AthleteConnectionError as exc:
        _raise_connection_error(exc)


@connections_router.post("/api/runs/{run_id}/connection-requests", response_model=ConnectionView)
async def create_connection_request(
    run_id: RunId,
    payload: ConnectionRequestWrite,
    user: AuthenticatedUser = Depends(get_current_user),
    service: AthleteConnectionService = Depends(get_connection_service),
) -> ConnectionView:
    try:
        return service.request_connection(user.uid, run_id, payload.candidateId)
    except AthleteConnectionError as exc:
        _raise_connection_error(exc)


@connections_router.get("/api/me/connections", response_model=ConnectionListResponse)
async def list_my_connections(
    user: AuthenticatedUser = Depends(get_current_user),
    service: AthleteConnectionService = Depends(get_connection_service),
) -> ConnectionListResponse:
    return service.list_connections(user.uid)


@connections_router.post(
    "/api/me/connections/{connection_id}/accept", response_model=ConnectionView
)
async def accept_connection(
    request: Request,
    connection_id: ConnectionId,
    user: AuthenticatedUser = Depends(get_current_user),
    service: AthleteConnectionService = Depends(get_connection_service),
) -> ConnectionView:
    await _require_no_body(request)
    try:
        return service.accept(user.uid, connection_id)
    except AthleteConnectionError as exc:
        _raise_connection_error(exc)


@connections_router.post(
    "/api/me/connections/{connection_id}/decline", response_model=ConnectionView
)
async def decline_connection(
    request: Request,
    connection_id: ConnectionId,
    user: AuthenticatedUser = Depends(get_current_user),
    service: AthleteConnectionService = Depends(get_connection_service),
) -> ConnectionView:
    await _require_no_body(request)
    try:
        return service.decline(user.uid, connection_id)
    except AthleteConnectionError as exc:
        _raise_connection_error(exc)


@connections_router.post(
    "/api/me/connections/{connection_id}/remove", response_model=ConnectionView
)
async def remove_connection(
    request: Request,
    connection_id: ConnectionId,
    user: AuthenticatedUser = Depends(get_current_user),
    service: AthleteConnectionService = Depends(get_connection_service),
) -> ConnectionView:
    await _require_no_body(request)
    try:
        return service.remove(user.uid, connection_id)
    except AthleteConnectionError as exc:
        _raise_connection_error(exc)


@connections_router.post(
    "/api/me/connections/{connection_id}/block", response_model=ConnectionView
)
async def block_connection(
    request: Request,
    connection_id: ConnectionId,
    user: AuthenticatedUser = Depends(get_current_user),
    service: AthleteConnectionService = Depends(get_connection_service),
) -> ConnectionView:
    await _require_no_body(request)
    try:
        return service.block(user.uid, connection_id)
    except AthleteConnectionError as exc:
        _raise_connection_error(exc)


@connections_router.post("/api/me/safety-reports", response_model=SafetyReportReceipt)
async def submit_safety_report(
    payload: SafetyReportWrite,
    user: AuthenticatedUser = Depends(get_current_user),
    service: AthleteConnectionService = Depends(get_connection_service),
) -> SafetyReportReceipt:
    try:
        return service.submit_safety_report(user.uid, payload)
    except AthleteConnectionError as exc:
        _raise_connection_error(exc)


async def _require_no_body(request: Request) -> Dict[str, Any]:
    """State transitions take their subject from the path and identity from the token."""
    raw = await request.body()
    if not raw.strip():
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Request body must be JSON") from None
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object")
    try:
        reject_identity_fields(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None
    if data:
        raise HTTPException(status_code=400, detail="This request does not accept a body")
    return data
