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
                previous_avg = player_stats[col].tail(window_size * 2).head(window_size).mean()
                trends[col] = ((current_avg - previous_avg) / previous_avg) * 100
        return trends

    def _calculate_weighted_skill_score(
        self,
        stats: pd.Series,
        recent_weight: float = 0.7
    ) -> Tuple[float, float]:
        """
        Calculate weighted skill score giving more importance to recent performance.
        
        Args:
            stats: Time series of a specific stat
            recent_weight: Weight given to recent performance (0-1)
            
        Returns:
            Tuple of (weighted score, raw percentile)
        """
        if len(stats) < 2:
            return (float(stats.iloc[-1]), float(stats.iloc[-1]))
            
        # Calculate recent and overall percentiles
        recent_window = min(5, len(stats) // 2)
        recent_stats = stats.tail(recent_window)
        recent_percentile = np.percentile(recent_stats, 75)
        
        overall_percentile = np.percentile(stats, 75)
        
        # Combine with weighting
        weighted_score = (
            recent_weight * recent_percentile +
            (1 - recent_weight) * overall_percentile
        )
        
        return (weighted_score, overall_percentile)

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
        top_skills = []
        
        for col in self._stats_columns:
            if col in player_stats.columns:
                weighted_score, raw_percentile = self._calculate_weighted_skill_score(
                    player_stats[col],
                    recent_weight
                )
                
                # Consider a skill as top if either weighted score or raw percentile is high
                if weighted_score >= np.percentile(player_stats[col], percentile_threshold):
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