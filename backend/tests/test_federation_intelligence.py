"""
Test suite for Federation Intelligence Service
Tests multi-region stat normalization, LLM-based conflict resolution, and rule harmonization
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from services.federation_intelligence import (
    FederationIntelligenceService, 
    RuleConflict, 
    HarmonizedRule,
    RegionStats
)

class TestFederationIntelligenceService:
    """Test cases for FederationIntelligenceService"""

    @pytest.fixture
    def federation_intelligence(self):
        """Create federation intelligence service instance"""
        return FederationIntelligenceService()

    @pytest.fixture
    def sample_stats(self):
        """Sample player statistics"""
        return {
            'points': 25,
            'assists': 8,
            'rebounds': 12,
            'steals': 3,
            'blocks': 2,
            'field_goal_percentage': 0.65,
            'three_point_percentage': 0.42
        }

    @pytest.fixture
    def sample_conflict(self):
        """Sample rule conflict"""
        return RuleConflict(
            id="test_conflict_1",
            federation1_id="ncaa",
            federation2_id="nba",
            sport="basketball",
            rule_type="timing",
            conflict_description="Different timing rules between NCAA and NBA",
            severity="high",
            status="pending",
            created_at=datetime.now()
        )

    @pytest.fixture
    def sample_harmonized_rule(self):
        """Sample harmonized rule"""
        return HarmonizedRule(
            sport="basketball",
            rule_type="harmonized",
            base_rule={
                "scoring": {"points_per_basket": 2, "free_throw": 1, "three_pointer": 3},
                "timing": {"quarters": 4, "quarter_duration": 10, "overtime": 5}
            },
            federation_overrides={
                "ncaa": {"timing": {"halves": 2, "half_duration": 20}},
                "nba": {"timing": {"quarters": 4, "quarter_duration": 12}}
            },
            harmonized_rule={
                "scoring": {"points_per_basket": 2, "free_throw": 1, "three_pointer": 3},
                "timing": {"quarters": 4, "quarter_duration": 10, "overtime": 5}
            },
            confidence_score=0.85,
            last_updated=datetime.now()
        )

    def test_region_factors_initialization(self, federation_intelligence):
        """Test that region factors are properly initialized"""
        assert len(federation_intelligence.region_factors) == 6
        
        # Check specific regions
        assert 'North America' in federation_intelligence.region_factors
        assert 'Europe' in federation_intelligence.region_factors
        assert 'Asia' in federation_intelligence.region_factors
        
        # Check North America as baseline
        na_stats = federation_intelligence.region_factors['North America']
        assert na_stats.strength_multiplier == 1.0
        assert na_stats.travel_penalty == 0.0
        assert na_stats.timezone_adjustment == 0.0

    def test_calculate_travel_distance(self, federation_intelligence):
        """Test travel distance calculation"""
        # Test known distances
        assert federation_intelligence.calculate_travel_distance('North America', 'Europe') == 7000
        assert federation_intelligence.calculate_travel_distance('Europe', 'North America') == 7000
        
        # Test same region
        assert federation_intelligence.calculate_travel_distance('North America', 'North America') == 0
        
        # Test unknown region combination
        assert federation_intelligence.calculate_travel_distance('Unknown', 'North America') == 0

    def test_calculate_timezone_difference(self, federation_intelligence):
        """Test timezone difference calculation"""
        # Test known timezone differences
        assert federation_intelligence.calculate_timezone_difference('North America', 'Europe') == -6  # EST to CET
        assert federation_intelligence.calculate_timezone_difference('Europe', 'Asia') == -7  # CET to CST
        
        # Test same region
        assert federation_intelligence.calculate_timezone_difference('North America', 'North America') == 0
        
        # Test unknown region
        assert federation_intelligence.calculate_timezone_difference('Unknown', 'North America') == 0

    @pytest.mark.asyncio
    async def test_normalize_stats_by_region(self, federation_intelligence, sample_stats):
        """Test stat normalization by region"""
        # Test North America to Europe (should increase due to higher strength multiplier)
        normalized = await federation_intelligence.normalize_stats_by_region(
            sample_stats, 'North America', 'Europe'
        )
        
        # Points should be increased due to Europe's higher strength multiplier
        assert normalized['points'] > sample_stats['points']
        
        # Test Europe to North America (should decrease)
        normalized_reverse = await federation_intelligence.normalize_stats_by_region(
            sample_stats, 'Europe', 'North America'
        )
        
        assert normalized_reverse['points'] < sample_stats['points']
        
        # Test same region (should be unchanged)
        normalized_same = await federation_intelligence.normalize_stats_by_region(
            sample_stats, 'North America', 'North America'
        )
        
        assert normalized_same['points'] == sample_stats['points']

    @pytest.mark.asyncio
    async def test_normalize_stats_with_travel_penalty(self, federation_intelligence, sample_stats):
        """Test stat normalization with travel penalty"""
        # Test cross-region competition with travel penalty
        normalized = await federation_intelligence.normalize_stats_by_region(
            sample_stats, 'North America', 'Oceania'
        )
        
        # Should have travel penalty applied
        assert normalized['points'] < sample_stats['points']
        
        # Test same region (no travel penalty)
        normalized_same = await federation_intelligence.normalize_stats_by_region(
            sample_stats, 'North America', 'North America'
        )
        
        assert normalized_same['points'] == sample_stats['points']

    def test_assess_conflict_severity(self, federation_intelligence):
        """Test conflict severity assessment"""
        # Test critical conflicts
        assert federation_intelligence.assess_conflict_severity('equipment', {}, {}) == 'critical'
        assert federation_intelligence.assess_conflict_severity('field_dimensions', {}, {}) == 'critical'
        assert federation_intelligence.assess_conflict_severity('player_count', {}, {}) == 'critical'
        
        # Test high severity conflicts
        assert federation_intelligence.assess_conflict_severity('scoring', {}, {}) == 'high'
        assert federation_intelligence.assess_conflict_severity('timing', {}, {}) == 'high'
        
        # Test medium severity conflicts
        assert federation_intelligence.assess_conflict_severity('substitutions', {}, {}) == 'medium'
        assert federation_intelligence.assess_conflict_severity('timeouts', {}, {}) == 'medium'
        
        # Test low severity conflicts
        assert federation_intelligence.assess_conflict_severity('uniforms', {}, {}) == 'low'

    @pytest.mark.asyncio
    @patch('services.federation_intelligence.openai')
    async def test_resolve_rule_conflict_llm(self, mock_openai, federation_intelligence, sample_conflict):
        """Test LLM-based rule conflict resolution"""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Use NCAA timing rules as they are more suitable for amateur competition"
        mock_openai.chat.completions.create.return_value = mock_response
        
        # Mock federation rules
        with patch.object(federation_intelligence, 'get_federation_rules') as mock_get_rules:
            mock_get_rules.side_effect = [
                {"timing": {"halves": 2, "half_duration": 20}},
                {"timing": {"quarters": 4, "quarter_duration": 12}}
            ]
            
            resolution = await federation_intelligence.resolve_rule_conflict_llm(sample_conflict)
            
            assert resolution == "Use NCAA timing rules as they are more suitable for amateur competition"
            assert sample_conflict.status == 'resolved'
            assert sample_conflict.resolution == resolution
            assert sample_conflict.resolved_by == 'ai_system'

    @pytest.mark.asyncio
    @patch('services.federation_intelligence.openai')
    async def test_resolve_rule_conflict_llm_error(self, mock_openai, federation_intelligence, sample_conflict):
        """Test LLM-based rule conflict resolution with error"""
        # Mock OpenAI error
        mock_openai.chat.completions.create.side_effect = Exception("API Error")
        
        resolution = await federation_intelligence.resolve_rule_conflict_llm(sample_conflict)
        
        assert "Manual resolution required" in resolution
        assert sample_conflict.status == 'pending'  # Should not be resolved

    @pytest.mark.asyncio
    async def test_harmonize_sport_rules(self, federation_intelligence):
        """Test sport rule harmonization"""
        # Mock federation rules
        with patch.object(federation_intelligence, 'get_federation_rules') as mock_get_rules:
            mock_get_rules.side_effect = [
                {
                    "scoring": {"points_per_basket": 2, "free_throw": 1, "three_pointer": 3},
                    "timing": {"quarters": 4, "quarter_duration": 10, "overtime": 5}
                },
                {
                    "scoring": {"points_per_basket": 2, "free_throw": 1, "three_pointer": 3},
                    "timing": {"halves": 2, "half_duration": 20, "overtime": 5}
                }
            ]
            
            harmonized = await federation_intelligence.harmonize_sport_rules(
                "basketball", ["nba", "ncaa"]
            )
            
            assert harmonized.sport == "basketball"
            assert harmonized.rule_type == "harmonized"
            assert "scoring" in harmonized.harmonized_rule
            assert "timing" in harmonized.harmonized_rule
            assert harmonized.confidence_score > 0

    @pytest.mark.asyncio
    async def test_harmonize_sport_rules_no_federations(self, federation_intelligence):
        """Test sport rule harmonization with no federations"""
        harmonized = await federation_intelligence.harmonize_sport_rules("basketball", [])
        
        assert harmonized.sport == "basketball"
        assert harmonized.rule_type == "fallback"
        assert harmonized.confidence_score == 0.3

    def test_should_apply_override(self, federation_intelligence):
        """Test override application logic"""
        # Test safety rules - should apply stricter standards
        assert federation_intelligence.should_apply_override(
            'equipment', {'helmet': 'required'}, {'helmet': 'optional'}
        ) == True
        
        # Test scoring rules - should apply more detailed rules
        assert federation_intelligence.should_apply_override(
            'scoring', {'points': 2, 'bonus': 1}, {'points': 2}
        ) == True
        
        # Test timing rules - should apply more efficient rules
        assert federation_intelligence.should_apply_override(
            'timing', {'duration': 30}, {'duration': 45}
        ) == True
        
        # Test same values - should not apply override
        assert federation_intelligence.should_apply_override(
            'scoring', {'points': 2}, {'points': 2}
        ) == False

    def test_is_stricter_rule(self, federation_intelligence):
        """Test stricter rule detection"""
        # Test equipment rules
        assert federation_intelligence.is_stricter_rule(
            'equipment', {'helmet': 'required', 'pads': 'required'}, {'helmet': 'required'}
        ) == True
        
        # Test field dimensions
        assert federation_intelligence.is_stricter_rule(
            'field_dimensions', {'size': 50}, {'size': 100}
        ) == True
        
        # Test non-stricter rules
        assert federation_intelligence.is_stricter_rule(
            'equipment', {'helmet': 'required'}, {'helmet': 'required', 'pads': 'required'}
        ) == False

    def test_is_more_detailed_rule(self, federation_intelligence):
        """Test more detailed rule detection"""
        # Test dictionary rules
        assert federation_intelligence.is_more_detailed_rule(
            {'points': 2, 'bonus': 1, 'penalty': 1}, {'points': 2}
        ) == True
        
        # Test string rules
        assert federation_intelligence.is_more_detailed_rule(
            "Detailed rule description with multiple clauses", "Simple rule"
        ) == True
        
        # Test less detailed rules
        assert federation_intelligence.is_more_detailed_rule(
            {'points': 2}, {'points': 2, 'bonus': 1}
        ) == False

    def test_is_more_efficient_rule(self, federation_intelligence):
        """Test more efficient rule detection"""
        # Test timing rules with shorter duration
        assert federation_intelligence.is_more_efficient_rule(
            {'duration': 30}, {'duration': 45}
        ) == True
        
        # Test non-timing rules
        assert federation_intelligence.is_more_efficient_rule(
            {'points': 2}, {'points': 3}
        ) == False

    def test_calculate_harmonization_confidence(self, federation_intelligence):
        """Test harmonization confidence calculation"""
        federation_rules = {
            'fed1': {'scoring': {'points': 2}, 'timing': {'duration': 30}},
            'fed2': {'scoring': {'points': 2}, 'timing': {'duration': 45}},
            'fed3': {'scoring': {'points': 2}, 'timing': {'duration': 30}}
        }
        
        harmonized_rule = {'scoring': {'points': 2}, 'timing': {'duration': 30}}
        
        confidence = federation_intelligence.calculate_harmonization_confidence(
            federation_rules, harmonized_rule
        )
        
        # 2 out of 3 rules match (scoring matches all, timing matches 2)
        assert confidence == 0.67  # Approximately 2/3

    @pytest.mark.asyncio
    async def test_get_federation_rules(self, federation_intelligence):
        """Test getting federation rules"""
        # Mock federation document
        with patch('services.federation_intelligence.db') as mock_db:
            mock_doc = Mock()
            mock_doc.exists = True
            mock_doc.to_dict.return_value = {
                'sport_rules': {
                    'basketball': {
                        'timing': {'quarters': 4, 'quarter_duration': 12}
                    }
                }
            }
            mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
            
            rules = await federation_intelligence.get_federation_rules('nba', 'basketball')
            
            assert 'timing' in rules
            assert rules['timing']['quarters'] == 4

    @pytest.mark.asyncio
    async def test_get_federation_rules_not_found(self, federation_intelligence):
        """Test getting federation rules when federation not found"""
        # Mock non-existent federation
        with patch('services.federation_intelligence.db') as mock_db:
            mock_doc = Mock()
            mock_doc.exists = False
            mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
            
            rules = await federation_intelligence.get_federation_rules('unknown', 'basketball')
            
            # Should return base sport rules
            assert rules is not None

    @pytest.mark.asyncio
    async def test_save_rule_conflict(self, federation_intelligence, sample_conflict):
        """Test saving rule conflict to database"""
        with patch('services.federation_intelligence.db') as mock_db:
            await federation_intelligence.save_rule_conflict(sample_conflict)
            
            # Verify document was set
            mock_db.collection.assert_called_with('rule_conflicts')
            mock_db.collection.return_value.document.assert_called_with(sample_conflict.id)
            mock_db.collection.return_value.document.return_value.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_harmonized_rule(self, federation_intelligence, sample_harmonized_rule):
        """Test saving harmonized rule to database"""
        with patch('services.federation_intelligence.db') as mock_db:
            await federation_intelligence.save_harmonized_rule(sample_harmonized_rule)
            
            # Verify document was set
            mock_db.collection.assert_called_with('harmonized_rules')
            mock_db.collection.return_value.document.assert_called_with('basketball_harmonized')
            mock_db.collection.return_value.document.return_value.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_harmonized_rule(self, federation_intelligence):
        """Test getting harmonized rule from database"""
        with patch('services.federation_intelligence.db') as mock_db:
            mock_doc = Mock()
            mock_doc.exists = True
            mock_doc.to_dict.return_value = {
                'sport': 'basketball',
                'rule_type': 'harmonized',
                'base_rule': {'scoring': {'points': 2}},
                'federation_overrides': {},
                'harmonized_rule': {'scoring': {'points': 2}},
                'confidence_score': 0.85,
                'last_updated': datetime.now()
            }
            mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
            
            rule = await federation_intelligence.get_harmonized_rule('basketball')
            
            assert rule.sport == 'basketball'
            assert rule.rule_type == 'harmonized'
            assert rule.confidence_score == 0.85

    @pytest.mark.asyncio
    async def test_get_harmonized_rule_not_found(self, federation_intelligence):
        """Test getting harmonized rule when not found"""
        with patch('services.federation_intelligence.db') as mock_db:
            mock_doc = Mock()
            mock_doc.exists = False
            mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
            
            rule = await federation_intelligence.get_harmonized_rule('unknown')
            
            assert rule is None

class TestRegionStats:
    """Test cases for RegionStats dataclass"""

    def test_region_stats_creation(self):
        """Test RegionStats dataclass creation"""
        stats = RegionStats(
            region='Test Region',
            strength_multiplier=1.2,
            travel_penalty=0.05,
            timezone_adjustment=0.02,
            climate_adjustment=0.01,
            population_density=1.1,
            sports_infrastructure=0.9,
            competition_level=1.15
        )
        
        assert stats.region == 'Test Region'
        assert stats.strength_multiplier == 1.2
        assert stats.travel_penalty == 0.05
        assert stats.timezone_adjustment == 0.02
        assert stats.climate_adjustment == 0.01
        assert stats.population_density == 1.1
        assert stats.sports_infrastructure == 0.9
        assert stats.competition_level == 1.15

class TestRuleConflict:
    """Test cases for RuleConflict dataclass"""

    def test_rule_conflict_creation(self):
        """Test RuleConflict dataclass creation"""
        conflict = RuleConflict(
            id="test_conflict",
            federation1_id="fed1",
            federation2_id="fed2",
            sport="basketball",
            rule_type="timing",
            conflict_description="Test conflict",
            severity="high",
            status="pending"
        )
        
        assert conflict.id == "test_conflict"
        assert conflict.federation1_id == "fed1"
        assert conflict.federation2_id == "fed2"
        assert conflict.sport == "basketball"
        assert conflict.rule_type == "timing"
        assert conflict.conflict_description == "Test conflict"
        assert conflict.severity == "high"
        assert conflict.status == "pending"
        assert conflict.resolution is None
        assert conflict.resolved_by is None
        assert conflict.resolved_at is None

class TestHarmonizedRule:
    """Test cases for HarmonizedRule dataclass"""

    def test_harmonized_rule_creation(self):
        """Test HarmonizedRule dataclass creation"""
        rule = HarmonizedRule(
            sport="basketball",
            rule_type="harmonized",
            base_rule={'scoring': {'points': 2}},
            federation_overrides={'fed1': {'timing': {'duration': 30}}},
            harmonized_rule={'scoring': {'points': 2}, 'timing': {'duration': 30}},
            confidence_score=0.85,
            last_updated=datetime.now()
        )
        
        assert rule.sport == "basketball"
        assert rule.rule_type == "harmonized"
        assert rule.base_rule == {'scoring': {'points': 2}}
        assert rule.federation_overrides == {'fed1': {'timing': {'duration': 30}}}
        assert rule.harmonized_rule == {'scoring': {'points': 2}, 'timing': {'duration': 30}}
        assert rule.confidence_score == 0.85
        assert rule.last_updated is not None 