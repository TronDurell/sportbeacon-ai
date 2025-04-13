from datetime import datetime, timedelta
import pandas as pd
from typing import List, Dict, Optional
from ai.player_insight import PlayerInsightEngine
from .models import PlayerStatRecord, PlayerAnalysisResponse, PlayerInsightResponse

class PlayerInsightService:
    def __init__(self):
        self.player_engine = PlayerInsightEngine()

    def analyze_player_stats(self, stats: List[PlayerStatRecord]) -> PlayerAnalysisResponse:
        """Analyze player statistics to generate insights."""
        # Convert stats to DataFrame
        df = pd.DataFrame([stat.dict() for stat in stats])
        
        # Sort by game date to ensure chronological order
        df = df.sort_values('game_date')
        
        # Generate normalized stats
        normalized_stats = self.player_engine.normalize_stats(df)
        
        # Get the player name from the most recent entry
        player_name = df.iloc[-1].player_name
        
        # Calculate all insights
        top_skills = self.player_engine.identify_top_skills(normalized_stats)
        growth_areas = self.player_engine.get_growth_areas(normalized_stats)
        recent_trends = self.player_engine.calculate_player_trends(normalized_stats)
        
        # Get the most recent normalized stats
        latest_stats = {
            col: float(normalized_stats[col].iloc[-1])
            for col in self.player_engine._stats_columns
            if col in normalized_stats.columns
        }
        
        return PlayerAnalysisResponse(
            player_name=player_name,
            normalized_stats=latest_stats,
            top_skills=top_skills,
            growth_areas=growth_areas,
            recent_trends=recent_trends
        )

    def get_top_winners(
        self,
        time_period_days: int = 30,
        limit: int = 5
    ) -> List[Dict]:
        """Get top players by win rate for the specified time period."""
        # Load player data
        player_data = self._load_player_data()
        
        # Calculate win rates for all players
        player_stats = []
        unique_players = player_data['player_id'].unique()
        
        for player_id in unique_players:
            player_games = player_data[player_data['player_id'] == player_id]
            win_rate = self.player_engine.calculate_win_rate(
                player_games,
                time_period=timedelta(days=time_period_days)
            )
            
            if len(player_games) > 0:
                latest_game = player_games.iloc[-1]
                player_stats.append({
                    'player_id': player_id,
                    'player_name': latest_game['player_name'],
                    'win_rate': win_rate,
                    'games_played': len(player_games),
                    'avg_points': player_games['points'].mean(),
                    'avg_assists': player_games['assists'].mean(),
                    'avg_rebounds': player_games['rebounds'].mean()
                })
        
        # Sort by win rate and get top players
        return sorted(
            player_stats,
            key=lambda x: x['win_rate'],
            reverse=True
        )[:limit]

    def _load_player_data(self) -> pd.DataFrame:
        """Load player statistics from the data source."""
        # This is a mock implementation - replace with actual database connection
        return pd.DataFrame({
            'player_id': range(1, 101),
            'player_name': [f'Player_{i}' for i in range(1, 101)],
            'game_date': [datetime.now() - timedelta(days=i % 30) for i in range(100)],
            'result': ['win' if i % 3 == 0 else 'loss' for i in range(100)],
            'points': [20 + i % 10 for i in range(100)],
            'assists': [5 + i % 5 for i in range(100)],
            'rebounds': [8 + i % 7 for i in range(100)],
            'steals': [2 + i % 3 for i in range(100)],
            'blocks': [1 + i % 2 for i in range(100)],
            'field_goal_percentage': [45 + i % 10 for i in range(100)],
            'three_point_percentage': [35 + i % 10 for i in range(100)]
        }) 