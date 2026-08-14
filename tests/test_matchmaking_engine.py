from datetime import datetime, timedelta

from ai.matchmaking_engine import MatchmakingEngine
from backend.models import PlayerProfile


def make_player(player_id: int, name: str, position: str, base: float):
    skill_scores = {
        "points": base,
        "assists": base * 0.8,
        "rebounds": base * 0.9,
        "steals": base * 0.7,
        "blocks": base * 0.6,
        "field_goal_percentage": 50.0,
        "three_point_percentage": 35.0,
    }
    return PlayerProfile(
        player_id=player_id,
        name=name,
        position=position,
        skill_scores=skill_scores,
        overall_rating=0.0,
    )


def _with_ratings(engine: MatchmakingEngine, players):
    for player in players:
        player.overall_rating = engine.calculate_overall_rating(player)
    return players


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

    slot = now + timedelta(hours=2)
    for player in [p1, p2, p3, p4, p5, p6]:
        setattr(player, "availability", [slot])

    available = engine.find_available_players([p1, p2, p3, p4, p5, p6], slot)
    assert len(available) == 6

    suggested = engine.suggest_game_time(
        [p1, p2, p3, p4, p5, p6],
        team_size=3,
        start_time=now,
        end_time=now + timedelta(days=1),
    )
    assert suggested == slot


def test_create_balanced_teams():
    engine = MatchmakingEngine()
    players = _with_ratings(
        engine,
        [
            make_player(1, "A", "guard", 80),
            make_player(2, "B", "forward", 60),
            make_player(3, "C", "center", 70),
            make_player(4, "D", "guard", 75),
            make_player(5, "E", "forward", 65),
            make_player(6, "F", "center", 68),
        ],
    )

    resp = engine.create_balanced_teams(players, team_size=3, consider_positions=True)
    assert resp.is_balanced is True
    assert len(resp.team1.players) == 3
    assert len(resp.team2.players) == 3
    assert resp.balance_score > 0
    ids = [p.player_id for p in resp.team1.players + resp.team2.players]
    assert len(ids) == len(set(ids))


def test_all_guard_roster_is_not_perfectly_balanced():
    engine = MatchmakingEngine()
    players = _with_ratings(
        engine,
        [make_player(i, f"G{i}", "guard", 70) for i in range(1, 7)],
    )
    resp = engine.create_balanced_teams(players, team_size=3, consider_positions=True)
    assert resp.balance_score < 1.0
    assert resp.team1.positions["guard"] == 3
    assert resp.team2.positions["guard"] == 3


def test_duplicate_player_ids_are_deduplicated():
    engine = MatchmakingEngine()
    original = _with_ratings(
        engine,
        [
            make_player(1, "A", "guard", 80),
            make_player(2, "B", "forward", 60),
            make_player(3, "C", "center", 70),
            make_player(4, "D", "guard", 75),
            make_player(5, "E", "forward", 65),
            make_player(6, "F", "center", 68),
        ],
    )
    duplicate = make_player(1, "A-copy", "guard", 80)
    duplicate.overall_rating = original[0].overall_rating
    resp = engine.create_balanced_teams(original + [duplicate], team_size=3)
    ids = [p.player_id for p in resp.team1.players + resp.team2.players]
    assert len(ids) == 6
    assert len(set(ids)) == 6


def test_equivalent_profiles_with_distinct_ids_are_preserved():
    engine = MatchmakingEngine()
    players = _with_ratings(
        engine,
        [
            make_player(1, "CloneA", "guard", 70),
            make_player(2, "CloneB", "guard", 70),
            make_player(3, "CloneC", "forward", 70),
            make_player(4, "CloneD", "forward", 70),
            make_player(5, "CloneE", "center", 70),
            make_player(6, "CloneF", "center", 70),
        ],
    )
    resp = engine.create_balanced_teams(players, team_size=3)
    ids = [p.player_id for p in resp.team1.players + resp.team2.players]
    assert set(ids) == {1, 2, 3, 4, 5, 6}


def test_extra_players_sit_out_of_3v3():
    engine = MatchmakingEngine()
    players = _with_ratings(
        engine,
        [
            make_player(1, "A", "guard", 80),
            make_player(2, "B", "forward", 60),
            make_player(3, "C", "center", 70),
            make_player(4, "D", "guard", 75),
            make_player(5, "E", "forward", 65),
            make_player(6, "F", "center", 68),
            make_player(7, "G", "guard", 50),
            make_player(8, "H", "forward", 52),
        ],
    )
    resp = engine.create_balanced_teams(players, team_size=3)
    ids = [p.player_id for p in resp.team1.players + resp.team2.players]
    assert len(ids) == 6
    assert len(set(ids)) == 6
    assert set(ids).issubset({p.player_id for p in players})


def test_create_balanced_5v5_teams():
    engine = MatchmakingEngine()
    players = _with_ratings(
        engine,
        [
            make_player(1, "G1", "guard", 80),
            make_player(2, "G2", "guard", 78),
            make_player(3, "G3", "guard", 76),
            make_player(4, "G4", "guard", 74),
            make_player(5, "F1", "forward", 72),
            make_player(6, "F2", "forward", 70),
            make_player(7, "F3", "forward", 68),
            make_player(8, "F4", "forward", 66),
            make_player(9, "C1", "center", 84),
            make_player(10, "C2", "center", 64),
        ],
    )
    resp = engine.create_balanced_teams(players, team_size=5, consider_positions=True)
    assert len(resp.team1.players) == 5
    assert len(resp.team2.players) == 5
    ids = [p.player_id for p in resp.team1.players + resp.team2.players]
    assert len(set(ids)) == 10
    assert resp.balance_score > 0


def test_large_pool_stays_bounded():
    engine = MatchmakingEngine()
    players = _with_ratings(
        engine,
        [
            make_player(i, f"P{i}", ["guard", "forward", "center"][i % 3], 50 + (i % 20))
            for i in range(1, 21)
        ],
    )
    resp = engine.create_balanced_teams(players, team_size=5)
    ids = [p.player_id for p in resp.team1.players + resp.team2.players]
    assert len(ids) == 10
    assert len(set(ids)) == 10
