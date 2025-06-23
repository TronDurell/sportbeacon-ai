import unittest
from unittest.mock import patch, MagicMock, AsyncMock
import sys
import os
from datetime import datetime, timedelta
import json

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

class TestAISummaryGeneration(unittest.TestCase):
    """Test cases for AI-powered coaching summary generation."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_team_data = {
            'team_id': 'team_123',
            'team_name': 'Champions Team',
            'timeframe': 'week',
            'members': [
                {
                    'player_id': 'player_1',
                    'name': 'Jordan',
                    'sport': 'basketball',
                    'stats': {
                        'beacon_earned': 1500,
                        'drills_completed': 25,
                        'current_streak': 7,
                        'avg_score': 85.5,
                        'points': 92,
                        'rebounds': 8,
                        'assists': 12
                    },
                    'achievements': ['scoring_milestone', 'playmaking'],
                    'performance_trend': 'up'
                },
                {
                    'player_id': 'player_2',
                    'name': 'Sarah',
                    'sport': 'basketball',
                    'stats': {
                        'beacon_earned': 1200,
                        'drills_completed': 22,
                        'current_streak': 5,
                        'avg_score': 78.2,
                        'points': 67,
                        'rebounds': 12,
                        'assists': 8
                    },
                    'achievements': ['defensive_excellence'],
                    'performance_trend': 'stable'
                }
            ],
            'team_stats': {
                'total_beacon_earned': 2700,
                'total_drills_completed': 47,
                'avg_team_score': 81.85,
                'team_activity_score': 85.2
            },
            'recent_activity': [
                {'type': 'drill_completion', 'player': 'Jordan', 'drill': '3-Point Shooting', 'score': 92},
                {'type': 'achievement', 'player': 'Sarah', 'achievement': 'Defensive Excellence'},
                {'type': 'streak_milestone', 'player': 'Jordan', 'streak': 7}
            ]
        }

        self.mock_player_data = {
            'player_id': 'player_1',
            'name': 'Jordan',
            'sport': 'basketball',
            'timeframe': 'week',
            'stats': {
                'beacon_earned': 1500,
                'drills_completed': 25,
                'current_streak': 7,
                'avg_score': 85.5,
                'points': 92,
                'rebounds': 8,
                'assists': 12,
                'steals': 3,
                'blocks': 2
            },
            'achievements': ['scoring_milestone', 'playmaking'],
            'performance_trend': 'up',
            'recent_drills': [
                {'name': '3-Point Shooting', 'score': 92, 'date': '2024-01-15'},
                {'name': 'Ball Handling', 'score': 88, 'date': '2024-01-14'},
                {'name': 'Defense', 'score': 85, 'date': '2024-01-13'}
            ],
            'goals': ['Improve 3-point accuracy', 'Increase assists per game'],
            'coach_notes': ['Excellent work ethic', 'Great team player']
        }

        self.mock_openai_response = {
            'choices': [
                {
                    'message': {
                        'content': 'This week, the team showed excellent dedication and teamwork. Jordan led with 1500 BEACON earned and a 7-day streak, while Sarah demonstrated defensive excellence. The team completed 47 drills with an average score of 81.85. Keep up this amazing momentum!'
                    }
                }
            ]
        }

    @patch('services.coach_ai_summary.client')
    async def test_generate_team_summary_success(self, mock_openai_client):
        """Test successful team summary generation with OpenAI."""
        from services.coach_ai_summary import coach_ai_summary

        # Mock OpenAI response
        mock_openai_client.chat.completions.create.return_value = self.mock_openai_response

        # Test team summary generation
        summary = await coach_ai_summary.generate_team_summary('team_123', 'week')

        # Verify OpenAI was called
        mock_openai_client.chat.completions.create.assert_called_once()
        
        # Verify response structure
        self.assertIsInstance(summary, dict)
        self.assertTrue(summary['ai_generated'])
        self.assertIn('summary_text', summary)
        self.assertIn('key_points', summary)
        self.assertIn('motivational_quote', summary)
        self.assertIn('generated_at', summary)

        # Verify summary content
        self.assertIn('Jordan', summary['summary_text'])
        self.assertIn('1500 BEACON', summary['summary_text'])
        self.assertGreater(len(summary['key_points']), 0)

    @patch('services.coach_ai_summary.client')
    async def test_generate_player_summary_success(self, mock_openai_client):
        """Test successful player summary generation with OpenAI."""
        from services.coach_ai_summary import coach_ai_summary

        # Mock OpenAI response
        mock_openai_client.chat.completions.create.return_value = self.mock_openai_response

        # Test player summary generation
        summary = await coach_ai_summary.generate_player_summary('player_1', 'week')

        # Verify OpenAI was called
        mock_openai_client.chat.completions.create.assert_called_once()
        
        # Verify response structure
        self.assertIsInstance(summary, dict)
        self.assertTrue(summary['ai_generated'])
        self.assertIn('summary_text', summary)
        self.assertIn('key_points', summary)
        self.assertIn('motivational_quote', summary)

    @patch('services.coach_ai_summary.client')
    async def test_generate_team_summary_openai_error(self, mock_openai_client):
        """Test team summary generation when OpenAI fails."""
        from services.coach_ai_summary import coach_ai_summary

        # Mock OpenAI error
        mock_openai_client.chat.completions.create.side_effect = Exception("OpenAI API error")

        # Test team summary generation
        summary = await coach_ai_summary.generate_team_summary('team_123', 'week')

        # Verify fallback summary is generated
        self.assertIsInstance(summary, dict)
        self.assertFalse(summary['ai_generated'])
        self.assertIn('summary_text', summary)
        self.assertIn('Unable to generate', summary['summary_text'])

    @patch('services.coach_ai_summary.client')
    async def test_generate_player_summary_openai_error(self, mock_openai_client):
        """Test player summary generation when OpenAI fails."""
        from services.coach_ai_summary import coach_ai_summary

        # Mock OpenAI error
        mock_openai_client.chat.completions.create.side_effect = Exception("OpenAI API error")

        # Test player summary generation
        summary = await coach_ai_summary.generate_player_summary('player_1', 'week')

        # Verify fallback summary is generated
        self.assertIsInstance(summary, dict)
        self.assertFalse(summary['ai_generated'])
        self.assertIn('summary_text', summary)

    async def test_generate_weekly_report(self):
        """Test comprehensive weekly report generation."""
        from services.coach_ai_summary import coach_ai_summary

        with patch.object(coach_ai_summary, '_get_team_data', return_value=self.mock_team_data):
            with patch.object(coach_ai_summary, '_generate_ai_summary', return_value={
                'ai_generated': True,
                'summary_text': 'Test summary',
                'key_points': ['Point 1', 'Point 2'],
                'motivational_quote': 'Test quote',
                'generated_at': datetime.now().isoformat()
            }):
                with patch.object(coach_ai_summary, '_extract_highlights', return_value=[
                    {'type': 'top_performer', 'title': '🏅 Top Performer: Jordan', 'description': '1500 BEACON earned'}
                ]):
                    with patch.object(coach_ai_summary, '_generate_recommendations', return_value=[
                        {'type': 'improvement', 'title': 'Focus on Skill Development', 'description': 'Test recommendation'}
                    ]):
                        with patch.object(coach_ai_summary, '_analyze_trends', return_value=[
                            {'type': 'positive', 'title': '📈 Team Momentum Building', 'description': '2 players showing improvement'}
                        ]):
                            with patch.object(coach_ai_summary, '_identify_milestones', return_value=[
                                {'type': 'team', 'title': '💰 1000+ BEACON Milestone', 'description': 'Team milestone achieved'}
                            ]):
                                with patch.object(coach_ai_summary, '_generate_next_week_focus', return_value={
                                    'primary_focus': 'Maintain momentum',
                                    'secondary_focus': 'Team building',
                                    'target_metrics': {'target_drills': 50, 'target_score': 85, 'target_streak': 5}
                                }):
                                    # Test weekly report generation
                                    report = await coach_ai_summary.generate_weekly_report('team_123')

                                    # Verify report structure
                                    self.assertIsInstance(report, dict)
                                    self.assertEqual(report['team_id'], 'team_123')
                                    self.assertEqual(report['report_type'], 'weekly')
                                    self.assertIn('summary', report)
                                    self.assertIn('highlights', report)
                                    self.assertIn('recommendations', report)
                                    self.assertIn('trends', report)
                                    self.assertIn('milestones', report)
                                    self.assertIn('next_week_focus', report)

    def test_extract_highlights(self):
        """Test highlight extraction from team data."""
        from services.coach_ai_summary import coach_ai_summary

        highlights = coach_ai_summary._extract_highlights(self.mock_team_data)

        self.assertIsInstance(highlights, list)
        self.assertGreater(len(highlights), 0)

        # Verify highlight structure
        for highlight in highlights:
            self.assertIn('type', highlight)
            self.assertIn('title', highlight)
            self.assertIn('description', highlight)
            self.assertIn('icon', highlight)

        # Verify top performer highlight
        top_performer_highlight = next((h for h in highlights if h['type'] == 'top_performer'), None)
        self.assertIsNotNone(top_performer_highlight)
        self.assertIn('Jordan', top_performer_highlight['title'])

    def test_generate_recommendations(self):
        """Test recommendation generation based on team data."""
        from services.coach_ai_summary import coach_ai_summary

        recommendations = coach_ai_summary._generate_recommendations(self.mock_team_data)

        self.assertIsInstance(recommendations, list)
        self.assertGreater(len(recommendations), 0)

        # Verify recommendation structure
        for rec in recommendations:
            self.assertIn('type', rec)
            self.assertIn('title', rec)
            self.assertIn('description', rec)
            self.assertIn('priority', rec)

    def test_analyze_trends(self):
        """Test trend analysis from team data."""
        from services.coach_ai_summary import coach_ai_summary

        trends = coach_ai_summary._analyze_trends(self.mock_team_data)

        self.assertIsInstance(trends, list)
        self.assertGreater(len(trends), 0)

        # Verify trend structure
        for trend in trends:
            self.assertIn('type', trend)
            self.assertIn('title', trend)
            self.assertIn('description', trend)
            self.assertIn('trend', trend)

    def test_identify_milestones(self):
        """Test milestone identification from team data."""
        from services.coach_ai_summary import coach_ai_summary

        milestones = coach_ai_summary._identify_milestones(self.mock_team_data)

        self.assertIsInstance(milestones, list)

        # Verify milestone structure
        for milestone in milestones:
            self.assertIn('type', milestone)
            self.assertIn('title', milestone)
            self.assertIn('description', milestone)
            self.assertIn('achieved', milestone)

    def test_generate_next_week_focus(self):
        """Test next week focus generation."""
        from services.coach_ai_summary import coach_ai_summary

        focus = coach_ai_summary._generate_next_week_focus(self.mock_team_data)

        self.assertIsInstance(focus, dict)
        self.assertIn('primary_focus', focus)
        self.assertIn('secondary_focus', focus)
        self.assertIn('target_metrics', focus)

        # Verify target metrics structure
        target_metrics = focus['target_metrics']
        self.assertIn('target_drills', target_metrics)
        self.assertIn('target_score', target_metrics)
        self.assertIn('target_streak', target_metrics)

    def test_extract_key_points(self):
        """Test key points extraction from AI summary."""
        from services.coach_ai_summary import coach_ai_summary

        summary_text = "This week was amazing. Jordan led the team with 1500 BEACON. Sarah showed great defense. The team completed 47 drills."
        
        key_points = coach_ai_summary._extract_key_points(summary_text)

        self.assertIsInstance(key_points, list)
        self.assertGreater(len(key_points), 0)
        self.assertLessEqual(len(key_points), 3)  # Should extract max 3 key points

    def test_generate_motivational_quote(self):
        """Test motivational quote generation."""
        from services.coach_ai_summary import coach_ai_summary

        # Test with upward trend
        quote_up = coach_ai_summary._generate_motivational_quote({'performance_trend': 'up'})
        self.assertIsInstance(quote_up, str)
        self.assertGreater(len(quote_up), 0)

        # Test with downward trend
        quote_down = coach_ai_summary._generate_motivational_quote({'performance_trend': 'down'})
        self.assertIsInstance(quote_down, str)
        self.assertGreater(len(quote_down), 0)

        # Test with stable trend
        quote_stable = coach_ai_summary._generate_motivational_quote({'performance_trend': 'stable'})
        self.assertIsInstance(quote_stable, str)
        self.assertGreater(len(quote_stable), 0)

    def test_create_team_prompt(self):
        """Test team prompt creation."""
        from services.coach_ai_summary import coach_ai_summary

        prompt = coach_ai_summary._create_team_prompt(self.mock_team_data, 'week')

        self.assertIsInstance(prompt, str)
        self.assertGreater(len(prompt), 0)
        self.assertIn('Champions Team', prompt)
        self.assertIn('Jordan', prompt)
        self.assertIn('Sarah', prompt)
        self.assertIn('2700', prompt)  # Total BEACON earned
        self.assertIn('47', prompt)    # Total drills completed

    def test_create_player_prompt(self):
        """Test player prompt creation."""
        from services.coach_ai_summary import coach_ai_summary

        prompt = coach_ai_summary._create_player_prompt(self.mock_player_data, 'week')

        self.assertIsInstance(prompt, str)
        self.assertGreater(len(prompt), 0)
        self.assertIn('Jordan', prompt)
        self.assertIn('basketball', prompt)
        self.assertIn('1500', prompt)  # BEACON earned
        self.assertIn('25', prompt)    # Drills completed
        self.assertIn('7', prompt)     # Current streak

    def test_cache_functionality(self):
        """Test caching functionality."""
        from services.coach_ai_summary import coach_ai_summary

        # Test cache set and get
        cache_key = 'test_cache_key'
        test_data = {'test': 'data'}
        
        coach_ai_summary.cache[cache_key] = {
            'summary': test_data,
            'timestamp': datetime.now()
        }

        # Test cache retrieval
        cached_data = coach_ai_summary.cache.get(cache_key)
        self.assertIsNotNone(cached_data)
        self.assertEqual(cached_data['summary'], test_data)

    def test_cache_expiration(self):
        """Test cache expiration."""
        from services.coach_ai_summary import coach_ai_summary

        cache_key = 'expired_cache_key'
        test_data = {'test': 'data'}
        
        # Set cache with expired timestamp
        coach_ai_summary.cache[cache_key] = {
            'summary': test_data,
            'timestamp': datetime.now() - timedelta(hours=2)  # Expired
        }

        # Test cache expiration
        cached_data = coach_ai_summary.cache.get(cache_key)
        self.assertIsNone(cached_data)

    def test_generate_fallback_summary(self):
        """Test fallback summary generation."""
        from services.coach_ai_summary import coach_ai_summary

        fallback = coach_ai_summary._generate_fallback_summary('team_123', 'team', 'week')

        self.assertIsInstance(fallback, dict)
        self.assertFalse(fallback['ai_generated'])
        self.assertIn('summary_text', fallback)
        self.assertIn('Unable to generate', fallback['summary_text'])
        self.assertIn('error', fallback)

    def test_generate_fallback_weekly_report(self):
        """Test fallback weekly report generation."""
        from services.coach_ai_summary import coach_ai_summary

        fallback_report = coach_ai_summary._generate_fallback_weekly_report('team_123')

        self.assertIsInstance(fallback_report, dict)
        self.assertEqual(fallback_report['team_id'], 'team_123')
        self.assertEqual(fallback_report['report_type'], 'weekly')
        self.assertIn('error', fallback_report)
        self.assertIn('summary', fallback_report)
        self.assertIn('highlights', fallback_report)
        self.assertIn('recommendations', fallback_report)

    def test_validate_team_data(self):
        """Test team data validation."""
        from services.coach_ai_summary import coach_ai_summary

        # Test valid team data
        is_valid = coach_ai_summary._validate_team_data(self.mock_team_data)
        self.assertTrue(is_valid)

        # Test invalid team data (missing required fields)
        invalid_data = {
            'team_id': 'team_123'
            # Missing required fields
        }
        
        is_valid = coach_ai_summary._validate_team_data(invalid_data)
        self.assertFalse(is_valid)

    def test_validate_player_data(self):
        """Test player data validation."""
        from services.coach_ai_summary import coach_ai_summary

        # Test valid player data
        is_valid = coach_ai_summary._validate_player_data(self.mock_player_data)
        self.assertTrue(is_valid)

        # Test invalid player data (missing required fields)
        invalid_data = {
            'player_id': 'player_1'
            # Missing required fields
        }
        
        is_valid = coach_ai_summary._validate_player_data(invalid_data)
        self.assertFalse(is_valid)

    def test_performance_analysis(self):
        """Test performance analysis functionality."""
        from services.coach_ai_summary import coach_ai_summary

        # Test team performance analysis
        analysis = coach_ai_summary._analyze_team_performance(self.mock_team_data)

        self.assertIsInstance(analysis, dict)
        self.assertIn('overall_score', analysis)
        self.assertIn('strengths', analysis)
        self.assertIn('weaknesses', analysis)
        self.assertIn('improvement_areas', analysis)

        # Test player performance analysis
        player_analysis = coach_ai_summary._analyze_player_performance(self.mock_player_data)

        self.assertIsInstance(player_analysis, dict)
        self.assertIn('performance_score', player_analysis)
        self.assertIn('key_metrics', player_analysis)
        self.assertIn('trends', player_analysis)

    def test_content_generation_quality(self):
        """Test content generation quality and consistency."""
        from services.coach_ai_summary import coach_ai_summary

        # Test multiple summary generations for consistency
        summaries = []
        for _ in range(3):
            summary = coach_ai_summary._generate_mock_summary(self.mock_team_data, 'team', 'week')
            summaries.append(summary)

        # Verify all summaries have required structure
        for summary in summaries:
            self.assertIsInstance(summary, dict)
            self.assertIn('summary_text', summary)
            self.assertIn('key_points', summary)
            self.assertIn('motivational_quote', summary)
            self.assertIn('generated_at', summary)

        # Verify summaries are not identical (some variation expected)
        summary_texts = [s['summary_text'] for s in summaries]
        unique_texts = set(summary_texts)
        self.assertGreater(len(unique_texts), 1)  # Should have some variation

if __name__ == '__main__':
    unittest.main() 