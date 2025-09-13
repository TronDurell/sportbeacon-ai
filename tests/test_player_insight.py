import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

# Add the project root to the path so we can import the ai modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.player_insight import PlayerInsightEngine, PlayerStatRecord

class TestPlayerInsightEngine:
    
    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.engine = PlayerInsightEngine()
        
        # Create sample player stats for testing
        self.sample_stats = [
            PlayerStatRecord(
                player_id=1,
                player_name="Test Player",
                game_date=datetime.now() - timedelta(days=10),
                points=20.0,
                assists=5.0,
                rebounds=8.0,
                steals=2.0,
                blocks=1.0,
                field_goal_percentage=45.0,
                three_point_percentage=35.0,
                result="win"
            ),
            PlayerStatRecord(
                player_id=1,
                player_name="Test Player",
                game_date=datetime.now() - timedelta(days=8),
                points=25.0,
                assists=7.0,
                rebounds=10.0,
                steals=1.0,
                blocks=2.0,
                field_goal_percentage=50.0,
                three_point_percentage=40.0,
                result="win"
            ),
            PlayerStatRecord(
                player_id=1,
                player_name="Test Player",
                game_date=datetime.now() - timedelta(days=6),
                points=18.0,
                assists=4.0,
                rebounds=6.0,
                steals=3.0,
                blocks=0.0,
                field_goal_percentage=40.0,
                three_point_percentage=30.0,
                result="loss"
            ),
            PlayerStatRecord(
                player_id=1,
                player_name="Test Player",
                game_date=datetime.now() - timedelta(days=4),
                points=22.0,
                assists=6.0,
                rebounds=9.0,
                steals=2.0,
                blocks=1.0,
                field_goal_percentage=48.0,
                three_point_percentage=38.0,
                result="win"
            ),
            PlayerStatRecord(
                player_id=1,
                player_name="Test Player",
                game_date=datetime.now() - timedelta(days=2),
                points=28.0,
                assists=8.0,
                rebounds=12.0,
                steals=1.0,
                blocks=3.0,
                field_goal_percentage=55.0,
                three_point_percentage=45.0,
                result="win"
            )
        ]
    
    def test_convert_to_dataframe(self):
        """Test conversion of PlayerStatRecord list to DataFrame."""
        df = self.engine._convert_to_dataframe(self.sample_stats)
        
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 5
        assert 'player_name' in df.columns
        assert 'points' in df.columns
        assert df['player_name'].iloc[0] == "Test Player"
        assert df['points'].iloc[0] == 20.0
    
    def test_convert_to_dataframe_empty(self):
        """Test conversion with empty stats list."""
        df = self.engine._convert_to_dataframe([])
        assert isinstance(df, pd.DataFrame)
        assert df.empty
    
    def test_normalize_stats(self):
        """Test statistical normalization using StandardScaler."""
        df = self.engine._convert_to_dataframe(self.sample_stats)
        normalized = self.engine.normalize_stats(df)
        
        assert isinstance(normalized, dict)
        assert 'points' in normalized
        assert 'assists' in normalized
        assert 'rebounds' in normalized
        
        # Check that normalized values are reasonable (not extreme outliers)
        for value in normalized.values():
            assert isinstance(value, float)
            assert not np.isnan(value)
            assert not np.isinf(value)
    
    def test_normalize_stats_empty_dataframe(self):
        """Test normalization with empty DataFrame."""
        df = pd.DataFrame()
        normalized = self.engine.normalize_stats(df)
        assert normalized == {}
    
    def test_calculate_player_trends(self):
        """Test calculation of player performance trends."""
        df = self.engine._convert_to_dataframe(self.sample_stats)
        trends = self.engine.calculate_player_trends(df)
        
        assert isinstance(trends, dict)
        assert 'points' in trends
        assert 'assists' in trends
        assert 'rebounds' in trends
        
        # Check that trends are calculated (values should be numeric)
        assert isinstance(trends['points'], (int, float, np.number))
        assert isinstance(trends['assists'], (int, float, np.number))
        assert isinstance(trends['rebounds'], (int, float, np.number))
    
    def test_calculate_player_trends_insufficient_data(self):
        """Test trends calculation with insufficient data."""
        # Create DataFrame with only 2 games (not enough for trends)
        short_stats = self.sample_stats[:2]
        df = self.engine._convert_to_dataframe(short_stats)
        trends = self.engine.calculate_player_trends(df)
        assert trends == {}
    
    def test_identify_top_skills(self):
        """Test identification of player's top skills."""
        df = self.engine._convert_to_dataframe(self.sample_stats)
        top_skills = self.engine.identify_top_skills(df)
        
        assert isinstance(top_skills, list)
        assert len(top_skills) <= 3  # Should return top 3 skills
        assert all(isinstance(skill, str) for skill in top_skills)
        
        # Check that skills are from the expected set
        expected_skills = {
            'scoring', 'playmaking', 'rebounding', 'defense', 
            'shot_blocking', 'shooting_efficiency', 'three_point_shooting'
        }
        assert all(skill in expected_skills for skill in top_skills)
    
    def test_identify_top_skills_empty_dataframe(self):
        """Test skill identification with empty DataFrame."""
        df = pd.DataFrame()
        top_skills = self.engine.identify_top_skills(df)
        assert top_skills == []
    
    def test_get_growth_areas(self):
        """Test identification of player's growth areas."""
        df = self.engine._convert_to_dataframe(self.sample_stats)
        growth_areas = self.engine.get_growth_areas(df)
        
        assert isinstance(growth_areas, list)
        assert len(growth_areas) <= 3  # Should return bottom 3 skills
        assert all(isinstance(area, str) for area in growth_areas)
        
        # Check that growth areas are from the expected set
        expected_skills = {
            'scoring', 'playmaking', 'rebounding', 'defense', 
            'shot_blocking', 'shooting_efficiency', 'three_point_shooting'
        }
        assert all(area in expected_skills for area in growth_areas)
    
    def test_get_growth_areas_empty_dataframe(self):
        """Test growth areas identification with empty DataFrame."""
        df = pd.DataFrame()
        growth_areas = self.engine.get_growth_areas(df)
        assert growth_areas == []
    
    def test_calculate_win_rate(self):
        """Test calculation of player's win rate."""
        df = self.engine._convert_to_dataframe(self.sample_stats)
        win_rate = self.engine.calculate_win_rate(df)
        
        assert isinstance(win_rate, float)
        assert 0.0 <= win_rate <= 1.0
        
        # With our sample data: 4 wins out of 5 games = 0.8
        expected_win_rate = 4.0 / 5.0
        assert abs(win_rate - expected_win_rate) < 0.01
    
    def test_calculate_win_rate_no_results(self):
        """Test win rate calculation with no result data."""
        df = pd.DataFrame({'points': [20, 25, 18]})
        win_rate = self.engine.calculate_win_rate(df)
        assert win_rate == 0.0
    
    def test_generate_player_report(self):
        """Test generation of comprehensive player report."""
        df = self.engine._convert_to_dataframe(self.sample_stats)
        report = self.engine.generate_player_report(df)
        
        assert isinstance(report, dict)
        assert 'player_name' in report
        assert 'games_played' in report
        assert 'win_rate' in report
        assert 'avg_stats' in report
        assert 'top_skills' in report
        assert 'growth_areas' in report
        assert 'trends' in report
        assert 'recommendations' in report
        
        assert report['player_name'] == "Test Player"
        assert report['games_played'] == 5
        assert report['win_rate'] == 0.8
        assert isinstance(report['top_skills'], list)
        assert isinstance(report['growth_areas'], list)
        assert isinstance(report['recommendations'], list)
    
    def test_generate_player_report_empty_dataframe(self):
        """Test report generation with empty DataFrame."""
        df = pd.DataFrame()
        report = self.engine.generate_player_report(df)
        
        assert report['player_name'] == 'Unknown'
        assert report['games_played'] == 0
        assert report['win_rate'] == 0.0
        assert report['top_skills'] == []
        assert report['growth_areas'] == []
    
    def test_analyze_player_performance(self):
        """Test the main analysis method."""
        analysis = self.engine.analyze_player_performance(self.sample_stats)
        
        assert analysis.player_name == "Test Player"
        assert isinstance(analysis.normalized_stats, dict)
        assert isinstance(analysis.top_skills, list)
        assert isinstance(analysis.growth_areas, list)
        assert isinstance(analysis.recent_trends, dict)
    
    def test_analyze_player_performance_empty_stats(self):
        """Test analysis with empty stats list."""
        analysis = self.engine.analyze_player_performance([])
        
        assert analysis.player_name == "Unknown"
        assert analysis.normalized_stats == {}
        assert analysis.top_skills == []
        assert analysis.growth_areas == []
        assert analysis.recent_trends == {}
    
    def test_get_player_insights(self):
        """Test the main insights method."""
        insights = self.engine.get_player_insights(self.sample_stats)
        
        assert insights.player_id == 1
        assert insights.player_name == "Test Player"
        assert insights.games_played == 5
        assert insights.win_rate == 0.8
        assert isinstance(insights.avg_points, float)
        assert isinstance(insights.avg_assists, float)
        assert isinstance(insights.avg_rebounds, float)
    
    def test_get_player_insights_empty_stats(self):
        """Test insights with empty stats list."""
        insights = self.engine.get_player_insights([])
        
        assert insights.player_id == 0
        assert insights.player_name == "Unknown"
        assert insights.games_played == 0
        assert insights.win_rate == 0.0
        assert insights.avg_points == 0.0
        assert insights.avg_assists == 0.0
        assert insights.avg_rebounds == 0.0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
