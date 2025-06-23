from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal, Any
from datetime import datetime
from enum import Enum

class PlayerStatRecord(BaseModel):
    player_id: int
    player_name: str
    game_date: datetime
    points: float = Field(ge=0)
    assists: float = Field(ge=0)
    rebounds: float = Field(ge=0)
    steals: float = Field(ge=0)
    blocks: float = Field(ge=0)
    field_goal_percentage: float = Field(ge=0, le=100)
    three_point_percentage: float = Field(ge=0, le=100)
    result: str = Field(pattern="^(win|loss)$")

class PlayerAnalysisResponse(BaseModel):
    player_name: str
    normalized_stats: Dict[str, float]
    top_skills: List[str]
    growth_areas: List[str]
    recent_trends: Dict[str, float]

class PlayerInsightResponse(BaseModel):
    player_id: int
    player_name: str
    win_rate: float
    games_played: int
    avg_points: float
    avg_assists: float
    avg_rebounds: float

# New models for matchmaking
class PlayerProfile(BaseModel):
    player_id: int
    name: str
    position: Literal['guard', 'forward', 'center']
    skill_scores: Dict[str, float]
    overall_rating: float
    recent_games: List[PlayerStatRecord] = []

class TeamComposition(BaseModel):
    players: List[PlayerProfile]
    total_skill: float
    average_skill: float
    positions: Dict[str, int]

class MatchmakingRequest(BaseModel):
    players: List[PlayerStatRecord]
    team_size: Literal[3, 5] = 3
    consider_positions: bool = True

class MatchmakingResponse(BaseModel):
    team1: TeamComposition
    team2: TeamComposition
    skill_gap: float
    is_balanced: bool
    balance_score: float  # 0-1 score indicating how well balanced the teams are 

# Drill recommendation models
class DifficultyLevel(Enum):
    BEGINNER = 1
    INTERMEDIATE = 2
    ADVANCED = 3
    EXPERT = 4

class TrainingFormat(Enum):
    SOLO = "solo"
    PARTNER = "partner"
    GROUP = "group"

class DrillInfo(BaseModel):
    id: str
    name: str
    description: str
    difficulty: DifficultyLevel
    difficulty_level: float  # Numeric value between 0 and 1
    duration: int  # in minutes
    intensity: float  # 0 to 1
    requires_gym: bool
    equipment_needed: List[str]
    target_skills: List[str]
    training_format: TrainingFormat
    video_url: Optional[str] = None
    
    def copy(self) -> 'DrillInfo':
        """Create a copy of the drill info."""
        return DrillInfo(**self.dict())

class ScheduledDrill(BaseModel):
    drill: DrillInfo
    duration_minutes: int
    equipment_needed: List[str]
    requires_gym: bool
    intensity: str
    relevance_score: float

class DailySchedule(BaseModel):
    day: str
    drills: List[DrillInfo]
    total_duration: int
    intensity: float
    requires_gym: bool
    equipment_needed: List[str]
    notes: List[str]

class WeeklyTrainingSchedule(BaseModel):
    monday: Optional[DailySchedule]
    tuesday: Optional[DailySchedule]
    wednesday: Optional[DailySchedule]
    thursday: Optional[DailySchedule]
    friday: Optional[DailySchedule]
    saturday: Optional[DailySchedule]
    sunday: Optional[DailySchedule]
    total_duration: int
    equipment_needed: List[str]
    focus_areas: List[str]

class DrillScheduleRequest(BaseModel):
    user_id: str
    available_days: List[str]
    gym_access: bool
    skill_levels: Dict[str, float]
    growth_areas: List[str]
    min_difficulty: DifficultyLevel = DifficultyLevel.BEGINNER
    max_difficulty: DifficultyLevel = DifficultyLevel.EXPERT
    max_drills_per_day: int = 4
    max_duration_per_day: int = 120  # in minutes
    preferred_training_format: Optional[TrainingFormat] = None

class DrillScheduleResponse(BaseModel):
    user_id: str
    weekly_schedule: Dict[str, List[DrillInfo]]
    total_duration: int
    skill_coverage: Dict[str, float]
    intensity_distribution: Dict[str, float]
    training_notes: str
    formatted_output: Optional[str] = None

class FormattedScheduleResponse(BaseModel):
    formatted_plan: str
    schedule_type: Literal['text', 'markdown', 'html']
    total_duration: int
    requires_gym: bool

class DrillRecommendationRequest(BaseModel):
    user_id: str
    skill_levels: Dict[str, float]  # Skill name to level (0-1) mapping
    growth_areas: List[str]
    top_skills: List[str]
    max_recommendations: int = 5
    min_difficulty: DifficultyLevel = DifficultyLevel.BEGINNER
    max_difficulty: DifficultyLevel = DifficultyLevel.EXPERT

class DrillRecommendationResponse(BaseModel):
    player_id: str
    recommended_drills: List[DrillInfo]
    training_notes: List[str]

class TrainingPreferences(BaseModel):
    days_per_week: int = Field(ge=1, le=7)
    available_days: List[str]
    equipment_access: List[str]
    primary_focus: List[str]
    format_type: TrainingFormat
    max_session_duration: int = Field(ge=15, le=180)
    preferred_time: Optional[str]
    notifications_enabled: bool = True

class WeeklyPerformance(BaseModel):
    week_start: datetime
    completed_drills: int
    skipped_drills: int
    total_duration: int
    average_intensity: float
    skill_progress: Dict[str, float]

class ExtendedDrillScheduleRequest(DrillScheduleRequest):
    preferences: TrainingPreferences
    previous_performance: Optional[WeeklyPerformance]
    specific_goals: List[str]
    intensity_preference: float = Field(ge=0.0, le=1.0, default=0.7)

class HighlightEvent(BaseModel):
    timestamp: str
    event: str
    player: str
    highlight_type: str
    impact_score: int = Field(ge=0, le=100)
    description: Optional[str]
    tags: List[str]

class HighlightResponse(BaseModel):
    game_id: str
    highlights: List[HighlightEvent]
    top_plays: List[HighlightEvent]
    momentum_shifts: List[Dict[str, Any]]
    game_winning_sequences: List[Dict[str, Any]]

class CoachQuestion(BaseModel):
    user_id: str
    question: str
    context: Optional[Dict[str, Any]]
    include_stats: bool = True
    include_videos: bool = False

class CoachResponse(BaseModel):
    answer: str
    drills: Optional[List[DrillInfo]]
    stats: Optional[Dict[str, Any]]
    video_links: Optional[List[str]]
    confidence_score: float

class DrillLog(BaseModel):
    drill_id: str
    player_id: str
    score: float
    video_url: Optional[str] = None
    feedback: Optional[str] = None
    duration: float
    timestamp: str

class Evaluation(BaseModel):
    evaluation_id: str
    player_id: str
    rubric_id: str
    score: float
    feedback: Optional[str] = None
    timestamp: str 