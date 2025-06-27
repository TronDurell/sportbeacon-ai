from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import openai
import json
import logging
from .player_progress_tracker import PlayerProgressTracker
from .drill_recommendation_engine import DrillRecommendationEngine
from .workout_partner import WorkoutPartner, WorkoutType, DietaryPreference, FitnessGoal
from services.response_cache import ResponseCache
import redis
from services.llm_service import LLMService

class CoachAssistantEngine:
    def __init__(self, config: Dict, progress_tracker, drill_engine):
        self.config = config
        self.progress_tracker = progress_tracker
        self.drill_engine = drill_engine
        self.workout_partner = WorkoutPartner()
        
        # Initialize response templates
        self.response_templates = {
            'improvement': [
                "Based on your {stat} performance, try focusing on {drill_type} drills. {specific_advice}",
                "I notice your {stat} could use some work. Consider {drill_type} to improve. {specific_advice}",
                "To boost your {stat}, I recommend {drill_type}. {specific_advice}"
            ],
            'strength': [
                "Your {stat} is looking strong! Keep it up with {drill_type}. {specific_advice}",
                "Great work on {stat}! To maintain this, continue with {drill_type}. {specific_advice}",
                "You're excelling at {stat}. Let's build on this with {drill_type}. {specific_advice}"
            ],
            'workout': [
                "I've created a {duration}-minute {type} workout focused on {goal}. {details}",
                "Here's your personalized {type} workout for today, targeting {goal}. {details}",
                "Ready for your workout? I've prepared a {duration}-minute {type} session for {goal}. {details}"
            ],
            'meal': [
                "Here's your {preference} meal plan for today. {details}",
                "I've prepared a {preference} meal plan to support your {goal}. {details}",
                "Based on your preferences, here's your daily meal plan. {details}"
            ],
            'location': [
                "I found {count} great spots nearby for your {type} workout. {details}",
                "Here are {count} recommended locations for your workout. {details}",
                "Check out these {count} venues perfect for your {type} session. {details}"
            ]
        }

        # Initialize Redis client and response cache
        redis_client = redis.Redis(
            host=config.get('redis_host', 'localhost'),
            port=config.get('redis_port', 6379),
            db=config.get('redis_db', 0),
            decode_responses=True
        )
        self.response_cache = ResponseCache(redis_client)
        
        # Initialize LLM service
        self.llm_service = LLMService(config, self.response_cache)

    def analyze_performance(self, player_id: str) -> Dict[str, Dict[str, float]]:
        """Analyzes player performance across different metrics."""
        recent_stats = self.progress_tracker.get_recent_stats(player_id, days=30)
        previous_stats = self.progress_tracker.get_recent_stats(player_id, days=60, end_days=30)
        
        analysis = {
            'trends': {},
            'strengths': [],
            'weaknesses': []
        }
        
        # Calculate trends
        for stat, current in recent_stats.items():
            if stat in previous_stats:
                change = ((current - previous_stats[stat]) / previous_stats[stat]) * 100
                analysis['trends'][stat] = change
                
                # Classify as strength or weakness
                if change > 10:
                    analysis['strengths'].append(stat)
                elif change < -5:
                    analysis['weaknesses'].append(stat)
        
        return analysis

    def get_specific_advice(self, stat: str, trend: float) -> Tuple[str, str]:
        """Returns specific advice and drill type based on the stat and its trend."""
        advice_map = {
            'shooting_percentage': (
                "shooting",
                "Focus on form shooting and game-speed repetitions"
            ),
            'assists': (
                "playmaking",
                "Work on court vision and decision-making drills"
            ),
            'rebounds': (
                "positioning",
                "Practice box-out techniques and timing drills"
            ),
            'steals': (
                "defensive",
                "Improve defensive footwork and anticipation"
            ),
            'blocks': (
                "defensive",
                "Work on timing and vertical leap training"
            ),
            'turnovers': (
                "ball_handling",
                "Focus on ball security and decision-making under pressure"
            )
        }
        
        return advice_map.get(stat, ("general", "Keep working on fundamentals"))

    async def generate_response(
        self,
        player_id: str,
        question: str,
        context: Optional[Dict] = None
    ) -> str:
        """Generate a response to a player's question, using cache when possible."""
        # Try to get cached response first
        cached_response = self.response_cache.get_cached_response(
            player_id,
            question,
            context
        )
        
        if cached_response:
            logger.info(f"Using cached response for player {player_id}")
            return cached_response

        # Get similar questions for context enhancement
        similar_questions = self.response_cache.get_similar_questions(
            player_id,
            question
        )
        
        if similar_questions:
            # Enhance context with similar questions
            context = context or {}
            context['similar_questions'] = [
                q['question'] for q in similar_questions[:2]
            ]

        # Generate new response
        response = await self._generate_llm_response(question, context)
        
        # Cache the new response
        self.response_cache.cache_response(
            player_id,
            question,
            response,
            context
        )
        
        return response

    def invalidate_player_cache(self, player_id: str) -> None:
        """Invalidate all cached responses for a player."""
        self.response_cache.invalidate_cache(player_id)

    def get_popular_questions(
        self,
        player_id: str,
        days: int = 7
    ) -> list:
        """Get frequently asked questions for a player."""
        return self.response_cache.get_popular_questions(
            player_id,
            timedelta(days=days)
        )

    def _handle_workout_question(self, player_id: str, question: str) -> str:
        """Handle workout-related questions and generate workout plans."""
        # Extract workout preferences from question and player history
        preferences = self._extract_workout_preferences(player_id, question)
        
        # Generate workout plan
        workout_plan = self.workout_partner.generate_daily_workout(
            fitness_goal=preferences['goal'],
            workout_type=preferences['type'],
            time_available=preferences['duration'],
            equipment_access=preferences['equipment']
        )

        # Format response
        exercise_details = "\n".join([
            f"- {ex.name}: {ex.sets}x{ex.reps if ex.reps else f'{ex.duration}s'}"
            for ex in workout_plan['workout_plan']['exercises']
        ])

        response = self._format_response(
            'workout',
            duration=preferences['duration'],
            type=preferences['type'].value,
            goal=preferences['goal'].value,
            details=f"\n{exercise_details}\n\nEstimated calories: {workout_plan['workout_plan']['estimated_calories']}"
        )

        return response

    def _handle_meal_question(self, player_id: str, question: str) -> str:
        """Handle meal-related questions and generate meal plans."""
        # Extract dietary preferences from question and player history
        preferences = self._extract_dietary_preferences(player_id, question)
        
        # Generate meal plan
        meal_plan = self.workout_partner.generate_meal_plan(
            dietary_preference=preferences['preference'],
            calorie_target=preferences['calories'],
            include_snacks=preferences['include_snacks']
        )

        # Format response
        meal_details = []
        for meal_type, meal in meal_plan['meal_plan'].items():
            if meal:
                meal_details.append(f"{meal_type.title()}: {meal.name} ({meal.calories} cal)")

        macros = meal_plan['macros']
        macro_details = f"\nMacros: {macros['protein']}g protein, {macros['carbs']}g carbs, {macros['fats']}g fats"
        water = f"\nRecommended water intake: {meal_plan['water_intake_ml']/1000:.1f}L"

        response = self._format_response(
            'meal',
            preference=preferences['preference'].value,
            goal=preferences['goal'],
            details=f"\n" + "\n".join(meal_details) + macro_details + water
        )

        return response

    def _handle_location_question(self, player_id: str, question: str) -> str:
        """Handle location-related questions and suggest workout venues."""
        # Extract location preferences from question
        preferences = self._extract_location_preferences(player_id, question)
        
        # Get venue suggestions
        venues = self.workout_partner.suggest_workout_location(
            user_lat=preferences['latitude'],
            user_lng=preferences['longitude'],
            workout_type=preferences['type'],
            required_equipment=preferences['equipment']
        )

        # Format response
        venue_details = []
        for venue in venues:
            distance_km = venue['distance'] / 1000
            venue_details.append(
                f"- {venue['name']} ({distance_km:.1f}km)\n"
                f"  Equipment: {', '.join(venue['equipment'])}\n"
                f"  Rating: {venue['rating']}/5.0"
            )

        response = self._format_response(
            'location',
            count=len(venues),
            type=preferences['type'].value,
            details=f"\n" + "\n".join(venue_details)
        )

        return response

    def _handle_performance_question(self, player_id: str, question: str) -> str:
        """Handle performance-related questions using existing logic."""
        # Existing performance question handling logic
        analysis = self.analyze_performance(player_id)
        return self._generate_performance_response(analysis, question)

    def _extract_workout_preferences(self, player_id: str, question: str) -> Dict:
        """Extract workout preferences from question and player history."""
        # Default preferences
        preferences = {
            'goal': FitnessGoal.ATHLETIC_PERFORMANCE,
            'type': WorkoutType.CALISTHENICS,
            'duration': 45,  # minutes
            'equipment': []
        }

        # Extract from question
        if "strength" in question.lower():
            preferences['goal'] = FitnessGoal.STRENGTH
        elif "endurance" in question.lower():
            preferences['goal'] = FitnessGoal.ENDURANCE
        elif "weight loss" in question.lower():
            preferences['goal'] = FitnessGoal.WEIGHT_LOSS

        if "gym" in question.lower():
            preferences['type'] = WorkoutType.GYM_BASED
        elif "hiit" in question.lower():
            preferences['type'] = WorkoutType.HIIT

        # TODO: Extract more preferences from player history

        return preferences

    def _extract_dietary_preferences(self, player_id: str, question: str) -> Dict:
        """Extract dietary preferences from question and player history."""
        # Default preferences
        preferences = {
            'preference': DietaryPreference.BALANCED,
            'calories': 2000,
            'include_snacks': True,
            'goal': 'performance'
        }

        # Extract from question
        if "vegetarian" in question.lower() or "plant" in question.lower():
            preferences['preference'] = DietaryPreference.PLANT_BASED
        elif "protein" in question.lower():
            preferences['preference'] = DietaryPreference.HIGH_PROTEIN
        elif "keto" in question.lower():
            preferences['preference'] = DietaryPreference.KETO

        # TODO: Extract more preferences from player history

        return preferences

    def _extract_location_preferences(self, player_id: str, question: str) -> Dict:
        """Extract location preferences from question."""
        # Default preferences
        preferences = {
            'latitude': 40.7128,  # NYC default
            'longitude': -74.0060,
            'type': WorkoutType.CALISTHENICS,
            'equipment': []
        }

        # TODO: Get actual user location from their profile or device

        # Extract from question
        if "gym" in question.lower():
            preferences['type'] = WorkoutType.GYM_BASED
        elif "park" in question.lower():
            preferences['type'] = WorkoutType.CALISTHENICS

        if "weights" in question.lower():
            preferences['equipment'].append("weights")
        if "pull-up" in question.lower():
            preferences['equipment'].append("pull-up bar")

        return preferences

    def _format_response(self, template_type: str, **kwargs) -> str:
        """Format response using templates."""
        import random
        template = random.choice(self.response_templates[template_type])
        return template.format(**kwargs)

    def get_recommended_focus_areas(self, player_id: str) -> List[Dict[str, str]]:
        """Returns recommended focus areas based on recent performance."""
        analysis = self.analyze_performance(player_id)
        recommendations = []
        
        for weakness in analysis['weaknesses']:
            drill_type, advice = self.get_specific_advice(weakness, analysis['trends'][weakness])
            recommendations.append({
                'area': weakness,
                'drill_type': drill_type,
                'advice': advice,
                'priority': 'high' if analysis['trends'][weakness] < -10 else 'medium'
            })
        
        return recommendations

    def generate_weekly_focus(self, player_id: str) -> Dict[str, any]:
        """Generates a weekly focus plan based on performance analysis."""
        recommendations = self.get_recommended_focus_areas(player_id)
        drills = self.drill_engine.generate_weekly_schedule(player_id)
        
        return {
            'focus_areas': recommendations,
            'recommended_drills': drills,
            'notes': self._generate_focus_notes(recommendations)
        }

    def _generate_focus_notes(self, recommendations: List[Dict[str, str]]) -> str:
        """Generates focused training notes based on recommendations."""
        if not recommendations:
            return "Maintain current training routine and focus on overall skill development."
        
        priority_areas = [r for r in recommendations if r['priority'] == 'high']
        notes = []
        
        if priority_areas:
            areas = ', '.join([r['area'].replace('_', ' ').title() for r in priority_areas])
            notes.append(f"Priority focus areas: {areas}")
            
            for area in priority_areas:
                notes.append(f"- {area['advice']}")
        
        return '\n'.join(notes)

    async def _generate_llm_response(
        self,
        question: str,
        context: Optional[Dict] = None
    ) -> str:
        """Generate an AI coach response using the LLM service."""
        try:
            # Get player ID from context
            player_id = context.get('player_id') if context else None
            if not player_id:
                return "Error: Player context is required"

            # Build enhanced context
            enhanced_context = self._build_response_context(player_id, context)
            
            # Generate response using LLM service
            response = await self.llm_service.generate_coach_response(
                player_id,
                question,
                enhanced_context
            )
            
            return response

        except Exception as e:
            logger.error(f"Error in _generate_llm_response: {str(e)}")
            return "I encountered an error while processing your question. Please try again."

    def _build_response_context(self, player_id: str, base_context: Optional[Dict] = None) -> Dict:
        """Build comprehensive context for LLM response generation."""
        context = base_context or {}
        
        try:
            # Get player progression data
            progression_data = self.progress_tracker.get_progression_summary(player_id)
            context['progression'] = {
                'level': progression_data['level'],
                'tier': progression_data['tier'],
                'xp': progression_data['xp'],
                'next_tier': progression_data.get('next_tier')
            }

            # Get recent performance data
            recent_stats = self.progress_tracker.get_recent_stats(player_id)
            context['recent_performance'] = recent_stats

            # Get active challenges
            active_challenges = self.progress_tracker.get_active_challenges(player_id)
            context['active_challenges'] = active_challenges

            # Get recommended focus areas
            focus_areas = self.drill_engine.get_recommended_focus_areas(player_id)
            context['focus_areas'] = focus_areas

            # Get health/recovery status if available
            health_status = self.progress_tracker.get_health_status(player_id)
            if health_status:
                context['health_status'] = health_status

            # Get recent XP gains
            recent_xp = self.progress_tracker.get_recent_xp(
                player_id,
                timeframe=timedelta(days=1)
            )
            context['recent_xp'] = recent_xp

            # Add conversation history if available
            if base_context and base_context.get('conversation_history'):
                context['conversation_history'] = base_context['conversation_history']

        except Exception as e:
            logger.error(f"Error building response context: {str(e)}")

        return context 