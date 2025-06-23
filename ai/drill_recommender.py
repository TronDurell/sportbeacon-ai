from typing import List, Dict, Optional, Tuple
import numpy as np
import random
from datetime import datetime, timedelta
from backend.models import (
    DrillInfo,
    DrillRecommendation,
    DrillRecommendationRequest,
    DrillRecommendationResponse,
    DrillScheduleRequest,
    DrillScheduleResponse,
    WeeklyTrainingSchedule,
    DailySchedule,
    ScheduledDrill
)

class DrillRecommendationEngine:
    def __init__(self):
        # Initialize with mock drill database
        self.drills_db = self._create_mock_drills()
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
        
    def _create_mock_drills(self) -> List[DrillInfo]:
        """Create an expanded mock database of basketball drills."""
        return [
            DrillInfo(
                area="rebounds",
                name="Box-Out Basics",
                difficulty="Beginner",
                description="Learn proper box-out positioning and timing for rebounds",
                duration_minutes=15,
                equipment=["Basketball", "Cones"],
                key_points=[
                    "Keep your body between opponent and basket",
                    "Maintain low center of gravity",
                    "Use arms to create space legally"
                ],
                requires_gym=False,
                intensity="Low",
                recommended_time_of_day=["Morning", "Afternoon"]
            ),
            DrillInfo(
                area="rebounds",
                name="Rebound Battle Circuit",
                difficulty="Advanced",
                description="High-intensity rebound competition with multiple players",
                duration_minutes=20,
                equipment=["Basketball", "Rebounding Machine"],
                key_points=[
                    "Quick reactions to ball trajectory",
                    "Strong two-handed grabs",
                    "Immediate outlet passes"
                ],
                requires_gym=True,
                intensity="High",
                recommended_time_of_day=["Afternoon"]
            ),
            DrillInfo(
                area="assists",
                name="Pick and Roll Mastery",
                difficulty="Intermediate",
                description="Practice pick and roll scenarios with emphasis on passing",
                duration_minutes=25,
                equipment=["Basketball", "Cones"],
                key_points=[
                    "Timing of the screen",
                    "Reading defender position",
                    "Accurate pocket passes"
                ]
            ),
            DrillInfo(
                area="field_goal_percentage",
                name="Spot Shooting Circuit",
                difficulty="Advanced",
                description="High-volume shooting from multiple court positions",
                duration_minutes=30,
                equipment=["Basketball", "Shot Clock", "Cones"],
                key_points=[
                    "Consistent form",
                    "Quick release",
                    "Game-speed movement"
                ],
                video_url="https://example.com/drills/spot-shooting"
            ),
            DrillInfo(
                area="steals",
                name="Deflection Line Drill",
                difficulty="Intermediate",
                description="Practice anticipating and deflecting passes",
                duration_minutes=20,
                equipment=["Basketball"],
                key_points=[
                    "Active hands",
                    "Quick lateral movement",
                    "Reading passing lanes"
                ]
            ),
            # Add more drills for each skill area...
        ]
        
    def _calculate_drill_relevance(
        self,
        drill: DrillInfo,
        request: DrillScheduleRequest,
        day_intensity: str
    ) -> float:
        """Calculate how relevant a drill is for a player's needs and schedule."""
        # Base relevance calculation
        base_relevance = 2.0 if drill.area in request.growth_areas else 0.5
        
        # Adjust for skill level
        if drill.area in request.skill_levels:
            skill_level = request.skill_levels[drill.area]
            if drill.difficulty == 'Beginner':
                base_relevance *= (1.5 - skill_level)
            elif drill.difficulty == 'Advanced':
                base_relevance *= skill_level
        
        # Adjust for intensity match
        if drill.intensity == day_intensity:
            base_relevance *= 1.2
            
        # Adjust for gym access
        if drill.requires_gym and not request.gym_access:
            base_relevance *= 0.1
            
        return min(1.0, base_relevance / 2.0)
        
    def _create_daily_schedule(
        self,
        available_drills: List[Tuple[DrillInfo, float]],
        max_duration: int,
        max_drills: int,
        day_intensity: str,
        gym_access: bool
    ) -> DailySchedule:
        """Create a balanced daily training schedule."""
        selected_drills = []
        total_duration = 0
        all_equipment = set()
        
        # Sort by relevance and randomize within relevance groups
        grouped_drills = {}
        for drill, relevance in available_drills:
            key = round(relevance * 10)  # Group by relevance rounded to 1 decimal
            if key not in grouped_drills:
                grouped_drills[key] = []
            grouped_drills[key].append((drill, relevance))
            
        # Select drills ensuring variety and time constraints
        for relevance_group in sorted(grouped_drills.keys(), reverse=True):
            drills = grouped_drills[relevance_group]
            random.shuffle(drills)
            
            for drill, relevance in drills:
                if len(selected_drills) >= max_drills:
                    break
                    
                if total_duration + drill.duration_minutes <= max_duration:
                    if not drill.requires_gym or gym_access:
                        scheduled_drill = ScheduledDrill(
                            drill=drill,
                            duration_minutes=drill.duration_minutes,
                            equipment_needed=drill.equipment,
                            requires_gym=drill.requires_gym,
                            intensity=drill.intensity,
                            relevance_score=relevance
                        )
                        selected_drills.append(scheduled_drill)
                        total_duration += drill.duration_minutes
                        all_equipment.update(drill.equipment)
                        
        return DailySchedule(
            drills=selected_drills,
            total_duration=total_duration,
            equipment_needed=list(all_equipment),
            requires_gym=any(d.requires_gym for d in selected_drills),
            intensity_level=day_intensity
        )
        
    def create_weekly_schedule(
        self,
        request: DrillScheduleRequest
    ) -> DrillScheduleResponse:
        """Generate a personalized weekly training schedule."""
        # Filter drills by difficulty range
        min_diff_score = self.difficulty_scores[request.min_difficulty]
        max_diff_score = self.difficulty_scores[request.max_difficulty]
        
        eligible_drills = [
            drill for drill in self.drills_db
            if min_diff_score <= self.difficulty_scores[drill.difficulty] <= max_diff_score
        ]
        
        # Create daily schedules
        weekly_schedule = {}
        all_equipment = set()
        focus_areas = set()
        total_duration = 0
        
        for day in request.available_days:
            day_intensity = self.intensity_progression[day.lower()]
            
            # Calculate relevance scores for this day
            scored_drills = [
                (drill, self._calculate_drill_relevance(drill, request, day_intensity))
                for drill in eligible_drills
            ]
            
            # Create daily schedule
            daily_schedule = self._create_daily_schedule(
                scored_drills,
                request.max_duration_per_day,
                request.max_drills_per_day,
                day_intensity,
                request.gym_access
            )
            
            weekly_schedule[day.lower()] = daily_schedule
            all_equipment.update(daily_schedule.equipment_needed)
            focus_areas.update(d.drill.area for d in daily_schedule.drills)
            total_duration += daily_schedule.total_duration
            
        # Create the weekly training schedule
        schedule = WeeklyTrainingSchedule(
            monday=weekly_schedule.get('monday'),
            tuesday=weekly_schedule.get('tuesday'),
            wednesday=weekly_schedule.get('wednesday'),
            thursday=weekly_schedule.get('thursday'),
            friday=weekly_schedule.get('friday'),
            saturday=weekly_schedule.get('saturday'),
            sunday=weekly_schedule.get('sunday'),
            total_duration=total_duration,
            equipment_needed=list(all_equipment),
            focus_areas=list(focus_areas)
        )
        
        return DrillScheduleResponse(
            player_name=request.player_name,
            player_id=request.player_id,
            weekly_schedule=schedule,
            total_duration=total_duration,
            equipment_needed=list(all_equipment),
            focus_areas=list(focus_areas),
            notes=self._generate_schedule_notes(schedule, request)
        )
        
    def _generate_schedule_notes(
        self,
        schedule: WeeklyTrainingSchedule,
        request: DrillScheduleRequest
    ) -> str:
        """Generate helpful notes about the training schedule."""
        notes = []
        
        # Add intensity progression note
        notes.append("Schedule follows a high-low intensity pattern for optimal recovery.")
        
        # Add equipment notes
        if any(day and any(drill.requires_gym for drill in day.drills) 
               for day in [schedule.monday, schedule.tuesday, schedule.wednesday, 
                         schedule.thursday, schedule.friday, schedule.saturday, 
                         schedule.sunday] if day):
            notes.append("Some drills require gym access - plan accordingly.")
            
        # Add focus area notes
        notes.append(f"Primary focus areas: {', '.join(schedule.focus_areas)}")
        
        return "\n".join(notes)
        
    def format_schedule_for_display(
        self,
        response: DrillScheduleResponse,
        format_type: str = 'text'
    ) -> str:
        """Format the weekly schedule for different display contexts."""
        if format_type == 'text':
            return self._format_schedule_text(response)
        elif format_type == 'markdown':
            return self._format_schedule_markdown(response)
        elif format_type == 'html':
            return self._format_schedule_html(response)
        else:
            raise ValueError(f"Unsupported format type: {format_type}")
            
    def _format_schedule_text(self, response: DrillScheduleResponse) -> str:
        """Format schedule as plain text."""
        lines = [
            f"🏀 Weekly Training Plan for {response.player_name}",
            f"Total Duration: {response.total_duration} minutes\n"
        ]
        
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 
                'saturday', 'sunday']
        
        for day in days:
            schedule = getattr(response.weekly_schedule, day)
            if schedule and schedule.drills:
                lines.extend([
                    f"\n{day.title()} - {schedule.intensity_level} Intensity",
                    f"Duration: {schedule.total_duration} minutes"
                ])
                
                for i, drill in enumerate(schedule.drills, 1):
                    lines.extend([
                        f"\n{i}. {drill.drill.name}",
                        f"   Duration: {drill.duration_minutes} min",
                        f"   Equipment: {', '.join(drill.equipment_needed)}",
                        "   Key Points:",
                        *[f"   - {point}" for point in drill.drill.key_points]
                    ])
                    
        if response.notes:
            lines.extend(["\nNotes:", response.notes])
            
        return "\n".join(lines)
        
    def _format_schedule_markdown(self, response: DrillScheduleResponse) -> str:
        """Format schedule as markdown."""
        # Implementation similar to text but with markdown formatting
        pass
        
    def _format_schedule_html(self, response: DrillScheduleResponse) -> str:
        """Format schedule as HTML."""
        # Implementation for HTML formatting
        pass
        
    def format_recommendations_for_display(
        self,
        response: DrillRecommendationResponse,
        format_type: str = 'text'
    ) -> str:
        """Format drill recommendations for different display contexts."""
        if format_type == 'text':
            lines = [
                f"🏀 Training Plan for {response.player_name}",
                f"Total Duration: {response.total_duration_minutes} minutes\n",
                "Recommended Drills:",
            ]
            
            for i, drill in enumerate(response.recommended_drills, 1):
                lines.extend([
                    f"\n{i}. {drill.name} ({drill.difficulty})",
                    f"   Focus Area: {drill.area}",
                    f"   Duration: {drill.duration_minutes} minutes",
                    f"   Equipment: {', '.join(drill.equipment)}",
                    "   Key Points:",
                    *[f"   - {point}" for point in drill.key_points]
                ])
                
            lines.extend([
                f"\nRequired Equipment: {', '.join(response.equipment_needed)}",
                f"Focus Areas: {', '.join(response.focus_areas)}"
            ])
            
            return "\n".join(lines)
            
        elif format_type == 'markdown':
            lines = [
                f"# Training Plan for {response.player_name}",
                f"**Total Duration:** {response.total_duration_minutes} minutes\n",
                "## Recommended Drills"
            ]
            
            for drill in response.recommended_drills:
                lines.extend([
                    f"\n### {drill.name} ({drill.difficulty})",
                    f"- **Focus Area:** {drill.area}",
                    f"- **Duration:** {drill.duration_minutes} minutes",
                    f"- **Equipment:** {', '.join(drill.equipment)}",
                    "\n**Key Points:**",
                    *[f"- {point}" for point in drill.key_points]
                ])
                
            lines.extend([
                "\n## Equipment Needed",
                *[f"- {item}" for item in response.equipment_needed],
                "\n## Focus Areas",
                *[f"- {area}" for item in response.focus_areas]
            ])
            
            return "\n".join(lines)
            
        else:
            raise ValueError(f"Unsupported format type: {format_type}") 