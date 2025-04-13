from typing import List, Dict
from .models import (
    PlayerStatRecord,
    PlayerProfile,
    MatchmakingRequest,
    MatchmakingResponse
)
from .insight_service import PlayerInsightService
from ai.matchmaking_engine import MatchmakingEngine

class MatchmakingService:
    def __init__(self):
        self.insight_service = PlayerInsightService()
        self.matchmaking_engine = MatchmakingEngine()
        
    def create_player_profile(
        self,
        player_stats: List[PlayerStatRecord],
        position: str
    ) -> PlayerProfile:
        """Convert player stats into a profile with skill ratings."""
        # Get player insights
        analysis = self.insight_service.analyze_player_stats(player_stats)
        
        # Extract the most recent game for player info
        latest_game = player_stats[-1]
        
        return PlayerProfile(
            player_id=latest_game.player_id,
            name=latest_game.player_name,
            position=position,
            skill_scores=analysis.normalized_stats,
            overall_rating=sum(analysis.normalized_stats.values()) / len(analysis.normalized_stats),
            recent_games=player_stats
        )
        
    def create_balanced_teams(
        self,
        request: MatchmakingRequest
    ) -> MatchmakingResponse:
        """Create balanced teams from player stats."""
        # Group stats by player
        player_stats = {}
        for stat in request.players:
            if stat.player_id not in player_stats:
                player_stats[stat.player_id] = []
            player_stats[stat.player_id].append(stat)
            
        # Sort each player's stats by date
        for stats in player_stats.values():
            stats.sort(key=lambda x: x.game_date)
            
        # Create player profiles
        # For this example, we'll assign positions round-robin style
        positions = ['guard', 'forward', 'center'] * (len(player_stats) // 3 + 1)
        profiles = []
        
        for i, (player_id, stats) in enumerate(player_stats.items()):
            profile = self.create_player_profile(stats, positions[i])
            profiles.append(profile)
            
        # Create balanced teams
        return self.matchmaking_engine.create_balanced_teams(
            players=profiles,
            team_size=request.team_size,
            consider_positions=request.consider_positions
        ) 