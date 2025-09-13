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
        
    def create_balanced_teams(
        self,
        request: MatchmakingRequest
    ) -> MatchmakingResponse:
        """Create balanced teams from player stats."""
        # Use the real MatchmakingEngine directly with the request
        return self.matchmaking_engine.create_balanced_teams(request) 