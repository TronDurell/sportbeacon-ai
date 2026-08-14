import numpy as np
import pandas as pd
import pytest

from ai.player_insight import PlayerInsightEngine


def make_sample_stats():
    dates = pd.date_range("2024-01-01", periods=10, freq="D")
    # Create a strong upward trend in points so it's clearly a top skill
    points = [5, 6, 7, 8, 10, 12, 15, 18, 22, 30]
    # Other stats vary mildly without strong recent surge
    assists = [3, 4, 3, 4, 4, 3, 4, 3, 4, 4]
    rebounds = [5, 5, 6, 5, 6, 5, 6, 5, 6, 5]
    steals = [1, 1, 1, 2, 1, 1, 2, 1, 1, 1]
    blocks = [0, 1, 0, 1, 1, 0, 1, 0, 1, 0]
    fgp = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49]
    tpp = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39]
    result = ["loss", "loss", "loss", "loss", "loss", "win", "win", "win", "win", "win"]

    return pd.DataFrame({
        "game_date": dates,
        "points": points,
        "assists": assists,
        "rebounds": rebounds,
        "steals": steals,
        "blocks": blocks,
        "field_goal_percentage": fgp,
        "three_point_percentage": tpp,
        "result": result,
    })


def test_normalize_stats_means_and_stds():
    engine = PlayerInsightEngine()
    df = make_sample_stats()
    norm = engine.normalize_stats(df)

    cols = [
        "points",
        "assists",
        "rebounds",
        "steals",
        "blocks",
        "field_goal_percentage",
        "three_point_percentage",
    ]

    for col in cols:
        col_mean = float(np.mean(norm[col]))
        col_std = float(np.std(norm[col], ddof=0))
        assert abs(col_mean) < 1e-7
        # std may be zero for near-constant columns, but should be ~1 otherwise
        if df[col].nunique() > 1:
            assert 0.9 < col_std < 1.1


def test_identify_top_skills_points_detected():
    engine = PlayerInsightEngine()
    df = make_sample_stats()
    top_skills = engine.identify_top_skills(df, percentile_threshold=60, recent_weight=0.9)

    assert "points" in top_skills
    assert "blocks" not in top_skills


def test_recent_weight_changes_top_skills():
    engine = PlayerInsightEngine()
    df = pd.DataFrame({
        "points": [90, 90, 90, 90, 90, 90, 90, 10, 10, 10],
        "assists": [10, 10, 10, 10, 10, 10, 10, 90, 90, 90],
        "rebounds": [40, 41, 40, 41, 40, 41, 40, 41, 40, 41],
        "steals": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        "blocks": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        "field_goal_percentage": [45, 45, 45, 45, 45, 45, 45, 45, 45, 45],
        "three_point_percentage": [33, 33, 33, 33, 33, 33, 33, 33, 33, 33],
    })

    recent_focus = engine.identify_top_skills(df, percentile_threshold=90, recent_weight=0.95)
    career_focus = engine.identify_top_skills(df, percentile_threshold=90, recent_weight=0.05)

    assert recent_focus != career_focus
    assert "assists" in recent_focus
    assert "points" in career_focus
    assert "points" not in recent_focus
    assert "assists" not in career_focus


def test_single_game_spike_is_not_enough_for_top_skill():
    engine = PlayerInsightEngine()
    df = pd.DataFrame({
        "points": [20, 21, 20, 22, 21, 20, 22, 21, 20, 21],
        "assists": [6, 6, 7, 6, 6, 7, 6, 6, 7, 6],
        "rebounds": [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
        "steals": [1, 1, 1, 1, 1, 1, 1, 1, 1, 40],
        "blocks": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        "field_goal_percentage": [48, 49, 48, 49, 48, 49, 48, 49, 48, 49],
        "three_point_percentage": [35, 35, 36, 35, 35, 36, 35, 35, 36, 35],
    })
    top_skills = engine.identify_top_skills(df, percentile_threshold=75, recent_weight=0.7)
    assert "steals" not in top_skills


def test_trends_use_raw_stats_and_keep_direction():
    engine = PlayerInsightEngine()
    df = make_sample_stats()
    raw_trends = engine.calculate_player_trends(df)
    normalized_trends = engine.calculate_player_trends(engine.normalize_stats(df))

    assert raw_trends["points"] > 0
    assert raw_trends["points"] != pytest.approx(normalized_trends["points"])
    report = engine.generate_player_report(df)
    assert report["recent_trends"]["points"] == pytest.approx(raw_trends["points"])


def test_empty_and_one_game_histories_are_safe():
    engine = PlayerInsightEngine()
    empty = pd.DataFrame()
    assert engine.identify_top_skills(empty) == []
    assert engine.get_growth_areas(empty) == []
    assert engine.calculate_player_trends(empty) == {}
    assert engine.calculate_win_rate(empty) == 0.0
    assert engine.generate_player_report(empty)["top_skills"] == []

    one_game = pd.DataFrame({
        "points": [12],
        "assists": [4],
        "result": ["win"],
    })
    assert engine.identify_top_skills(one_game)
    assert engine.calculate_player_trends(one_game)["points"] == 0.0
    assert engine.get_growth_areas(one_game) == []
    assert engine.normalize_stats(one_game)["points"].iloc[0] == 0.0


def test_constant_stats_zero_baseline_and_missing_columns_are_safe():
    engine = PlayerInsightEngine()
    df = pd.DataFrame({
        "points": [0, 0, 0, 0, 0, 8, 8, 8, 8, 8],
        "assists": [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    })
    trends = engine.calculate_player_trends(df)
    assert trends["assists"] == 0.0
    assert trends["points"] > 0
    normalized = engine.normalize_stats(df)
    assert list(normalized["assists"].unique()) == [0.0]
    assert "rebounds" not in engine.identify_top_skills(df)
    assert engine.calculate_win_rate(df) == 0.0


def test_trend_windows_do_not_overlap_for_histories_longer_than_ten():
    engine = PlayerInsightEngine()
    values = list(range(1, 21))
    series = pd.Series(values)
    previous, current = engine._trend_windows(series, 5)

    assert len(values) == 20
    assert list(current) == [16, 17, 18, 19, 20]
    assert list(previous) == [11, 12, 13, 14, 15]
    assert set(previous.index).isdisjoint(set(current.index))

    longer = list(range(1, 26))
    prev_25, curr_25 = engine._trend_windows(pd.Series(longer), 5)
    assert list(curr_25) == [21, 22, 23, 24, 25]
    assert list(prev_25) == [16, 17, 18, 19, 20]
    assert set(prev_25.index).isdisjoint(set(curr_25.index))

    df = pd.DataFrame({"points": values})
    expected = ((18.0 - 13.0) / 13.0) * 100.0
    assert engine.calculate_player_trends(df, window_size=5)["points"] == pytest.approx(expected)
