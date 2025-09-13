from typing import List, Dict, Optional, Any, Tuple, Literal
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from pydantic import BaseModel

# Import backend models to avoid conflicts
from backend.models import (
    PlayerStatRecord,
    PlayerProfile,
    TeamComposition,
    MatchmakingRequest,
    MatchmakingResponse
)

class MatchmakingEngine:
    def __init__(self):
        self.position_weights = {
            'guard': {'points': 0.25, 'assists': 0.35, 'rebounds': 0.15, 'steals': 0.25},
            'forward': {'points': 0.35, 'assists': 0.20, 'rebounds': 0.25, 'steals': 0.20},
            'center': {'points': 0.25, 'assists': 0.15, 'rebounds': 0.40, 'steals': 0.20}
        }
        
        # Standard time slots for games
        self.time_slots = [
            "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
            "17:00", "18:00", "19:00", "20:00", "21:00"
        ]
        
    def calculate_overall_rating(self, player_stats: List[PlayerStatRecord]) -> float:
        """Calculate overall player rating based on recent performance."""
        if not player_stats:
            return 0.0
        
        # Convert to DataFrame for easier analysis
        df = self._convert_to_dataframe(player_stats)
        
        # Calculate average stats
        avg_points = df['points'].mean()
        avg_assists = df['assists'].mean()
        avg_rebounds = df['rebounds'].mean()
        avg_steals = df['steals'].mean()
        avg_blocks = df['blocks'].mean()
        avg_fg_pct = df['field_goal_percentage'].mean()
        
        # Calculate overall rating using weighted formula
        # Based on basketball analytics principles
        overall_rating = (
            avg_points * 0.3 +           # Scoring is most important
            avg_assists * 0.25 +         # Playmaking
            avg_rebounds * 0.2 +         # Rebounding
            avg_steals * 0.15 +          # Defense
            avg_blocks * 0.1 +           # Shot blocking
            (avg_fg_pct / 100.0) * 0.1   # Shooting efficiency
        )
        
        return float(overall_rating)
    
    def find_available_players(self, all_players: List[PlayerStatRecord], 
                             required_count: int, 
                             min_games: int = 3) -> List[PlayerStatRecord]:
        """Find available players who meet minimum criteria."""
        if not all_players:
            return []
        
        # Group players by ID and count their games
        player_games = {}
        for player in all_players:
            if player.player_id not in player_games:
                player_games[player.player_id] = []
            player_games[player.player_id].append(player)
        
        # Filter players with sufficient games
        available_players = []
        for player_id, games in player_games.items():
            if len(games) >= min_games:
                # Use the most recent game for the player
                latest_game = max(games, key=lambda g: g.game_date)
                available_players.append(latest_game)
        
        # Sort by overall rating and return top players
        available_players.sort(key=lambda p: self.calculate_overall_rating([p]), reverse=True)
        
        return available_players[:required_count]
    
    def create_balanced_teams(self, request: MatchmakingRequest) -> MatchmakingResponse:
        """Create balanced teams using advanced algorithms."""
        if len(request.players) < request.team_size * 2:
            raise ValueError(f"Not enough players for {request.team_size}-player teams")
        
        # Create player profiles
        profiles = self.create_player_profiles(request.players)
        
        # Sort by overall rating
        profiles.sort(key=lambda p: p.overall_rating, reverse=True)
        
        # Use snake draft algorithm for better balance
        team1_players = []
        team2_players = []
        
        for i, profile in enumerate(profiles):
            if i % 2 == 0:
                team1_players.append(profile)
            else:
                team2_players.append(profile)
        
        # Ensure equal team sizes
        while len(team1_players) > len(team2_players) and len(team2_players) < request.team_size:
            team2_players.append(team1_players.pop())
        while len(team2_players) > len(team1_players) and len(team1_players) < request.team_size:
            team1_players.append(team2_players.pop())
        
        # Limit to requested team size
        team1_players = team1_players[:request.team_size]
        team2_players = team2_players[:request.team_size]
        
        # Create team compositions
        team1 = self._create_team_composition(team1_players)
        team2 = self._create_team_composition(team2_players)
        
        # Calculate balance metrics
        skill_gap = abs(team1.average_skill - team2.average_skill)
        balance_score = 1.0 - min(1.0, skill_gap / 0.5)  # Normalize to 0-1
        is_balanced = skill_gap < 0.2  # Consider balanced if gap is less than 20%
        
        return MatchmakingResponse(
            team1=team1,
            team2=team2,
            skill_gap=skill_gap,
            is_balanced=is_balanced,
            balance_score=balance_score
        )
    
    def suggest_game_time(self, players: List[PlayerStatRecord], 
                         preferred_times: List[str] = None) -> Dict[str, Any]:
        """Suggest optimal game time based on player availability and preferences."""
        if not players:
            return {"suggested_time": "No players available", "confidence": 0.0}
        
        # Analyze player activity patterns
        df = self._convert_to_dataframe(players)
        
        # Extract hour from game dates to find preferred times
        df['hour'] = pd.to_datetime(df['game_date']).dt.hour
        
        # Find most common game hours
        hour_counts = df['hour'].value_counts()
        
        if hour_counts.empty:
            # Default to evening time if no data
            suggested_hour = 19
        else:
            # Use the most common hour, with preference for evening times
            evening_hours = [17, 18, 19, 20, 21]
            evening_counts = hour_counts[hour_counts.index.isin(evening_hours)]
            
            if not evening_counts.empty:
                suggested_hour = evening_counts.idxmax()
            else:
                suggested_hour = hour_counts.idxmax()
        
        # Convert to time string
        suggested_time = f"{suggested_hour:02d}:00"
        
        # Calculate confidence based on data consistency
        total_games = len(df)
        confidence = min(1.0, total_games / 10.0)  # Higher confidence with more data
        
        return {
            "suggested_time": suggested_time,
            "confidence": confidence,
            "alternative_times": self._get_alternative_times(suggested_hour),
            "reasoning": f"Based on {total_games} recent games, most players prefer {suggested_time}"
        }
    
    def _get_alternative_times(self, preferred_hour: int) -> List[str]:
        """Get alternative time slots around the preferred hour."""
        alternatives = []
        for offset in [-2, -1, 1, 2]:
            hour = preferred_hour + offset
            if 9 <= hour <= 21:  # Reasonable game hours
                alternatives.append(f"{hour:02d}:00")
        return alternatives
    
    def _convert_to_dataframe(self, players: List[PlayerStatRecord]) -> pd.DataFrame:
        """Convert PlayerStatRecord list to DataFrame."""
        if not players:
            return pd.DataFrame()
        
        data = []
        for player in players:
            data.append({
                'player_id': player.player_id,
                'player_name': player.player_name,
                'game_date': player.game_date,
                'points': player.points,
                'assists': player.assists,
                'rebounds': player.rebounds,
                'steals': player.steals,
                'blocks': player.blocks,
                'field_goal_percentage': player.field_goal_percentage,
                'three_point_percentage': player.three_point_percentage,
                'result': player.result
            })
        
        return pd.DataFrame(data)
    
    def create_player_profiles(self, players: List[PlayerStatRecord]) -> List[PlayerProfile]:
        """Create player profiles from game statistics."""
        profiles = []
        
        # Group players by ID to get their full history
        player_groups = {}
        for player in players:
            if player.player_id not in player_groups:
                player_groups[player.player_id] = []
            player_groups[player.player_id].append(player)
        
        for player_id, player_games in player_groups.items():
            # Calculate skill scores based on recent performance
            recent_games = sorted(player_games, key=lambda p: p.game_date, reverse=True)[:5]
            
            # Calculate averages from recent games
            avg_points = sum(g.points for g in recent_games) / len(recent_games)
            avg_assists = sum(g.assists for g in recent_games) / len(recent_games)
            avg_rebounds = sum(g.rebounds for g in recent_games) / len(recent_games)
            avg_steals = sum(g.steals for g in recent_games) / len(recent_games)
            avg_blocks = sum(g.blocks for g in recent_games) / len(recent_games)
            avg_fg_pct = sum(g.field_goal_percentage for g in recent_games) / len(recent_games)
            avg_3p_pct = sum(g.three_point_percentage for g in recent_games) / len(recent_games)
            
            skill_scores = {
                'points': min(1.0, avg_points / 30.0),  # Normalize to 0-1 scale
                'assists': min(1.0, avg_assists / 10.0),
                'rebounds': min(1.0, avg_rebounds / 15.0),
                'steals': min(1.0, avg_steals / 5.0),
                'blocks': min(1.0, avg_blocks / 5.0),
                'field_goal_percentage': avg_fg_pct / 100.0,
                'three_point_percentage': avg_3p_pct / 100.0
            }
            
            # Determine position based on stats
            position = self._determine_position(skill_scores)
            
            # Calculate overall rating
            overall_rating = self._calculate_overall_rating(skill_scores, position)
            
            profile = PlayerProfile(
                player_id=player_id,
                name=recent_games[0].player_name,
                position=position,
                skill_scores=skill_scores,
                overall_rating=overall_rating,
                recent_games=recent_games
            )
            profiles.append(profile)
            
        return profiles
    
    def _determine_position(self, skill_scores: Dict[str, float]) -> Literal['guard', 'forward', 'center']:
        """Determine player position based on skill scores."""
        if skill_scores['rebounds'] > 0.6:
            return 'center'
        elif skill_scores['assists'] > 0.6:
            return 'guard'
        else:
            return 'forward'
    
    def _calculate_overall_rating(self, skill_scores: Dict[str, float], position: str) -> float:
        """Calculate overall player rating based on position-specific weights."""
        if position not in self.position_weights:
            return sum(skill_scores.values()) / len(skill_scores)
        
        weights = self.position_weights[position]
        weighted_sum = 0.0
        total_weight = 0.0
        
        for skill, weight in weights.items():
            if skill in skill_scores:
                weighted_sum += skill_scores[skill] * weight
                total_weight += weight
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    def _create_team_composition(self, players: List[PlayerProfile]) -> TeamComposition:
        """Create a team composition from a list of players."""
        total_skill = sum(p.overall_rating for p in players)
        average_skill = total_skill / len(players) if players else 0.0
        
        # Count positions
        positions = {}
        for player in players:
            positions[player.position] = positions.get(player.position, 0) + 1
        
        return TeamComposition(
            players=players,
            total_skill=total_skill,
            average_skill=average_skill,
            positions=positions
        ) 