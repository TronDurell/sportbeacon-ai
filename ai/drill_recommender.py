from typing import Dict, List

from backend.models import (
    DifficultyLevel,
    DrillInfo,
    DrillRecommendationRequest,
    DrillRecommendationResponse,
    DrillScheduleRequest,
    DrillScheduleResponse,
    TrainingFormat,
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
            DrillInfo(
                id="partner_closeouts",
                name="Partner Closeout Drill",
                description="Closeouts and contest with a partner",
                difficulty=DifficultyLevel.INTERMEDIATE,
                difficulty_level=0.55,
                duration=15,
                intensity=0.7,
                requires_gym=False,
                equipment_needed=["basketball"],
                target_skills=["defense", "agility"],
                training_format=TrainingFormat.PARTNER,
                video_url=None,
            ),
            DrillInfo(
                id="partner_shooting",
                name="Partner Shooting Relay",
                description="Catch-and-shoot repetitions with a passer",
                difficulty=DifficultyLevel.BEGINNER,
                difficulty_level=0.35,
                duration=20,
                intensity=0.5,
                requires_gym=True,
                equipment_needed=["basketball", "hoop"],
                target_skills=["shooting", "passing"],
                training_format=TrainingFormat.PARTNER,
                video_url=None,
            ),
        ]

    def _validate_difficulty_range(
        self, min_difficulty: DifficultyLevel, max_difficulty: DifficultyLevel
    ) -> None:
        if min_difficulty.value > max_difficulty.value:
            raise ValueError("min_difficulty cannot be greater than max_difficulty")

    def _validate_schedule_request(self, request: DrillScheduleRequest) -> None:
        self._validate_difficulty_range(request.min_difficulty, request.max_difficulty)
        if request.max_drills_per_day < 1:
            raise ValueError("max_drills_per_day must be at least 1")
        if request.max_duration_per_day < 1:
            raise ValueError("max_duration_per_day must be at least 1")

    def _filter_by_difficulty(
        self, drills: List[DrillInfo], min_d: DifficultyLevel, max_d: DifficultyLevel
    ) -> List[DrillInfo]:
        return [d for d in drills if min_d.value <= d.difficulty.value <= max_d.value]

    def _score_drill(
        self, drill: DrillInfo, skill_levels: Dict[str, float], growth_areas: List[str]
    ) -> float:
        score = 0.0
        growth = {area.lower() for area in growth_areas}
        for skill in drill.target_skills:
            base = 1.5 if skill.lower() in growth else 0.5
            level = skill_levels.get(skill, skill_levels.get(skill.lower(), 0.5))
            score += base * (1.0 - abs(level - drill.difficulty_level))
        return score

    def _eligible_schedule_drills(self, request: DrillScheduleRequest) -> List[DrillInfo]:
        pool = self._filter_by_difficulty(
            self.drills_db, request.min_difficulty, request.max_difficulty
        )
        eligible: List[DrillInfo] = []
        for drill in pool:
            if drill.requires_gym and not request.gym_access:
                continue
            if (
                request.preferred_training_format is not None
                and drill.training_format != request.preferred_training_format
            ):
                continue
            eligible.append(drill)
        return eligible

    def _rank_drills(
        self,
        drills: List[DrillInfo],
        skill_levels: Dict[str, float],
        growth_areas: List[str],
    ) -> List[DrillInfo]:
        return sorted(
            drills,
            key=lambda drill: (
                -self._score_drill(drill, skill_levels, growth_areas),
                drill.id,
            ),
        )

    # Back-compat wrapper for backend.drill_service
    def recommend_drills(self, request: DrillRecommendationRequest) -> DrillRecommendationResponse:
        return self.get_recommendations(request)

    def get_recommendations(self, request: DrillRecommendationRequest) -> DrillRecommendationResponse:
        self._validate_difficulty_range(request.min_difficulty, request.max_difficulty)
        pool = self._filter_by_difficulty(
            self.drills_db, request.min_difficulty, request.max_difficulty
        )
        selected = self._rank_drills(pool, request.skill_levels, request.growth_areas)[
            : request.max_recommendations
        ]
        notes = [
            "Prioritized growth areas first",
            f"Difficulty range: {request.min_difficulty.name} - {request.max_difficulty.name}",
        ]
        return DrillRecommendationResponse(
            user_id=request.user_id,
            player_id=request.user_id,
            recommended_drills=selected,
            training_notes=notes,
        )

    def create_weekly_schedule(self, request: DrillScheduleRequest) -> DrillScheduleResponse:
        self._validate_schedule_request(request)
        pool = self._eligible_schedule_drills(request)
        ranked = self._rank_drills(pool, request.skill_levels, request.growth_areas)

        weekly_schedule: Dict[str, List[DrillInfo]] = {}
        total_duration = 0
        skill_coverage: Dict[str, float] = {}
        intensity_distribution: Dict[str, float] = {}

        for day in request.available_days:
            day_key = day.lower()
            day_drills: List[DrillInfo] = []
            remaining_duration = request.max_duration_per_day
            for drill in ranked:
                if len(day_drills) >= request.max_drills_per_day:
                    break
                if drill.duration > remaining_duration:
                    continue
                day_drills.append(drill)
                remaining_duration -= drill.duration

            weekly_schedule[day_key] = day_drills
            day_duration = sum(d.duration for d in day_drills)
            total_duration += day_duration
            if day_drills:
                intensity_distribution[day_key] = float(
                    sum(d.intensity for d in day_drills) / len(day_drills)
                )
            for drill in day_drills:
                for skill in drill.target_skills:
                    skill_coverage[skill] = skill_coverage.get(skill, 0.0) + 1.0

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

    def format_recommendations_for_display(
        self, response: DrillRecommendationResponse, format_type: str = "text"
    ) -> str:
        if format_type == "text":
            lines = ["Recommended Drills:"]
            for i, d in enumerate(response.recommended_drills, 1):
                lines.append(f"{i}. {d.name} - {d.difficulty.name} - {d.duration} min")
            if response.training_notes:
                lines.append("Notes:")
                lines.extend(response.training_notes)
            return "\n".join(lines)
        if format_type == "markdown":
            lines = ["## Recommended Drills"]
            for d in response.recommended_drills:
                lines.append(f"- {d.name} ({d.difficulty.name}) — {d.duration} min")
            return "\n".join(lines)
        raise ValueError(f"Unsupported format type: {format_type}")

    def format_schedule_for_display(
        self, response: DrillScheduleResponse, format_type: str = "text"
    ) -> str:
        days_order = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ]
        if format_type == "text":
            lines = ["Weekly Schedule:"]
            for day in days_order:
                drills = response.weekly_schedule.get(day) or []
                if not drills:
                    continue
                lines.append(f"\n{day.title()}:")
                for d in drills:
                    lines.append(f"- {d.name} ({d.duration} min)")
            return "\n".join(lines)
        if format_type == "markdown":
            lines = ["## Weekly Schedule"]
            for day in days_order:
                drills = response.weekly_schedule.get(day) or []
                if not drills:
                    continue
                lines.append(f"\n### {day.title()}")
                for d in drills:
                    lines.append(f"- {d.name} ({d.duration} min)")
            return "\n".join(lines)
        raise ValueError(f"Unsupported format type: {format_type}")
