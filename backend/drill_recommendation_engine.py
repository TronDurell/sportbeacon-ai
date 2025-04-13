from typing import List, Dict, Optional, Tuple
from .models import (
    DrillInfo, 
    DrillScheduleRequest,
    ExtendedDrillScheduleRequest,
    DrillScheduleResponse,
    DailySchedule,
    DifficultyLevel,
    TrainingFormat,
    WeeklyPerformance,
    DrillRecommendationRequest
)
import random
from datetime import datetime, timedelta
import markdown
import emoji
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from .progress_tracker import PlayerProgressTracker, DrillStatus

class DrillRecommendationEngine:
    def __init__(self):
        # Initialize with sample drills - in production, this would come from a database
        self.drills_database: List[DrillInfo] = []
        self.progress_tracker = PlayerProgressTracker()
        self._initialize_sample_drills()
        self.performance_history: Dict[str, List[WeeklyPerformance]] = {}

    def _initialize_sample_drills(self):
        # Sample drills for testing - in production, these would be loaded from a database
        sample_drills = [
            DrillInfo(
                name="Dribbling Figure 8",
                description="Practice dribbling in a figure 8 pattern between cones",
                difficulty=DifficultyLevel.BEGINNER,
                duration=15,
                equipment_needed=["basketball", "cones"],
                target_skills=["ball_handling", "coordination"],
                requires_gym=False,
                intensity=0.6,
                recommended_time_of_day="morning"
            ),
            DrillInfo(
                name="Shooting Form Practice",
                description="Focus on proper shooting form with close-range shots",
                difficulty=DifficultyLevel.BEGINNER,
                duration=20,
                equipment_needed=["basketball", "hoop"],
                target_skills=["shooting", "form"],
                requires_gym=True,
                intensity=0.4,
                recommended_time_of_day="any"
            ),
            DrillInfo(
                name="Full-Court Sprints",
                description="Alternating sprints with and without ball",
                difficulty=DifficultyLevel.ADVANCED,
                duration=15,
                equipment_needed=["basketball"],
                target_skills=["conditioning", "speed", "ball_handling"],
                requires_gym=True,
                intensity=0.9,
                recommended_time_of_day="morning"
            ),
            DrillInfo(
                name="Three-Point Circuit",
                description="Shooting from multiple three-point positions",
                difficulty=DifficultyLevel.ADVANCED,
                duration=25,
                equipment_needed=["basketball", "hoop"],
                target_skills=["shooting", "stamina"],
                requires_gym=True,
                intensity=0.7,
                recommended_time_of_day="any"
            ),
            DrillInfo(
                name="Defensive Slides",
                description="Practice defensive movement patterns",
                difficulty=DifficultyLevel.INTERMEDIATE,
                duration=10,
                equipment_needed=["cones"],
                target_skills=["defense", "agility"],
                requires_gym=False,
                intensity=0.8,
                recommended_time_of_day="any"
            ),
            DrillInfo(
                name="Free Throw Practice",
                description="Focus on free throw accuracy and routine",
                difficulty=DifficultyLevel.BEGINNER,
                duration=20,
                equipment_needed=["basketball", "hoop"],
                target_skills=["shooting", "concentration"],
                requires_gym=True,
                intensity=0.3,
                recommended_time_of_day="any"
            ),
            DrillInfo(
                name="Crossover Series",
                description="Practice various crossover dribbling moves",
                difficulty=DifficultyLevel.INTERMEDIATE,
                duration=15,
                equipment_needed=["basketball", "cones"],
                target_skills=["ball_handling", "agility"],
                requires_gym=False,
                intensity=0.6,
                recommended_time_of_day="any"
            ),
            DrillInfo(
                name="Box Jump Circuit",
                description="Plyometric exercises for explosive power",
                difficulty=DifficultyLevel.EXPERT,
                duration=20,
                equipment_needed=["plyo boxes"],
                target_skills=["vertical_jump", "power"],
                requires_gym=True,
                intensity=0.9,
                recommended_time_of_day="morning"
            ),
            DrillInfo(
                name="Pick and Roll Footwork",
                description="Practice proper footwork for pick and roll situations",
                difficulty=DifficultyLevel.ADVANCED,
                duration=25,
                equipment_needed=["basketball", "cones"],
                target_skills=["footwork", "basketball_iq"],
                requires_gym=True,
                intensity=0.5,
                recommended_time_of_day="any"
            ),
            DrillInfo(
                name="Ball Control Dribbling",
                description="Stationary dribbling drills focusing on control",
                difficulty=DifficultyLevel.BEGINNER,
                duration=10,
                equipment_needed=["basketball"],
                target_skills=["ball_handling", "control"],
                requires_gym=False,
                intensity=0.4,
                recommended_time_of_day="any"
            )
        ]
        self.drills_database.extend(sample_drills)

    def _calculate_drill_relevance(
        self,
        drill: DrillInfo,
        request: DrillRecommendationRequest,
        user_history: Dict[str, float]
    ) -> float:
        """Calculate how relevant a drill is based on user's needs and history."""
        base_score = 0.0
        
        # Consider skill levels and growth areas
        for skill in drill.target_skills:
            if skill in request.growth_areas:
                base_score += 2.0  # Higher weight for growth areas
            elif skill in request.top_skills:
                base_score += 0.5  # Lower weight for already strong skills
                
            # Consider skill level match
            skill_level = request.skill_levels.get(skill, 0.5)
            level_match = 1.0 - abs(skill_level - drill.difficulty_level)
            base_score += level_match
            
        # Adjust based on completion history
        if drill.name in user_history:
            completion_rate = user_history[drill.name]
            if completion_rate < 0.5:  # Prioritize unfinished drills
                base_score *= 1.5
            elif completion_rate > 0.8:  # Reduce priority of mastered drills
                base_score *= 0.7
                
        # Normalize score
        return base_score / (len(drill.target_skills) * 3.0)

    def _get_user_drill_history(self, user_id: str) -> Dict[str, float]:
        """Get user's drill completion history and performance."""
        history = {}
        recent_drills = self.progress_tracker.get_user_drill_history(user_id, days=30)
        
        for drill in recent_drills:
            if drill.drill_name not in history:
                history[drill.drill_name] = {
                    "attempts": 0,
                    "completions": 0,
                    "total_rating": 0.0
                }
                
            record = history[drill.drill_name]
            record["attempts"] += 1
            
            if drill.status == DrillStatus.COMPLETED:
                record["completions"] += 1
                if drill.performance_rating:
                    record["total_rating"] += drill.performance_rating
                    
        # Calculate completion rates
        return {
            name: (
                record["completions"] / record["attempts"]
                if record["attempts"] > 0 else 0.0
            )
            for name, record in history.items()
        }

    def _adjust_difficulty(
        self,
        drill: DrillInfo,
        user_id: str
    ) -> DrillInfo:
        """Adjust drill difficulty based on user's performance."""
        history = self.progress_tracker.get_user_drill_history(user_id, days=14)
        relevant_drills = [
            d for d in history
            if d.drill_name == drill.name and d.status == DrillStatus.COMPLETED
        ]
        
        if not relevant_drills:
            return drill
            
        # Calculate average performance
        avg_performance = sum(
            d.performance_rating for d in relevant_drills
            if d.performance_rating is not None
        ) / len(relevant_drills)
        
        # Adjust difficulty
        adjusted_drill = drill.copy()
        if avg_performance > 0.8 and len(relevant_drills) >= 3:
            # Increase difficulty for consistently high performers
            adjusted_drill.difficulty_level = min(1.0, drill.difficulty_level + 0.1)
            adjusted_drill.duration = int(drill.duration * 1.2)  # Increase duration
        elif avg_performance < 0.4:
            # Decrease difficulty for struggling users
            adjusted_drill.difficulty_level = max(0.1, drill.difficulty_level - 0.1)
            adjusted_drill.duration = int(drill.duration * 0.8)  # Decrease duration
            
        return adjusted_drill

    def get_recommendations(
        self,
        request: DrillRecommendationRequest
    ) -> List[DrillInfo]:
        """Get personalized drill recommendations."""
        user_history = self._get_user_drill_history(request.user_id)
        
        # Calculate relevance scores
        scored_drills = [
            (
                drill,
                self._calculate_drill_relevance(drill, request, user_history)
            )
            for drill in self.drills_database
        ]
        
        # Sort by relevance
        scored_drills.sort(key=lambda x: x[1], reverse=True)
        
        # Get top recommendations and adjust difficulty
        recommendations = []
        for drill, _ in scored_drills[:request.max_recommendations]:
            adjusted_drill = self._adjust_difficulty(drill, request.user_id)
            recommendations.append(adjusted_drill)
            
        return recommendations

    def _generate_daily_schedule(self, request: DrillScheduleRequest, 
                               day: str, target_intensity: float,
                               is_gym_day: bool) -> DailySchedule:
        """Generate a schedule for a single day."""
        relevant_drills = []
        
        # Calculate relevance for each drill
        for drill in self.drills_database:
            relevance = self._calculate_drill_relevance(drill, request, target_intensity, is_gym_day)
            if relevance > 0:
                relevant_drills.append((drill, relevance))

        # Sort drills by relevance
        relevant_drills.sort(key=lambda x: x[1], reverse=True)
        
        selected_drills = []
        total_duration = 0
        total_intensity = 0
        equipment_needed = set()
        requires_gym = False

        # Select drills while respecting constraints
        for drill, _ in relevant_drills:
            if (len(selected_drills) >= request.max_drills_per_day or 
                total_duration + drill.duration > request.max_duration_per_day):
                break

            selected_drills.append(drill)
            total_duration += drill.duration
            total_intensity += drill.intensity
            equipment_needed.update(drill.equipment_needed)
            requires_gym = requires_gym or drill.requires_gym

        # Calculate average intensity
        avg_intensity = total_intensity / len(selected_drills) if selected_drills else 0

        return DailySchedule(
            day=day,
            drills=selected_drills,
            total_duration=total_duration,
            intensity=avg_intensity,
            requires_gym=requires_gym,
            equipment_needed=list(equipment_needed),
            notes=self._generate_training_notes(selected_drills, day)
        )

    def _generate_training_notes(self, drills: List[DrillInfo], day: str) -> List[str]:
        """Generate helpful notes for the training session."""
        notes = []
        total_intensity = sum(drill.intensity for drill in drills)
        
        if total_intensity > 0.8:
            notes.append(f"High intensity day - ensure proper warm-up and recovery")
        elif total_intensity < 0.4:
            notes.append(f"Light training day - focus on technique and form")

        if any(drill.requires_gym for drill in drills):
            notes.append("Gym access required for some drills")

        return notes

    def _adapt_to_previous_performance(
        self,
        request: ExtendedDrillScheduleRequest,
        base_schedule: Dict[str, DailySchedule]
    ) -> Dict[str, DailySchedule]:
        """Adjust schedule based on previous week's performance."""
        if not request.previous_performance:
            return base_schedule

        perf = request.previous_performance
        
        # Adjust intensity based on completion rate
        completion_rate = len(perf.completed_drills) / (len(perf.completed_drills) + len(perf.skipped_drills))
        intensity_adjustment = -0.1 if completion_rate < 0.7 else 0.1 if completion_rate > 0.9 else 0
        
        # Prioritize growth areas with low progress
        low_progress_areas = [
            area for area, progress in perf.focus_areas_progress.items()
            if progress < 0.6
        ]

        # Adjust daily schedules
        for day, schedule in base_schedule.items():
            adjusted_drills = []
            for drill in schedule.drills:
                # Adjust drill intensity
                drill.intensity = min(1.0, max(0.1, drill.intensity + intensity_adjustment))
                
                # Prioritize drills targeting low progress areas
                if any(area in drill.target_skills for area in low_progress_areas):
                    adjusted_drills.insert(0, drill)
                else:
                    adjusted_drills.append(drill)
                    
            schedule.drills = adjusted_drills[:len(schedule.drills)]
            
        return base_schedule

    def _format_for_export(
        self,
        schedule: DrillScheduleResponse,
        format_type: TrainingFormat,
        output_path: Optional[str] = None
    ) -> str:
        """Format the schedule for different output formats."""
        if format_type == TrainingFormat.MARKDOWN:
            return self._format_markdown(schedule)
        elif format_type == TrainingFormat.PDF:
            return self._export_pdf(schedule, output_path or "training_plan.pdf")
        elif format_type == TrainingFormat.SMS:
            return self._format_sms(schedule)
        elif format_type == TrainingFormat.PUSH:
            return self._format_push(schedule)
        else:
            return self._format_api(schedule)

    def _format_markdown(self, schedule: DrillScheduleResponse) -> str:
        """Format schedule as markdown with emojis."""
        md = [
            f"# 🏀 Training Plan for {schedule.player_name}\n",
            f"## Weekly Overview",
            f"- Total Duration: {schedule.total_duration} minutes",
            f"- Focus Areas: {', '.join(schedule.weekly_focus_areas)}",
            f"- Equipment Needed: {', '.join(schedule.equipment_needed)}\n"
        ]

        for day, daily in schedule.weekly_schedule.items():
            md.extend([
                f"## {day.title()} {self._get_day_emoji(daily.intensity)}",
                f"- Intensity: {self._format_intensity(daily.intensity)}",
                f"- Duration: {daily.total_duration} minutes\n",
                "### Drills:"
            ])
            
            for i, drill in enumerate(daily.drills, 1):
                md.extend([
                    f"{i}. **{drill.name}** ({drill.duration} min)",
                    f"   - {drill.description}",
                    f"   - 🎯 Focus: {', '.join(drill.target_skills)}",
                    f"   - 🔧 Equipment: {', '.join(drill.equipment_needed)}\n"
                ])

        return "\n".join(md)

    def _export_pdf(self, schedule: DrillScheduleResponse, output_path: str) -> str:
        """Export schedule as a formatted PDF."""
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30
        )
        story.append(Paragraph(f"Training Plan for {schedule.player_name}", title_style))
        story.append(Spacer(1, 12))

        # Weekly Overview
        story.append(Paragraph("Weekly Overview", styles['Heading2']))
        overview_data = [
            ["Total Duration", f"{schedule.total_duration} minutes"],
            ["Focus Areas", ", ".join(schedule.weekly_focus_areas)],
            ["Equipment", ", ".join(schedule.equipment_needed)]
        ]
        
        t = Table(overview_data, colWidths=[120, 400])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

        # Daily Schedules
        for day, daily in schedule.weekly_schedule.items():
            story.append(Paragraph(f"{day.title()}", styles['Heading2']))
            story.append(Paragraph(f"Intensity: {self._format_intensity(daily.intensity)}", styles['Normal']))
            story.append(Paragraph(f"Duration: {daily.total_duration} minutes", styles['Normal']))
            story.append(Spacer(1, 12))

            # Drills table
            drill_data = [["Drill", "Duration", "Focus", "Equipment"]]
            for drill in daily.drills:
                drill_data.append([
                    drill.name,
                    f"{drill.duration} min",
                    ", ".join(drill.target_skills),
                    ", ".join(drill.equipment_needed)
                ])

            t = Table(drill_data, colWidths=[120, 60, 180, 160])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(t)
            story.append(Spacer(1, 20))

        doc.build(story)
        return output_path

    def _format_sms(self, schedule: DrillScheduleResponse) -> str:
        """Format schedule as SMS-friendly text."""
        lines = [
            f"🏀 Training Plan - {schedule.player_name}",
            f"Duration: {schedule.total_duration}min"
        ]
        
        for day, daily in schedule.weekly_schedule.items():
            lines.append(f"\n{day.title()}:")
            for drill in daily.drills:
                lines.append(f"- {drill.name} ({drill.duration}min)")
        
        return "\n".join(lines)

    def _format_push(self, schedule: DrillScheduleResponse) -> Dict:
        """Format schedule as push notification content."""
        return {
            "title": f"Training Plan Ready - {schedule.player_name}",
            "body": f"Your {schedule.total_duration}min training plan is ready!",
            "data": {
                "type": "training_plan",
                "player_id": schedule.player_id,
                "total_duration": schedule.total_duration,
                "equipment_needed": schedule.equipment_needed
            }
        }

    def _format_api(self, schedule: DrillScheduleResponse) -> Dict:
        """Format schedule as API response."""
        return schedule.dict()

    def _get_day_emoji(self, intensity: float) -> str:
        """Get appropriate emoji for day's intensity."""
        if intensity >= 0.8:
            return "🔥"
        elif intensity >= 0.6:
            return "💪"
        elif intensity >= 0.4:
            return "🎯"
        else:
            return "🌟"

    def _format_intensity(self, intensity: float) -> str:
        """Format intensity level with description."""
        if intensity >= 0.8:
            return "High Intensity 🔥"
        elif intensity >= 0.6:
            return "Moderate Intensity 💪"
        elif intensity >= 0.4:
            return "Light Intensity 🎯"
        else:
            return "Recovery 🌟"

    def generate_weekly_schedule(
        self,
        request: ExtendedDrillScheduleRequest
    ) -> DrillScheduleResponse:
        """Generate a complete weekly training schedule with adaptations."""
        # Get base schedule
        base_schedule = super().generate_weekly_schedule(request)
        
        # Adapt based on previous performance
        adapted_schedule = self._adapt_to_previous_performance(request, base_schedule.weekly_schedule)
        base_schedule.weekly_schedule = adapted_schedule

        # Format according to preference
        formatted_schedule = self._format_for_export(
            base_schedule,
            request.preferences.format_type
        )

        # Store performance for future reference
        if request.player_id not in self.performance_history:
            self.performance_history[request.player_id] = []
        
        # Update schedule with formatting
        base_schedule.formatted_output = formatted_schedule
        return base_schedule

    def record_drill_completion(
        self,
        user_id: str,
        drill_id: str,
        status: DrillStatus,
        performance_rating: Optional[float] = None,
        skip_reason: Optional[str] = None
    ) -> None:
        """Record drill completion status."""
        drill = next(
            (d for d in self.drills_database if d.id == drill_id),
            None
        )
        if not drill:
            raise ValueError(f"Drill with ID {drill_id} not found")
            
        record = DrillRecord(
            drill_id=drill_id,
            drill_name=drill.name,
            timestamp=datetime.now(),
            status=status,
            duration=drill.duration,
            difficulty=drill.difficulty,
            target_skills=drill.target_skills,
            performance_rating=performance_rating,
            skip_reason=skip_reason
        )
        
        self.progress_tracker.record_drill_completion(user_id, record) 