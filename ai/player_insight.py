import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

class PlayerInsightEngine:
    def __init__(self):
        self.scaler = StandardScaler()
        self._stats_columns = [
            'points', 'assists', 'rebounds', 'steals', 'blocks',
            'field_goal_percentage', 'three_point_percentage'
        ]

    def normalize_stats(self, stats_df: pd.DataFrame) -> pd.DataFrame:
        """Normalize player statistics using StandardScaler."""
        normalized_stats = stats_df.copy()
        normalized_stats[self._stats_columns] = self.scaler.fit_transform(
            stats_df[self._stats_columns]
        )
        return normalized_stats

    def calculate_player_trends(
        self, 
        player_stats: pd.DataFrame,
        window_size: int = 5
    ) -> Dict[str, float]:
        """Calculate recent performance trends using rolling averages."""
        trends = {}
        for col in self._stats_columns:
            if col in player_stats.columns:
                current_avg = player_stats[col].tail(window_size).mean()
                previous_window = player_stats[col].tail(window_size * 2).head(window_size)
                previous_avg = previous_window.mean()
                if previous_avg == 0 or pd.isna(previous_avg):
                    trends[col] = float(current_avg * 100.0)
                else:
                    trends[col] = float(((current_avg - previous_avg) / previous_avg) * 100.0)
        return trends

    def _calculate_weighted_skill_score(
        self,
        stats: pd.Series,
        recent_weight: float = 0.7
    ) -> Tuple[float, float]:
        """Calculate weighted score and percentile rank of recent performance."""
        if len(stats) == 0:
            return (0.0, 0.0)
        if len(stats) == 1:
            value = float(stats.iloc[-1])
            # Percentile rank of single value among itself is 100
            return (value, 100.0)

        recent_window = max(1, min(5, len(stats)))
        recent_mean = float(stats.tail(recent_window).mean())
        overall_mean = float(stats.mean())
        weighted_value = recent_weight * recent_mean + (1.0 - recent_weight) * overall_mean

        # Percentile rank of weighted_value within the series distribution
        values = stats.to_numpy()
        percentile_rank = float((values <= weighted_value).sum() / len(values) * 100.0)
        return (weighted_value, percentile_rank)

    def identify_top_skills(
        self,
        player_stats: pd.DataFrame,
        percentile_threshold: float = 75,
        recent_weight: float = 0.7
    ) -> List[str]:
        """
        Identify a player's top skills based on percentile rankings,
        with higher weight given to recent performance.
        
        Args:
            player_stats: DataFrame containing player statistics
            percentile_threshold: Threshold to consider a skill as top skill
            recent_weight: Weight given to recent performance (0-1)
            
        Returns:
            List of top skills
        """
        top_skills: List[str] = []
        for col in self._stats_columns:
            if col in player_stats.columns:
                values = player_stats[col].to_numpy()
                if len(values) == 0:
                    continue
                last_val = float(values[-1])
                # Percentile rank of the latest performance within the series
                percentile_rank = float(((values <= last_val).sum() / len(values)) * 100.0)
                if percentile_rank >= float(percentile_threshold):
                    top_skills.append(col)
        return top_skills

    def get_growth_areas(
        self, 
        player_stats: pd.DataFrame,
        percentile_threshold: float = 25
    ) -> List[str]:
        """Identify areas where a player needs improvement."""
        growth_areas = []
        for col in self._stats_columns:
            if col in player_stats.columns:
                percentile = np.percentile(player_stats[col], percentile_threshold)
                if player_stats[col].iloc[-1] <= percentile:
                    growth_areas.append(col)
        return growth_areas

    def calculate_win_rate(
        self,
        player_stats: pd.DataFrame,
        time_period: Optional[timedelta] = None
    ) -> float:
        """Calculate player's win rate for a given time period."""
        if time_period:
            cutoff_date = datetime.now() - time_period
            player_stats = player_stats[player_stats['game_date'] >= cutoff_date]
        
        total_games = len(player_stats)
        if total_games == 0:
            return 0.0
            
        wins = len(player_stats[player_stats['result'] == 'win'])
        return (wins / total_games) * 100

    def generate_player_report(
        self,
        player_stats: pd.DataFrame
    ) -> Dict[str, any]:
        """Generate a comprehensive player performance report."""
        normalized_stats = self.normalize_stats(player_stats)
        
        return {
            'top_skills': self.identify_top_skills(normalized_stats),
            'growth_areas': self.get_growth_areas(normalized_stats),
            'recent_trends': self.calculate_player_trends(normalized_stats),
            'win_rate': self.calculate_win_rate(
                player_stats,
                time_period=timedelta(days=30)
            )
        } 