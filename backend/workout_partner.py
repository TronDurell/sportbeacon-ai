from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, time
import math
from enum import Enum

class WorkoutType(Enum):
    CALISTHENICS = "calisthenics"
    GYM_BASED = "gym_based"
    HIIT = "hiit"
    STRENGTH = "strength"
    CARDIO = "cardio"
    FLEXIBILITY = "flexibility"

class DietaryPreference(Enum):
    BALANCED = "balanced"
    PLANT_BASED = "plant_based"
    HIGH_PROTEIN = "high_protein"
    KETO = "keto"
    MEDITERRANEAN = "mediterranean"

class FitnessGoal(Enum):
    ENDURANCE = "endurance"
    STRENGTH = "strength"
    WEIGHT_LOSS = "weight_loss"
    ATHLETIC_PERFORMANCE = "athletic_performance"
    MUSCLE_GAIN = "muscle_gain"

@dataclass
class Exercise:
    name: str
    sets: Optional[int]
    reps: Optional[int]
    duration: Optional[int]  # in seconds
    equipment: List[str]
    description: str
    intensity: str
    rest_period: int  # in seconds

@dataclass
class Meal:
    name: str
    ingredients: List[str]
    macros: Dict[str, float]  # protein, carbs, fats in grams
    calories: int
    preparation_time: int  # in minutes
    dietary_tags: List[str]

@dataclass
class WorkoutLocation:
    name: str
    venue_type: str
    latitude: float
    longitude: float
    equipment: List[str]
    distance: float  # in meters
    open_hours: Dict[str, Tuple[time, time]]
    features: List[str]
    rating: float

class WorkoutPartner:
    def __init__(self):
        self._initialize_exercise_database()
        self._initialize_meal_database()
        self._initialize_venue_database()

    def _initialize_exercise_database(self):
        """Initialize sample exercises for different workout types."""
        self.exercises_db = {
            WorkoutType.CALISTHENICS: [
                Exercise(
                    name="Push-ups",
                    sets=3,
                    reps=12,
                    duration=None,
                    equipment=[],
                    description="Standard push-ups with proper form",
                    intensity="moderate",
                    rest_period=60
                ),
                Exercise(
                    name="Pull-ups",
                    sets=3,
                    reps=8,
                    duration=None,
                    equipment=["pull-up bar"],
                    description="Full range of motion pull-ups",
                    intensity="high",
                    rest_period=90
                ),
                # Add more exercises...
            ],
            WorkoutType.HIIT: [
                Exercise(
                    name="Burpees",
                    sets=None,
                    reps=None,
                    duration=30,
                    equipment=[],
                    description="Full body burpees",
                    intensity="high",
                    rest_period=15
                ),
                # Add more exercises...
            ]
        }

    def _initialize_meal_database(self):
        """Initialize sample meals for different dietary preferences."""
        self.meals_db = {
            DietaryPreference.BALANCED: {
                "breakfast": [
                    Meal(
                        name="Oatmeal with Berries and Nuts",
                        ingredients=["oats", "mixed berries", "almonds", "honey"],
                        macros={"protein": 12, "carbs": 45, "fats": 15},
                        calories=350,
                        preparation_time=10,
                        dietary_tags=["vegetarian", "high_fiber"]
                    ),
                ],
                "lunch": [
                    # Add lunch meals...
                ],
                "dinner": [
                    # Add dinner meals...
                ],
                "snacks": [
                    # Add snacks...
                ]
            },
            # Add more dietary preferences...
        }

    def _initialize_venue_database(self):
        """Initialize sample workout venues."""
        self.venues_db = [
            WorkoutLocation(
                name="Central Park Fitness Area",
                venue_type="park",
                latitude=40.7829,
                longitude=-73.9654,
                equipment=["pull-up bars", "parallel bars", "open turf"],
                distance=0,  # Will be calculated based on user location
                open_hours={"all": (time(6, 0), time(22, 0))},
                features=["outdoor", "free", "calisthenics-friendly"],
                rating=4.5
            ),
            # Add more venues...
        ]

    def generate_daily_workout(
        self,
        fitness_goal: FitnessGoal,
        workout_type: WorkoutType,
        time_available: int,  # in minutes
        equipment_access: List[str]
    ) -> Dict:
        """Generate a daily workout routine based on user preferences."""
        # Filter exercises based on equipment access
        available_exercises = []
        for exercise in self.exercises_db.get(workout_type, []):
            if all(eq in equipment_access for eq in exercise.equipment):
                available_exercises.append(exercise)

        # Select exercises based on time available and fitness goal
        selected_exercises = []
        total_time = 0
        target_time = time_available * 60  # Convert to seconds

        while total_time < target_time and available_exercises:
            exercise = self._select_best_exercise(
                available_exercises,
                fitness_goal,
                target_time - total_time
            )
            if not exercise:
                break

            selected_exercises.append(exercise)
            total_time += self._calculate_exercise_time(exercise)
            available_exercises.remove(exercise)

        return {
            "workout_plan": {
                "exercises": selected_exercises,
                "total_duration": total_time,
                "intensity_level": self._calculate_workout_intensity(selected_exercises),
                "estimated_calories": self._estimate_calories_burned(selected_exercises),
                "warm_up": self._generate_warm_up(workout_type),
                "cool_down": self._generate_cool_down(workout_type)
            }
        }

    def generate_meal_plan(
        self,
        dietary_preference: DietaryPreference,
        calorie_target: int,
        meal_count: int = 3,
        include_snacks: bool = True
    ) -> Dict:
        """Generate a daily meal plan based on user preferences."""
        meals = self.meals_db.get(dietary_preference, {})
        selected_meals = {
            "breakfast": self._select_meal(meals.get("breakfast", []), calorie_target * 0.3),
            "lunch": self._select_meal(meals.get("lunch", []), calorie_target * 0.35),
            "dinner": self._select_meal(meals.get("dinner", []), calorie_target * 0.35)
        }

        if include_snacks:
            selected_meals["snacks"] = self._select_meal(
                meals.get("snacks", []),
                calorie_target * 0.1
            )

        total_macros = self._calculate_total_macros(selected_meals)
        water_intake = self._calculate_water_intake(calorie_target)

        return {
            "meal_plan": selected_meals,
            "macros": total_macros,
            "total_calories": sum(meal.calories for meal in selected_meals.values()),
            "water_intake_ml": water_intake
        }

    def suggest_workout_location(
        self,
        user_lat: float,
        user_lng: float,
        workout_type: WorkoutType,
        required_equipment: List[str],
        max_distance: float = 5000  # 5km default radius
    ) -> List[Dict]:
        """Suggest workout locations based on user location and preferences."""
        # Calculate distances and filter venues
        ranked_venues = []
        for venue in self.venues_db:
            # Calculate distance using Haversine formula
            distance = self._calculate_distance(
                user_lat, user_lng,
                venue.latitude, venue.longitude
            )
            
            if distance <= max_distance:
                # Check if venue has required equipment
                if all(eq in venue.equipment for eq in required_equipment):
                    venue.distance = distance
                    ranked_venues.append(venue)

        # Sort venues by distance and relevance
        ranked_venues.sort(key=lambda x: (
            x.distance,
            -len(set(x.features) & self._get_workout_type_features(workout_type)),
            -x.rating
        ))

        # Return top 5 venues
        return [{
            "name": venue.name,
            "type": venue.venue_type,
            "coordinates": {"lat": venue.latitude, "lng": venue.longitude},
            "distance": venue.distance,
            "equipment": venue.equipment,
            "features": venue.features,
            "rating": venue.rating,
            "open_hours": venue.open_hours
        } for venue in ranked_venues[:5]]

    def _calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """Calculate distance between two points using Haversine formula."""
        R = 6371000  # Earth's radius in meters

        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi/2) * math.sin(delta_phi/2) + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(delta_lambda/2) * math.sin(delta_lambda/2)
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    def _get_workout_type_features(self, workout_type: WorkoutType) -> set:
        """Get relevant features for a workout type."""
        feature_map = {
            WorkoutType.CALISTHENICS: {"outdoor", "calisthenics-friendly", "free"},
            WorkoutType.GYM_BASED: {"indoor", "equipment-rich", "climate-controlled"},
            WorkoutType.HIIT: {"open space", "climate-controlled", "equipment-optional"},
            WorkoutType.STRENGTH: {"equipment-rich", "weights-available"},
            WorkoutType.CARDIO: {"running-track", "cardio-equipment", "open space"},
            WorkoutType.FLEXIBILITY: {"quiet", "spacious", "climate-controlled"}
        }
        return feature_map.get(workout_type, set())

    def _select_best_exercise(
        self,
        exercises: List[Exercise],
        goal: FitnessGoal,
        time_remaining: int
    ) -> Optional[Exercise]:
        """Select the best exercise based on goal and time constraints."""
        for exercise in exercises:
            time_needed = self._calculate_exercise_time(exercise)
            if time_needed <= time_remaining:
                return exercise
        return None

    def _calculate_exercise_time(self, exercise: Exercise) -> int:
        """Calculate total time needed for an exercise including rest."""
        if exercise.duration:
            return exercise.duration + exercise.rest_period
        else:
            return (exercise.sets * exercise.reps * 3) + (exercise.sets * exercise.rest_period)

    def _calculate_workout_intensity(self, exercises: List[Exercise]) -> str:
        """Calculate overall workout intensity."""
        intensity_scores = {"low": 1, "moderate": 2, "high": 3}
        avg_intensity = sum(intensity_scores[ex.intensity] for ex in exercises) / len(exercises)
        return "high" if avg_intensity > 2.5 else "moderate" if avg_intensity > 1.5 else "low"

    def _estimate_calories_burned(self, exercises: List[Exercise]) -> int:
        """Estimate calories burned during workout."""
        # Simplified calculation - would need to account for user's weight and other factors
        intensity_multipliers = {"low": 3, "moderate": 5, "high": 7}
        total_calories = 0
        for exercise in exercises:
            time_in_minutes = self._calculate_exercise_time(exercise) / 60
            total_calories += time_in_minutes * intensity_multipliers[exercise.intensity]
        return int(total_calories)

    def _select_meal(self, meals: List[Meal], target_calories: float) -> Optional[Meal]:
        """Select appropriate meal based on calorie target."""
        if not meals:
            return None
        return min(meals, key=lambda m: abs(m.calories - target_calories))

    def _calculate_total_macros(self, meals: Dict[str, Meal]) -> Dict[str, float]:
        """Calculate total macronutrients from selected meals."""
        totals = {"protein": 0, "carbs": 0, "fats": 0}
        for meal in meals.values():
            if meal:
                for macro, value in meal.macros.items():
                    totals[macro] += value
        return totals

    def _calculate_water_intake(self, calorie_target: int) -> int:
        """Calculate recommended daily water intake in milliliters."""
        # Basic calculation: 30-35ml per kg of body weight
        # Estimated weight from calorie target
        estimated_weight = calorie_target / 30  # rough estimation
        return int(estimated_weight * 33)  # middle of range 