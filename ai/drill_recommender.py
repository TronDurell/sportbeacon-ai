from typing import List, Dict, Optional, Tuple, Any
import numpy as np
import random
from datetime import datetime, timedelta
from pydantic import BaseModel

# Import backend models to avoid conflicts
from backend.models import (
    DrillInfo,
    DrillRecommendationRequest,
    DrillRecommendationResponse,
    DrillScheduleRequest,
    DrillScheduleResponse,
    DifficultyLevel,
    TrainingFormat
)

class DrillRecommendation(BaseModel):
    drill: DrillInfo
    relevance_score: float
    reasoning: str

class DrillRecommendationEngine:
    def __init__(self):
        # Initialize with comprehensive drill database
        self.drills_db = self._create_drill_database()
        self.difficulty_scores = {
            'Beginner': 1,
            'Intermediate': 2,
            'Advanced': 3
        }
        self.intensity_progression = {
            'monday': 'Medium',
            'tuesday': 'High',
            'wednesday': 'Low',
            'thursday': 'High',
            'friday': 'Medium',
            'saturday': 'Low',
            'sunday': 'Rest'
        }
        
        # Skill area mappings
        self.skill_to_drill_areas = {
            'scoring': ['scoring', 'shooting_efficiency'],
            'playmaking': ['playmaking'],
            'rebounding': ['rebounding'],
            'defense': ['defense'],
            'shooting_efficiency': ['scoring', 'shooting_efficiency'],
            'three_point_shooting': ['scoring', 'three_point_shooting'],
            'shot_blocking': ['shot_blocking']
        }
        
    def _create_drill_database(self) -> List[DrillInfo]:
        """Create a comprehensive database of basketball drills."""
        return [
            # Scoring Drills
            DrillInfo(
                id="scoring_basic",
                name="Basic Shooting Form",
                description="Practice proper shooting mechanics and form",
                difficulty=DifficultyLevel.BEGINNER,
                difficulty_level=0.2,
                duration=20,
                intensity=0.4,
                requires_gym=False,
                equipment_needed=["Basketball", "Hoop"],
                target_skills=["scoring", "shooting_efficiency"],
                training_format=TrainingFormat.SOLO,
                video_url=None
            ),
            DrillInfo(
                id="scoring_advanced",
                name="Game-Speed Scoring",
                description="High-intensity scoring drills with defenders",
                difficulty=DifficultyLevel.ADVANCED,
                difficulty_level=0.8,
                duration=30,
                intensity=0.9,
                requires_gym=True,
                equipment_needed=["Basketball", "Defenders", "Shot Clock"],
                target_skills=["scoring", "three_point_shooting"],
                training_format=TrainingFormat.GROUP,
                video_url=None
            ),
            
            # Playmaking Drills
            DrillInfo(
                id="playmaking_basic",
                name="Passing Fundamentals",
                description="Practice basic passing techniques",
                difficulty=DifficultyLevel.BEGINNER,
                difficulty_level=0.3,
                duration=15,
                intensity=0.3,
                requires_gym=False,
                equipment_needed=["Basketball", "Partner"],
                target_skills=["playmaking"],
                training_format=TrainingFormat.PARTNER,
                video_url=None
            ),
            DrillInfo(
                id="playmaking_intermediate",
                name="Pick and Roll Practice",
                description="Practice pick and roll scenarios",
                difficulty=DifficultyLevel.INTERMEDIATE,
                difficulty_level=0.6,
                duration=25,
                intensity=0.6,
                requires_gym=False,
                equipment_needed=["Basketball", "Cones", "Partner"],
                target_skills=["playmaking"],
                training_format=TrainingFormat.PARTNER,
                video_url=None
            ),
            
            # Rebounding Drills
            DrillInfo(
                id="rebounding_basic",
                name="Box-Out Basics",
                description="Learn proper box-out positioning",
                difficulty=DifficultyLevel.BEGINNER,
                difficulty_level=0.2,
                duration=15,
                intensity=0.3,
                requires_gym=False,
                equipment_needed=["Basketball", "Cones"],
                target_skills=["rebounding"],
                training_format=TrainingFormat.SOLO,
                video_url=None
            ),
            
            # Defense Drills
            DrillInfo(
                id="defense_basic",
                name="Defensive Stance",
                description="Practice proper defensive positioning and footwork",
                difficulty=DifficultyLevel.BEGINNER,
                difficulty_level=0.3,
                duration=20,
                intensity=0.5,
                requires_gym=False,
                equipment_needed=["Basketball", "Cones"],
                target_skills=["defense"],
                training_format=TrainingFormat.SOLO,
                video_url=None
            ),
            
            # Shot Blocking Drills
            DrillInfo(
                id="blocking_basic",
                name="Timing and Positioning",
                description="Practice shot blocking timing and positioning",
                difficulty=DifficultyLevel.INTERMEDIATE,
                difficulty_level=0.7,
                duration=25,
                intensity=0.7,
                requires_gym=True,
                equipment_needed=["Basketball", "Partner"],
                target_skills=["shot_blocking"],
                training_format=TrainingFormat.PARTNER,
                video_url=None
            )
        ]
    
    def create_weekly_schedule(self, player_skills: List[str], growth_areas: List[str], 
                             available_days: List[str] = None) -> Dict[str, List[DrillInfo]]:
        """Create a balanced weekly training schedule."""
        if available_days is None:
            available_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        
        schedule = {}
        
        for day in available_days:
            if day == 'sunday':
                schedule[day] = []  # Rest day
                continue
                
            # Get appropriate drills for this day
            day_drills = self._get_drills_for_day(day, player_skills, growth_areas)
            
            # Limit drills per day (2-3 drills)
            max_drills = 3 if day in ['tuesday', 'thursday'] else 2
            day_drills = day_drills[:max_drills]
            
            schedule[day] = day_drills
        
        return schedule
    
    def get_recommendations(self, player_skills: List[str], growth_areas: List[str], 
                          skill_levels: Dict[str, float], max_recommendations: int = 5) -> List[DrillRecommendation]:
        """Get personalized drill recommendations based on player needs."""
        recommendations = []
        
        # Map skill areas to drill areas
        target_areas = set()
        for skill in growth_areas:
            if skill in self.skill_to_drill_areas:
                target_areas.update(self.skill_to_drill_areas[skill])
        
        # If no specific areas, use all growth areas
        if not target_areas:
            target_areas = set(growth_areas)
        
        # Filter and score drills
        for drill in self.drills_db:
            # Check if drill targets any of the growth areas
            drill_targets_growth = any(skill in drill.target_skills for skill in growth_areas)
            if drill_targets_growth:
                relevance_score = self._calculate_relevance_score(drill, skill_levels, growth_areas)
                
                recommendation = DrillRecommendation(
                    drill=drill,
                    relevance_score=relevance_score,
                    reasoning=self._generate_reasoning(drill, growth_areas, skill_levels)
                )
                recommendations.append(recommendation)
        
        # Sort by relevance and limit results
        recommendations.sort(key=lambda x: x.relevance_score, reverse=True)
        return recommendations[:max_recommendations]
    
    def format_recommendations_for_display(self, recommendations: List[DrillRecommendation]) -> Dict[str, Any]:
        """Format drill recommendations for user interface display."""
        if not recommendations:
            return {
                "message": "No drills found for your current skill level and goals.",
                "recommendations": [],
                "summary": {}
            }
        
        # Group by difficulty
        by_difficulty = {"BEGINNER": [], "INTERMEDIATE": [], "ADVANCED": []}
        for rec in recommendations:
            difficulty_name = rec.drill.difficulty.name if hasattr(rec.drill.difficulty, 'name') else str(rec.drill.difficulty)
            if difficulty_name in by_difficulty:
                by_difficulty[difficulty_name].append(rec)
            else:
                # Default to intermediate if difficulty not recognized
                by_difficulty["INTERMEDIATE"].append(rec)
        
        # Calculate summary statistics
        total_duration = sum(rec.drill.duration for rec in recommendations)
        avg_relevance = sum(rec.relevance_score for rec in recommendations) / len(recommendations)
        
        # Format for display
        formatted_recommendations = []
        for rec in recommendations:
            formatted_recommendations.append({
                "name": rec.drill.name,
                "target_skills": rec.drill.target_skills,
                "difficulty": rec.drill.difficulty.name if hasattr(rec.drill.difficulty, 'name') else str(rec.drill.difficulty),
                "duration": f"{rec.drill.duration} minutes",
                "description": rec.drill.description,
                "equipment": ", ".join(rec.drill.equipment_needed),
                "relevance_score": f"{rec.relevance_score:.2f}",
                "reasoning": rec.reasoning,
                "requires_gym": rec.drill.requires_gym,
                "intensity": f"{rec.drill.intensity:.1f}"
            })
        
        return {
            "recommendations": formatted_recommendations,
            "summary": {
                "total_drills": len(recommendations),
                "total_duration_minutes": total_duration,
                "total_duration_hours": round(total_duration / 60, 1),
                "average_relevance": round(avg_relevance, 2),
                "by_difficulty": {
                    difficulty: len(drills) for difficulty, drills in by_difficulty.items()
                }
            }
        }
    
    def _get_drills_for_day(self, day: str, player_skills: List[str], growth_areas: List[str]) -> List[DrillInfo]:
        """Get appropriate drills for a specific day."""
        target_intensity = self.intensity_progression.get(day.lower(), 'Medium')
        
        # Get drills that match growth areas and intensity
        suitable_drills = []
        for drill in self.drills_db:
            drill_targets_growth = any(skill in drill.target_skills for skill in growth_areas)
            if drill_targets_growth and drill.intensity >= 0.6:  # High intensity
                suitable_drills.append(drill)
        
        # If no exact intensity match, get any drills for growth areas
        if not suitable_drills:
            for drill in self.drills_db:
                drill_targets_growth = any(skill in drill.target_skills for skill in growth_areas)
                if drill_targets_growth:
                    suitable_drills.append(drill)
        
        # Randomize order for variety
        random.shuffle(suitable_drills)
        return suitable_drills
    
    def _calculate_relevance_score(self, drill: DrillInfo, skill_levels: Dict[str, float], 
                                 growth_areas: List[str]) -> float:
        """Calculate how relevant a drill is based on current skill levels and growth areas."""
        base_score = 0.5
        
        # Higher relevance if drill targets growth areas
        drill_targets_growth = any(skill in drill.target_skills for skill in growth_areas)
        if drill_targets_growth:
            base_score += 0.3
        
        # Adjust based on skill level (lower skill = higher relevance)
        for skill in drill.target_skills:
            if skill in skill_levels:
                skill_level = skill_levels[skill]
                if skill_level < 0.3:  # Low skill level
                    base_score += 0.2
                elif skill_level > 0.7:  # High skill level
                    base_score -= 0.1
        
        # Adjust based on difficulty
        difficulty_value = drill.difficulty.value if hasattr(drill.difficulty, 'value') else drill.difficulty_level
        if difficulty_value <= 0.3:  # Beginner
            base_score += 0.1
        elif difficulty_value >= 0.7:  # Advanced
            base_score -= 0.1
        
        return min(1.0, max(0.0, base_score))
    
    def _generate_reasoning(self, drill: DrillInfo, growth_areas: List[str], 
                          skill_levels: Dict[str, float]) -> str:
        """Generate reasoning for why a drill is recommended."""
        reasons = []
        
        drill_targets_growth = any(skill in drill.target_skills for skill in growth_areas)
        if drill_targets_growth:
            reasons.append(f"Targets {', '.join(drill.target_skills)} improvement")
        
        for skill in drill.target_skills:
            if skill in skill_levels:
                skill_level = skill_levels[skill]
                if skill_level < 0.3:
                    reasons.append("Perfect for building fundamentals")
                elif skill_level < 0.6:
                    reasons.append("Great for skill development")
                else:
                    reasons.append("Excellent for advanced practice")
        
        difficulty_name = drill.difficulty.name if hasattr(drill.difficulty, 'name') else str(drill.difficulty)
        if difficulty_name == "BEGINNER":
            reasons.append("Suitable for all skill levels")
        elif difficulty_name == "ADVANCED":
            reasons.append("Challenging advanced drill")
        
        if drill.intensity >= 0.7:
            reasons.append("High-intensity training")
        elif drill.intensity <= 0.3:
            reasons.append("Low-impact skill work")
        
        return ". ".join(reasons) if reasons else f"Good {', '.join(drill.target_skills)} practice drill"
    
    def recommend_drills(self, request: DrillRecommendationRequest) -> DrillRecommendationResponse:
        """Recommend drills based on player profile and growth areas."""
        drill_recommendations = self.get_recommendations(
            request.top_skills,
            request.growth_areas,
            request.skill_levels,
            request.max_recommendations
        )
        
        # Convert DrillRecommendation objects to DrillInfo objects
        recommended_drills = [rec.drill for rec in drill_recommendations]
        
        # Generate training notes
        training_notes = []
        for rec in drill_recommendations:
            training_notes.append(rec.reasoning)
        
        return DrillRecommendationResponse(
            player_id=request.user_id,  # Use user_id as player_id
            recommended_drills=recommended_drills,
            training_notes=training_notes
        )

    def create_training_schedule(self, request: DrillScheduleRequest) -> DrillScheduleResponse:
        """Create a weekly training schedule based on player needs."""
        schedule = self.create_weekly_schedule(
            request.growth_areas,  # Use growth_areas instead of top_skills
            request.growth_areas,
            request.available_days
        )
        
        # Calculate totals
        total_drills = sum(len(drills) for drills in schedule.values())
        total_duration = sum(
            sum(drill.duration for drill in drills) 
            for drills in schedule.values()
        )
        weekly_hours = total_duration / 60
        
        return DrillScheduleResponse(
            user_id=request.user_id,
            weekly_schedule=schedule,
            total_duration=total_duration,
            skill_coverage={},  # Placeholder
            intensity_distribution={},  # Placeholder
            training_notes="Weekly training schedule created successfully"
        ) 