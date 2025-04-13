from typing import List, Dict
from .models import (
    DrillRecommendationRequest,
    DrillRecommendationResponse
)
from ai.drill_recommender import DrillRecommendationEngine

class DrillService:
    def __init__(self):
        self.recommender = DrillRecommendationEngine()
        
    def get_recommendations(
        self,
        request: DrillRecommendationRequest
    ) -> DrillRecommendationResponse:
        """Get personalized drill recommendations for a player."""
        return self.recommender.recommend_drills(request)
        
    def format_recommendations(
        self,
        response: DrillRecommendationResponse,
        format_type: str = 'text'
    ) -> str:
        """Format drill recommendations for display."""
        return self.recommender.format_recommendations_for_display(
            response,
            format_type
        ) 