from backend.models import DrillRecommendationRequest, DrillScheduleRequest, DifficultyLevel
from ai.drill_recommender import DrillRecommendationEngine


def test_get_recommendations_basic():
    engine = DrillRecommendationEngine()
    req = DrillRecommendationRequest(
        user_id="u1",
        skill_levels={"shooting": 0.4, "defense": 0.6},
        growth_areas=["shooting"],
        top_skills=["defense"],
        max_recommendations=3,
        min_difficulty=DifficultyLevel.BEGINNER,
        max_difficulty=DifficultyLevel.ADVANCED,
    )
    resp = engine.get_recommendations(req)
    assert len(resp.recommended_drills) <= 3
    assert any("Shooting" in d.name for d in resp.recommended_drills)


def test_create_weekly_schedule_respects_limits():
    engine = DrillRecommendationEngine()
    req = DrillScheduleRequest(
        user_id="u2",
        available_days=["monday", "wednesday"],
        gym_access=True,
        skill_levels={"shooting": 0.5},
        growth_areas=["shooting"],
        min_difficulty=DifficultyLevel.BEGINNER,
        max_difficulty=DifficultyLevel.ADVANCED,
        max_drills_per_day=2,
        max_duration_per_day=40,
        preferred_training_format=None,
    )
    resp = engine.create_weekly_schedule(req)
    for day in ["monday", "wednesday"]:
        drills = resp.weekly_schedule.get(day, [])
        assert len(drills) <= 2
        assert sum(d.duration for d in drills) <= 40
