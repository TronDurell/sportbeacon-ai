from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import uuid
import json

@dataclass
class GameContext:
    game_id: str
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    quarter: int
    time_remaining: int  # seconds
    possession: str

@dataclass
class PlayerAction:
    player_id: str
    team_id: str
    action_type: str
    points: int
    assists: int
    rebounds: int
    blocks: int
    steals: int
    quarter: int
    game_time: str
    score_diff: int
    timestamp: datetime

@dataclass
class HighlightTag:
    id: str
    player_id: str
    team_id: str
    highlight_type: str
    description: str
    score_impact: int
    confidence_score: float
    quarter: int
    game_time: str
    game_context: str
    related_actions: List[PlayerAction]

class HighlightTaggingEngine:
    def __init__(self, config_path='backend/config/taggingConfig.json'):
        # Load configuration from JSON
        with open(config_path, 'r') as config_file:
            config = json.load(config_file)

        # Configuration thresholds
        self.clutch_threshold_secs = config.get('clutch_threshold_secs', 30)
        self.hot_streak_window_secs = config.get('hot_streak_window_secs', 120)
        self.momentum_run_threshold = config.get('momentum_run_threshold', 10)
        self.defensive_impact_threshold = config.get('defensive_impact_threshold', 3)

        # Impact scores with defaults
        self.impact_scores = {
            "three_pointer": config.get("three_pointer", 3),
            "two_pointer": config.get("two_pointer", 2),
            "block": config.get("block", 1),
            "steal": config.get("steal", 1),
            "clutch_bonus": config.get("clutch_bonus", 5),
            "streak_bonus": config.get("streak_bonus", 5),
            "momentum_bonus": config.get("momentum_bonus", 5),
            "close_game_bonus": config.get("close_game_bonus", 5),
            "fourth_quarter_bonus": config.get("fourth_quarter_bonus", 5)
        }

        # Tracking state
        self.team_scoring_runs = {}  # Track team scoring runs
        self.player_shot_streaks = {}  # Track player shooting streaks
        self.defensive_plays = {}  # Track defensive plays
        
    def process_game_logs(self, game_logs: List[Dict]) -> List[Dict]:
        """Process game logs and generate highlights."""
        highlights = []
        self._reset_tracking_state()
        
        # Convert logs to PlayerAction objects
        actions = [self._create_player_action(log) for log in game_logs]
        
        # Process each action for different highlight types
        for i, action in enumerate(actions):
            # Check for clutch plays
            if self._is_clutch_situation(action):
                highlight = self._create_clutch_highlight(action)
                if highlight:
                    highlights.append(highlight)
            
            # Check for hot streaks
            if self._update_shot_streak(action):
                highlight = self._create_hot_streak_highlight(action)
                if highlight:
                    highlights.append(highlight)
            
            # Check for momentum shifts
            if self._update_team_run(action):
                highlight = self._create_momentum_highlight(action)
                if highlight:
                    highlights.append(highlight)
            
            # Check for defensive impact
            if self._update_defensive_plays(action):
                highlight = self._create_defensive_highlight(action)
                if highlight:
                    highlights.append(highlight)
        
        return [self._highlight_to_dict(h) for h in highlights]
    
    def _reset_tracking_state(self):
        """Reset all tracking dictionaries."""
        self.team_scoring_runs.clear()
        self.player_shot_streaks.clear()
        self.defensive_plays.clear()
    
    def _create_player_action(self, log: Dict) -> PlayerAction:
        """Convert log entry to PlayerAction object."""
        return PlayerAction(
            player_id=log["player_id"],
            team_id=log["team_id"],
            action_type=log.get("action_type", ""),
            points=log.get("points", 0),
            assists=log.get("assists", 0),
            rebounds=log.get("rebounds", 0),
            blocks=log.get("blocks", 0),
            steals=log.get("steals", 0),
            quarter=log["quarter"],
            game_time=log["game_time"],
            score_diff=abs(log["score_diff"]),
            timestamp=datetime.now()  # You might want to parse this from the log
        )
    
    def _is_clutch_situation(self, action: PlayerAction) -> bool:
        """Check if action occurred in clutch time."""
        minutes, seconds = map(int, action.game_time.split(":"))
        total_seconds = minutes * 60 + seconds
        return (total_seconds <= self.clutch_threshold_secs and 
                action.score_diff <= 5 and 
                action.points > 0)
    
    def _update_shot_streak(self, action: PlayerAction) -> bool:
        """Update and check player's shooting streak."""
        if action.points > 0:
            if action.player_id not in self.player_shot_streaks:
                self.player_shot_streaks[action.player_id] = []
            
            self.player_shot_streaks[action.player_id].append(action)
            
            # Remove old shots outside the window
            current_time = self._time_to_seconds(action.game_time)
            self.player_shot_streaks[action.player_id] = [
                shot for shot in self.player_shot_streaks[action.player_id]
                if (current_time - self._time_to_seconds(shot.game_time)) <= self.hot_streak_window_secs
            ]
            
            return len(self.player_shot_streaks[action.player_id]) >= 3
        return False
    
    def _update_team_run(self, action: PlayerAction) -> bool:
        """Update and check team scoring runs."""
        if action.points > 0:
            if action.team_id not in self.team_scoring_runs:
                self.team_scoring_runs[action.team_id] = 0
            
            self.team_scoring_runs[action.team_id] += action.points
            
            # Reset opponent's run
            for team_id in self.team_scoring_runs:
                if team_id != action.team_id:
                    self.team_scoring_runs[team_id] = 0
            
            return self.team_scoring_runs[action.team_id] >= self.momentum_run_threshold
        return False
    
    def _update_defensive_plays(self, action: PlayerAction) -> bool:
        """Update and check defensive impact plays."""
        defensive_plays = action.blocks + action.steals
        if defensive_plays > 0:
            if action.player_id not in self.defensive_plays:
                self.defensive_plays[action.player_id] = 0
            
            self.defensive_plays[action.player_id] += defensive_plays
            return self.defensive_plays[action.player_id] >= self.defensive_impact_threshold
        return False
    
    def _create_clutch_highlight(self, action: PlayerAction) -> Optional[HighlightTag]:
        """Create a clutch play highlight."""
        return HighlightTag(
            id=str(uuid.uuid4()),
            player_id=action.player_id,
            team_id=action.team_id,
            highlight_type="ClutchPlay",
            description=f"Clutch {action.points}-pointer with {action.game_time} remaining in Q{action.quarter}",
            score_impact=action.points,
            confidence_score=0.9,
            quarter=action.quarter,
            game_time=action.game_time,
            game_context=f"Q{action.quarter} | {action.score_diff} pt differential",
            related_actions=[action]
        )
    
    def _create_hot_streak_highlight(self, action: PlayerAction) -> Optional[HighlightTag]:
        """Create a hot streak highlight."""
        streak = self.player_shot_streaks[action.player_id]
        total_points = sum(a.points for a in streak)
        return HighlightTag(
            id=str(uuid.uuid4()),
            player_id=action.player_id,
            team_id=action.team_id,
            highlight_type="HotStreak",
            description=f"Hot streak! {total_points} points in {self.hot_streak_window_secs//60} minutes",
            score_impact=total_points,
            confidence_score=0.85,
            quarter=action.quarter,
            game_time=action.game_time,
            game_context=f"Q{action.quarter} | {len(streak)} consecutive scores",
            related_actions=streak
        )
    
    def _create_momentum_highlight(self, action: PlayerAction) -> Optional[HighlightTag]:
        """Create a momentum shift highlight."""
        run_points = self.team_scoring_runs[action.team_id]
        return HighlightTag(
            id=str(uuid.uuid4()),
            player_id=action.player_id,
            team_id=action.team_id,
            highlight_type="MomentumShift",
            description=f"{run_points}-0 scoring run!",
            score_impact=run_points,
            confidence_score=0.8,
            quarter=action.quarter,
            game_time=action.game_time,
            game_context=f"Q{action.quarter} | {run_points}-point run",
            related_actions=[action]
        )
    
    def _create_defensive_highlight(self, action: PlayerAction) -> Optional[HighlightTag]:
        """Create a defensive impact highlight."""
        defensive_plays = self.defensive_plays[action.player_id]
        return HighlightTag(
            id=str(uuid.uuid4()),
            player_id=action.player_id,
            team_id=action.team_id,
            highlight_type="ImpactPlay",
            description=f"Defensive dominance! {defensive_plays} defensive stops",
            score_impact=defensive_plays * 2,  # Estimated impact
            confidence_score=0.75,
            quarter=action.quarter,
            game_time=action.game_time,
            game_context=f"Q{action.quarter} | Strong defensive sequence",
            related_actions=[action]
        )
    
    def _time_to_seconds(self, time_str: str) -> int:
        """Convert MM:SS time format to total seconds."""
        minutes, seconds = map(int, time_str.split(":"))
        return minutes * 60 + seconds
    
    def _highlight_to_dict(self, highlight: HighlightTag) -> Dict:
        """Convert HighlightTag to dictionary format."""
        return {
            "id": highlight.id,
            "player_id": highlight.player_id,
            "team_id": highlight.team_id,
            "highlight_type": highlight.highlight_type,
            "description": highlight.description,
            "score_impact": highlight.score_impact,
            "confidence_score": highlight.confidence_score,
            "quarter": highlight.quarter,
            "game_time": highlight.game_time,
            "game_context": highlight.game_context,
            "related_actions": [
                {
                    "player_id": action.player_id,
                    "team_id": action.team_id,
                    "action_type": action.action_type,
                    "points": action.points,
                    "assists": action.assists,
                    "rebounds": action.rebounds,
                    "blocks": action.blocks,
                    "steals": action.steals,
                    "quarter": action.quarter,
                    "game_time": action.game_time,
                    "score_diff": action.score_diff
                }
                for action in highlight.related_actions
            ]
        }

    def _calculate_impact_score(self, event, game_context, streak_info=None, momentum_info=None):
        """Calculate impact score with enhanced context."""
        base_score = 50

        # Basic scoring impact
        event_type_scores = {
            "3PT": self.impact_scores['three_pointer'],
            "2PT": self.impact_scores['two_pointer'],
            "Block": self.impact_scores['block'],
            "Steal": self.impact_scores['steal']
        }
        base_score += event_type_scores.get(event["event_type"], 0)

        # Clutch situation bonus
        if self._is_clutch_situation(event):
            base_score += self.impact_scores['clutch_bonus']

        # Streak bonus
        if streak_info:
            streak_bonus = min(self.impact_scores['streak_bonus'], streak_info["points"] * 2)
            base_score += streak_bonus

        # Momentum shift bonus
        if momentum_info:
            shift_bonus = min(self.impact_scores['momentum_bonus'], momentum_info["shift_magnitude"] * 2)
            base_score += shift_bonus

        # Close game bonus
        if abs(game_context["score_differential"]) <= 5:
            base_score += self.impact_scores['close_game_bonus']

        # Game situation bonuses
        if game_context.get("quarter", 1) >= 4:  # Fourth quarter or OT
            base_score += self.impact_scores['fourth_quarter_bonus']

        return min(100, base_score) 