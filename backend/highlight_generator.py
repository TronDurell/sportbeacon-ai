from typing import List, Dict, Optional
from datetime import datetime
import json
from .models import HighlightEvent, HighlightResponse

class HighlightTaggingEngine:
    def __init__(self):
        self.impact_thresholds = {
            "clutch_time": 2,     # Last 2 minutes of game
            "scoring_run": 6,     # Points scored in succession
            "momentum_shift": 8,  # Point differential change
            "scoring_streak": 3   # Consecutive buckets for streak
        }
        self.streak_window = 120  # 2 minutes in seconds for streak detection

    def _parse_game_time(self, timestamp: str) -> int:
        """Convert MM:SS format to seconds remaining."""
        minutes, seconds = map(int, timestamp.split(":"))
        return minutes * 60 + seconds

    def _is_clutch_time(self, timestamp: str) -> bool:
        """Check if the play happened in clutch time."""
        seconds_remaining = self._parse_game_time(timestamp)
        return seconds_remaining <= self.impact_thresholds["clutch_time"] * 60

    def _detect_scoring_run(
        self,
        events: List[Dict],
        current_idx: int
    ) -> Optional[List[Dict]]:
        """Detect if there's a scoring run in progress."""
        if current_idx < 2:
            return None

        current_team = events[current_idx]["team"]
        points_in_run = events[current_idx]["points"]
        run_events = [events[current_idx]]

        # Look back for consecutive scores
        for i in range(current_idx - 1, max(-1, current_idx - 5), -1):
            if (events[i]["team"] == current_team and 
                events[i]["event_type"] in ["2PT", "3PT", "FT"]):
                points_in_run += events[i]["points"]
                run_events.append(events[i])
            else:
                break

        if points_in_run >= self.impact_thresholds["scoring_run"]:
            return run_events
        return None

    def _detect_momentum_shift(
        self,
        events: List[Dict],
        current_idx: int,
        window_size: int = 10
    ) -> Optional[Dict]:
        """Detect significant momentum shifts."""
        if current_idx < window_size:
            return None

        # Calculate point differential in previous window
        prev_differential = 0
        for i in range(current_idx - window_size, current_idx):
            if events[i]["event_type"] in ["2PT", "3PT", "FT"]:
                points = events[i]["points"]
                prev_differential += points if events[i]["team"] == "home" else -points

        # Calculate point differential in current window
        curr_differential = 0
        for i in range(current_idx, min(len(events), current_idx + window_size)):
            if events[i]["event_type"] in ["2PT", "3PT", "FT"]:
                points = events[i]["points"]
                curr_differential += points if events[i]["team"] == "home" else -points

        # Check for significant shift
        shift = abs(curr_differential - prev_differential)
        if shift >= self.impact_thresholds["momentum_shift"]:
            return {
                "start_time": events[current_idx - window_size]["timestamp"],
                "end_time": events[current_idx]["timestamp"],
                "shift_magnitude": shift,
                "leading_team": "home" if curr_differential > 0 else "away"
            }
        return None

    def _detect_scoring_streak(
        self,
        events: List[Dict],
        current_idx: int
    ) -> Optional[Dict]:
        """Detect scoring streaks (3+ buckets within 1-2 mins)."""
        if current_idx < 2:
            return None

        current_time = self._parse_game_time(events[current_idx]["timestamp"])
        streak_events = []
        current_team = events[current_idx]["team"]
        
        # Look back for consecutive scores within time window
        for i in range(current_idx, max(-1, current_idx - 10), -1):
            event = events[i]
            if event["event_type"] not in ["2PT", "3PT"]:
                continue
                
            event_time = self._parse_game_time(event["timestamp"])
            if current_time - event_time > self.streak_window:
                break
                
            if event["team"] == current_team:
                streak_events.append(event)
            else:
                break

        if len(streak_events) >= self.impact_thresholds["scoring_streak"]:
            return {
                "team": current_team,
                "events": streak_events,
                "duration": current_time - self._parse_game_time(streak_events[-1]["timestamp"]),
                "points": sum(e.get("points", 2) for e in streak_events)
            }
        return None

    def _is_clutch_situation(
        self,
        event: Dict,
        score_differential: int
    ) -> bool:
        """Check if a play is a clutch situation."""
        return (
            self._is_clutch_time(event["timestamp"]) and 
            abs(score_differential) <= 5 and
            event["event_type"] in ["2PT", "3PT", "FT", "Block", "Steal"]
        )

    def _calculate_impact_score(
        self,
        event: Dict,
        game_context: Dict,
        streak_info: Optional[Dict] = None,
        momentum_info: Optional[Dict] = None
    ) -> int:
        """Calculate impact score with enhanced context."""
        base_score = 50
        
        # Basic scoring impact
        if event["event_type"] == "3PT":
            base_score += 15
        elif event["event_type"] == "2PT":
            base_score += 10
        elif event["event_type"] == "Block":
            base_score += 12
        elif event["event_type"] == "Steal":
            base_score += 8

        # Clutch situation bonus
        if self._is_clutch_situation(event, game_context["score_differential"]):
            base_score += 25

        # Streak bonus
        if streak_info:
            streak_bonus = min(15, streak_info["points"] * 2)
            base_score += streak_bonus

        # Momentum shift bonus
        if momentum_info:
            shift_bonus = min(20, momentum_info["shift_magnitude"] * 2)
            base_score += shift_bonus

        # Close game bonus
        if abs(game_context["score_differential"]) <= 5:
            base_score += 15

        # Game situation bonuses
        if game_context.get("quarter", 1) >= 4:  # Fourth quarter or OT
            base_score += 10

        return min(100, base_score)

    def tag_highlights(
        self,
        game_id: str,
        events: List[Dict]
    ) -> HighlightResponse:
        """Process game events with enhanced tagging."""
        highlights = []
        momentum_shifts = []
        game_winning_sequences = []
        scoring_streaks = []
        
        game_context = {
            "score_differential": 0,
            "home_score": 0,
            "away_score": 0,
            "quarter": 1,
            "home_momentum": 0,
            "away_momentum": 0
        }

        for i, event in enumerate(events):
            # Update game context
            if event["event_type"] in ["2PT", "3PT", "FT"]:
                points = event["points"]
                if event["team"] == "home":
                    game_context["home_score"] += points
                    game_context["home_momentum"] += points
                    game_context["away_momentum"] = max(0, game_context["away_momentum"] - 1)
                else:
                    game_context["away_score"] += points
                    game_context["away_momentum"] += points
                    game_context["home_momentum"] = max(0, game_context["home_momentum"] - 1)
                    
                game_context["score_differential"] = (
                    game_context["home_score"] - game_context["away_score"]
                )

            # Detect streaks and momentum
            streak_info = self._detect_scoring_streak(events, i)
            if streak_info:
                scoring_streaks.append(streak_info)

            momentum_shift = self._detect_momentum_shift(events, i)
            if momentum_shift:
                momentum_shifts.append(momentum_shift)

            # Calculate impact with full context
            impact_score = self._calculate_impact_score(
                event,
                game_context,
                streak_info,
                momentum_shift
            )
            
            # Tag significant plays
            if (impact_score >= 75 or  # High impact
                streak_info or         # Part of streak
                self._is_clutch_situation(event, game_context["score_differential"])):
                
                highlight = HighlightEvent(
                    timestamp=event["timestamp"],
                    event=event["event_type"],
                    player=event["player"],
                    highlight_type=self._determine_highlight_type(event, game_context),
                    impact_score=impact_score,
                    description=self._generate_description(
                        event, 
                        game_context,
                        streak_info,
                        momentum_shift
                    ),
                    tags=self._generate_tags(event, game_context, streak_info)
                )
                highlights.append(highlight)

            # Track potential game-winners
            if (self._is_clutch_time(event["timestamp"]) and 
                abs(game_context["score_differential"]) <= 3):
                game_winning_sequences.append({
                    "timestamp": event["timestamp"],
                    "sequence": events[max(0, i-2):min(len(events), i+3)],
                    "score_differential": game_context["score_differential"],
                    "impact_score": impact_score
                })

        # Sort highlights by impact score
        highlights.sort(key=lambda x: x.impact_score, reverse=True)
        top_plays = highlights[:5]

        return HighlightResponse(
            game_id=game_id,
            highlights=highlights,
            top_plays=top_plays,
            momentum_shifts=momentum_shifts,
            game_winning_sequences=game_winning_sequences,
            scoring_streaks=scoring_streaks
        )

    def _determine_highlight_type(
        self,
        event: Dict,
        context: Dict
    ) -> str:
        """Determine highlight type with enhanced context."""
        if event["event_type"] == "3PT":
            if self._is_clutch_situation(event, context["score_differential"]):
                return "Clutch Three"
            return "Three Pointer"
        elif event["event_type"] == "2PT":
            if event.get("subtype") == "dunk":
                return "Slam Dunk"
            if self._is_clutch_situation(event, context["score_differential"]):
                return "Clutch Basket"
            return "Field Goal"
        elif event["event_type"] in ["Block", "Steal"]:
            if self._is_clutch_situation(event, context["score_differential"]):
                return "Clutch Defensive Play"
            return "Defensive Play"
        return "Key Play"

    def _generate_description(
        self,
        event: Dict,
        context: Dict,
        streak_info: Optional[Dict] = None,
        momentum_info: Optional[Dict] = None
    ) -> str:
        """Generate enhanced play description."""
        desc = []
        
        # Base play description
        if event["event_type"] == "3PT":
            desc.append(f"{event['player']} drains a three-pointer")
        elif event["event_type"] == "2PT":
            desc.append(f"{event['player']} scores")
        elif event["event_type"] == "Block":
            desc.append(f"Huge block by {event['player']}")
        elif event["event_type"] == "Steal":
            desc.append(f"{event['player']} with the steal")
        
        # Add context
        if self._is_clutch_situation(event, context["score_differential"]):
            desc.append("in clutch time")
            
        if streak_info:
            desc.append(f"as part of a {len(streak_info['events'])}-bucket streak")
            
        if momentum_info:
            desc.append("sparking a momentum shift")
            
        if abs(context["score_differential"]) <= 3:
            desc.append(f"with the game on the line")
            
        return " ".join(desc) + "!"

    def _generate_tags(
        self,
        event: Dict,
        context: Dict,
        streak_info: Optional[Dict] = None
    ) -> List[str]:
        """Generate enhanced highlight tags."""
        tags = [event["event_type"].lower()]
        
        if self._is_clutch_time(event["timestamp"]):
            tags.append("clutch_time")
            
        if abs(context["score_differential"]) <= 5:
            tags.append("close_game")
            
        if event["event_type"] in ["Block", "Steal"]:
            tags.append("defensive_highlight")
            
        if streak_info:
            tags.extend(["scoring_streak", "hot_hand"])
            
        if context.get("quarter", 1) >= 4:
            tags.append("fourth_quarter")
            
        return tags

    def load_sample_data(self, file_path: str) -> List[Dict]:
        """Load sample game data from JSON file."""
        with open(file_path, 'r') as f:
            return json.load(f)

    def save_highlights(self, highlights: HighlightResponse, output_path: str):
        """Save highlight data to JSON file."""
        with open(output_path, 'w') as f:
            json.dump(highlights.dict(), f, indent=2) 