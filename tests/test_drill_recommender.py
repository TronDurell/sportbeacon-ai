import pytest

from backend.models import (
    DifficultyLevel,
    DrillRecommendationRequest,
    DrillScheduleRequest,
    TrainingFormat,
)
from ai.drill_recommender import DrillRecommendationEngine


def _recommendation_request(**overrides):
    payload = dict(
        user_id="u1",
        skill_levels={"shooting": 0.4, "defense": 0.6},
        growth_areas=["shooting"],
        top_skills=["defense"],
        max_recommendations=3,
        min_difficulty=DifficultyLevel.BEGINNER,
        max_difficulty=DifficultyLevel.ADVANCED,
    )
    payload.update(overrides)
    return DrillRecommendationRequest(**payload)


def _schedule_request(**overrides):
    payload = dict(
        user_id="u2",
        available_days=["monday", "wednesday"],
        gym_access=True,
        skill_levels={"shooting": 0.5, "defense": 0.5},
        growth_areas=["shooting"],
        min_difficulty=DifficultyLevel.BEGINNER,
        max_difficulty=DifficultyLevel.ADVANCED,
        max_drills_per_day=2,
        max_duration_per_day=40,
        preferred_training_format=None,
    )
    payload.update(overrides)
    return DrillScheduleRequest(**payload)


def test_get_recommendations_basic():
    engine = DrillRecommendationEngine()
    resp = engine.get_recommendations(_recommendation_request())
    assert len(resp.recommended_drills) <= 3
    assert any("Shooting" in d.name for d in resp.recommended_drills)
    assert resp.user_id == "u1"
    assert resp.player_id == "u1"


def test_create_weekly_schedule_respects_limits():
    engine = DrillRecommendationEngine()
    resp = engine.create_weekly_schedule(_schedule_request())
    for day in ["monday", "wednesday"]:
        drills = resp.weekly_schedule.get(day, [])
        assert len(drills) <= 2
        assert sum(d.duration for d in drills) <= 40


def test_weekly_schedule_honors_gym_access():
    engine = DrillRecommendationEngine()
    resp = engine.create_weekly_schedule(_schedule_request(gym_access=False))
    for drills in resp.weekly_schedule.values():
        assert all(not drill.requires_gym for drill in drills)


def test_weekly_schedule_is_deterministic():
    engine = DrillRecommendationEngine()
    request = _schedule_request()
    first = engine.create_weekly_schedule(request)
    second = engine.create_weekly_schedule(request)
    assert first.weekly_schedule == second.weekly_schedule


def test_growth_areas_produce_different_schedules():
    engine = DrillRecommendationEngine()
    shooting = engine.create_weekly_schedule(_schedule_request(growth_areas=["shooting"]))
    defense = engine.create_weekly_schedule(_schedule_request(growth_areas=["defense"]))

    shooting_ids = [d.id for d in shooting.weekly_schedule["monday"]]
    defense_ids = [d.id for d in defense.weekly_schedule["monday"]]
    assert shooting_ids != defense_ids
    assert any("shooting" in d.target_skills for d in shooting.weekly_schedule["monday"])
    assert any("defense" in d.target_skills for d in defense.weekly_schedule["monday"])


def test_partner_only_schedule_returns_only_partner_drills():
    engine = DrillRecommendationEngine()
    resp = engine.create_weekly_schedule(
        _schedule_request(preferred_training_format=TrainingFormat.PARTNER)
    )
    scheduled = [drill for drills in resp.weekly_schedule.values() for drill in drills]
    assert scheduled
    assert all(drill.training_format == TrainingFormat.PARTNER for drill in scheduled)


def test_invalid_duration_limit_raises():
    engine = DrillRecommendationEngine()
    request = _schedule_request()
    request.max_duration_per_day = 0
    with pytest.raises(ValueError, match="max_duration_per_day"):
        engine.create_weekly_schedule(request)


def test_invalid_drill_count_limit_raises():
    engine = DrillRecommendationEngine()
    request = _schedule_request()
    request.max_drills_per_day = 0
    with pytest.raises(ValueError, match="max_drills_per_day"):
        engine.create_weekly_schedule(request)


def test_min_difficulty_greater_than_max_raises():
    with pytest.raises(ValueError, match="min_difficulty"):
        _schedule_request(
            min_difficulty=DifficultyLevel.ADVANCED,
            max_difficulty=DifficultyLevel.BEGINNER,
        )


def test_available_days_are_normalized_to_lowercase():
    request = _schedule_request(available_days=["Monday", " WEDNESDAY "])
    assert request.available_days == ["monday", "wednesday"]


def test_available_days_reject_empty_invalid_and_duplicates():
    with pytest.raises(ValueError, match="at least one"):
        _schedule_request(available_days=[])
    with pytest.raises(ValueError, match="Monday through Sunday"):
        _schedule_request(available_days=["funday"])
    with pytest.raises(ValueError, match="duplicate"):
        _schedule_request(available_days=["Monday", "monday"])


def test_total_duration_matches_weekly_schedule():
    engine = DrillRecommendationEngine()
    resp = engine.create_weekly_schedule(_schedule_request())
    scheduled_duration = sum(
        drill.duration for drills in resp.weekly_schedule.values() for drill in drills
    )
    assert resp.total_duration == scheduled_duration
