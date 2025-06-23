import unittest
from unittest.mock import patch, MagicMock
import sys
import os
from datetime import datetime, timedelta
import json

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

class TestGlobalHighlights(unittest.TestCase):
    """Test cases for global highlights functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_highlight_data = {
            'id': 'highlight_123',
            'title': 'Amazing 3-Point Shot',
            'description': 'Incredible buzzer-beater from downtown',
            'video_url': 'https://example.com/video.mp4',
            'thumbnail_url': 'https://example.com/thumbnail.jpg',
            'player_id': 'player_456',
            'player_name': 'Jordan Smith',
            'player_avatar': 'https://example.com/avatar.jpg',
            'sport': 'basketball',
            'created_at': datetime.now().isoformat(),
            'duration': 45,
            'engagement_score': 85.5,
            'stats': {
                'views': 1250,
                'likes': 89,
                'comments': 23,
                'shares': 15,
                'tips': 8
            },
            'tags': ['basketball', '3-pointer', 'buzzer-beater'],
            'viral_indicators': {
                'is_viral': True,
                'is_trending': True,
                'viral_score': 92,
                'growth_rate': 15.5
            },
            'performance_metrics': {
                'drill_score': 95,
                'achievement_type': 'clutch_performance'
            }
        }

        self.mock_highlights_response = {
            'highlights': [
                self.mock_highlight_data,
                {
                    **self.mock_highlight_data,
                    'id': 'highlight_124',
                    'title': 'Perfect Free Throw',
                    'engagement_score': 72.3,
                    'viral_indicators': {
                        'is_viral': False,
                        'is_trending': False,
                        'viral_score': 45,
                        'growth_rate': 2.1
                    }
                }
            ],
            'total_count': 2,
            'generated_at': datetime.now().isoformat()
        }

    @patch('firebase_admin.firestore.client')
    def test_fetch_global_highlights(self, mock_firestore):
        """Test fetching global highlights from Firestore."""
        # Mock Firestore query
        mock_query = MagicMock()
        mock_query.where.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.get.return_value = [
            MagicMock(to_dict=lambda: self.mock_highlight_data),
            MagicMock(to_dict=lambda: {**self.mock_highlight_data, 'id': 'highlight_124'})
        ]
        
        mock_firestore.return_value.collection.return_value = mock_query

        # Test the fetch function
        from api.highlights import get_global_highlights
        
        result = get_global_highlights(
            limit=10,
            offset=0,
            time_range='this_week',
            sport_filter='basketball',
            sort_by='engagement'
        )

        self.assertIsInstance(result, dict)
        self.assertIn('highlights', result)
        self.assertIn('total_count', result)
        self.assertGreater(len(result['highlights']), 0)

    def test_highlight_engagement_score_calculation(self):
        """Test engagement score calculation for highlights."""
        from services.highlight_engine import calculate_engagement_score

        # Test high engagement highlight
        high_engagement_stats = {
            'views': 5000,
            'likes': 500,
            'comments': 100,
            'shares': 50,
            'tips': 25
        }
        
        score = calculate_engagement_score(high_engagement_stats)
        self.assertGreater(score, 80)  # Should be high engagement

        # Test low engagement highlight
        low_engagement_stats = {
            'views': 100,
            'likes': 5,
            'comments': 1,
            'shares': 0,
            'tips': 0
        }
        
        score = calculate_engagement_score(low_engagement_stats)
        self.assertLess(score, 30)  # Should be low engagement

    def test_viral_indicator_detection(self):
        """Test viral indicator detection logic."""
        from services.highlight_engine import detect_viral_indicators

        # Test viral highlight
        viral_stats = {
            'views': 10000,
            'likes': 1000,
            'comments': 200,
            'shares': 100,
            'tips': 50,
            'growth_rate': 25.5
        }
        
        indicators = detect_viral_indicators(viral_stats)
        self.assertTrue(indicators['is_viral'])
        self.assertTrue(indicators['is_trending'])
        self.assertGreater(indicators['viral_score'], 80)

        # Test non-viral highlight
        non_viral_stats = {
            'views': 100,
            'likes': 10,
            'comments': 2,
            'shares': 1,
            'tips': 0,
            'growth_rate': 1.2
        }
        
        indicators = detect_viral_indicators(non_viral_stats)
        self.assertFalse(indicators['is_viral'])
        self.assertFalse(indicators['is_trending'])
        self.assertLess(indicators['viral_score'], 50)

    def test_highlight_filtering(self):
        """Test highlight filtering by various criteria."""
        from services.highlight_engine import filter_highlights

        highlights = [
            self.mock_highlight_data,
            {**self.mock_highlight_data, 'id': 'highlight_124', 'sport': 'soccer'},
            {**self.mock_highlight_data, 'id': 'highlight_125', 'sport': 'basketball', 'viral_indicators': {'is_viral': False}}
        ]

        # Test sport filtering
        basketball_highlights = filter_highlights(highlights, sport='basketball')
        self.assertEqual(len(basketball_highlights), 2)

        soccer_highlights = filter_highlights(highlights, sport='soccer')
        self.assertEqual(len(soccer_highlights), 1)

        # Test viral filtering
        viral_highlights = filter_highlights(highlights, viral_only=True)
        self.assertEqual(len(viral_highlights), 1)

        # Test trending filtering
        trending_highlights = filter_highlights(highlights, trending_only=True)
        self.assertEqual(len(trending_highlights), 1)

    def test_highlight_sorting(self):
        """Test highlight sorting by different criteria."""
        from services.highlight_engine import sort_highlights

        highlights = [
            {**self.mock_highlight_data, 'id': 'highlight_1', 'engagement_score': 50},
            {**self.mock_highlight_data, 'id': 'highlight_2', 'engagement_score': 90},
            {**self.mock_highlight_data, 'id': 'highlight_3', 'engagement_score': 75}
        ]

        # Test engagement sorting
        sorted_by_engagement = sort_highlights(highlights, sort_by='engagement')
        self.assertEqual(sorted_by_engagement[0]['id'], 'highlight_2')  # Highest engagement
        self.assertEqual(sorted_by_engagement[-1]['id'], 'highlight_1')  # Lowest engagement

        # Test tips sorting
        highlights_with_tips = [
            {**self.mock_highlight_data, 'id': 'highlight_1', 'stats': {'tips': 5}},
            {**self.mock_highlight_data, 'id': 'highlight_2', 'stats': {'tips': 15}},
            {**self.mock_highlight_data, 'id': 'highlight_3', 'stats': {'tips': 10}}
        ]

        sorted_by_tips = sort_highlights(highlights_with_tips, sort_by='tips')
        self.assertEqual(sorted_by_tips[0]['id'], 'highlight_2')  # Most tips
        self.assertEqual(sorted_by_tips[-1]['id'], 'highlight_1')  # Least tips

    def test_highlight_validation(self):
        """Test highlight data validation."""
        from services.highlight_engine import validate_highlight_data

        # Test valid highlight
        is_valid = validate_highlight_data(self.mock_highlight_data)
        self.assertTrue(is_valid)

        # Test invalid highlight (missing required fields)
        invalid_highlight = {
            'id': 'highlight_123',
            'title': 'Test Highlight'
            # Missing required fields
        }
        
        is_valid = validate_highlight_data(invalid_highlight)
        self.assertFalse(is_valid)

        # Test highlight with invalid engagement score
        invalid_score_highlight = {
            **self.mock_highlight_data,
            'engagement_score': 150  # Should be 0-100
        }
        
        is_valid = validate_highlight_data(invalid_score_highlight)
        self.assertFalse(is_valid)

    def test_highlight_metadata_extraction(self):
        """Test extraction of highlight metadata."""
        from services.highlight_engine import extract_highlight_metadata

        metadata = extract_highlight_metadata(self.mock_highlight_data)

        self.assertIn('duration_formatted', metadata)
        self.assertIn('created_date', metadata)
        self.assertIn('engagement_level', metadata)
        self.assertIn('viral_status', metadata)

        # Test duration formatting
        self.assertEqual(metadata['duration_formatted'], '0:45')

        # Test engagement level
        self.assertIn(metadata['engagement_level'], ['low', 'medium', 'high', 'viral'])

    def test_highlight_recommendations(self):
        """Test highlight recommendation generation."""
        from services.highlight_engine import generate_highlight_recommendations

        user_preferences = {
            'sport': 'basketball',
            'favorite_players': ['player_456'],
            'preferred_content': ['game_highlights', 'skill_drills']
        }

        recommendations = generate_highlight_recommendations(
            [self.mock_highlight_data],
            user_preferences
        )

        self.assertIsInstance(recommendations, list)
        self.assertGreater(len(recommendations), 0)

    def test_highlight_analytics(self):
        """Test highlight analytics calculation."""
        from services.highlight_engine import calculate_highlight_analytics

        highlights = [
            self.mock_highlight_data,
            {**self.mock_highlight_data, 'id': 'highlight_124', 'stats': {'views': 2000, 'likes': 150}},
            {**self.mock_highlight_data, 'id': 'highlight_125', 'stats': {'views': 3000, 'likes': 300}}
        ]

        analytics = calculate_highlight_analytics(highlights)

        self.assertIn('total_views', analytics)
        self.assertIn('total_likes', analytics)
        self.assertIn('total_comments', analytics)
        self.assertIn('total_shares', analytics)
        self.assertIn('total_tips', analytics)
        self.assertIn('avg_engagement_rate', analytics)
        self.assertIn('viral_highlights_count', analytics)

        # Test calculations
        self.assertEqual(analytics['total_views'], 6250)  # 1250 + 2000 + 3000
        self.assertEqual(analytics['total_likes'], 539)   # 89 + 150 + 300
        self.assertGreater(analytics['avg_engagement_rate'], 0)

    def test_highlight_cache_management(self):
        """Test highlight cache management."""
        from services.highlight_cache import HighlightCache

        cache = HighlightCache()

        # Test cache set and get
        cache.set('test_key', self.mock_highlight_data, ttl=300)
        cached_data = cache.get('test_key')
        self.assertEqual(cached_data['id'], self.mock_highlight_data['id'])

        # Test cache expiration
        cache.set('expire_key', self.mock_highlight_data, ttl=0)
        expired_data = cache.get('expire_key')
        self.assertIsNone(expired_data)

        # Test cache clear
        cache.set('clear_key', self.mock_highlight_data, ttl=300)
        cache.clear()
        cleared_data = cache.get('clear_key')
        self.assertIsNone(cleared_data)

    def test_highlight_performance_metrics(self):
        """Test highlight performance metrics calculation."""
        from services.highlight_engine import calculate_performance_metrics

        metrics = calculate_performance_metrics(self.mock_highlight_data)

        self.assertIn('view_to_like_ratio', metrics)
        self.assertIn('engagement_rate', metrics)
        self.assertIn('viral_coefficient', metrics)
        self.assertIn('trending_score', metrics)

        # Test ratio calculations
        self.assertGreater(metrics['view_to_like_ratio'], 0)
        self.assertLessEqual(metrics['engagement_rate'], 100)
        self.assertGreaterEqual(metrics['viral_coefficient'], 0)

    def test_highlight_content_moderation(self):
        """Test highlight content moderation."""
        from services.highlight_moderation import moderate_highlight_content

        # Test appropriate content
        appropriate_highlight = {
            **self.mock_highlight_data,
            'title': 'Great basketball play',
            'description': 'Amazing teamwork and skill'
        }
        
        moderation_result = moderate_highlight_content(appropriate_highlight)
        self.assertTrue(moderation_result['is_appropriate'])
        self.assertEqual(moderation_result['moderation_score'], 0)

        # Test inappropriate content
        inappropriate_highlight = {
            **self.mock_highlight_data,
            'title': 'Inappropriate title',
            'description': 'Content with inappropriate language'
        }
        
        moderation_result = moderate_highlight_content(inappropriate_highlight)
        self.assertFalse(moderation_result['is_appropriate'])
        self.assertGreater(moderation_result['moderation_score'], 0)

    def test_highlight_social_interactions(self):
        """Test highlight social interaction tracking."""
        from services.highlight_social import track_social_interaction

        # Test like interaction
        like_result = track_social_interaction(
            highlight_id='highlight_123',
            user_id='user_789',
            interaction_type='like'
        )
        
        self.assertTrue(like_result['success'])
        self.assertIn('updated_stats', like_result)

        # Test tip interaction
        tip_result = track_social_interaction(
            highlight_id='highlight_123',
            user_id='user_789',
            interaction_type='tip',
            amount=10
        )
        
        self.assertTrue(tip_result['success'])
        self.assertIn('updated_stats', tip_result)

    def test_highlight_recommendation_algorithm(self):
        """Test highlight recommendation algorithm."""
        from services.highlight_recommendations import get_personalized_recommendations

        user_profile = {
            'user_id': 'user_123',
            'sport_preferences': ['basketball', 'soccer'],
            'viewing_history': ['highlight_123', 'highlight_124'],
            'interaction_history': {
                'likes': ['highlight_123'],
                'tips': ['highlight_124']
            }
        }

        recommendations = get_personalized_recommendations(
            user_profile,
            [self.mock_highlight_data],
            limit=5
        )

        self.assertIsInstance(recommendations, list)
        self.assertLessEqual(len(recommendations), 5)

        # Test recommendation relevance
        for rec in recommendations:
            self.assertIn(rec['sport'], user_profile['sport_preferences'])

    def test_highlight_trending_algorithm(self):
        """Test highlight trending algorithm."""
        from services.highlight_trending import calculate_trending_score

        # Test trending highlight
        trending_highlight = {
            **self.mock_highlight_data,
            'stats': {
                'views': 5000,
                'likes': 500,
                'comments': 100,
                'shares': 50,
                'tips': 25
            },
            'created_at': datetime.now().isoformat(),
            'viral_indicators': {
                'growth_rate': 25.5
            }
        }

        trending_score = calculate_trending_score(trending_highlight)
        self.assertGreater(trending_score, 70)

        # Test non-trending highlight
        non_trending_highlight = {
            **self.mock_highlight_data,
            'stats': {
                'views': 100,
                'likes': 5,
                'comments': 1,
                'shares': 0,
                'tips': 0
            },
            'created_at': (datetime.now() - timedelta(days=7)).isoformat(),
            'viral_indicators': {
                'growth_rate': 1.2
            }
        }

        trending_score = calculate_trending_score(non_trending_highlight)
        self.assertLess(trending_score, 30)

    def test_highlight_export_functionality(self):
        """Test highlight export functionality."""
        from services.highlight_export import export_highlights

        highlights = [self.mock_highlight_data]

        # Test JSON export
        json_export = export_highlights(highlights, format='json')
        self.assertIsInstance(json_export, str)
        
        parsed_json = json.loads(json_export)
        self.assertIn('highlights', parsed_json)
        self.assertEqual(len(parsed_json['highlights']), 1)

        # Test CSV export
        csv_export = export_highlights(highlights, format='csv')
        self.assertIsInstance(csv_export, str)
        self.assertIn('title,description,engagement_score', csv_export)

if __name__ == '__main__':
    unittest.main() 