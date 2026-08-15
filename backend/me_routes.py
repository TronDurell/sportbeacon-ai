from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from .athlete_models import (
    AthleteProfileWrite,
    BasketballStatWrite,
    DrillControls,
    MeResponse,
    StatsListResponse,
    reject_identity_fields,
)
from .athlete_repository import AthleteRepository, FirestoreAthleteRepository
from .models import DrillRecommendationRequest, PlayerStatRecord
from .token_auth import AuthenticatedUser, get_current_user

me_router = APIRouter(prefix="/api/me", tags=["me"])


def get_athlete_repository(request: Request) -> AthleteRepository:
    repo = getattr(request.app.state, "athlete_repository", None)
    if repo is None:
        repo = FirestoreAthleteRepository()
        request.app.state.athlete_repository = repo
    return repo


def _insight_service(request: Request):
    return request.app.state.insight_service


def _drill_service(request: Request):
    return request.app.state.drill_service


def _internal_player_id(uid: str) -> int:
    digest = hashlib.sha256(f"sportbeacon:{uid}".encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % 1_000_000_000


@me_router.get("", response_model=MeResponse)
async def read_me(_: AuthenticatedUser = Depends(get_current_user)) -> MeResponse:
    return MeResponse(authenticated=True)


@me_router.get("/profile")
async def read_profile(
    user: AuthenticatedUser = Depends(get_current_user),
    repo: AthleteRepository = Depends(get_athlete_repository),
):
    profile = repo.get_profile(user.uid)
    if profile is None:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return profile


@me_router.put("/profile")
async def upsert_profile(
    payload: AthleteProfileWrite,
    user: AuthenticatedUser = Depends(get_current_user),
    repo: AthleteRepository = Depends(get_athlete_repository),
):
    return repo.upsert_profile(user.uid, payload)


@me_router.post("/stats/basketball")
async def add_basketball_stat(
    payload: BasketballStatWrite,
    user: AuthenticatedUser = Depends(get_current_user),
    repo: AthleteRepository = Depends(get_athlete_repository),
):
    return repo.add_stat(user.uid, payload)


@me_router.get("/stats", response_model=StatsListResponse)
async def list_stats(
    user: AuthenticatedUser = Depends(get_current_user),
    repo: AthleteRepository = Depends(get_athlete_repository),
    limit: int = Query(default=20, ge=1, le=50),
    cursor: Optional[str] = Query(default=None, max_length=80),
):
    items, next_cursor = repo.list_stats(user.uid, limit=limit, cursor=cursor)
    return StatsListResponse(items=items, nextCursor=next_cursor)


@me_router.post("/insights")
async def generate_insights(
    request: Request,
    user: AuthenticatedUser = Depends(get_current_user),
    repo: AthleteRepository = Depends(get_athlete_repository),
):
    body = await _optional_object_body(request)
    if body:
        raise HTTPException(status_code=400, detail="Insight requests must not include a body")
    profile = repo.get_profile(user.uid)
    if profile is None:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    stats, _ = repo.list_stats(user.uid, limit=50, cursor=None)
    if len(stats) < 1:
        raise HTTPException(status_code=422, detail="Add at least one basketball stat before generating insights")
    records = [
        PlayerStatRecord(
            player_id=_internal_player_id(user.uid),
            player_name=profile.displayName,
            game_date=item.occurredAt,
            points=item.points,
            assists=item.assists,
            rebounds=item.rebounds,
            steals=item.steals,
            blocks=item.blocks,
            field_goal_percentage=item.field_goal_percentage,
            three_point_percentage=item.three_point_percentage,
            result=item.result,
        )
        for item in stats
        if item.sport == "basketball"
    ]
    if not records:
        raise HTTPException(status_code=422, detail="No basketball stats are available")
    return _insight_service(request).analyze_player_stats(records)


@me_router.post("/drills/recommend")
async def recommend_drills(
    request: Request,
    user: AuthenticatedUser = Depends(get_current_user),
    repo: AthleteRepository = Depends(get_athlete_repository),
):
    body = await _optional_object_body(request)
    reject_identity_fields(body)
    controls = DrillControls.model_validate(body or {})
    profile = repo.get_profile(user.uid)
    if profile is None:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    basketball = profile.skillsBySport.get("basketball")
    if basketball is None or not basketball.skill_levels:
        raise HTTPException(
            status_code=422,
            detail="Basketball skill levels are required before recommending drills",
        )
    engine_request = DrillRecommendationRequest(
        user_id=user.uid,
        skill_levels=basketball.skill_levels,
        growth_areas=basketball.growth_areas or list(basketball.skill_levels),
        top_skills=basketball.top_skills or [],
        max_recommendations=controls.max_recommendations,
        min_difficulty=controls.min_difficulty,
        max_difficulty=controls.max_difficulty,
    )
    return _drill_service(request).get_recommendations(engine_request)


async def _optional_object_body(request: Request) -> Dict[str, Any]:
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
    return data
