import pytest
import random
from datetime import datetime, timedelta
import sys
import os

# Add the project root to the path so we can import the ai modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.drill_recommender import DrillRecommendationEngine, DrillRecommendationRequest, DrillScheduleRequest
from backend.models import DifficultyLevel

class TestDrillRecommendationEngine:
    
    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.engine = DrillRecommendationEngine()
        
        # Sample player data for testing
        self.sample_player_skills = ['scoring', 'playmaking', 'rebounding']
        self.sample_growth_areas = ['defense', 'shooting_efficiency']
        self.sample_skill_levels = {
            'points': 0.6,
            'assists': 0.4,
            'rebounds': 0.7,
            'steals': 0.2,
            'blocks': 0.3,
            'field_goal_percentage': 0.5,
            'three_point_percentage': 0.4
        }
    
    def test_create_weekly_schedule(self):
        """Test creation of weekly training schedule."""
        schedule = self.engine.create_weekly_schedule(
            self.sample_player_skills,
            self.sample_growth_areas
        )
        
        assert isinstance(schedule, dict)
        assert 'monday' in schedule
        assert 'tuesday' in schedule
        assert 'wednesday' in schedule
        assert 'thursday' in schedule
        assert 'friday' in schedule
        assert 'saturday' in schedule
        
        # Check that each day has drills (except Sunday)
        for day, drills in schedule.items():
            if day != 'sunday':
                assert isinstance(drills, list)
                assert len(drills) <= 3  # Max 3 drills per day
    
    def test_create_weekly_schedule_custom_days(self):
        """Test weekly schedule with custom available days."""
        custom_days = ['monday', 'wednesday', 'friday']
        schedule = self.engine.create_weekly_schedule(
            self.sample_player_skills,
            self.sample_growth_areas,
            custom_days
        )
        
        assert isinstance(schedule, dict)
        assert 'monday' in schedule
        assert 'wednesday' in schedule
        assert 'friday' in schedule
        assert 'tuesday' not in schedule
        assert 'thursday' not in schedule
    
    def test_get_recommendations(self):
        """Test getting personalized drill recommendations."""
        recommendations = self.engine.get_recommendations(
            self.sample_player_skills,
            self.sample_growth_areas,
            self.sample_skill_levels,
            max_recommendations=3
        )
        
        assert isinstance(recommendations, list)
        assert len(recommendations) <= 3
        
        for rec in recommendations:
            assert hasattr(rec, 'drill')
            assert hasattr(rec, 'relevance_score')
            assert hasattr(rec, 'reasoning')
            assert isinstance(rec.relevance_score, float)
            assert 0.0 <= rec.relevance_score <= 1.0
            assert isinstance(rec.reasoning, str)
    
    def test_get_recommendations_empty_growth_areas(self):
        """Test recommendations with empty growth areas."""
        recommendations = self.engine.get_recommendations(
            self.sample_player_skills,
            [],
            self.sample_skill_levels,
            max_recommendations=3
        )
        
        assert isinstance(recommendations, list)
        # Should still return some recommendations based on available drills
    
    def test_format_recommendations_for_display(self):
        """Test formatting recommendations for UI display."""
        # First get some recommendations
        recommendations = self.engine.get_recommendations(
            self.sample_player_skills,
            self.sample_growth_areas,
            self.sample_skill_levels,
            max_recommendations=3
        )

        formatted = self.engine.format_recommendations_for_display(recommendations)
        
        assert isinstance(formatted, dict)
        assert 'recommendations' in formatted
        assert 'summary' in formatted
        assert isinstance(formatted['recommendations'], list)
        assert isinstance(formatted['summary'], dict)

        # Check recommendations structure
        for rec in formatted['recommendations']:
            assert 'name' in rec
            assert 'target_skills' in rec  # Changed from 'area' to 'target_skills'
            assert 'difficulty' in rec
            assert 'duration' in rec
            assert 'description' in rec
            assert 'equipment' in rec
            assert 'relevance_score' in rec
            assert 'reasoning' in rec
            assert 'requires_gym' in rec
            assert 'intensity' in rec
    
    def test_format_recommendations_empty(self):
        """Test formatting empty recommendations."""
        formatted = self.engine.format_recommendations_for_display([])
        
        assert formatted['message'] == "No drills found for your current skill level and goals."
        assert formatted['recommendations'] == []
        assert formatted['summary'] == {}
    
    def test_recommend_drills_with_request(self):
        """Test drill recommendations with proper request object."""
        request = DrillRecommendationRequest(
            user_id="test_user",
            top_skills=self.sample_player_skills,
            growth_areas=self.sample_growth_areas,
            skill_levels=self.sample_skill_levels,
            min_difficulty=DifficultyLevel.BEGINNER,
            max_difficulty=DifficultyLevel.ADVANCED,
            max_recommendations=3
        )
        
        response = self.engine.recommend_drills(request)
        
        assert hasattr(response, 'player_id')
        assert hasattr(response, 'recommended_drills')
        assert hasattr(response, 'training_notes')
        assert response.player_id == "test_user"
        assert isinstance(response.recommended_drills, list)
        assert isinstance(response.training_notes, list)
    
    def test_create_training_schedule_with_request(self):
        """Test creating training schedule with proper request object."""
        request = DrillScheduleRequest(
            user_id="test_user",
            available_days=['monday', 'wednesday', 'friday'],
            gym_access=True,
            skill_levels=self.sample_skill_levels,
            growth_areas=self.sample_growth_areas,
            min_difficulty=DifficultyLevel.BEGINNER,
            max_difficulty=DifficultyLevel.ADVANCED,
            max_drills_per_day=3,
            max_duration_per_day=60
        )
        
        response = self.engine.create_training_schedule(request)
        
        assert hasattr(response, 'user_id')
        assert hasattr(response, 'weekly_schedule')
        assert hasattr(response, 'total_duration')
        assert response.user_id == "test_user"
        assert isinstance(response.weekly_schedule, dict)
        assert isinstance(response.total_duration, int)
    
    def test_get_drills_for_day(self):
        """Test getting drills for a specific day."""
        drills = self.engine._get_drills_for_day(
            'monday',
            self.sample_player_skills,
            self.sample_growth_areas
        )
        
        assert isinstance(drills, list)
        for drill in drills:
            assert hasattr(drill, 'target_skills')
            assert isinstance(drill.target_skills, list)
    
    def test_calculate_relevance_score(self):
        """Test relevance score calculation."""
        drill = self.engine.drills_db[0]  # Get first drill
        score = self.engine._calculate_relevance_score(
            drill,
            self.sample_skill_levels,
            self.sample_growth_areas
        )
        
        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0
    
    def test_generate_reasoning(self):
        """Test reasoning generation for drill recommendations."""
        drill = self.engine.drills_db[0]  # Get first drill
        reasoning = self.engine._generate_reasoning(
            drill,
            self.sample_growth_areas,
            self.sample_skill_levels
        )
        
        assert isinstance(reasoning, str)
        assert len(reasoning) > 0
    
    def test_drill_database_creation(self):
        """Test that drill database is properly created."""
        assert len(self.engine.drills_db) > 0
        
        for drill in self.engine.drills_db:
            assert hasattr(drill, 'id')
            assert hasattr(drill, 'name')
            assert hasattr(drill, 'description')
            assert hasattr(drill, 'difficulty')
            assert hasattr(drill, 'duration')
            assert hasattr(drill, 'target_skills')
            assert isinstance(drill.target_skills, list)

    def test_skill_to_drill_areas_mapping(self):
        """Test skill to drill areas mapping."""
        mapping = self.engine.skill_to_drill_areas
        
        assert 'scoring' in mapping
        assert 'playmaking' in mapping
        assert 'rebounding' in mapping
        assert 'defense' in mapping
        
        # Check that mappings contain valid drill areas
        for skill, areas in mapping.items():
            assert isinstance(areas, list)
            for area in areas:
                # Check that this area exists in the drill database
                area_exists = any(area in drill.target_skills for drill in self.engine.drills_db)
                assert area_exists, f"Area '{area}' not found in drill database"
    
    def test_difficulty_scores(self):
        """Test difficulty scoring system."""
        scores = self.engine.difficulty_scores
        
        assert 'Beginner' in scores
        assert 'Intermediate' in scores
        assert 'Advanced' in scores
        
        assert scores['Beginner'] == 1
        assert scores['Intermediate'] == 2
        assert scores['Advanced'] == 3
    
    def test_intensity_progression(self):
        """Test intensity progression mapping."""
        progression = self.engine.intensity_progression
        
        assert 'monday' in progression
        assert 'tuesday' in progression
        assert 'wednesday' in progression
        assert 'thursday' in progression
        assert 'friday' in progression
        assert 'saturday' in progression
        assert 'sunday' in progression
    
    def test_recommendations_sorting(self):
        """Test that recommendations are properly sorted by relevance."""
        recommendations = self.engine.get_recommendations(
            self.sample_player_skills,
            self.sample_growth_areas,
            self.sample_skill_levels,
            max_recommendations=5
        )
        
        if len(recommendations) > 1:
            # Check that recommendations are sorted by relevance score (descending)
            for i in range(len(recommendations) - 1):
                assert recommendations[i].relevance_score >= recommendations[i + 1].relevance_score
    
    def test_schedule_balance(self):
        """Test that weekly schedule is properly balanced."""
        schedule = self.engine.create_weekly_schedule(
            self.sample_player_skills,
            self.sample_growth_areas
        )
        
        # Check that no day has too many drills
        for day, drills in schedule.items():
            if day != 'sunday':
                assert len(drills) <= 3, f"Day {day} has too many drills: {len(drills)}"
        
        # Check that schedule covers multiple days
        active_days = [day for day, drills in schedule.items() if day != 'sunday' and len(drills) > 0]
        assert len(active_days) > 0, "No active training days in schedule"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
