from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from enum import Enum
import math
import random
import json
import logging

logger = logging.getLogger(__name__)

class PlayerTier(Enum):
    ROOKIE = "Rookie"
    PROSPECT = "Prospect"
    CONTENDER = "Contender"
    VETERAN = "Veteran"
    ELITE = "Elite"
    PRODIGY = "Prodigy"
    LEGEND = "Legend"

class ChallengeType(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MILESTONE = "milestone"
    SOCIAL = "social"
    STREAK = "streak"

class ChallengeCategory(Enum):
    SHOOTING = "shooting"
    CONDITIONING = "conditioning"
    STRENGTH = "strength"
    SKILLS = "skills"
    TEAMWORK = "teamwork"
    CONSISTENCY = "consistency"

class PlayerProgressionSystem:
    def __init__(self, progress_tracker, drill_engine):
        self.progress_tracker = progress_tracker
        self.drill_engine = drill_engine
        
        # XP Configuration
        self.xp_config = {
            'base_stat_improvement': 100,
            'streak_multiplier': 0.1,
            'badge_xp': {
                'bronze': 200,
                'silver': 500,
                'gold': 1000,
                'platinum': 2000
            },
            'challenge_xp': {
                'easy': 150,
                'medium': 300,
                'hard': 600,
                'elite': 1000
            }
        }
        
        # Level thresholds (XP required for each level)
        self.level_thresholds = [
            1000,  # Level 1
            2500,  # Level 2
            5000,  # Level 3
            10000, # Level 4
            20000, # Level 5
            # ... add more levels
        ]
        
        # Tier requirements
        self.tier_requirements = {
            PlayerTier.ROOKIE: {'min_level': 0, 'badges_required': 0},
            PlayerTier.PROSPECT: {'min_level': 5, 'badges_required': 3},
            PlayerTier.CONTENDER: {'min_level': 10, 'badges_required': 8},
            PlayerTier.VETERAN: {'min_level': 20, 'badges_required': 15},
            PlayerTier.ELITE: {'min_level': 30, 'badges_required': 25},
            PlayerTier.PRODIGY: {'min_level': 40, 'badges_required': 35},
            PlayerTier.LEGEND: {'min_level': 50, 'badges_required': 50}
        }
        
        # Challenge pool
        self.challenge_pool = self._initialize_challenge_pool()

    def _initialize_challenge_pool(self) -> Dict[str, List[Dict]]:
        """Initialize the pool of available challenges."""
        return {
            ChallengeCategory.SHOOTING.value: [
                {
                    'id': 'free_throw_streak',
                    'title': 'Free Throw Master',
                    'description': 'Make {target} consecutive free throws',
                    'difficulty': 'medium',
                    'base_target': 10,
                    'xp_reward': 300,
                    'scaling_factor': 1.2
                },
                # Add more shooting challenges
            ],
            ChallengeCategory.CONDITIONING.value: [
                {
                    'id': 'hiit_workout',
                    'title': 'HIIT Hero',
                    'description': 'Complete {target} HIIT workouts this week',
                    'difficulty': 'hard',
                    'base_target': 3,
                    'xp_reward': 600,
                    'scaling_factor': 1.3
                },
                # Add more conditioning challenges
            ],
            # Add more categories
        }

    def calculate_xp_gain(
        self,
        player_id: str,
        activity_type: str,
        performance_data: Dict[str, Any]
    ) -> int:
        """Calculate XP gain from various activities."""
        base_xp = 0
        
        if activity_type == 'stat_improvement':
            improvement = performance_data.get('improvement', 0)
            base_xp = self.xp_config['base_stat_improvement'] * improvement
            
        elif activity_type == 'badge_earned':
            badge_tier = performance_data.get('tier', 'bronze')
            base_xp = self.xp_config['badge_xp'].get(badge_tier, 0)
            
        elif activity_type == 'challenge_completed':
            difficulty = performance_data.get('difficulty', 'easy')
            base_xp = self.xp_config['challenge_xp'].get(difficulty, 0)
        
        # Apply streak multiplier
        streak = self.progress_tracker.get_active_streak(player_id)
        streak_bonus = base_xp * (streak * self.xp_config['streak_multiplier'])
        
        total_xp = math.ceil(base_xp + streak_bonus)
        logger.info(f"XP gained: {total_xp} (base: {base_xp}, streak bonus: {streak_bonus})")
        
        return total_xp

    def get_level_progress(self, total_xp: int) -> Tuple[int, float]:
        """Calculate current level and progress to next level."""
        current_level = 0
        for level, threshold in enumerate(self.level_thresholds):
            if total_xp >= threshold:
                current_level = level + 1
            else:
                break
        
        # Calculate progress to next level
        current_threshold = self.level_thresholds[current_level - 1] if current_level > 0 else 0
        next_threshold = self.level_thresholds[current_level] if current_level < len(self.level_thresholds) else float('inf')
        
        progress = (total_xp - current_threshold) / (next_threshold - current_threshold)
        return current_level, min(progress, 1.0)

    def get_player_tier(self, player_id: str) -> PlayerTier:
        """Determine player's current tier based on level and badges."""
        total_xp = self.progress_tracker.get_total_xp(player_id)
        current_level, _ = self.get_level_progress(total_xp)
        badge_count = self.progress_tracker.get_badge_count(player_id)
        
        current_tier = PlayerTier.ROOKIE
        for tier, requirements in self.tier_requirements.items():
            if (current_level >= requirements['min_level'] and 
                badge_count >= requirements['badges_required']):
                current_tier = tier
        
        return current_tier

    def generate_challenges(
        self,
        player_id: str,
        challenge_type: ChallengeType
    ) -> List[Dict]:
        """Generate appropriate challenges for the player."""
        player_stats = self.progress_tracker.get_recent_stats(player_id)
        focus_areas = self.drill_engine.get_recommended_focus_areas(player_id)
        
        challenges = []
        num_challenges = 3 if challenge_type == ChallengeType.DAILY else 5
        
        # Prioritize challenges from focus areas
        focus_categories = [
            ChallengeCategory(area['area']).value 
            for area in focus_areas 
            if hasattr(ChallengeCategory, area['area'].upper())
        ]
        
        for category in focus_categories:
            if len(challenges) >= num_challenges:
                break
                
            category_challenges = self.challenge_pool.get(category, [])
            if category_challenges:
                challenge = random.choice(category_challenges).copy()
                challenge['target'] = self._scale_challenge_target(
                    player_id, 
                    challenge['base_target'],
                    challenge['scaling_factor']
                )
                challenges.append(challenge)
        
        # Fill remaining slots with random challenges
        while len(challenges) < num_challenges:
            category = random.choice(list(ChallengeCategory))
            category_challenges = self.challenge_pool.get(category.value, [])
            if category_challenges:
                challenge = random.choice(category_challenges).copy()
                challenge['target'] = self._scale_challenge_target(
                    player_id,
                    challenge['base_target'],
                    challenge['scaling_factor']
                )
                challenges.append(challenge)
        
        return challenges

    def _scale_challenge_target(
        self,
        player_id: str,
        base_target: int,
        scaling_factor: float
    ) -> int:
        """Scale challenge target based on player level."""
        total_xp = self.progress_tracker.get_total_xp(player_id)
        current_level, _ = self.get_level_progress(total_xp)
        
        scaled_target = base_target * (1 + (current_level * scaling_factor / 10))
        return math.ceil(scaled_target)

    def track_challenge_progress(
        self,
        player_id: str,
        challenge_id: str,
        progress_data: Dict[str, Any]
    ) -> Tuple[bool, int]:
        """Track progress for an active challenge."""
        challenge = self.progress_tracker.get_active_challenge(player_id, challenge_id)
        if not challenge:
            return False, 0
        
        current_progress = progress_data.get('progress', 0)
        is_completed = current_progress >= challenge['target']
        
        if is_completed:
            xp_gained = self.calculate_xp_gain(
                player_id,
                'challenge_completed',
                {'difficulty': challenge['difficulty']}
            )
            self.progress_tracker.update_xp(player_id, xp_gained)
            self.progress_tracker.complete_challenge(player_id, challenge_id)
            return True, xp_gained
        
        self.progress_tracker.update_challenge_progress(
            player_id,
            challenge_id,
            current_progress
        )
        return False, 0

    def get_progression_summary(self, player_id: str) -> Dict[str, Any]:
        """Get a complete summary of player's progression."""
        total_xp = self.progress_tracker.get_total_xp(player_id)
        current_level, level_progress = self.get_level_progress(total_xp)
        current_tier = self.get_player_tier(player_id)
        
        active_challenges = self.progress_tracker.get_active_challenges(player_id)
        recent_achievements = self.progress_tracker.get_recent_achievements(player_id)
        
        return {
            'xp': total_xp,
            'level': current_level,
            'level_progress': level_progress,
            'tier': current_tier.value,
            'active_challenges': active_challenges,
            'recent_achievements': recent_achievements,
            'next_tier': self._get_next_tier_requirements(current_tier),
            'stats_summary': self.progress_tracker.get_stats_summary(player_id)
        }

    def _get_next_tier_requirements(self, current_tier: PlayerTier) -> Optional[Dict]:
        """Get requirements for the next tier."""
        tiers = list(PlayerTier)
        current_index = tiers.index(current_tier)
        
        if current_index < len(tiers) - 1:
            next_tier = tiers[current_index + 1]
            requirements = self.tier_requirements[next_tier]
            return {
                'tier': next_tier.value,
                'min_level': requirements['min_level'],
                'badges_required': requirements['badges_required']
            }
        return None 