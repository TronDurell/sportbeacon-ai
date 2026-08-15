from __future__ import annotations

import json
from typing import Annotated, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request

from .athlete_models import reject_identity_fields
from .athlete_repository import AthleteRepository
from .me_routes import get_athlete_repository
from .sports_loop_models import ParticipationHistoryResponse, RunListResponse, RunView
from .sports_loop_repository import FirestoreSportsLoopRepository, SportsLoopRepository
from .sports_loop_service import SportsLoopError, SportsLoopService
from .token_auth import AuthenticatedUser, get_current_user

sports_router = APIRouter(tags=["sports-loop"])
RunId = Annotated[str, Path(min_length=8, max_length=80, pattern=r"^[A-Za-z0-9_-]{8,80}$")]


def get_sports_loop_repository(request: Request) -> SportsLoopRepository:
    repo = getattr(request.app.state, "sports_loop_repository", None)
    if repo is None:
        repo = FirestoreSportsLoopRepository()
        request.app.state.sports_loop_repository = repo
    return repo


def get_sports_loop_service(
    request: Request,
    repo: SportsLoopRepository = Depends(get_sports_loop_repository),
) -> SportsLoopService:
    clock = getattr(request.app.state, "sports_loop_clock", None)
    return SportsLoopService(repo, clock=clock)


def _raise_loop_error(exc: SportsLoopError) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None


@sports_router.get("/api/runs", response_model=RunListResponse)
async def list_playable_runs(
    user: AuthenticatedUser = Depends(get_current_user),
    service: SportsLoopService = Depends(get_sports_loop_service),
    athlete_repo: AthleteRepository = Depends(get_athlete_repository),
    sport: str = Query(default="basketball", max_length=40),
) -> RunListResponse:
    if sport.strip().lower() != "basketball":
        raise HTTPException(status_code=422, detail="Only basketball discovery is available")
    profile = athlete_repo.get_profile(user.uid)
    home_area = profile.homeArea if profile is not None else None
    try:
        items = service.discover_runs(user.uid, sport="basketball", home_area=home_area)
    except SportsLoopError as exc:
        _raise_loop_error(exc)
    return RunListResponse(
        items=items,
        sport="basketball",
        isTestData=any(item.isTestData for item in items),
    )


@sports_router.get("/api/runs/{run_id}", response_model=RunView)
async def read_run(
    run_id: RunId,
    user: AuthenticatedUser = Depends(get_current_user),
    service: SportsLoopService = Depends(get_sports_loop_service),
) -> RunView:
    try:
        return service.get_run(user.uid, run_id)
    except SportsLoopError as exc:
        _raise_loop_error(exc)


@sports_router.post("/api/runs/{run_id}/join", response_model=RunView)
async def join_run(
    request: Request,
    run_id: RunId,
    user: AuthenticatedUser = Depends(get_current_user),
    service: SportsLoopService = Depends(get_sports_loop_service),
) -> RunView:
    await _reject_identity_body(request)
    try:
        return service.join(user.uid, run_id)
    except SportsLoopError as exc:
        _raise_loop_error(exc)


@sports_router.post("/api/runs/{run_id}/check-in", response_model=RunView)
async def check_in_run(
    request: Request,
    run_id: RunId,
    user: AuthenticatedUser = Depends(get_current_user),
    service: SportsLoopService = Depends(get_sports_loop_service),
) -> RunView:
    await _reject_identity_body(request)
    try:
        return service.check_in(user.uid, run_id)
    except SportsLoopError as exc:
        _raise_loop_error(exc)


@sports_router.get("/api/me/participation", response_model=ParticipationHistoryResponse)
async def list_my_participation(
    user: AuthenticatedUser = Depends(get_current_user),
    service: SportsLoopService = Depends(get_sports_loop_service),
) -> ParticipationHistoryResponse:
    return ParticipationHistoryResponse(items=service.list_history(user.uid))


async def _reject_identity_body(request: Request) -> Dict[str, Any]:
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
