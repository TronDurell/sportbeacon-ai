from typing import List, Dict
from .models import (
    DrillRecommendationRequest,
    DrillRecommendationResponse
)
from .drill_recommendation_engine import DrillRecommendationEngine

class DrillService:
    def __init__(self):
        self.recommender = DrillRecommendationEngine()
        
    def get_recommendations(
        self,
        request: DrillRecommendationRequest
    ) -> DrillRecommendationResponse:
        """Get personalized drill recommendations for a player."""
        # Backend engine returns a List[DrillInfo]; wrap into DrillRecommendationResponse if needed
        recommended_drills = self.recommender.get_recommendations(request)
        return DrillRecommendationResponse(
            player_id=request.user_id,
            recommended_drills=recommended_drills,
            training_notes=[
                "Focus on growth areas while maintaining strengths.",
                "Adjust intensity based on recovery and fatigue."
            ]
        )
        
    def format_recommendations(
        self,
        response: DrillRecommendationResponse,
        format_type: str = 'text'
    ) -> str:
        """Format drill recommendations for display."""
        # The backend engine may not have formatting; provide a simple fallback formatter
        if format_type == 'text':
            lines = [
                f"Recommended drills for user {response.player_id}",
                ""
            ]
            for i, drill in enumerate(response.recommended_drills, 1):
                lines.append(f"{i}. {drill.name} ({drill.difficulty.name.title()}) - {drill.duration} min")
            if response.training_notes:
                lines.append("")
                lines.append("Notes:")
                lines.extend([f"- {note}" for note in response.training_notes])
            return "\n".join(lines)
        elif format_type == 'markdown':
            lines = [
                f"# Recommended drills for user {response.player_id}",
                ""
            ]
            for drill in response.recommended_drills:
                lines.extend([
                    f"- **{drill.name}** ({drill.difficulty.name.title()}) — {drill.duration} min",
                    f"  - Skills: {', '.join(drill.target_skills)}"
                ])
            if response.training_notes:
                lines.append("\n## Notes")
                lines.extend([f"- {note}" for note in response.training_notes])
            return "\n".join(lines)
        elif format_type == 'html':
            items = ''.join([
                f"<li><strong>{d.name}</strong> ({d.difficulty.name.title()}) — {d.duration} min</li>"
                for d in response.recommended_drills
            ])
            notes = ''.join([f"<li>{n}</li>" for n in (response.training_notes or [])])
            return f"<h1>Recommended drills for user {response.player_id}</h1><ul>{items}</ul>" + (f"<h2>Notes</h2><ul>{notes}</ul>" if notes else "")
        else:
            raise ValueError(f"Unsupported format type: {format_type}")