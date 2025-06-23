"""
Federation Intelligence Service for SportBeaconAI v3.0
Handles multi-region stat normalization, LLM-based conflict resolution, and rule harmonization
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import firebase_admin
from firebase_admin import firestore
import openai
from config.sportRules import getSportRule, SPORT_RULES

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase
db = firestore.client()

@dataclass
class RegionStats:
    """Region-specific statistics and normalization factors"""
    region: str
    strength_multiplier: float
    travel_penalty: float
    timezone_adjustment: float
    climate_adjustment: float
    population_density: float
    sports_infrastructure: float
    competition_level: float

@dataclass
class RuleConflict:
    """Rule conflict between federations"""
    id: str
    federation1_id: str
    federation2_id: str
    sport: str
    rule_type: str
    conflict_description: str
    severity: str  # low, medium, high, critical
    status: str  # pending, resolved, escalated
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime = None

@dataclass
class HarmonizedRule:
    """Harmonized rule across multiple federations"""
    sport: str
    rule_type: str
    base_rule: Dict[str, Any]
    federation_overrides: Dict[str, Dict[str, Any]]
    harmonized_rule: Dict[str, Any]
    confidence_score: float
    last_updated: datetime

class FederationIntelligenceService:
    """Enhanced federation intelligence service"""
    
    def __init__(self):
        self.federations_ref = db.collection('federations')
        self.conflicts_ref = db.collection('rule_conflicts')
        self.harmonized_rules_ref = db.collection('harmonized_rules')
        self.region_stats_ref = db.collection('region_stats')
        
        # Region normalization factors
        self.region_factors = {
            'North America': RegionStats(
                region='North America',
                strength_multiplier=1.0,
                travel_penalty=0.0,
                timezone_adjustment=0.0,
                climate_adjustment=0.0,
                population_density=1.0,
                sports_infrastructure=1.0,
                competition_level=1.0
            ),
            'Europe': RegionStats(
                region='Europe',
                strength_multiplier=1.1,
                travel_penalty=0.05,
                timezone_adjustment=0.02,
                climate_adjustment=0.01,
                population_density=1.2,
                sports_infrastructure=1.1,
                competition_level=1.15
            ),
            'Asia': RegionStats(
                region='Asia',
                strength_multiplier=1.05,
                travel_penalty=0.08,
                timezone_adjustment=0.03,
                climate_adjustment=0.02,
                population_density=1.5,
                sports_infrastructure=0.9,
                competition_level=1.05
            ),
            'South America': RegionStats(
                region='South America',
                strength_multiplier=1.15,
                travel_penalty=0.10,
                timezone_adjustment=0.04,
                climate_adjustment=0.03,
                population_density=0.8,
                sports_infrastructure=0.7,
                competition_level=1.2
            ),
            'Africa': RegionStats(
                region='Africa',
                strength_multiplier=0.95,
                travel_penalty=0.12,
                timezone_adjustment=0.05,
                climate_adjustment=0.04,
                population_density=0.6,
                sports_infrastructure=0.5,
                competition_level=0.9
            ),
            'Oceania': RegionStats(
                region='Oceania',
                strength_multiplier=0.90,
                travel_penalty=0.15,
                timezone_adjustment=0.06,
                climate_adjustment=0.02,
                population_density=0.3,
                sports_infrastructure=0.8,
                competition_level=0.85
            )
        }

    async def normalize_stats_by_region(self, stats: Dict[str, Any], player_region: str, competition_region: str) -> Dict[str, Any]:
        """Normalize player statistics based on region factors"""
        try:
            player_factors = self.region_factors.get(player_region, self.region_factors['North America'])
            competition_factors = self.region_factors.get(competition_region, self.region_factors['North America'])
            
            normalized_stats = {}
            
            for stat_name, stat_value in stats.items():
                if isinstance(stat_value, (int, float)):
                    # Apply region normalization
                    normalized_value = stat_value
                    
                    # Strength multiplier adjustment
                    normalized_value *= (player_factors.strength_multiplier / competition_factors.strength_multiplier)
                    
                    # Travel penalty for cross-region competition
                    if player_region != competition_region:
                        travel_distance = self.calculate_travel_distance(player_region, competition_region)
                        travel_penalty = min(travel_distance * 0.0001, 0.1)  # Max 10% penalty
                        normalized_value *= (1 - travel_penalty)
                    
                    # Timezone adjustment
                    timezone_diff = self.calculate_timezone_difference(player_region, competition_region)
                    timezone_penalty = abs(timezone_diff) * 0.01  # 1% per hour difference
                    normalized_value *= (1 - timezone_penalty)
                    
                    # Climate adjustment
                    climate_penalty = abs(player_factors.climate_adjustment - competition_factors.climate_adjustment)
                    normalized_value *= (1 - climate_penalty)
                    
                    # Infrastructure adjustment
                    infrastructure_factor = player_factors.sports_infrastructure / competition_factors.sports_infrastructure
                    normalized_value *= infrastructure_factor
                    
                    normalized_stats[stat_name] = max(0, normalized_value)
                else:
                    normalized_stats[stat_name] = stat_value
            
            return normalized_stats
            
        except Exception as e:
            logger.error(f"Error normalizing stats by region: {e}")
            return stats

    def calculate_travel_distance(self, region1: str, region2: str) -> float:
        """Calculate approximate travel distance between regions (km)"""
        distances = {
            ('North America', 'Europe'): 7000,
            ('North America', 'Asia'): 10000,
            ('North America', 'South America'): 8000,
            ('North America', 'Africa'): 12000,
            ('North America', 'Oceania'): 15000,
            ('Europe', 'Asia'): 8000,
            ('Europe', 'South America'): 10000,
            ('Europe', 'Africa'): 5000,
            ('Europe', 'Oceania'): 18000,
            ('Asia', 'South America'): 18000,
            ('Asia', 'Africa'): 12000,
            ('Asia', 'Oceania'): 8000,
            ('South America', 'Africa'): 8000,
            ('South America', 'Oceania'): 15000,
            ('Africa', 'Oceania'): 12000
        }
        
        # Check both directions
        key = (region1, region2)
        if key in distances:
            return distances[key]
        
        key = (region2, region1)
        if key in distances:
            return distances[key]
        
        return 0  # Same region

    def calculate_timezone_difference(self, region1: str, region2: str) -> int:
        """Calculate timezone difference between regions (hours)"""
        timezones = {
            'North America': -5,  # EST
            'Europe': 1,          # CET
            'Asia': 8,            # CST
            'South America': -3,  # BRT
            'Africa': 2,          # CAT
            'Oceania': 10         # AEST
        }
        
        tz1 = timezones.get(region1, 0)
        tz2 = timezones.get(region2, 0)
        
        return tz1 - tz2

    async def detect_rule_conflicts(self, federation1_id: str, federation2_id: str, sport: str) -> List[RuleConflict]:
        """Detect rule conflicts between federations"""
        try:
            # Get federation rules
            fed1_rules = await self.get_federation_rules(federation1_id, sport)
            fed2_rules = await self.get_federation_rules(federation2_id, sport)
            
            if not fed1_rules or not fed2_rules:
                return []
            
            conflicts = []
            
            # Compare rule types
            rule_types = ['scoring', 'timing', 'equipment', 'field_dimensions', 'player_count']
            
            for rule_type in rule_types:
                if rule_type in fed1_rules and rule_type in fed2_rules:
                    if fed1_rules[rule_type] != fed2_rules[rule_type]:
                        conflict = RuleConflict(
                            id=f"conflict_{federation1_id}_{federation2_id}_{sport}_{rule_type}",
                            federation1_id=federation1_id,
                            federation2_id=federation2_id,
                            sport=sport,
                            rule_type=rule_type,
                            conflict_description=f"Different {rule_type} rules between {federation1_id} and {federation2_id}",
                            severity=self.assess_conflict_severity(rule_type, fed1_rules[rule_type], fed2_rules[rule_type]),
                            status='pending',
                            created_at=datetime.now()
                        )
                        conflicts.append(conflict)
            
            # Save conflicts to database
            for conflict in conflicts:
                await self.save_rule_conflict(conflict)
            
            return conflicts
            
        except Exception as e:
            logger.error(f"Error detecting rule conflicts: {e}")
            return []

    def assess_conflict_severity(self, rule_type: str, rule1: Any, rule2: Any) -> str:
        """Assess the severity of a rule conflict"""
        # Critical conflicts that affect safety or fundamental gameplay
        critical_rules = ['equipment', 'field_dimensions', 'player_count']
        if rule_type in critical_rules:
            return 'critical'
        
        # High severity conflicts that affect scoring or timing
        high_severity_rules = ['scoring', 'timing']
        if rule_type in high_severity_rules:
            return 'high'
        
        # Medium severity conflicts that affect minor rules
        medium_severity_rules = ['substitutions', 'timeouts']
        if rule_type in medium_severity_rules:
            return 'medium'
        
        return 'low'

    async def resolve_rule_conflict_llm(self, conflict: RuleConflict) -> str:
        """Resolve rule conflict using LLM"""
        try:
            # Get detailed rule information
            fed1_rules = await self.get_federation_rules(conflict.federation1_id, conflict.sport)
            fed2_rules = await self.get_federation_rules(conflict.federation2_id, conflict.sport)
            
            if not fed1_rules or not fed2_rules:
                return "Unable to resolve: Missing rule data"
            
            rule1 = fed1_rules.get(conflict.rule_type, {})
            rule2 = fed2_rules.get(conflict.rule_type, {})
            
            prompt = f"""
            Resolve this sports federation rule conflict:
            
            Sport: {conflict.sport}
            Rule Type: {conflict.rule_type}
            Federation 1 ({conflict.federation1_id}): {rule1}
            Federation 2 ({conflict.federation2_id}): {rule2}
            
            Provide a resolution that:
            1. Prioritizes safety and fairness
            2. Maintains competitive integrity
            3. Is practical to implement
            4. Respects both federations' traditions
            5. Can be applied consistently across competitions
            
            Resolution (be specific and actionable):
            """
            
            response = await openai.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.3
            )
            
            resolution = response.choices[0].message.content or "No resolution provided"
            
            # Update conflict status
            conflict.status = 'resolved'
            conflict.resolution = resolution
            conflict.resolved_by = 'ai_system'
            conflict.resolved_at = datetime.now()
            
            await self.save_rule_conflict(conflict)
            
            return resolution
            
        except Exception as e:
            logger.error(f"Error resolving rule conflict with LLM: {e}")
            return f"Manual resolution required: {str(e)}"

    async def harmonize_sport_rules(self, sport: str, federations: List[str]) -> HarmonizedRule:
        """Harmonize rules across multiple federations for a sport"""
        try:
            # Get rules from all federations
            federation_rules = {}
            for fed_id in federations:
                rules = await self.get_federation_rules(fed_id, sport)
                if rules:
                    federation_rules[fed_id] = rules
            
            if not federation_rules:
                # Fallback to base sport rules
                base_rules = getSportRule(sport)
                return HarmonizedRule(
                    sport=sport,
                    rule_type='base',
                    base_rule=base_rules or {},
                    federation_overrides={},
                    harmonized_rule=base_rules or {},
                    confidence_score=0.5,
                    last_updated=datetime.now()
                )
            
            # Start with the most comprehensive rule set
            base_federation = max(federation_rules.keys(), key=lambda x: len(federation_rules[x]))
            base_rule = federation_rules[base_federation]
            
            # Create federation overrides
            federation_overrides = {}
            for fed_id, rules in federation_rules.items():
                if fed_id != base_federation:
                    overrides = {}
                    for rule_type, rule_value in rules.items():
                        if rule_type in base_rule and base_rule[rule_type] != rule_value:
                            overrides[rule_type] = rule_value
                    if overrides:
                        federation_overrides[fed_id] = overrides
            
            # Create harmonized rule
            harmonized_rule = base_rule.copy()
            
            # Apply overrides based on federation priority or consensus
            for fed_id, overrides in federation_overrides.items():
                for rule_type, rule_value in overrides.items():
                    # Use consensus or priority-based decision
                    if self.should_apply_override(rule_type, rule_value, harmonized_rule.get(rule_type)):
                        harmonized_rule[rule_type] = rule_value
            
            # Calculate confidence score
            confidence_score = self.calculate_harmonization_confidence(federation_rules, harmonized_rule)
            
            harmonized = HarmonizedRule(
                sport=sport,
                rule_type='harmonized',
                base_rule=base_rule,
                federation_overrides=federation_overrides,
                harmonized_rule=harmonized_rule,
                confidence_score=confidence_score,
                last_updated=datetime.now()
            )
            
            # Save harmonized rule
            await self.save_harmonized_rule(harmonized)
            
            return harmonized
            
        except Exception as e:
            logger.error(f"Error harmonizing sport rules: {e}")
            # Return fallback rules
            return HarmonizedRule(
                sport=sport,
                rule_type='fallback',
                base_rule=getSportRule(sport) or {},
                federation_overrides={},
                harmonized_rule=getSportRule(sport) or {},
                confidence_score=0.3,
                last_updated=datetime.now()
            )

    def should_apply_override(self, rule_type: str, override_value: Any, current_value: Any) -> bool:
        """Determine if an override should be applied"""
        # Safety-critical rules: always apply stricter standards
        safety_rules = ['equipment', 'field_dimensions', 'player_count']
        if rule_type in safety_rules:
            return self.is_stricter_rule(rule_type, override_value, current_value)
        
        # Scoring rules: prefer more detailed/clear rules
        scoring_rules = ['scoring', 'points']
        if rule_type in scoring_rules:
            return self.is_more_detailed_rule(override_value, current_value)
        
        # Timing rules: prefer shorter/more efficient rules
        timing_rules = ['timing', 'duration']
        if rule_type in timing_rules:
            return self.is_more_efficient_rule(override_value, current_value)
        
        # Default: apply override if it's different
        return override_value != current_value

    def is_stricter_rule(self, rule_type: str, rule1: Any, rule2: Any) -> bool:
        """Check if rule1 is stricter than rule2"""
        if rule_type == 'equipment':
            # More equipment requirements = stricter
            if isinstance(rule1, dict) and isinstance(rule2, dict):
                return len(rule1) > len(rule2)
        elif rule_type == 'field_dimensions':
            # Smaller field = stricter
            if isinstance(rule1, dict) and isinstance(rule2, dict):
                return rule1.get('size', 0) < rule2.get('size', float('inf'))
        return False

    def is_more_detailed_rule(self, rule1: Any, rule2: Any) -> bool:
        """Check if rule1 is more detailed than rule2"""
        if isinstance(rule1, dict) and isinstance(rule2, dict):
            return len(rule1) > len(rule2)
        elif isinstance(rule1, str) and isinstance(rule2, str):
            return len(rule1) > len(rule2)
        return False

    def is_more_efficient_rule(self, rule1: Any, rule2: Any) -> bool:
        """Check if rule1 is more efficient than rule2"""
        if isinstance(rule1, dict) and isinstance(rule2, dict):
            # Shorter duration = more efficient
            if 'duration' in rule1 and 'duration' in rule2:
                return rule1['duration'] < rule2['duration']
        return False

    def calculate_harmonization_confidence(self, federation_rules: Dict[str, Any], harmonized_rule: Dict[str, Any]) -> float:
        """Calculate confidence score for harmonized rule"""
        total_rules = 0
        matching_rules = 0
        
        for fed_rules in federation_rules.values():
            for rule_type, rule_value in fed_rules.items():
                total_rules += 1
                if rule_type in harmonized_rule and harmonized_rule[rule_type] == rule_value:
                    matching_rules += 1
        
        if total_rules == 0:
            return 0.0
        
        return matching_rules / total_rules

    async def get_federation_rules(self, federation_id: str, sport: str) -> Optional[Dict[str, Any]]:
        """Get federation-specific rules for a sport"""
        try:
            # Get base sport rules
            base_rules = getSportRule(sport)
            if not base_rules:
                return None
            
            # Get federation overrides
            doc = self.federations_ref.document(federation_id).get()
            if not doc.exists:
                return base_rules
            
            federation_data = doc.to_dict()
            federation_overrides = federation_data.get('sport_rules', {}).get(sport, {})
            
            # Merge base rules with federation overrides
            merged_rules = base_rules.copy()
            merged_rules.update(federation_overrides)
            
            return merged_rules
            
        except Exception as e:
            logger.error(f"Error getting federation rules: {e}")
            return getSportRule(sport)

    async def save_rule_conflict(self, conflict: RuleConflict):
        """Save rule conflict to database"""
        try:
            conflict_data = {
                'id': conflict.id,
                'federation1_id': conflict.federation1_id,
                'federation2_id': conflict.federation2_id,
                'sport': conflict.sport,
                'rule_type': conflict.rule_type,
                'conflict_description': conflict.conflict_description,
                'severity': conflict.severity,
                'status': conflict.status,
                'resolution': conflict.resolution,
                'resolved_by': conflict.resolved_by,
                'resolved_at': conflict.resolved_at,
                'created_at': conflict.created_at
            }
            
            self.conflicts_ref.document(conflict.id).set(conflict_data)
            
        except Exception as e:
            logger.error(f"Error saving rule conflict: {e}")

    async def save_harmonized_rule(self, harmonized: HarmonizedRule):
        """Save harmonized rule to database"""
        try:
            rule_data = {
                'sport': harmonized.sport,
                'rule_type': harmonized.rule_type,
                'base_rule': harmonized.base_rule,
                'federation_overrides': harmonized.federation_overrides,
                'harmonized_rule': harmonized.harmonized_rule,
                'confidence_score': harmonized.confidence_score,
                'last_updated': harmonized.last_updated
            }
            
            self.harmonized_rules_ref.document(f"{harmonized.sport}_{harmonized.rule_type}").set(rule_data)
            
        except Exception as e:
            logger.error(f"Error saving harmonized rule: {e}")

    async def get_harmonized_rule(self, sport: str, rule_type: str = 'harmonized') -> Optional[HarmonizedRule]:
        """Get harmonized rule from database"""
        try:
            doc = self.harmonized_rules_ref.document(f"{sport}_{rule_type}").get()
            if doc.exists:
                data = doc.to_dict()
                return HarmonizedRule(
                    sport=data['sport'],
                    rule_type=data['rule_type'],
                    base_rule=data['base_rule'],
                    federation_overrides=data['federation_overrides'],
                    harmonized_rule=data['harmonized_rule'],
                    confidence_score=data['confidence_score'],
                    last_updated=data['last_updated']
                )
            return None
            
        except Exception as e:
            logger.error(f"Error getting harmonized rule: {e}")
            return None

# Initialize federation intelligence service
federation_intelligence = FederationIntelligenceService() 