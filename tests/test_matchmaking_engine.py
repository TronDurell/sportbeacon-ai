from datetime import datetime, timedelta

from ai.matchmaking_engine import MatchmakingEngine
from backend.models import PlayerProfile


def make_player(player_id: int, name: str, position: str, base: float):
    # Skill set touches the weighted keys used by the engine
    skill_scores = {
        'points': base,
        'assists': base * 0.8,
        'rebounds': base * 0.9,
        'steals': base * 0.7,
        'blocks': base * 0.6,
        'field_goal_percentage': 50.0,
        'three_point_percentage': 35.0,
    }
    return PlayerProfile(
        player_id=player_id,
        name=name,
        position=position,
        skill_scores=skill_scores,
        overall_rating=0.0,
    )


def test_calculate_overall_rating():
    engine = MatchmakingEngine()
    player = make_player(1, "A", "guard", 80)
    rating = engine.calculate_overall_rating(player)
    assert rating > 0


def test_find_available_players_and_suggest_time():
    engine = MatchmakingEngine()
    now = datetime.now()

    p1 = make_player(1, "A", "guard", 70)
    p2 = make_player(2, "B", "forward", 65)
    p3 = make_player(3, "C", "center", 60)
    p4 = make_player(4, "D", "guard", 75)
    p5 = make_player(5, "E", "forward", 68)
    p6 = make_player(6, "F", "center", 72)

    # Attach availability attributes dynamically for testing
    slot = now + timedelta(hours=2)
    for p in [p1, p2, p3, p4, p5, p6]:
        setattr(p, 'availability', [slot])

    available = engine.find_available_players([p1, p2, p3, p4, p5, p6], slot)
    assert len(available) == 6

    suggested = engine.suggest_game_time([p1, p2, p3, p4, p5, p6], team_size=3, start_time=now, end_time=now + timedelta(days=1))
    assert suggested == slot


def test_create_balanced_teams():
    engine = MatchmakingEngine()

    players = [
        make_player(1, "A", "guard", 80),
        make_player(2, "B", "forward", 60),
        make_player(3, "C", "center", 70),
        make_player(4, "D", "guard", 75),
        make_player(5, "E", "forward", 65),
        make_player(6, "F", "center", 68),
    ]

    # Set overall_rating consistent with engine's calculation
    for p in players:
        p.overall_rating = engine.calculate_overall_rating(p)

    resp = engine.create_balanced_teams(players, team_size=3, consider_positions=True)
    assert resp.is_balanced is True
    assert len(resp.team1.players) == 3
    assert len(resp.team2.players) == 3
    assert resp.balance_score > 0

