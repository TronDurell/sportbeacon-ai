from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel
from .motivational_message import MotivationalMessageGenerator

class DrillStatus(str, Enum):
    COMPLETED = "completed"
    SKIPPED = "skipped"
    MISSED = "missed"  # For drills that were scheduled but not marked either way

class DrillRecord(BaseModel):
    drill_id: str
    drill_name: str
    timestamp: datetime
    status: DrillStatus
    duration: int
    difficulty: str
    target_skills: List[str]
    performance_rating: Optional[float] = None
    skip_reason: Optional[str] = None
    notes: Optional[str] = None

class WeeklyProgress(BaseModel):
    completed_drills: List[DrillRecord]
    skipped_drills: List[DrillRecord]
    missed_drills: List[DrillRecord]
    completion_rate: float
    current_streak: int
    longest_streak: int
    total_duration: int
    focus_areas_progress: Dict[str, float]
    performance_by_skill: Dict[str, float]
    motivational_messages: List[str]

class WeeklySummaryUIModel(BaseModel):
    top_accomplishments: List[str]
    completion_stats: Dict[str, int]
    skill_progress: Dict[str, float]
    performance_indicators: Dict[str, str]  # color codes
    summary_text: str
    streak_info: Dict[str, int]
    chart_data: Dict[str, Any]  # For UI visualization
    motivational_message: str

class PlayerProgressTracker:
    def __init__(self):
        # In-memory storage (replace with DB later)
        self.drill_history: Dict[str, List[DrillRecord]] = {}
        self.weekly_summaries: Dict[str, Dict[str, WeeklyProgress]] = {}
        self.last_active: Dict[str, datetime] = {}
        self.current_streaks: Dict[str, int] = {}
        self.longest_streaks: Dict[str, int] = {}
        self.rest_days: Dict[str, List[datetime]] = {}
        self.message_generator = MotivationalMessageGenerator()
        
    def record_drill_completion(
        self,
        user_id: str,
        drill_record: DrillRecord
    ) -> None:
        """Record a completed or skipped drill."""
        if user_id not in self.drill_history:
            self.drill_history[user_id] = []
        
        self.drill_history[user_id].append(drill_record)
        self._update_streak_info(user_id, drill_record)
        self._update_weekly_progress(user_id)

    def _update_streak_info(self, user_id: str, drill_record: DrillRecord) -> None:
        """Update user's streak information."""
        today = datetime.now().date()
        last_active = self.last_active.get(user_id)
        
        if drill_record.status == DrillStatus.COMPLETED:
            if not last_active or (today - last_active.date()).days <= 1:
                self.current_streaks[user_id] = self.current_streaks.get(user_id, 0) + 1
                self.longest_streaks[user_id] = max(
                    self.longest_streaks.get(user_id, 0),
                    self.current_streaks[user_id]
                )
            else:
                self.current_streaks[user_id] = 1
            
            self.last_active[user_id] = drill_record.timestamp
        elif drill_record.status == DrillStatus.SKIPPED:
            if user_id not in self.rest_days:
                self.rest_days[user_id] = []
            self.rest_days[user_id].append(drill_record.timestamp.date())

    def _update_weekly_progress(self, user_id: str) -> None:
        """Update weekly progress metrics."""
        current_week = datetime.now().strftime("%Y-W%W")
        
        if user_id not in self.weekly_summaries:
            self.weekly_summaries[user_id] = {}
            
        # Get this week's drills
        week_start = datetime.now() - timedelta(days=datetime.now().weekday())
        week_drills = [
            drill for drill in self.drill_history[user_id]
            if drill.timestamp >= week_start
        ]
        
        # Calculate completion stats
        completed = [d for d in week_drills if d.status == DrillStatus.COMPLETED]
        skipped = [d for d in week_drills if d.status == DrillStatus.SKIPPED]
        missed = [d for d in week_drills if d.status == DrillStatus.MISSED]
        
        total_scheduled = len(week_drills)
        completion_rate = len(completed) / total_scheduled if total_scheduled > 0 else 0
        
        # Calculate skill progress
        focus_areas_progress = self._calculate_skill_progress(completed)
        performance_by_skill = self._calculate_performance_by_skill(completed)
        
        # Generate motivational messages
        messages = [
            self.message_generator.get_weekly_achievement_message(completion_rate),
            self.message_generator.get_improvement_tip(len(missed) + len(skipped)),
            self.message_generator.get_daily_message(
                self.current_streaks.get(user_id, 0),
                self.last_active.get(user_id)
            )
        ]
        
        # Update weekly summary
        self.weekly_summaries[user_id][current_week] = WeeklyProgress(
            completed_drills=completed,
            skipped_drills=skipped,
            missed_drills=missed,
            completion_rate=completion_rate,
            current_streak=self.current_streaks.get(user_id, 0),
            longest_streak=self.longest_streaks.get(user_id, 0),
            total_duration=sum(d.duration for d in completed),
            focus_areas_progress=focus_areas_progress,
            performance_by_skill=performance_by_skill,
            motivational_messages=messages
        )

    def get_weekly_stats(self, user_id: str) -> Dict[str, Any]:
        """Get weekly statistics for a user."""
        current_week = datetime.now().strftime("%Y-W%W")
        progress = self.weekly_summaries.get(user_id, {}).get(current_week)
        
        if not progress:
            return {
                "completion_rate": 0.0,
                "missed_drills": 0,
                "total_duration": 0,
                "current_streak": 0,
                "motivational_message": self.message_generator.get_daily_message()
            }
            
        return {
            "completion_rate": progress.completion_rate,
            "missed_drills": len(progress.missed_drills) + len(progress.skipped_drills),
            "total_duration": progress.total_duration,
            "current_streak": progress.current_streak,
            "motivational_message": progress.motivational_messages[0]
        }

    def get_streak_status(self, user_id: str) -> Dict[str, Any]:
        """Get user's current streak information."""
        return {
            "current_streak": self.current_streaks.get(user_id, 0),
            "longest_streak": self.longest_streaks.get(user_id, 0),
            "last_active": self.last_active.get(user_id),
            "rest_days_this_week": len([
                day for day in self.rest_days.get(user_id, [])
                if day >= datetime.now().date() - timedelta(days=7)
            ]),
            "motivational_message": self.message_generator.get_daily_message(
                self.current_streaks.get(user_id, 0),
                self.last_active.get(user_id)
            )
        }

    def get_weekly_summary_ui(self, user_id: str) -> WeeklySummaryUIModel:
        """Generate UI-friendly weekly summary."""
        current_week = datetime.now().strftime("%Y-W%W")
        progress = self.weekly_summaries.get(user_id, {}).get(current_week)
        
        if not progress:
            return WeeklySummaryUIModel(
                top_accomplishments=[],
                completion_stats={"completed": 0, "skipped": 0, "missed": 0},
                skill_progress={},
                performance_indicators={},
                summary_text="No data available for this week.",
                streak_info={"current": 0, "longest": 0},
                chart_data={},
                motivational_message=self.message_generator.get_daily_message()
            )
            
        # Generate performance indicators
        indicators = {}
        for skill, rating in progress.performance_by_skill.items():
            if rating >= 0.8:
                indicators[skill] = "green"
            elif rating >= 0.6:
                indicators[skill] = "yellow"
            else:
                indicators[skill] = "red"
                
        # Prepare chart data
        chart_data = {
            "completion": {
                "labels": ["Completed", "Skipped", "Missed"],
                "data": [
                    len(progress.completed_drills),
                    len(progress.skipped_drills),
                    len(progress.missed_drills)
                ]
            },
            "skills": {
                "labels": list(progress.focus_areas_progress.keys()),
                "data": list(progress.focus_areas_progress.values())
            }
        }
        
        return WeeklySummaryUIModel(
            top_accomplishments=self._generate_accomplishments(progress),
            completion_stats={
                "completed": len(progress.completed_drills),
                "skipped": len(progress.skipped_drills),
                "missed": len(progress.missed_drills)
            },
            skill_progress=progress.focus_areas_progress,
            performance_indicators=indicators,
            summary_text=self._generate_summary_text(progress),
            streak_info={
                "current": progress.current_streak,
                "longest": progress.longest_streak
            },
            chart_data=chart_data,
            motivational_message=progress.motivational_messages[0]
        )

    def _generate_accomplishments(self, progress: WeeklyProgress) -> List[str]:
        """Generate list of top accomplishments."""
        accomplishments = []
        
        if progress.completion_rate >= 0.85:
            accomplishments.append(
                f"🔥 Completed {progress.completion_rate:.0%} of your drills this week!"
            )
        
        if progress.current_streak >= 3:
            accomplishments.append(
                f"⚡ {progress.current_streak} day streak and counting!"
            )
            
        if len(progress.skipped_drills) > 0:
            accomplishments.append(
                f"💡 You skipped {len(progress.skipped_drills)} sessions — aim for consistency next week."
            )
            
        return accomplishments

    def _generate_summary_text(self, progress: WeeklyProgress) -> str:
        """Generate a summary text with emojis."""
        lines = [
            f"📊 Weekly Progress Summary",
            f"✅ Completed: {len(progress.completed_drills)} drills",
            f"⏭️ Skipped: {len(progress.skipped_drills)} drills",
            f"📈 Completion Rate: {progress.completion_rate:.0%}",
            f"⚡ Current Streak: {progress.current_streak} days",
            "",
            progress.motivational_messages[-1]
        ]
        return "\n".join(lines)

    def _calculate_skill_progress(
        self,
        completed_drills: List[DrillRecord]
    ) -> Dict[str, float]:
        """Calculate progress for each skill area."""
        skill_counts = {}
        skill_ratings = {}
        
        for drill in completed_drills:
            for skill in drill.target_skills:
                if skill not in skill_counts:
                    skill_counts[skill] = 0
                    skill_ratings[skill] = 0
                    
                skill_counts[skill] += 1
                if drill.performance_rating:
                    skill_ratings[skill] += drill.performance_rating
                    
        # Calculate average progress
        progress = {}
        for skill in skill_counts:
            if skill_counts[skill] > 0:
                progress[skill] = skill_ratings[skill] / skill_counts[skill]
            else:
                progress[skill] = 0
                
        return progress

    def _calculate_performance_by_skill(
        self,
        completed_drills: List[DrillRecord]
    ) -> Dict[str, float]:
        """Calculate average performance rating for each skill."""
        skill_ratings = {}
        skill_counts = {}
        
        for drill in completed_drills:
            if not drill.performance_rating:
                continue
                
            for skill in drill.target_skills:
                if skill not in skill_ratings:
                    skill_ratings[skill] = 0
                    skill_counts[skill] = 0
                    
                skill_ratings[skill] += drill.performance_rating
                skill_counts[skill] += 1
                
        # Calculate averages
        return {
            skill: (rating / skill_counts[skill])
            for skill, rating in skill_ratings.items()
            if skill_counts[skill] > 0
        }

    def get_user_drill_history(
        self,
        user_id: str,
        days: int = 30
    ) -> List[DrillRecord]:
        """Get user's drill history for the specified period."""
        if user_id not in self.drill_history:
            return []
            
        cutoff_date = datetime.now() - timedelta(days=days)
        return [
            drill for drill in self.drill_history[user_id]
            if drill.timestamp >= cutoff_date
        ]

    def get_completion_rate(
        self,
        user_id: str,
        days: int = 7
    ) -> float:
        """Calculate completion rate for the specified period."""
        history = self.get_user_drill_history(user_id, days)
        if not history:
            return 0.0
            
        completed = len([
            d for d in history
            if d.status == DrillStatus.COMPLETED
        ])
        return completed / len(history)

    def get_skill_progress(
        self,
        user_id: str,
        days: int = 7
    ) -> Dict[str, float]:
        """Get progress by skill area for the specified period."""
        history = self.get_user_drill_history(user_id, days)
        completed = [d for d in history if d.status == DrillStatus.COMPLETED]
        return self._calculate_skill_progress(completed) 