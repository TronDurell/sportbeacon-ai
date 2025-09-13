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
        # Use the real PlayerInsightEngine's analyze_player_performance method
        return self.player_engine.analyze_player_performance(stats)

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
            
            # Convert DataFrame rows to PlayerStatRecord objects
            player_records = []
            for _, row in player_games.iterrows():
                player_records.append(PlayerStatRecord(
                    player_id=int(row['player_id']),
                    player_name=row['player_name'],
                    game_date=row['game_date'],
                    points=float(row['points']),
                    assists=float(row['assists']),
                    rebounds=float(row['rebounds']),
                    steals=float(row['steals']),
                    blocks=float(row['blocks']),
                    field_goal_percentage=float(row['field_goal_percentage']),
                    three_point_percentage=float(row['three_point_percentage']),
                    result=row['result']
                ))
            
            # Use the real engine to get insights
            insights = self.player_engine.get_player_insights(player_records)
            
            player_stats.append({
                'player_id': player_id,
                'player_name': insights.player_name,
                'win_rate': insights.win_rate,
                'games_played': insights.games_played,
                'avg_points': insights.avg_points,
                'avg_assists': insights.avg_assists,
                'avg_rebounds': insights.avg_rebounds
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