import pandas as pd
import numpy as np

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
        'points', 'assists', 'rebounds', 'steals', 'blocks',
        'field_goal_percentage', 'three_point_percentage'
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
    norm = engine.normalize_stats(df)

    top_skills = engine.identify_top_skills(norm, percentile_threshold=90, recent_weight=0.9)

    assert 'points' in top_skills
    # With high threshold and mild variance, blocks should generally not qualify
    assert 'blocks' not in top_skills

