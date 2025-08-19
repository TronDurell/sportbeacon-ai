from typing import List, Dict
import random
from backend.models import (
    DrillInfo,
    DrillRecommendationRequest,
    DrillRecommendationResponse,
    DrillScheduleRequest,
    DrillScheduleResponse,
    DifficultyLevel,
    TrainingFormat
)


class DrillRecommendationEngine:
    def __init__(self):
        self.drills_db = self._create_mock_drills()

    def _create_mock_drills(self) -> List[DrillInfo]:
        """Create a small set of sample drills matching backend.models.DrillInfo."""
        return [
            DrillInfo(
                id="shooting_form",
                name="Shooting Form Practice",
                description="Close-range shots focusing on form",
                difficulty=DifficultyLevel.BEGINNER,
                difficulty_level=0.3,
                duration=20,
                intensity=0.4,
                requires_gym=True,
                equipment_needed=["basketball", "hoop"],
                target_skills=["shooting"],
                training_format=TrainingFormat.SOLO,
                video_url=None,
            ),
            DrillInfo(
                id="three_point_circuit",
                name="Three-Point Circuit",
                description="Shooting from multiple three-point spots",
                difficulty=DifficultyLevel.ADVANCED,
                difficulty_level=0.7,
                duration=25,
                intensity=0.7,
                requires_gym=True,
                equipment_needed=["basketball", "hoop"],
                target_skills=["shooting", "stamina"],
                training_format=TrainingFormat.SOLO,
                video_url=None,
            ),
            DrillInfo(
                id="defensive_slides",
                name="Defensive Slides",
                description="Lateral movement for defensive positioning",
                difficulty=DifficultyLevel.INTERMEDIATE,
                difficulty_level=0.5,
                duration=15,
                intensity=0.8,
                requires_gym=False,
                equipment_needed=["cones"],
                target_skills=["defense", "agility"],
                training_format=TrainingFormat.SOLO,
                video_url=None,
            ),
            DrillInfo(
                id="rebounding_boxout",
                name="Box-Out Basics",
                description="Positioning and timing for rebounds",
                difficulty=DifficultyLevel.BEGINNER,
                difficulty_level=0.3,
                duration=15,
                intensity=0.5,
                requires_gym=False,
                equipment_needed=["basketball", "cones"],
                target_skills=["rebounds", "positioning"],
                training_format=TrainingFormat.GROUP,
                video_url=None,
            ),
            DrillInfo(
                id="passing_pnr",
                name="Pick and Roll Mastery",
                description="Reads and passes out of PnR",
                difficulty=DifficultyLevel.INTERMEDIATE,
                difficulty_level=0.6,
                duration=20,
                intensity=0.6,
                requires_gym=False,
                equipment_needed=["basketball", "cones"],
                target_skills=["assists", "passing", "basketball_iq"],
                training_format=TrainingFormat.PARTNER,
                video_url=None,
            ),
        ]

    def _filter_by_difficulty(self, drills: List[DrillInfo], min_d: DifficultyLevel, max_d: DifficultyLevel) -> List[DrillInfo]:
        return [d for d in drills if min_d.value <= d.difficulty.value <= max_d.value]

    def _score_drill(self, drill: DrillInfo, skill_levels: Dict[str, float], growth_areas: List[str]) -> float:
        score = 0.0
        for skill in drill.target_skills:
            base = 1.5 if skill in growth_areas else 0.5
            level = skill_levels.get(skill, 0.5)
            score += base * (1.0 - abs(level - drill.difficulty_level))
        return score

    # Back-compat wrapper for backend.drill_service
    def recommend_drills(self, request: DrillRecommendationRequest) -> DrillRecommendationResponse:
        return self.get_recommendations(request)

    def get_recommendations(self, request: DrillRecommendationRequest) -> DrillRecommendationResponse:
        pool = self._filter_by_difficulty(self.drills_db, request.min_difficulty, request.max_difficulty)
        scored = sorted(
            pool,
            key=lambda d: self._score_drill(d, request.skill_levels, request.growth_areas),
            reverse=True,
        )
        selected = scored[: request.max_recommendations]
        notes = [
            "Prioritized growth areas first",
            f"Difficulty range: {request.min_difficulty.name} - {request.max_difficulty.name}",
        ]
        return DrillRecommendationResponse(player_id=request.user_id, recommended_drills=selected, training_notes=notes)

    def create_weekly_schedule(self, request: DrillScheduleRequest) -> DrillScheduleResponse:
        pool = self._filter_by_difficulty(self.drills_db, request.min_difficulty, request.max_difficulty)
        weekly_schedule: Dict[str, List[DrillInfo]] = {}
        total_duration = 0
        skill_coverage: Dict[str, float] = {}
        intensity_distribution: Dict[str, float] = {}

        for day in request.available_days:
            day_key = day.lower()
            day_drills: List[DrillInfo] = []
            random.shuffle(pool)
            for d in pool:
                if len(day_drills) >= request.max_drills_per_day:
                    break
                if d.requires_gym and not request.gym_access:
                    continue
                if sum(x.duration for x in day_drills) + d.duration <= request.max_duration_per_day:
                    day_drills.append(d)
            weekly_schedule[day_key] = day_drills
            total_duration += sum(d.duration for d in day_drills)
            if day_drills:
                intensity_distribution[day_key] = float(sum(d.intensity for d in day_drills) / len(day_drills))
            for d in day_drills:
                for s in d.target_skills:
                    skill_coverage[s] = skill_coverage.get(s, 0.0) + 1.0

        notes = "Focus on balanced mix of skills across selected days."
        return DrillScheduleResponse(
            user_id=request.user_id,
            weekly_schedule=weekly_schedule,
            total_duration=total_duration,
            skill_coverage=skill_coverage,
            intensity_distribution=intensity_distribution,
            training_notes=notes,
            formatted_output=None,
        )

    def format_recommendations_for_display(self, response: DrillRecommendationResponse, format_type: str = 'text') -> str:
        if format_type == 'text':
            lines = ["Recommended Drills:"]
            for i, d in enumerate(response.recommended_drills, 1):
                lines.append(f"{i}. {d.name} - {d.difficulty.name} - {d.duration} min")
            if response.training_notes:
                lines.append("Notes:")
                lines.extend(response.training_notes)
            return "\n".join(lines)
        elif format_type == 'markdown':
            lines = ["## Recommended Drills"]
            for d in response.recommended_drills:
                lines.append(f"- {d.name} ({d.difficulty.name}) — {d.duration} min")
            return "\n".join(lines)
        else:
            raise ValueError(f"Unsupported format type: {format_type}")

    # Simple weekly schedule formatter used by API service
    def format_schedule_for_display(self, response: DrillScheduleResponse, format_type: str = 'text') -> str:
        days_order = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        if format_type == 'text':
            lines = ["Weekly Schedule:"]
            for day in days_order:
                drills = response.weekly_schedule.get(day) or []
                if not drills:
                    continue
                lines.append(f"\n{day.title()}:")
                for d in drills:
                    lines.append(f"- {d.name} ({d.duration} min)")
            return "\n".join(lines)
        elif format_type == 'markdown':
            lines = ["## Weekly Schedule"]
            for day in days_order:
                drills = response.weekly_schedule.get(day) or []
                if not drills:
                    continue
                lines.append(f"\n### {day.title()}")
                for d in drills:
                    lines.append(f"- {d.name} ({d.duration} min)")
            return "\n".join(lines)
        else:
            raise ValueError(f"Unsupported format type: {format_type}")