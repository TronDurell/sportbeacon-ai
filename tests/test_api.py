from fastapi.testclient import TestClient

from backend.api import app
from backend.models import (
    API_VERSION,
    SERVICE_NAME,
    DifficultyLevel,
    DrillRecommendationRequest,
    DrillScheduleRequest,
)


client = TestClient(app)


def _stat(player_id: int, name: str, points: float, result: str = "win"):
    return {
        "player_id": player_id,
        "player_name": name,
        "game_date": "2024-04-01T20:00:00",
        "points": points,
        "assists": 5,
        "rebounds": 6,
        "steals": 1,
        "blocks": 1,
        "field_goal_percentage": 48.0,
        "three_point_percentage": 35.0,
        "result": result,
    }


def test_health_endpoint_contract():
    response = client.get("/api/health")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == SERVICE_NAME
    assert body["version"] == API_VERSION
    assert set(body) >= {"status", "service", "version"}


def test_health_cors_allows_local_vite_origin():
    response = client.get(
        "/api/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_health_cors_does_not_echo_unknown_origin():
    response = client.get(
        "/api/health",
        headers={"Origin": "https://evil.example"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") != "https://evil.example"


def test_recommend_drills_accepts_user_id_and_human_difficulty():
    response = client.post(
        "/api/drills/recommend",
        json={
            "user_id": "player-1",
            "skill_levels": {"shooting": 0.4, "defense": 0.6},
            "growth_areas": ["shooting"],
            "top_skills": ["defense"],
            "max_recommendations": 3,
            "min_difficulty": "Beginner",
            "max_difficulty": "Advanced",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["user_id"] == "player-1"
    assert body["player_id"] == "player-1"
    assert body["recommended_drills"]
    assert body["recommended_drills"][0]["difficulty"] in {
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",
    }


def test_recommend_drills_accepts_player_id_alias():
    response = client.post(
        "/api/drills/recommend",
        json={
            "player_id": 99,
            "skill_levels": {"shooting": 0.4},
            "growth_areas": ["shooting"],
            "top_skills": ["defense"],
            "min_difficulty": "Beginner",
            "max_difficulty": "Advanced",
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["user_id"] == "99"


def test_schedule_drills_endpoint():
    response = client.post(
        "/api/drills/schedule",
        json={
            "user_id": "player-2",
            "available_days": ["monday", "wednesday"],
            "gym_access": True,
            "skill_levels": {"shooting": 0.5, "defense": 0.5},
            "growth_areas": ["defense"],
            "min_difficulty": "Beginner",
            "max_difficulty": "Advanced",
            "max_drills_per_day": 2,
            "max_duration_per_day": 40,
            "preferred_training_format": "partner",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["user_id"] == "player-2"
    scheduled = [drill for drills in body["weekly_schedule"].values() for drill in drills]
    assert scheduled
    assert all(drill["training_format"] == "partner" for drill in scheduled)
    represented = sum(drill["duration"] for drill in scheduled)
    assert body["total_duration"] == represented


def test_schedule_normalizes_days_and_rejects_invalid_days():
    ok = client.post(
        "/api/drills/schedule",
        json={
            "user_id": "player-2",
            "available_days": ["Tuesday"],
            "gym_access": True,
            "skill_levels": {"shooting": 0.5},
            "growth_areas": ["shooting"],
            "min_difficulty": "Beginner",
            "max_difficulty": "Advanced",
        },
    )
    assert ok.status_code == 200, ok.text
    assert "tuesday" in ok.json()["weekly_schedule"]

    empty = client.post(
        "/api/drills/schedule",
        json={
            "user_id": "player-2",
            "available_days": [],
            "gym_access": True,
            "skill_levels": {"shooting": 0.5},
            "growth_areas": ["shooting"],
        },
    )
    assert empty.status_code == 422

    invalid = client.post(
        "/api/drills/schedule",
        json={
            "user_id": "player-2",
            "available_days": ["funday"],
            "gym_access": True,
            "skill_levels": {"shooting": 0.5},
            "growth_areas": ["shooting"],
        },
    )
    assert invalid.status_code == 422

    duplicate = client.post(
        "/api/drills/schedule",
        json={
            "user_id": "player-2",
            "available_days": ["Monday", "monday"],
            "gym_access": True,
            "skill_levels": {"shooting": 0.5},
            "growth_areas": ["shooting"],
        },
    )
    assert duplicate.status_code == 422


def test_invalid_difficulty_range_returns_validation_error():
    response = client.post(
        "/api/drills/recommend",
        json={
            "user_id": "player-3",
            "skill_levels": {"shooting": 0.4},
            "growth_areas": ["shooting"],
            "top_skills": ["defense"],
            "min_difficulty": "Advanced",
            "max_difficulty": "Beginner",
        },
    )
    assert response.status_code == 422
    assert response.status_code != 500


def test_invalid_schedule_limit_returns_validation_error():
    response = client.post(
        "/api/drills/schedule",
        json={
            "user_id": "player-4",
            "available_days": ["monday"],
            "gym_access": True,
            "skill_levels": {"shooting": 0.5},
            "growth_areas": ["shooting"],
            "max_drills_per_day": 0,
            "max_duration_per_day": 40,
        },
    )
    assert response.status_code == 422


def test_analyze_player_endpoint():
    response = client.post(
        "/api/players/analyze",
        json=[
            _stat(1, "John Smith", 18, "loss"),
            _stat(1, "John Smith", 22, "win"),
            _stat(1, "John Smith", 30, "win"),
        ],
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["player_name"] == "John Smith"
    assert "top_skills" in body
    assert "recent_trends" in body


def test_analyze_invalid_payload_returns_validation_error():
    response = client.post("/api/players/analyze", json=[])
    assert response.status_code == 422
    bad = _stat(1, "John Smith", 18)
    bad["points"] = "hot-hand"
    response = client.post("/api/players/analyze", json=[bad])
    assert response.status_code == 422


def test_matchmaking_endpoint_3v3():
    players = []
    names = ["A", "B", "C", "D", "E", "F"]
    for idx, name in enumerate(names, start=1):
        row = _stat(idx, name, 20 + idx)
        row["game_date"] = f"2024-04-0{idx}T20:00:00"
        players.append(row)
    response = client.post(
        "/api/matchmaking/create-teams",
        json={"team_size": 3, "consider_positions": True, "players": players},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["team1"]["players"]) == 3
    assert len(body["team2"]["players"]) == 3


def test_matchmaking_invalid_team_size_returns_validation_error():
    response = client.post(
        "/api/matchmaking/create-teams",
        json={"team_size": 4, "players": [_stat(1, "A", 20)]},
    )
    assert response.status_code == 422


def test_models_accept_human_readable_difficulty():
    request = DrillRecommendationRequest(
        user_id="abc",
        skill_levels={"shooting": 0.5},
        growth_areas=["shooting"],
        top_skills=[],
        min_difficulty="Beginner",
        max_difficulty="Advanced",
    )
    assert request.min_difficulty == DifficultyLevel.BEGINNER
    schedule = DrillScheduleRequest(
        player_id="xyz",
        available_days=["monday"],
        gym_access=True,
        skill_levels={"defense": 0.4},
        growth_areas=["defense"],
        min_difficulty="Beginner",
        max_difficulty="Advanced",
    )
    assert schedule.user_id == "xyz"
