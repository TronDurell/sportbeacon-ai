import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import firebase_admin
from firebase_admin import firestore
import json
import os
from dotenv import load_dotenv
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AICoachingEngine:
    """
    AI-powered coaching engine for personalized training plans and skill analysis.
    Generates recommendations based on player stats, performance history, and highlight insights.
    """
    
    def __init__(self):
        self.db = firestore.client()
        self.skill_weights = self._load_skill_weights()
        self.training_templates = self._load_training_templates()
        self.reward_tiers = self._load_reward_tiers()
        self.motivational_engine = self._load_motivational_engine()
        
    def _load_skill_weights(self) -> Dict:
        """Load skill importance weights for different sports."""
        return {
            'basketball': {
                'shooting': 0.25,
                'dribbling': 0.20,
                'passing': 0.15,
                'defense': 0.20,
                'rebounding': 0.10,
                'athleticism': 0.10
            },
            'soccer': {
                'dribbling': 0.25,
                'passing': 0.25,
                'shooting': 0.20,
                'defense': 0.15,
                'tactical_awareness': 0.10,
                'athleticism': 0.05
            },
            'football': {
                'throwing': 0.30,
                'running': 0.25,
                'catching': 0.20,
                'blocking': 0.15,
                'tackling': 0.10
            }
        }
    
    def _load_training_templates(self) -> Dict:
        """Load training plan templates for different skill levels and focus areas."""
        return {
            'beginner': {
                'duration': 30,
                'intensity': 'low',
                'focus_areas': ['fundamentals', 'basic_skills'],
                'drill_types': ['repetition', 'form_practice']
            },
            'intermediate': {
                'duration': 45,
                'intensity': 'medium',
                'focus_areas': ['skill_development', 'game_situations'],
                'drill_types': ['progressive', 'scenario_based']
            },
            'advanced': {
                'duration': 60,
                'intensity': 'high',
                'focus_areas': ['advanced_techniques', 'performance_optimization'],
                'drill_types': ['complex', 'pressure_situations']
            }
        }
    
    def _load_reward_tiers(self) -> Dict:
        """Load reward tier configurations for coaching engagement."""
        return {
            'basic': {
                'daily_limit': 1,
                'reward_multiplier': 1.0,
                'access_level': 'basic_coaching'
            },
            'premium': {
                'daily_limit': 3,
                'reward_multiplier': 1.5,
                'access_level': 'advanced_coaching'
            },
            'elite': {
                'daily_limit': 5,
                'reward_multiplier': 2.0,
                'access_level': 'elite_coaching'
            }
        }
    
    def _load_motivational_engine(self) -> Dict:
        """Load motivational message templates and triggers."""
        return {
            'positive_performance': [
                "Great work! Your {skill} has improved by {improvement}% this week.",
                "Outstanding progress! You're showing real dedication to {skill}.",
                "Fantastic! Your hard work on {skill} is paying off."
            ],
            'needs_improvement': [
                "Let's focus on {skill} today. Small improvements lead to big results!",
                "Time to level up your {skill}. You've got this!",
                "Ready to tackle {skill}? Every expert was once a beginner."
            ],
            'streak_motivation': [
                "🔥 {streak} day streak! You're on fire!",
                "Incredible consistency! {streak} days of dedication.",
                "You're building something special with this {streak} day streak!"
            ],
            'milestone_celebration': [
                "🎉 Milestone reached! Your {skill} has reached a new level!",
                "Congratulations! You've mastered {skill} fundamentals.",
                "Amazing achievement! Your {skill} is now elite level."
            ]
        }
    
    async def analyze_player_performance(self, player_id: str, sport: str) -> Dict:
        """
        Analyze player performance and identify skill gaps.
        
        Args:
            player_id: The player's unique identifier
            sport: The sport being analyzed
            
        Returns:
            Dict containing performance analysis and skill assessment
        """
        try:
            # Get player data
            player_data = await self._get_player_data(player_id)
            if not player_data:
                return {'error': 'Player data not found'}
            
            # Get performance history
            performance_history = await self._get_performance_history(player_id)
            
            # Get highlight insights
            highlight_insights = await self._get_highlight_insights(player_id)
            
            # Calculate skill scores
            skill_scores = self._calculate_skill_scores(player_data, performance_history, sport)
            
            # Identify skill gaps
            skill_gaps = self._identify_skill_gaps(skill_scores, sport)
            
            # Generate performance trends
            performance_trends = self._analyze_performance_trends(performance_history)
            
            # Calculate improvement areas
            improvement_areas = self._prioritize_improvement_areas(skill_gaps, performance_trends)
            
            return {
                'player_id': player_id,
                'sport': sport,
                'skill_scores': skill_scores,
                'skill_gaps': skill_gaps,
                'performance_trends': performance_trends,
                'improvement_areas': improvement_areas,
                'highlight_insights': highlight_insights,
                'analysis_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing player performance: {e}")
            return {'error': str(e)}
    
    async def generate_training_plan(self, player_id: str, sport: str, focus_skills: List[str] = None) -> Dict:
        """
        Generate personalized training plan based on player analysis.
        
        Args:
            player_id: The player's unique identifier
            sport: The sport for training plan
            focus_skills: Specific skills to focus on (optional)
            
        Returns:
            Dict containing personalized training plan
        """
        try:
            # Get player analysis
            analysis = await self.analyze_player_performance(player_id, sport)
            if 'error' in analysis:
                return analysis
            
            # Determine player level
            player_level = self._determine_player_level(analysis['skill_scores'])
            
            # Get focus skills if not provided
            if not focus_skills:
                focus_skills = [area['skill'] for area in analysis['improvement_areas'][:3]]
            
            # Generate daily training focus
            daily_focus = self._generate_daily_focus(focus_skills, player_level)
            
            # Create drill recommendations
            drill_recommendations = self._create_drill_recommendations(focus_skills, player_level, sport)
            
            # Generate motivational message
            motivational_message = self._generate_motivational_message(analysis, player_id)
            
            # Calculate potential rewards
            potential_rewards = self._calculate_potential_rewards(player_level, focus_skills)
            
            # Create progress tracking
            progress_tracking = self._create_progress_tracking(player_id, focus_skills)
            
            return {
                'player_id': player_id,
                'sport': sport,
                'player_level': player_level,
                'daily_focus': daily_focus,
                'drill_recommendations': drill_recommendations,
                'motivational_message': motivational_message,
                'potential_rewards': potential_rewards,
                'progress_tracking': progress_tracking,
                'focus_skills': focus_skills,
                'generated_date': datetime.now().isoformat(),
                'valid_until': (datetime.now() + timedelta(days=7)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating training plan: {e}")
            return {'error': str(e)}
    
    async def get_coaching_recommendations(self, player_id: str, sport: str, subscription_tier: str = 'basic') -> Dict:
        """
        Get comprehensive coaching recommendations for a player.
        
        Args:
            player_id: The player's unique identifier
            sport: The sport for recommendations
            subscription_tier: Player's subscription tier (basic/premium/elite)
            
        Returns:
            Dict containing coaching recommendations
        """
        try:
            # Get training plan
            training_plan = await self.generate_training_plan(player_id, sport)
            if 'error' in training_plan:
                return training_plan
            
            # Get player analysis
            analysis = await self.analyze_player_performance(player_id, sport)
            
            # Get engagement streak
            engagement_streak = await self._get_engagement_streak(player_id)
            
            # Get reward tier info
            reward_tier = self.reward_tiers.get(subscription_tier, self.reward_tiers['basic'])
            
            # Generate skill-building plans
            skill_plans = self._generate_skill_plans(analysis['improvement_areas'], subscription_tier)
            
            # Get past errors analysis
            past_errors = await self._analyze_past_errors(player_id)
            
            # Calculate progression streaks
            progression_streaks = await self._calculate_progression_streaks(player_id)
            
            # Generate highlight recommendations
            highlight_recommendations = await self._generate_highlight_recommendations(player_id, sport)
            
            # Create reward progression
            reward_progression = self._create_reward_progression(engagement_streak, subscription_tier)
            
            return {
                'player_id': player_id,
                'sport': sport,
                'subscription_tier': subscription_tier,
                'training_plan': training_plan,
                'skill_plans': skill_plans,
                'past_errors': past_errors,
                'progression_streaks': progression_streaks,
                'highlight_recommendations': highlight_recommendations,
                'reward_progression': reward_progression,
                'engagement_streak': engagement_streak,
                'daily_limit': reward_tier['daily_limit'],
                'reward_multiplier': reward_tier['reward_multiplier'],
                'generated_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting coaching recommendations: {e}")
            return {'error': str(e)}
    
    async def _get_player_data(self, player_id: str) -> Dict:
        """Get player profile and basic data."""
        try:
            player_ref = self.db.collection('players').document(player_id)
            player_doc = player_ref.get()
            
            if not player_doc.exists:
                return None
            
            return player_doc.to_dict()
            
        except Exception as e:
            logger.error(f"Error getting player data: {e}")
            return None
    
    async def _get_performance_history(self, player_id: str, days: int = 30) -> List[Dict]:
        """Get player performance history."""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            performance_ref = self.db.collection('player_performance')
            performances = performance_ref.where('player_id', '==', player_id).where('date', '>=', cutoff_date).get()
            
            return [doc.to_dict() for doc in performances]
            
        except Exception as e:
            logger.error(f"Error getting performance history: {e}")
            return []
    
    async def _get_highlight_insights(self, player_id: str) -> List[Dict]:
        """Get AI-generated insights from player highlights."""
        try:
            highlights_ref = self.db.collection('highlights')
            player_highlights = highlights_ref.where('creator_id', '==', player_id).get()
            
            insights = []
            for highlight_doc in player_highlights:
                highlight_data = highlight_doc.to_dict()
                
                # Get AI analysis for this highlight
                analysis_ref = highlight_doc.reference.collection('ai_analysis')
                analysis_docs = analysis_ref.get()
                
                if analysis_docs:
                    latest_analysis = max(analysis_docs, key=lambda x: x.get('timestamp', 0))
                    insights.append({
                        'highlight_id': highlight_doc.id,
                        'insights': latest_analysis.to_dict(),
                        'date': highlight_data.get('created_at')
                    })
            
            return insights
            
        except Exception as e:
            logger.error(f"Error getting highlight insights: {e}")
            return []
    
    def _calculate_skill_scores(self, player_data: Dict, performance_history: List[Dict], sport: str) -> Dict:
        """Calculate skill scores based on player data and performance."""
        try:
            skill_weights = self.skill_weights.get(sport, {})
            skill_scores = {}
            
            # Base scores from player profile
            for skill, weight in skill_weights.items():
                base_score = player_data.get(f'{skill}_rating', 50)
                skill_scores[skill] = {
                    'score': base_score,
                    'weight': weight,
                    'weighted_score': base_score * weight
                }
            
            # Adjust scores based on performance history
            for performance in performance_history:
                for skill, weight in skill_weights.items():
                    performance_score = performance.get(f'{skill}_performance', 0)
                    if performance_score > 0:
                        skill_scores[skill]['score'] = (skill_scores[skill]['score'] + performance_score) / 2
                        skill_scores[skill]['weighted_score'] = skill_scores[skill]['score'] * weight
            
            return skill_scores
            
        except Exception as e:
            logger.error(f"Error calculating skill scores: {e}")
            return {}
    
    def _identify_skill_gaps(self, skill_scores: Dict, sport: str) -> List[Dict]:
        """Identify skill gaps and areas for improvement."""
        try:
            skill_gaps = []
            target_scores = {
                'basketball': {'shooting': 80, 'dribbling': 75, 'passing': 70, 'defense': 75, 'rebounding': 70, 'athleticism': 75},
                'soccer': {'dribbling': 80, 'passing': 80, 'shooting': 75, 'defense': 70, 'tactical_awareness': 75, 'athleticism': 70},
                'football': {'throwing': 85, 'running': 80, 'catching': 75, 'blocking': 70, 'tackling': 70}
            }
            
            target_scores_sport = target_scores.get(sport, {})
            
            for skill, data in skill_scores.items():
                current_score = data['score']
                target_score = target_scores_sport.get(skill, 75)
                
                if current_score < target_score:
                    gap = target_score - current_score
                    skill_gaps.append({
                        'skill': skill,
                        'current_score': current_score,
                        'target_score': target_score,
                        'gap': gap,
                        'priority': gap * data['weight']
                    })
            
            # Sort by priority
            skill_gaps.sort(key=lambda x: x['priority'], reverse=True)
            
            return skill_gaps
            
        except Exception as e:
            logger.error(f"Error identifying skill gaps: {e}")
            return []
    
    def _analyze_performance_trends(self, performance_history: List[Dict]) -> Dict:
        """Analyze performance trends over time."""
        try:
            if not performance_history:
                return {'trend': 'stable', 'improvement_rate': 0}
            
            # Sort by date
            sorted_performance = sorted(performance_history, key=lambda x: x.get('date', 0))
            
            # Calculate overall performance scores
            scores = []
            for performance in sorted_performance:
                overall_score = performance.get('overall_score', 0)
                if overall_score > 0:
                    scores.append(overall_score)
            
            if len(scores) < 2:
                return {'trend': 'stable', 'improvement_rate': 0}
            
            # Calculate trend
            recent_avg = np.mean(scores[-5:]) if len(scores) >= 5 else np.mean(scores)
            earlier_avg = np.mean(scores[:5]) if len(scores) >= 5 else scores[0]
            
            improvement_rate = (recent_avg - earlier_avg) / earlier_avg * 100
            
            if improvement_rate > 5:
                trend = 'improving'
            elif improvement_rate < -5:
                trend = 'declining'
            else:
                trend = 'stable'
            
            return {
                'trend': trend,
                'improvement_rate': improvement_rate,
                'recent_avg': recent_avg,
                'earlier_avg': earlier_avg
            }
            
        except Exception as e:
            logger.error(f"Error analyzing performance trends: {e}")
            return {'trend': 'stable', 'improvement_rate': 0}
    
    def _prioritize_improvement_areas(self, skill_gaps: List[Dict], performance_trends: Dict) -> List[Dict]:
        """Prioritize improvement areas based on gaps and trends."""
        try:
            improvement_areas = []
            
            for gap in skill_gaps:
                priority_score = gap['priority']
                
                # Adjust priority based on performance trend
                if performance_trends['trend'] == 'declining':
                    priority_score *= 1.2  # Increase priority for declining performance
                elif performance_trends['trend'] == 'improving':
                    priority_score *= 0.9  # Slightly reduce priority for improving performance
                
                improvement_areas.append({
                    'skill': gap['skill'],
                    'priority_score': priority_score,
                    'current_score': gap['current_score'],
                    'target_score': gap['target_score'],
                    'gap': gap['gap'],
                    'estimated_improvement_time': self._estimate_improvement_time(gap['gap'])
                })
            
            # Sort by priority score
            improvement_areas.sort(key=lambda x: x['priority_score'], reverse=True)
            
            return improvement_areas
            
        except Exception as e:
            logger.error(f"Error prioritizing improvement areas: {e}")
            return []
    
    def _determine_player_level(self, skill_scores: Dict) -> str:
        """Determine player level based on skill scores."""
        try:
            if not skill_scores:
                return 'beginner'
            
            # Calculate average weighted score
            total_weighted_score = sum(data['weighted_score'] for data in skill_scores.values())
            total_weight = sum(data['weight'] for data in skill_scores.values())
            
            if total_weight == 0:
                return 'beginner'
            
            average_score = total_weighted_score / total_weight
            
            if average_score >= 80:
                return 'advanced'
            elif average_score >= 60:
                return 'intermediate'
            else:
                return 'beginner'
                
        except Exception as e:
            logger.error(f"Error determining player level: {e}")
            return 'beginner'
    
    def _generate_daily_focus(self, focus_skills: List[str], player_level: str) -> Dict:
        """Generate daily training focus areas."""
        try:
            template = self.training_templates.get(player_level, self.training_templates['beginner'])
            
            return {
                'primary_skill': focus_skills[0] if focus_skills else 'general_fitness',
                'secondary_skills': focus_skills[1:3] if len(focus_skills) > 1 else [],
                'duration_minutes': template['duration'],
                'intensity': template['intensity'],
                'focus_areas': template['focus_areas'],
                'drill_types': template['drill_types']
            }
            
        except Exception as e:
            logger.error(f"Error generating daily focus: {e}")
            return {}
    
    def _create_drill_recommendations(self, focus_skills: List[str], player_level: str, sport: str) -> List[Dict]:
        """Create specific drill recommendations."""
        try:
            drills = []
            
            for skill in focus_skills:
                skill_drills = self._get_skill_drills(skill, player_level, sport)
                drills.extend(skill_drills)
            
            # Limit to 5 drills per day
            return drills[:5]
            
        except Exception as e:
            logger.error(f"Error creating drill recommendations: {e}")
            return []
    
    def _get_skill_drills(self, skill: str, player_level: str, sport: str) -> List[Dict]:
        """Get drills for a specific skill."""
        # This would typically come from a database of drills
        # For now, we'll return template drills
        drill_templates = {
            'shooting': [
                {
                    'name': 'Form Shooting',
                    'description': 'Practice shooting form with focus on technique',
                    'duration': 10,
                    'difficulty': 'beginner',
                    'equipment': ['basketball', 'hoop'],
                    'instructions': 'Focus on proper form and follow-through'
                },
                {
                    'name': 'Spot Shooting',
                    'description': 'Shoot from different spots on the court',
                    'duration': 15,
                    'difficulty': 'intermediate',
                    'equipment': ['basketball', 'hoop'],
                    'instructions': 'Shoot 10 shots from each spot'
                }
            ],
            'dribbling': [
                {
                    'name': 'Ball Control Drills',
                    'description': 'Improve ball handling and control',
                    'duration': 12,
                    'difficulty': 'beginner',
                    'equipment': ['basketball'],
                    'instructions': 'Practice dribbling with both hands'
                }
            ]
        }
        
        return drill_templates.get(skill, [])
    
    def _generate_motivational_message(self, analysis: Dict, player_id: str) -> str:
        """Generate personalized motivational message."""
        try:
            # Get player's recent performance
            performance_trends = analysis.get('performance_trends', {})
            skill_gaps = analysis.get('skill_gaps', [])
            
            if performance_trends.get('trend') == 'improving':
                skill = skill_gaps[0]['skill'] if skill_gaps else 'your game'
                improvement = abs(performance_trends.get('improvement_rate', 0))
                return f"Great work! Your {skill} has improved by {improvement:.1f}% this week. Keep pushing!"
            
            elif skill_gaps:
                skill = skill_gaps[0]['skill']
                return f"Let's focus on {skill} today. Small improvements lead to big results! You've got this!"
            
            else:
                return "You're doing great! Keep up the consistent work and you'll see amazing results!"
                
        except Exception as e:
            logger.error(f"Error generating motivational message: {e}")
            return "Ready to improve your game? Let's get to work!"
    
    def _calculate_potential_rewards(self, player_level: str, focus_skills: List[str]) -> Dict:
        """Calculate potential BEACON rewards for completing training."""
        try:
            base_reward = 5.0  # Base BEACON reward
            
            # Level multiplier
            level_multipliers = {'beginner': 1.0, 'intermediate': 1.2, 'advanced': 1.5}
            level_multiplier = level_multipliers.get(player_level, 1.0)
            
            # Skill difficulty multiplier
            skill_multiplier = 1.0 + (len(focus_skills) * 0.1)
            
            total_reward = base_reward * level_multiplier * skill_multiplier
            
            return {
                'base_reward': base_reward,
                'level_multiplier': level_multiplier,
                'skill_multiplier': skill_multiplier,
                'total_potential_reward': total_reward,
                'currency': 'BEACON'
            }
            
        except Exception as e:
            logger.error(f"Error calculating potential rewards: {e}")
            return {'total_potential_reward': 5.0, 'currency': 'BEACON'}
    
    def _create_progress_tracking(self, player_id: str, focus_skills: List[str]) -> Dict:
        """Create progress tracking structure."""
        try:
            return {
                'player_id': player_id,
                'focus_skills': focus_skills,
                'start_date': datetime.now().isoformat(),
                'target_date': (datetime.now() + timedelta(days=30)).isoformat(),
                'daily_completions': [],
                'skill_progress': {skill: {'start_score': 0, 'current_score': 0} for skill in focus_skills},
                'milestones': [],
                'streak_count': 0
            }
            
        except Exception as e:
            logger.error(f"Error creating progress tracking: {e}")
            return {}
    
    async def _get_engagement_streak(self, player_id: str) -> int:
        """Get player's current engagement streak."""
        try:
            # Get recent coaching interactions
            cutoff_date = datetime.now() - timedelta(days=30)
            
            interactions_ref = self.db.collection('coaching_interactions')
            interactions = interactions_ref.where('player_id', '==', player_id).where('date', '>=', cutoff_date).get()
            
            # Calculate streak
            dates = [doc.to_dict().get('date') for doc in interactions]
            dates.sort()
            
            streak = 0
            current_date = datetime.now().date()
            
            for i in range(len(dates)):
                if (current_date - dates[i].date()).days == i:
                    streak += 1
                else:
                    break
            
            return streak
            
        except Exception as e:
            logger.error(f"Error getting engagement streak: {e}")
            return 0
    
    def _generate_skill_plans(self, improvement_areas: List[Dict], subscription_tier: str) -> List[Dict]:
        """Generate detailed skill-building plans."""
        try:
            plans = []
            
            for area in improvement_areas[:3]:  # Top 3 areas
                plan = {
                    'skill': area['skill'],
                    'current_score': area['current_score'],
                    'target_score': area['target_score'],
                    'estimated_time': area['estimated_improvement_time'],
                    'weekly_goals': self._create_weekly_goals(area),
                    'drills': self._get_skill_drills(area['skill'], 'intermediate', 'basketball'),
                    'progress_milestones': self._create_progress_milestones(area)
                }
                plans.append(plan)
            
            return plans
            
        except Exception as e:
            logger.error(f"Error generating skill plans: {e}")
            return []
    
    async def _analyze_past_errors(self, player_id: str) -> List[Dict]:
        """Analyze past errors and provide improvement suggestions."""
        try:
            # Get past performance data with errors
            performance_ref = self.db.collection('player_performance')
            performances = performance_ref.where('player_id', '==', player_id).where('errors', '>', 0).get()
            
            errors = []
            for doc in performances:
                performance_data = doc.to_dict()
                error_details = performance_data.get('error_details', [])
                
                for error in error_details:
                    errors.append({
                        'date': performance_data.get('date'),
                        'error_type': error.get('type'),
                        'skill_affected': error.get('skill'),
                        'frequency': error.get('frequency', 1),
                        'suggestion': self._get_error_suggestion(error.get('type'))
                    })
            
            # Group by error type and calculate frequency
            error_summary = {}
            for error in errors:
                error_type = error['error_type']
                if error_type not in error_summary:
                    error_summary[error_type] = {
                        'count': 0,
                        'skills_affected': set(),
                        'suggestions': []
                    }
                
                error_summary[error_type]['count'] += error['frequency']
                error_summary[error_type]['skills_affected'].add(error['skill_affected'])
                error_summary[error_type]['suggestions'].append(error['suggestion'])
            
            # Convert to list format
            return [
                {
                    'error_type': error_type,
                    'frequency': data['count'],
                    'skills_affected': list(data['skills_affected']),
                    'primary_suggestion': data['suggestions'][0] if data['suggestions'] else 'Focus on fundamentals'
                }
                for error_type, data in error_summary.items()
            ]
            
        except Exception as e:
            logger.error(f"Error analyzing past errors: {e}")
            return []
    
    async def _calculate_progression_streaks(self, player_id: str) -> Dict:
        """Calculate progression streaks for different skills."""
        try:
            # Get recent performance data
            cutoff_date = datetime.now() - timedelta(days=60)
            
            performance_ref = self.db.collection('player_performance')
            performances = performance_ref.where('player_id', '==', player_id).where('date', '>=', cutoff_date).get()
            
            skill_streaks = {}
            
            for doc in performances:
                performance_data = doc.to_dict()
                skill_scores = performance_data.get('skill_scores', {})
                
                for skill, score in skill_scores.items():
                    if skill not in skill_streaks:
                        skill_streaks[skill] = {
                            'current_streak': 0,
                            'best_streak': 0,
                            'improvement_days': 0
                        }
                    
                    # Check if score improved
                    if score > skill_streaks[skill].get('last_score', 0):
                        skill_streaks[skill]['current_streak'] += 1
                        skill_streaks[skill]['improvement_days'] += 1
                    else:
                        skill_streaks[skill]['current_streak'] = 0
                    
                    skill_streaks[skill]['last_score'] = score
                    skill_streaks[skill]['best_streak'] = max(
                        skill_streaks[skill]['best_streak'],
                        skill_streaks[skill]['current_streak']
                    )
            
            return skill_streaks
            
        except Exception as e:
            logger.error(f"Error calculating progression streaks: {e}")
            return {}
    
    async def _generate_highlight_recommendations(self, player_id: str, sport: str) -> List[Dict]:
        """Generate highlight recommendations for skill improvement."""
        try:
            # Get player's highlight insights
            highlight_insights = await self._get_highlight_insights(player_id)
            
            recommendations = []
            
            for insight in highlight_insights:
                analysis = insight.get('insights', {})
                
                # Find areas for improvement
                weaknesses = analysis.get('weaknesses', [])
                strengths = analysis.get('strengths', [])
                
                for weakness in weaknesses:
                    recommendations.append({
                        'highlight_id': insight['highlight_id'],
                        'focus_area': weakness,
                        'type': 'improvement',
                        'description': f"Focus on improving {weakness} based on this highlight",
                        'timestamp': insight['date']
                    })
                
                for strength in strengths:
                    recommendations.append({
                        'highlight_id': insight['highlight_id'],
                        'focus_area': strength,
                        'type': 'reinforcement',
                        'description': f"Great example of {strength} - study this technique",
                        'timestamp': insight['date']
                    })
            
            # Sort by relevance and limit to top 5
            recommendations.sort(key=lambda x: x['timestamp'], reverse=True)
            return recommendations[:5]
            
        except Exception as e:
            logger.error(f"Error generating highlight recommendations: {e}")
            return []
    
    def _create_reward_progression(self, engagement_streak: int, subscription_tier: str) -> Dict:
        """Create reward progression based on engagement streak."""
        try:
            base_reward = 5.0
            tier_multiplier = self.reward_tiers.get(subscription_tier, {}).get('reward_multiplier', 1.0)
            
            # Streak bonuses
            streak_bonuses = {
                3: 1.2,  # 20% bonus for 3-day streak
                5: 1.5,  # 50% bonus for 5-day streak
                7: 2.0,  # 100% bonus for 7-day streak
                10: 3.0  # 200% bonus for 10-day streak
            }
            
            # Find applicable streak bonus
            applicable_bonus = 1.0
            for streak_threshold, bonus in streak_bonuses.items():
                if engagement_streak >= streak_threshold:
                    applicable_bonus = bonus
            
            total_reward = base_reward * tier_multiplier * applicable_bonus
            
            return {
                'current_streak': engagement_streak,
                'base_reward': base_reward,
                'tier_multiplier': tier_multiplier,
                'streak_bonus': applicable_bonus,
                'total_reward': total_reward,
                'next_milestone': self._get_next_streak_milestone(engagement_streak),
                'currency': 'BEACON'
            }
            
        except Exception as e:
            logger.error(f"Error creating reward progression: {e}")
            return {'total_reward': 5.0, 'currency': 'BEACON'}
    
    def _estimate_improvement_time(self, skill_gap: float) -> int:
        """Estimate time to improve a skill (in days)."""
        try:
            # Rough estimation: 1 day per 2 points of improvement
            return max(7, int(skill_gap / 2))  # Minimum 1 week
        except Exception as e:
            logger.error(f"Error estimating improvement time: {e}")
            return 14
    
    def _create_weekly_goals(self, improvement_area: Dict) -> List[Dict]:
        """Create weekly goals for skill improvement."""
        try:
            gap = improvement_area['gap']
            weeks_needed = max(1, int(gap / 5))  # 5 points per week
            
            goals = []
            for week in range(1, weeks_needed + 1):
                target_improvement = min(5, gap - (week - 1) * 5)
                goals.append({
                    'week': week,
                    'target_improvement': target_improvement,
                    'target_score': improvement_area['current_score'] + (week * 5),
                    'focus_areas': [improvement_area['skill']]
                })
            
            return goals
            
        except Exception as e:
            logger.error(f"Error creating weekly goals: {e}")
            return []
    
    def _create_progress_milestones(self, improvement_area: Dict) -> List[Dict]:
        """Create progress milestones for skill improvement."""
        try:
            current_score = improvement_area['current_score']
            target_score = improvement_area['target_score']
            gap = improvement_area['gap']
            
            milestones = []
            milestone_count = 5
            
            for i in range(1, milestone_count + 1):
                milestone_score = current_score + (gap * i / milestone_count)
                milestones.append({
                    'milestone': i,
                    'target_score': milestone_score,
                    'description': f"Reach {milestone_score:.0f} in {improvement_area['skill']}",
                    'reward': 2.0 * i  # Increasing rewards
                })
            
            return milestones
            
        except Exception as e:
            logger.error(f"Error creating progress milestones: {e}")
            return []
    
    def _get_error_suggestion(self, error_type: str) -> str:
        """Get improvement suggestion for error type."""
        suggestions = {
            'form_error': 'Focus on proper technique and form',
            'timing_error': 'Work on timing and rhythm',
            'decision_error': 'Improve game awareness and decision making',
            'physical_error': 'Build strength and conditioning',
            'mental_error': 'Practice under pressure and stay focused'
        }
        
        return suggestions.get(error_type, 'Focus on fundamentals and practice consistently')
    
    def _get_next_streak_milestone(self, current_streak: int) -> Dict:
        """Get next streak milestone information."""
        milestones = [3, 5, 7, 10, 15, 20, 30]
        
        for milestone in milestones:
            if current_streak < milestone:
                return {
                    'days_needed': milestone - current_streak,
                    'milestone': milestone,
                    'bonus_multiplier': 1.0 + (milestone * 0.1)
                }
        
        return {
            'days_needed': 0,
            'milestone': current_streak,
            'bonus_multiplier': 1.0 + (current_streak * 0.1)
        }

# Example usage
async def main():
    """Example usage of the AI coaching engine."""
    engine = AICoachingEngine()
    
    # Generate coaching recommendations
    recommendations = await engine.get_coaching_recommendations(
        player_id="player123",
        sport="basketball",
        subscription_tier="premium"
    )
    
    print("Coaching Recommendations:", json.dumps(recommendations, indent=2))

if __name__ == "__main__":
    asyncio.run(main()) 