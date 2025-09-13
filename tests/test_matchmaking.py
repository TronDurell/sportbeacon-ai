import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

# Add the project root to the path so we can import the ai modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.matchmaking_engine import MatchmakingEngine, PlayerStatRecord, MatchmakingRequest

class TestMatchmakingEngine:
    
    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.engine = MatchmakingEngine()
        
        # Create sample player stats for testing
        self.sample_players = [
            PlayerStatRecord(
                player_id=1,
                player_name="Player A",
                game_date=datetime.now() - timedelta(days=5),
                points=25.0,
                assists=8.0,
                rebounds=6.0,
                steals=2.0,
                blocks=1.0,
                field_goal_percentage=50.0,
                three_point_percentage=40.0,
                result="win"
            ),
            PlayerStatRecord(
                player_id=2,
                player_name="Player B",
                game_date=datetime.now() - timedelta(days=4),
                points=18.0,
                assists=12.0,
                rebounds=4.0,
                steals=3.0,
                blocks=0.0,
                field_goal_percentage=45.0,
                three_point_percentage=35.0,
                result="win"
            ),
            PlayerStatRecord(
                player_id=3,
                player_name="Player C",
                game_date=datetime.now() - timedelta(days=3),
                points=15.0,
                assists=5.0,
                rebounds=12.0,
                steals=1.0,
                blocks=3.0,
                field_goal_percentage=55.0,
                three_point_percentage=30.0,
                result="loss"
            ),
            PlayerStatRecord(
                player_id=4,
                player_name="Player D",
                game_date=datetime.now() - timedelta(days=2),
                points=22.0,
                assists=6.0,
                rebounds=8.0,
                steals=2.0,
                blocks=2.0,
                field_goal_percentage=48.0,
                three_point_percentage=42.0,
                result="win"
            ),
            PlayerStatRecord(
                player_id=5,
                player_name="Player E",
                game_date=datetime.now() - timedelta(days=1),
                points=20.0,
                assists=4.0,
                rebounds=10.0,
                steals=1.0,
                blocks=4.0,
                field_goal_percentage=52.0,
                three_point_percentage=38.0,
                result="win"
            ),
            PlayerStatRecord(
                player_id=6,
                player_name="Player F",
                game_date=datetime.now(),
                points=16.0,
                assists=10.0,
                rebounds=5.0,
                steals=4.0,
                blocks=1.0,
                field_goal_percentage=42.0,
                three_point_percentage=45.0,
                result="win"
            )
        ]
    
    def test_calculate_overall_rating(self):
        """Test calculation of overall player rating."""
        rating = self.engine.calculate_overall_rating([self.sample_players[0]])
        
        assert isinstance(rating, float)
        assert rating > 0.0
        assert not np.isnan(rating)
        assert not np.isinf(rating)
    
    def test_calculate_overall_rating_empty_stats(self):
        """Test rating calculation with empty stats."""
        rating = self.engine.calculate_overall_rating([])
        assert rating == 0.0
    
    def test_find_available_players(self):
        """Test finding available players with minimum criteria."""
        available = self.engine.find_available_players(self.sample_players, 3, min_games=1)
        
        assert isinstance(available, list)
        assert len(available) <= 3
        assert all(isinstance(p, PlayerStatRecord) for p in available)
    
    def test_find_available_players_insufficient_games(self):
        """Test finding players with high minimum game requirement."""
        available = self.engine.find_available_players(self.sample_players, 3, min_games=10)
        assert available == []
    
    def test_find_available_players_empty_list(self):
        """Test finding players with empty player list."""
        available = self.engine.find_available_players([], 3)
        assert available == []
    
    def test_create_balanced_teams(self):
        """Test creation of balanced teams."""
        request = MatchmakingRequest(
            players=self.sample_players,
            team_size=3,
            consider_positions=True
        )
        
        response = self.engine.create_balanced_teams(request)
        
        assert response.team1 is not None
        assert response.team2 is not None
        assert len(response.team1.players) == 3
        assert len(response.team2.players) == 3
        assert response.skill_gap >= 0.0
        assert 0.0 <= response.balance_score <= 1.0
        assert isinstance(response.is_balanced, bool)
    
    def test_create_balanced_teams_insufficient_players(self):
        """Test team creation with insufficient players."""
        request = MatchmakingRequest(
            players=self.sample_players[:2],  # Only 2 players
            team_size=3,
            consider_positions=True
        )
        
        with pytest.raises(ValueError):
            self.engine.create_balanced_teams(request)
    
    def test_create_balanced_teams_different_sizes(self):
        """Test team creation with different team sizes."""
        # Test with team size 3
        request = MatchmakingRequest(
            players=self.sample_players,
            team_size=3,
            consider_positions=True
        )
        response = self.engine.create_balanced_teams(request)
        assert response.team1 is not None
        assert response.team2 is not None
        assert len(response.team1.players) == 3
        assert len(response.team2.players) == 3
        
        # Test with team size 5 (if we have enough players)
        if len(self.sample_players) >= 10:
            request = MatchmakingRequest(
                players=self.sample_players,
                team_size=5,
                consider_positions=True
            )
            response = self.engine.create_balanced_teams(request)
            assert response.team1 is not None
            assert response.team2 is not None
            assert len(response.team1.players) == 5
            assert len(response.team2.players) == 5
    
    def test_suggest_game_time(self):
        """Test game time suggestion."""
        suggestion = self.engine.suggest_game_time(self.sample_players)
        
        assert isinstance(suggestion, dict)
        assert 'suggested_time' in suggestion
        assert 'confidence' in suggestion
        assert 'alternative_times' in suggestion
        assert 'reasoning' in suggestion
        
        assert isinstance(suggestion['suggested_time'], str)
        assert 0.0 <= suggestion['confidence'] <= 1.0
        assert isinstance(suggestion['alternative_times'], list)
        assert isinstance(suggestion['reasoning'], str)
    
    def test_suggest_game_time_empty_players(self):
        """Test game time suggestion with no players."""
        suggestion = self.engine.suggest_game_time([])
        
        assert suggestion['suggested_time'] == "No players available"
        assert suggestion['confidence'] == 0.0
    
    def test_create_player_profiles(self):
        """Test creation of player profiles."""
        profiles = self.engine.create_player_profiles(self.sample_players)
        
        assert isinstance(profiles, list)
        assert len(profiles) == 6  # One profile per unique player
        
        for profile in profiles:
            assert profile.player_id > 0
            assert profile.name in ["Player A", "Player B", "Player C", "Player D", "Player E", "Player F"]
            assert profile.position in ["guard", "forward", "center"]
            assert isinstance(profile.skill_scores, dict)
            assert isinstance(profile.overall_rating, float)
            assert profile.overall_rating >= 0.0
            assert isinstance(profile.recent_games, list)
    
    def test_create_player_profiles_empty_list(self):
        """Test profile creation with empty player list."""
        profiles = self.engine.create_player_profiles([])
        assert profiles == []
    
    def test_convert_to_dataframe(self):
        """Test conversion of players to DataFrame."""
        df = self.engine._convert_to_dataframe(self.sample_players)
        
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 6
        assert 'player_name' in df.columns
        assert 'points' in df.columns
        assert 'assists' in df.columns
        assert 'rebounds' in df.columns
    
    def test_convert_to_dataframe_empty_list(self):
        """Test DataFrame conversion with empty list."""
        df = self.engine._convert_to_dataframe([])
        assert isinstance(df, pd.DataFrame)
        assert df.empty
    
    def test_determine_position(self):
        """Test position determination logic."""
        # Test center position (high rebounds)
        center_skills = {
            'points': 0.5, 'assists': 0.3, 'rebounds': 0.8, 'steals': 0.2,
            'blocks': 0.6, 'field_goal_percentage': 0.5, 'three_point_percentage': 0.3
        }
        position = self.engine._determine_position(center_skills)
        assert position == 'center'
        
        # Test guard position (high assists)
        guard_skills = {
            'points': 0.4, 'assists': 0.8, 'rebounds': 0.3, 'steals': 0.4,
            'blocks': 0.2, 'field_goal_percentage': 0.45, 'three_point_percentage': 0.4
        }
        position = self.engine._determine_position(guard_skills)
        assert position == 'guard'
        
        # Test forward position (default)
        forward_skills = {
            'points': 0.6, 'assists': 0.4, 'rebounds': 0.5, 'steals': 0.3,
            'blocks': 0.3, 'field_goal_percentage': 0.5, 'three_point_percentage': 0.35
        }
        position = self.engine._determine_position(forward_skills)
        assert position == 'forward'
    
    def test_calculate_overall_rating_with_position(self):
        """Test position-specific rating calculation."""
        skills = {
            'points': 0.6, 'assists': 0.4, 'rebounds': 0.5, 'steals': 0.3
        }
        
        # Test guard rating
        guard_rating = self.engine._calculate_overall_rating(skills, 'guard')
        assert isinstance(guard_rating, float)
        assert guard_rating >= 0.0
        
        # Test forward rating
        forward_rating = self.engine._calculate_overall_rating(skills, 'forward')
        assert isinstance(forward_rating, float)
        assert forward_rating >= 0.0
        
        # Test center rating
        center_rating = self.engine._calculate_overall_rating(skills, 'center')
        assert isinstance(center_rating, float)
        assert center_rating >= 0.0
        
        # Test unknown position
        unknown_rating = self.engine._calculate_overall_rating(skills, 'unknown')
        assert isinstance(unknown_rating, float)
        assert unknown_rating >= 0.0
    
    def test_get_alternative_times(self):
        """Test alternative time generation."""
        alternatives = self.engine._get_alternative_times(19)
        
        assert isinstance(alternatives, list)
        assert "17:00" in alternatives
        assert "18:00" in alternatives
        assert "20:00" in alternatives
        assert "21:00" in alternatives
        
        # Test edge cases
        early_alternatives = self.engine._get_alternative_times(10)
        assert "09:00" in early_alternatives
        assert "08:00" not in early_alternatives  # Too early
        
        late_alternatives = self.engine._get_alternative_times(20)
        assert "22:00" not in late_alternatives  # Too late
    
    def test_create_team_composition(self):
        """Test team composition creation."""
        # Create mock player profiles
        from ai.matchmaking_engine import PlayerProfile
        
        profiles = [
            PlayerProfile(
                player_id=1,
                name="Player A",
                position="guard",
                skill_scores={"points": 0.6, "assists": 0.8},
                overall_rating=0.7,
                recent_games=[]
            ),
            PlayerProfile(
                player_id=2,
                name="Player B",
                position="forward",
                skill_scores={"points": 0.7, "assists": 0.4},
                overall_rating=0.65,
                recent_games=[]
            )
        ]
        
        composition = self.engine._create_team_composition(profiles)
        
        assert composition.players == profiles
        assert composition.total_skill == 1.35  # 0.7 + 0.65
        assert composition.average_skill == 0.675  # (0.7 + 0.65) / 2
        assert composition.positions == {"guard": 1, "forward": 1}
    
    def test_create_team_composition_empty(self):
        """Test team composition creation with empty player list."""
        composition = self.engine._create_team_composition([])
        
        assert composition.players == []
        assert composition.total_skill == 0.0
        assert composition.average_skill == 0.0
        assert composition.positions == {}

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
