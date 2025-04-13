from fastapi import FastAPI, HTTPException, Query
from typing import List, Dict, Optional, Any
from .models import (
    PlayerStatRecord,
    PlayerAnalysisResponse,
    PlayerInsightResponse,
    MatchmakingRequest,
    MatchmakingResponse,
    DrillRecommendationRequest,
    DrillRecommendationResponse,
    DrillScheduleRequest,
    DrillScheduleResponse,
    HighlightEvent,
    HighlightResponse,
    CoachQuestion,
    CoachResponse,
    ExtendedDrillScheduleRequest
)
from .insight_service import PlayerInsightService
from .matchmaking_service import MatchmakingService
from .drill_service import DrillService
from .highlight_generator import HighlightTaggingEngine
from .coach_assistant import CoachAssistant
import os
from datetime import datetime

app = FastAPI(title="SportBeacon AI API")
insight_service = PlayerInsightService()
matchmaking_service = MatchmakingService()
drill_service = DrillService()

# Initialize services
highlight_engine = HighlightTaggingEngine()
coach_assistant = CoachAssistant(os.getenv("OPENAI_API_KEY"))

@app.get("/api/players/top-winners", response_model=List[PlayerInsightResponse])
async def get_top_winners(time_period_days: int = 30, limit: int = 5):
    """
    Get the top players with highest win rates for the specified time period.
    
    Args:
        time_period_days: Number of days to consider for win rate calculation
        limit: Number of top players to return
    
    Returns:
        List of top players with their win rates and stats
    """
    try:
        return insight_service.get_top_winners(time_period_days, limit)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating top winners: {str(e)}"
        )

@app.post("/api/players/analyze", response_model=PlayerAnalysisResponse)
async def analyze_player_stats(stats: List[PlayerStatRecord]):
    """
    Analyze player statistics to generate insights.
    
    Args:
        stats: List of player stat entries
        
    Returns:
        PlayerAnalysisResponse containing normalized stats, top skills, and growth areas
    """
    try:
        return insight_service.analyze_player_stats(stats)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing player stats: {str(e)}"
        )

@app.post("/api/matchmaking/create-teams", response_model=MatchmakingResponse)
async def create_balanced_teams(request: MatchmakingRequest):
    """
    Create balanced teams from player statistics.
    
    Args:
        request: MatchmakingRequest containing player stats and preferences
        
    Returns:
        MatchmakingResponse with two balanced teams and balance metrics
    """
    try:
        return matchmaking_service.create_balanced_teams(request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating balanced teams: {str(e)}"
        )

@app.post("/api/drills/recommend")
async def get_drill_recommendations(
    request: DrillRecommendationRequest
) -> DrillRecommendationResponse:
    """Get personalized drill recommendations."""
    try:
        return drill_service.get_recommendations(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/drills/recommend/formatted")
async def get_formatted_recommendations(
    request: DrillRecommendationRequest,
    format_type: str = 'text'
) -> str:
    """Get formatted drill recommendations."""
    try:
        recommendations = drill_service.get_recommendations(request)
        return drill_service.format_recommendations(recommendations, format_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/drills/schedule")
async def get_weekly_schedule(
    request: DrillScheduleRequest
) -> DrillScheduleResponse:
    """Get a personalized weekly training schedule."""
    try:
        return drill_service.get_weekly_schedule(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/drills/schedule/formatted")
async def get_formatted_schedule(
    request: DrillScheduleRequest,
    format_type: str = 'text'
) -> str:
    """Get a formatted weekly training schedule."""
    try:
        schedule = drill_service.get_weekly_schedule(request)
        return drill_service.format_schedule(schedule, format_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/highlights/tag")
async def tag_game_highlights(
    game_id: str,
    events: List[Dict]
) -> HighlightResponse:
    """Tag and analyze game highlights."""
    try:
        return highlight_engine.tag_highlights(game_id, events)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing highlights: {str(e)}"
        )

@app.post("/api/coach/ask")
async def ask_coach_question(
    request: CoachQuestion,
    channel: str = Query(default="chat", regex="^(chat|email|sms|web)$")
) -> CoachResponse:
    """Get coaching advice and recommendations."""
    try:
        return coach_assistant.answer_question(request, channel)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing coaching question: {str(e)}"
        )

@app.get("/api/coach/weekly-summary/{player_id}")
async def get_weekly_summary(
    player_id: str,
    channel: str = Query(default="chat", regex="^(chat|email|sms|web)$")
) -> Dict[str, Any]:
    """Get a player's weekly progress summary."""
    try:
        summary = coach_assistant.generate_weekly_summary(player_id, channel)
        return {
            "player_id": player_id,
            "summary": summary,
            "channel": channel,
            "timestamp": str(datetime.now())
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating weekly summary: {str(e)}"
        )

@app.post("/api/drills/schedule/extended")
async def get_extended_schedule(
    request: ExtendedDrillScheduleRequest
) -> DrillScheduleResponse:
    """Get an extended weekly training schedule with adaptations."""
    try:
        return drill_service.get_extended_schedule(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Sample test data for the analyze endpoint
SAMPLE_ANALYZE_PAYLOAD = [
    {
        "player_id": 1,
        "player_name": "John Smith",
        "game_date": "2024-04-01T20:00:00",
        "points": 28,
        "assists": 7,
        "rebounds": 5,
        "steals": 2,
        "blocks": 1,
        "field_goal_percentage": 55.5,
        "three_point_percentage": 40.0,
        "result": "win"
    },
    {
        "player_id": 1,
        "player_name": "John Smith",
        "game_date": "2024-04-03T19:30:00",
        "points": 22,
        "assists": 9,
        "rebounds": 4,
        "steals": 3,
        "blocks": 0,
        "field_goal_percentage": 48.2,
        "three_point_percentage": 35.7,
        "result": "loss"
    },
    {
        "player_id": 1,
        "player_name": "John Smith",
        "game_date": "2024-04-05T21:00:00",
        "points": 31,
        "assists": 6,
        "rebounds": 6,
        "steals": 1,
        "blocks": 2,
        "field_goal_percentage": 62.1,
        "three_point_percentage": 45.5,
        "result": "win"
    }
]

# Sample test data for matchmaking
SAMPLE_MATCHMAKING_PAYLOAD = {
    "team_size": 3,
    "consider_positions": True,
    "players": [
        # Player 1 - Guard
        {
            "player_id": 1,
            "player_name": "John Smith",
            "game_date": "2024-04-05T21:00:00",
            "points": 31,
            "assists": 8,
            "rebounds": 4,
            "steals": 2,
            "blocks": 0,
            "field_goal_percentage": 58.0,
            "three_point_percentage": 42.0,
            "result": "win"
        },
        # Player 2 - Forward
        {
            "player_id": 2,
            "player_name": "Mike Johnson",
            "game_date": "2024-04-05T21:00:00",
            "points": 25,
            "assists": 4,
            "rebounds": 8,
            "steals": 1,
            "blocks": 2,
            "field_goal_percentage": 52.0,
            "three_point_percentage": 35.0,
            "result": "win"
        },
        # Player 3 - Center
        {
            "player_id": 3,
            "player_name": "Bill Williams",
            "game_date": "2024-04-05T21:00:00",
            "points": 18,
            "assists": 3,
            "rebounds": 12,
            "steals": 0,
            "blocks": 4,
            "field_goal_percentage": 65.0,
            "three_point_percentage": 0.0,
            "result": "win"
        },
        # Add more players...
    ]
}

# Sample test data for drill recommendations
SAMPLE_DRILL_REQUEST = {
    "player_name": "John Smith",
    "player_id": 1,
    "top_skills": ["points", "assists"],
    "growth_areas": ["rebounds", "steals", "field_goal_percentage"],
    "skill_levels": {
        "points": 0.85,
        "assists": 0.78,
        "rebounds": 0.45,
        "steals": 0.52,
        "blocks": 0.63,
        "field_goal_percentage": 0.58,
        "three_point_percentage": 0.72
    },
    "min_difficulty": "Beginner",
    "max_difficulty": "Advanced",
    "max_recommendations": 5
}

# Sample test data
test_schedule_request = {
    "player_name": "John Doe",
    "player_id": "12345",
    "growth_areas": ["shooting", "dribbling", "defense"],
    "top_skills": ["passing", "rebounds"],
    "skill_levels": {
        "shooting": 0.7,
        "dribbling": 0.5,
        "defense": 0.6,
        "passing": 0.8,
        "rebounds": 0.75
    },
    "min_difficulty": "Beginner",
    "max_difficulty": "Advanced",
    "available_days": ["monday", "tuesday", "wednesday", "friday"],
    "max_duration_per_day": 90,
    "max_drills_per_day": 4,
    "gym_access": True
}

# Sample test data for highlights
SAMPLE_GAME_EVENTS = [
    {
        "timestamp": "04:23",
        "event_type": "3PT",
        "player": "John Smith",
        "team": "home",
        "points": 3,
        "game_time": "Q4"
    },
    {
        "timestamp": "03:45",
        "event_type": "Block",
        "player": "Mike Johnson",
        "team": "home",
        "game_time": "Q4"
    },
    {
        "timestamp": "02:15",
        "event_type": "Steal",
        "player": "John Smith",
        "team": "home",
        "game_time": "Q4"
    }
]

# Sample test data for coach questions
SAMPLE_COACH_QUESTION = {
    "user_id": "user123",
    "question": "How can I improve my three-point shooting?",
    "include_stats": True
} 