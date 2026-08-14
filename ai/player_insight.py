from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


class PlayerInsightEngine:
    def __init__(self):
        self.scaler = StandardScaler()
        self._stats_columns = [
            "points",
            "assists",
            "rebounds",
            "steals",
            "blocks",
            "field_goal_percentage",
            "three_point_percentage",
        ]

    def _available_stat_columns(self, stats_df: pd.DataFrame) -> List[str]:
        if stats_df is None or stats_df.empty:
            return []
        return [col for col in self._stats_columns if col in stats_df.columns]

    def normalize_stats(self, stats_df: pd.DataFrame) -> pd.DataFrame:
        """Normalize player statistics using StandardScaler where variance exists."""
        if stats_df is None or stats_df.empty:
            return pd.DataFrame() if stats_df is None else stats_df.copy()

        normalized_stats = stats_df.copy()
        cols = self._available_stat_columns(stats_df)
        if not cols:
            return normalized_stats

        scalable: List[str] = []
        for col in cols:
            series = pd.to_numeric(stats_df[col], errors="coerce")
            if series.nunique(dropna=True) <= 1 or float(series.std(ddof=0) or 0.0) == 0.0:
                normalized_stats[col] = 0.0
            else:
                scalable.append(col)

        if scalable:
            normalized_stats[scalable] = self.scaler.fit_transform(stats_df[scalable])
        return normalized_stats

    @staticmethod
    def _trend_windows(series: pd.Series, window_size: int) -> Tuple[pd.Series, pd.Series]:
        """Split a series into non-overlapping previous and current windows.

        Current is the latest `window_size` observations. Previous is the
        `window_size` observations immediately before that, never overlapping
        even when the history is longer than `window_size * 2`.
        """
        current = series.iloc[-window_size:]
        previous = series.iloc[:-window_size].iloc[-window_size:]
        return previous, current

    def calculate_player_trends(
        self, player_stats: pd.DataFrame, window_size: int = 5
    ) -> Dict[str, float]:
        """Calculate recent performance trends from raw statistics, not z-scores."""
        trends: Dict[str, float] = {}
        if player_stats is None or player_stats.empty or window_size < 1:
            return trends

        for col in self._available_stat_columns(player_stats):
            series = pd.to_numeric(player_stats[col], errors="coerce").dropna()
            if len(series) == 0:
                continue
            if len(series) < 2:
                trends[col] = 0.0
                continue

            previous_window, current_window = self._trend_windows(series, window_size)
            if previous_window.empty or current_window.empty:
                trends[col] = 0.0
                continue

            current_avg = float(current_window.mean())
            previous_avg = float(previous_window.mean())

            if previous_avg == 0.0:
                if current_avg == 0.0:
                    trends[col] = 0.0
                else:
                    trends[col] = 100.0 if current_avg > 0 else -100.0
            else:
                trends[col] = float(((current_avg - previous_avg) / abs(previous_avg)) * 100.0)
        return trends

    def _unit_scale(self, stats: pd.Series) -> pd.Series:
        """Scale a series to 0-1 so counting stats and percentages are comparable."""
        numeric = pd.to_numeric(stats, errors="coerce").dropna()
        if len(numeric) == 0:
            return numeric
        low = float(numeric.min())
        high = float(numeric.max())
        span = high - low
        typical = max(abs(low), abs(high), 1.0)
        if span <= 1e-9 or span / typical < 0.05:
            return pd.Series(np.full(len(numeric), 0.5), index=numeric.index)
        return (numeric - low) / span

    def _robust_recent_mean(self, stats: pd.Series, window_size: int) -> float:
        """Average the recent window while ignoring a lone outlier spike."""
        recent = stats.tail(window_size)
        if len(recent) >= 3:
            q1 = float(recent.quantile(0.25))
            q3 = float(recent.quantile(0.75))
            iqr = q3 - q1
            if iqr == 0:
                mode = float(recent.mode().iloc[0]) if not recent.mode().empty else float(recent.median())
                filtered = recent[recent == mode]
            else:
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                filtered = recent[(recent >= lower) & (recent <= upper)]
            if len(filtered):
                return float(filtered.mean())
        return float(recent.mean())

    def _calculate_weighted_skill_score(
        self, stats: pd.Series, recent_weight: float = 0.7
    ) -> Tuple[float, float]:
        """Calculate weighted score and percentile rank of recent performance."""
        if len(stats) == 0:
            return (0.0, 0.0)
        if len(stats) == 1:
            value = float(stats.iloc[-1])
            return (value, 100.0)

        weight = min(1.0, max(0.0, float(recent_weight)))
        recent_window = max(1, min(5, len(stats)))
        recent_mean = self._robust_recent_mean(stats, recent_window)
        overall_mean = float(stats.mean())
        weighted_value = weight * recent_mean + (1.0 - weight) * overall_mean

        values = stats.to_numpy(dtype=float)
        percentile_rank = float((values <= weighted_value).sum() / len(values) * 100.0)
        return (weighted_value, percentile_rank)

    def identify_top_skills(
        self,
        player_stats: pd.DataFrame,
        percentile_threshold: float = 75,
        recent_weight: float = 0.7,
    ) -> List[str]:
        """
        Identify a player's top skills using a recent/overall weighted score.

        `recent_weight` blends a robust recent-window mean with career mean.
        A single final-game spike is not enough to identify a skill.
        """
        if player_stats is None or player_stats.empty:
            return []

        skill_scores: Dict[str, float] = {}
        for col in self._available_stat_columns(player_stats):
            series = pd.to_numeric(player_stats[col], errors="coerce").dropna()
            if len(series) == 0:
                continue
            scaled = self._unit_scale(series)
            weight = min(1.0, max(0.0, float(recent_weight)))
            weighted_value, _ = self._calculate_weighted_skill_score(scaled, weight)
            window = max(1, min(5, len(scaled)))
            recent_mean = self._robust_recent_mean(scaled, window)
            overall_mean = float(scaled.mean())
            upward_trend = max(recent_mean - overall_mean, 0.0)
            skill_scores[col] = weighted_value + weight * upward_trend

        if not skill_scores:
            return []

        values = np.array(list(skill_scores.values()), dtype=float)
        cutoff = float(np.percentile(values, percentile_threshold))
        return [skill for skill, score in skill_scores.items() if score >= cutoff]

    def get_growth_areas(
        self, player_stats: pd.DataFrame, percentile_threshold: float = 25
    ) -> List[str]:
        """Identify areas where a player needs improvement."""
        if player_stats is None or player_stats.empty:
            return []

        growth_areas: List[str] = []
        for col in self._available_stat_columns(player_stats):
            series = pd.to_numeric(player_stats[col], errors="coerce").dropna()
            if len(series) == 0:
                continue
            if len(series) == 1:
                continue
            percentile = np.percentile(series, percentile_threshold)
            if series.iloc[-1] <= percentile:
                growth_areas.append(col)
        return growth_areas

    def calculate_win_rate(
        self, player_stats: pd.DataFrame, time_period: Optional[timedelta] = None
    ) -> float:
        """Calculate player's win rate for a given time period."""
        if player_stats is None or player_stats.empty:
            return 0.0

        filtered = player_stats
        if time_period is not None:
            if "game_date" not in player_stats.columns:
                return 0.0
            cutoff_date = datetime.now() - time_period
            filtered = player_stats[player_stats["game_date"] >= cutoff_date]

        total_games = len(filtered)
        if total_games == 0 or "result" not in filtered.columns:
            return 0.0

        wins = len(filtered[filtered["result"] == "win"])
        return (wins / total_games) * 100

    def generate_player_report(self, player_stats: pd.DataFrame) -> Dict[str, object]:
        """Generate a comprehensive player performance report from raw stats."""
        if player_stats is None or player_stats.empty:
            return {
                "top_skills": [],
                "growth_areas": [],
                "recent_trends": {},
                "win_rate": 0.0,
            }

        return {
            "top_skills": self.identify_top_skills(player_stats),
            "growth_areas": self.get_growth_areas(player_stats),
            "recent_trends": self.calculate_player_trends(player_stats),
            "win_rate": self.calculate_win_rate(
                player_stats, time_period=timedelta(days=30)
            ),
        }
