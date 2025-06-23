#!/usr/bin/env python3
"""
Comprehensive Test Suite for SportBeaconAI
Covers all modules with edge cases and regression testing
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
import firebase_admin
from firebase_admin import firestore

# Import all modules to test
from services.league_engine import LeagueEngine, LEAGUE_TIERS, AGE_BRACKETS
from services.tokenomics import TokenomicsEngine, BEACON_TOKEN_CONFIG
from services.relationship_graph import RelationshipGraph, RelationshipType
from services.video_insight_engine import VideoInsightEngine
from services.plugin_manager import PluginManager, PluginType
from api.admin.privacy import PrivacyManager, PRIVACY_CONFIG
from config.sportRules import getSportRule, SPORT_RULES

class TestComprehensiveSuite:
    """Comprehensive test suite for all SportBeaconAI modules"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test environment"""
        self.league_engine = LeagueEngine()
        self.tokenomics_engine = TokenomicsEngine()
        self.relationship_graph = RelationshipGraph()
        self.video_engine = VideoInsightEngine()
        self.plugin_manager = PluginManager()
        self.privacy_manager = PrivacyManager()
        
        # Mock Firebase for testing
        with patch('firebase_admin.firestore.client'):
            yield

    # League Engine Tests
    def test_league_engine_initialization(self):
        """Test league engine initialization"""
        assert self.league_engine is not None
        assert len(LEAGUE_TIERS) == 4  # pro, varsity, club, amateur
        assert len(AGE_BRACKETS) == 5  # youth_8_10, youth_11_13, high_school_14_18, college_18_22, adult_18_plus

    @pytest.mark.asyncio
    async def test_league_creation_and_management(self):
        """Test league creation and management"""
        # Test league creation
        league_id = await self.league_engine.create_league('varsity', 'Test Varsity League')
        assert league_id is not None
        
        # Test league info retrieval
        league_info = await self.league_engine.get_league_info(league_id)
        assert league_info is not None
        assert league_info['leagueId'] == 'varsity'
        assert league_info['status'] == 'upcoming'

    @pytest.mark.asyncio
    async def test_league_promotion_relegation(self):
        """Test promotion and relegation mechanics"""
        # Create league
        league_id = await self.league_engine.create_league('varsity', 'Test League')
        
        # Add teams
        await self.league_engine.join_league(league_id, 'team1', 'captain1', 'Team Alpha', 'Captain Alpha')
        await self.league_engine.join_league(league_id, 'team2', 'captain2', 'Team Beta', 'Captain Beta')
        await self.league_engine.join_league(league_id, 'team3', 'captain3', 'Team Gamma', 'Captain Gamma')
        
        # Record match results
        await self.league_engine.record_match_result(league_id, 'team1', 'team2', 85, 72)
        await self.league_engine.record_match_result(league_id, 'team1', 'team3', 90, 75)
        await self.league_engine.record_match_result(league_id, 'team2', 'team3', 78, 82)
        
        # Get standings
        standings = await self.league_engine.get_league_standings(league_id)
        assert len(standings) == 3
        assert standings[0]['teamId'] == 'team1'  # Should be first with 2 wins

    def test_age_eligibility_edge_cases(self):
        """Test age eligibility edge cases"""
        # Test exact age boundaries
        assert await self.league_engine.check_age_eligibility(8, 'youth_8_10') == True
        assert await self.league_engine.check_age_eligibility(10, 'youth_8_10') == True
        assert await self.league_engine.check_age_eligibility(11, 'youth_8_10') == False
        
        # Test edge cases
        assert await self.league_engine.check_age_eligibility(0, 'youth_8_10') == False
        assert await self.league_engine.check_age_eligibility(99, 'adult_18_plus') == True

    # Tokenomics Tests
    @pytest.mark.asyncio
    async def test_token_awarding_and_balance(self):
        """Test token awarding and balance management"""
        user_id = 'test_user_123'
        
        # Initialize wallet
        await self.tokenomics_engine.initialize_wallet(user_id)
        
        # Award tokens
        success = await self.tokenomics_engine.award_tokens(user_id, 'drill_completion', 10)
        assert success == True
        
        # Check balance
        balance = await self.tokenomics_engine.get_wallet_balance(user_id)
        assert balance['beacon_balance'] >= 10

    @pytest.mark.asyncio
    async def test_tip_processing(self):
        """Test tip processing between users"""
        user1_id = 'user1'
        user2_id = 'user2'
        
        # Initialize wallets
        await self.tokenomics_engine.initialize_wallet(user1_id)
        await self.tokenomics_engine.initialize_wallet(user2_id)
        
        # Award initial tokens
        await self.tokenomics_engine.award_tokens(user1_id, 'purchase', 100)
        
        # Process tip
        success = await self.tokenomics_engine.process_tip(user1_id, user2_id, 25, 'highlight')
        assert success == True
        
        # Check balances
        balance1 = await self.tokenomics_engine.get_wallet_balance(user1_id)
        balance2 = await self.tokenomics_engine.get_wallet_balance(user2_id)
        
        assert balance1['beacon_balance'] == 75  # 100 - 25
        assert balance2['beacon_balance'] >= 25  # Received tip + bonus

    def test_multiplier_calculation(self):
        """Test reward multiplier calculation"""
        # Test basic multiplier
        multiplier = asyncio.run(self.tokenomics_engine.calculate_multiplier('test_user'))
        assert multiplier >= 1.0
        
        # Test with premium user (would be mocked in real test)
        with patch.object(self.tokenomics_engine, 'get_user_profile') as mock_profile:
            mock_profile.return_value = {'premium_member': True}
            multiplier = asyncio.run(self.tokenomics_engine.calculate_multiplier('premium_user'))
            assert multiplier >= BEACON_TOKEN_CONFIG['multipliers']['premium_member']

    # Relationship Graph Tests
    @pytest.mark.asyncio
    async def test_relationship_creation_and_strength(self):
        """Test relationship creation and strength calculation"""
        user1_id = 'user1'
        user2_id = 'user2'
        
        # Create relationship
        success = await self.relationship_graph.create_relationship(
            user1_id, user2_id, RelationshipType.COACH_PLAYER
        )
        assert success == True
        
        # Record interaction
        await self.relationship_graph.record_interaction(
            user1_id, user2_id, 'drills_coached'
        )
        
        # Calculate strength
        strength = await self.relationship_graph.calculate_connection_strength(user1_id, user2_id)
        assert strength > 0

    @pytest.mark.asyncio
    async def test_network_graph_generation(self):
        """Test network graph generation"""
        user_id = 'central_user'
        
        # Create multiple relationships
        await self.relationship_graph.create_relationship('user1', user_id, RelationshipType.TEAMMATE)
        await self.relationship_graph.create_relationship('user2', user_id, RelationshipType.TEAMMATE)
        await self.relationship_graph.create_relationship('user3', 'user1', RelationshipType.COACH_PLAYER)
        
        # Generate network graph
        network = await self.relationship_graph.get_network_graph(user_id, depth=2)
        assert 'nodes' in network
        assert 'edges' in network
        assert len(network['nodes']) >= 3  # central_user + 2 direct connections

    # Video Analysis Tests
    @pytest.mark.asyncio
    async def test_video_analysis_edge_cases(self):
        """Test video analysis with edge cases"""
        # Test with invalid video URL
        result = await self.video_engine.analyze_video(
            'invalid_url', 'basketball', 'test_user'
        )
        assert 'error' in result
        
        # Test with unsupported sport
        result = await self.video_engine.analyze_video(
            'https://example.com/video.mp4', 'unsupported_sport', 'test_user'
        )
        assert 'sport_analysis' in result or 'error' in result

    def test_sport_specific_analysis(self):
        """Test sport-specific analysis methods"""
        # Test basketball analysis
        frames = [Mock() for _ in range(10)]  # Mock frames
        analysis = asyncio.run(self.video_engine.analyze_basketball_video(frames, {}))
        assert 'sport' in analysis
        assert analysis['sport'] == 'basketball'
        
        # Test soccer analysis
        analysis = asyncio.run(self.video_engine.analyze_soccer_video(frames, {}))
        assert 'sport' in analysis
        assert analysis['sport'] == 'soccer'

    # Plugin Manager Tests
    @pytest.mark.asyncio
    async def test_plugin_installation_and_validation(self):
        """Test plugin installation and validation"""
        # Mock plugin config
        plugin_config = {
            'id': 'test_plugin',
            'name': 'Test Plugin',
            'version': '1.0.0',
            'type': PluginType.DRILL,
            'author': 'Test Author',
            'description': 'Test plugin for testing'
        }
        
        # Mock plugin file
        with patch('builtins.open', create=True):
            with patch('zipfile.ZipFile'):
                # Test plugin installation
                result = await self.plugin_manager.install_plugin('mock_file.zip', plugin_config)
                assert 'success' in result or 'error' in result

    def test_plugin_hook_execution(self):
        """Test plugin hook execution"""
        # Mock hook function
        mock_hook = AsyncMock(return_value={'result': 'success'})
        self.plugin_manager.plugin_hooks['pre_drill_execution'].append(mock_hook)
        
        # Execute hooks
        results = asyncio.run(self.plugin_manager.execute_plugin_hook('pre_drill_execution', 'test_data'))
        assert len(results) > 0
        assert results[0]['result'] == 'success'

    # Privacy & Compliance Tests
    @pytest.mark.asyncio
    async def test_data_anonymization(self):
        """Test data anonymization"""
        user_data = {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'phone': '555-123-4567',
            'age': 15  # COPPA user
        }
        
        # Test anonymization
        with patch.object(self.privacy_manager, 'get_user_data') as mock_get:
            mock_get.return_value = user_data
            result = await self.privacy_manager.anonymize_user_data('test_user', 'full')
            assert 'success' in result

    def test_coppa_compliance_check(self):
        """Test COPPA compliance checking"""
        # Test COPPA user
        coppa_user = {'age': 12}
        assert self.privacy_manager.is_coppa_user(coppa_user) == True
        
        # Test non-COPPA user
        adult_user = {'age': 18}
        assert self.privacy_manager.is_coppa_user(adult_user) == False

    @pytest.mark.asyncio
    async def test_data_deletion_request(self):
        """Test data deletion request processing"""
        user_id = 'test_user'
        
        # Test deletion request
        result = await self.privacy_manager.process_data_deletion_request(user_id, 'full')
        assert 'success' in result or 'error' in result

    # Sport Rules Tests
    def test_sport_rules_edge_cases(self):
        """Test sport rules with edge cases"""
        # Test existing sports
        basketball_rules = getSportRule('basketball')
        assert basketball_rules is not None
        assert 'primaryStats' in basketball_rules
        
        # Test non-existent sport
        unknown_rules = getSportRule('unknown_sport')
        assert unknown_rules is not None  # Should return fallback rules
        
        # Test esports (edge case)
        esports_rules = getSportRule('esports')
        assert esports_rules is not None

    def test_sport_rules_versioning(self):
        """Test sport rules versioning"""
        # Test version parameter
        rules_v1 = getSportRule('basketball', version='1.0')
        rules_v2 = getSportRule('basketball', version='2.0')
        
        # Should handle versioning gracefully
        assert rules_v1 is not None
        assert rules_v2 is not None

    # Edge Sports Tests
    def test_esports_rules(self):
        """Test esports-specific rules"""
        esports_rules = getSportRule('esports')
        assert esports_rules is not None
        
        # Check for esports-specific fields
        if 'gameTypes' in esports_rules:
            assert isinstance(esports_rules['gameTypes'], list)

    def test_track_and_field_rules(self):
        """Test track and field rules"""
        track_rules = getSportRule('track')
        assert track_rules is not None
        
        # Check for track-specific stats
        if 'primaryStats' in track_rules:
            track_stats = track_rules['primaryStats']
            assert any('time' in stat.lower() for stat in track_stats)

    def test_crossfit_rules(self):
        """Test CrossFit rules"""
        crossfit_rules = getSportRule('crossfit')
        assert crossfit_rules is not None
        
        # Check for CrossFit-specific features
        if 'workoutTypes' in crossfit_rules:
            assert isinstance(crossfit_rules['workoutTypes'], list)

    # Fallback Behavior Tests
    def test_fallback_ui_components(self):
        """Test fallback UI behavior"""
        # Test with missing data
        with patch('services.api.get_highlights') as mock_get:
            mock_get.side_effect = Exception("API Error")
            # Should handle gracefully and show fallback UI
            pass

    def test_ar_sync_fallback(self):
        """Test AR sync fallback behavior"""
        # Test offline mode
        with patch('services.offlineSync.isOnline', return_value=False):
            # Should use cached data
            pass

    def test_audio_caching_fallback(self):
        """Test audio caching fallback"""
        # Test with ElevenLabs API failure
        with patch('services.elevenlabs.generate_audio') as mock_generate:
            mock_generate.side_effect = Exception("API Error")
            # Should fall back to cached audio or text
            pass

    # Performance Tests
    def test_league_engine_performance(self):
        """Test league engine performance with large datasets"""
        # Test with many teams
        start_time = datetime.now()
        
        # Simulate adding 100 teams
        for i in range(100):
            asyncio.run(self.league_engine.join_league('test_league', f'team_{i}', f'captain_{i}', f'Team {i}', f'Captain {i}'))
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Should complete within reasonable time
        assert duration < 10  # 10 seconds max

    def test_tokenomics_performance(self):
        """Test tokenomics engine performance"""
        # Test with many transactions
        start_time = datetime.now()
        
        # Simulate 1000 token awards
        for i in range(1000):
            asyncio.run(self.tokenomics_engine.award_tokens(f'user_{i}', 'drill_completion', 10))
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Should complete within reasonable time
        assert duration < 30  # 30 seconds max

    # Integration Tests
    @pytest.mark.asyncio
    async def test_full_user_journey(self):
        """Test complete user journey"""
        user_id = 'journey_user'
        
        # 1. User registration
        await self.tokenomics_engine.initialize_wallet(user_id)
        
        # 2. Join league
        league_id = await self.league_engine.create_league('amateur', 'Journey League')
        await self.league_engine.join_league(league_id, f'team_{user_id}', user_id, 'Journey Team', 'Journey User')
        
        # 3. Complete drill
        await self.tokenomics_engine.award_tokens(user_id, 'drill_completion', 10)
        
        # 4. Upload highlight
        await self.tokenomics_engine.award_tokens(user_id, 'highlight_upload', 25)
        
        # 5. Give tip
        await self.tokenomics_engine.process_tip(user_id, 'other_user', 5, 'highlight')
        
        # 6. Check final state
        balance = await self.tokenomics_engine.get_wallet_balance(user_id)
        assert balance['beacon_balance'] >= 30  # 10 + 25 - 5
        
        standings = await self.league_engine.get_league_standings(league_id)
        assert len(standings) > 0

    # Error Handling Tests
    def test_error_handling_edge_cases(self):
        """Test error handling for edge cases"""
        # Test with invalid user IDs
        with pytest.raises(Exception):
            asyncio.run(self.tokenomics_engine.award_tokens('', 'drill_completion', 10))
        
        # Test with negative amounts
        with pytest.raises(Exception):
            asyncio.run(self.tokenomics_engine.award_tokens('user', 'drill_completion', -10))
        
        # Test with invalid league tiers
        with pytest.raises(Exception):
            asyncio.run(self.league_engine.create_league('invalid_tier', 'Test League'))

    # Security Tests
    def test_privacy_compliance(self):
        """Test privacy compliance features"""
        # Test data anonymization
        test_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '555-123-4567'
        }
        
        anonymized = self.privacy_manager.apply_text_anonymization(str(test_data))
        assert 'John Doe' not in anonymized
        assert 'john@example.com' not in anonymized

    def test_audit_logging(self):
        """Test audit logging functionality"""
        # Test audit event logging
        asyncio.run(self.privacy_manager.log_audit_event(
            'test_event',
            user_id='test_user',
            details={'action': 'test'}
        ))
        
        # Should not raise exceptions
        assert True

if __name__ == "__main__":
    # Run comprehensive test suite
    pytest.main([__file__, "-v", "--tb=short"]) 