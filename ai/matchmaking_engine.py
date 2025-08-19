import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from itertools import combinations
from backend.models import PlayerProfile, TeamComposition, MatchmakingResponse


class MatchmakingEngine:
    def __init__(self):
        self.scaler = StandardScaler()
        self._skill_weights = {
            'points': 0.3,
            'assists': 0.2,
            'rebounds': 0.15,
            'steals': 0.15,
            'blocks': 0.1,
            'field_goal_percentage': 0.05,
            'three_point_percentage': 0.05,
        }
        self.position_requirements = {
            3: {'guard': 1, 'forward': 1, 'center': 1},
            5: {'guard': 2, 'forward': 2, 'center': 1},
        }

        self.balance_weights = {
            'skill_gap': 0.6,
            'position_balance': 0.4,
        }

    def calculate_overall_rating(self, player: PlayerProfile) -> float:
        """Calculate weighted overall rating from player skills."""
        skill_map: Dict[str, float] = getattr(player, 'skill_scores', None) or getattr(player, 'skill_ratings', {})
        overall_rating = 0.0
        for skill, rating in skill_map.items():
            if skill in self._skill_weights:
                overall_rating += float(rating) * self._skill_weights[skill]
        return float(overall_rating)

    def find_available_players(
        self,
        players: List[PlayerProfile],
        game_time: datetime,
        tolerance_minutes: int = 30,
    ) -> List[PlayerProfile]:
        """Filter players based on availability window around game_time."""
        available: List[PlayerProfile] = []
        time_window = timedelta(minutes=tolerance_minutes)
        for player in players:
            availability = getattr(player, 'availability', [])
            for slot in availability:
                if abs(slot - game_time) <= time_window:
                    available.append(player)
                    break
        return available

    def _calculate_team_stats(self, team: List[PlayerProfile]) -> TeamComposition:
        total_skill = sum(player.overall_rating for player in team)
        avg_skill = total_skill / len(team)
        positions = {
            'guard': sum(1 for p in team if p.position == 'guard'),
            'forward': sum(1 for p in team if p.position == 'forward'),
            'center': sum(1 for p in team if p.position == 'center'),
        }
        return TeamComposition(
            players=team,
            total_skill=total_skill,
            average_skill=avg_skill,
            positions=positions,
        )

    def _evaluate_team_balance(
        self,
        team1: TeamComposition,
        team2: TeamComposition,
        consider_positions: bool = True,
    ) -> Tuple[float, bool]:
        skill_gap = abs(team1.total_skill - team2.total_skill)
        max_possible_gap = max(team1.total_skill, team2.total_skill)
        normalized_skill_gap = 1 - (skill_gap / max_possible_gap if max_possible_gap > 0 else 0)

        position_balance = 1.0
        if consider_positions:
            diffs = []
            for pos in ['guard', 'forward', 'center']:
                a, b = team1.positions[pos], team2.positions[pos]
                diffs.append(1 - (abs(a - b) / max(a, b) if max(a, b) > 0 else 0))
            position_balance = sum(diffs) / len(diffs)

        balance_score = (
            self.balance_weights['skill_gap'] * normalized_skill_gap +
            self.balance_weights['position_balance'] * position_balance
        )
        return balance_score, balance_score >= 0.8

    def create_balanced_teams(
        self,
        players: List[PlayerProfile],
        team_size: int = 3,
        consider_positions: bool = True,
    ) -> MatchmakingResponse:
        if team_size not in [3, 5]:
            raise ValueError("Team size must be either 3 or 5")
        if len(players) < team_size * 2:
            raise ValueError(f"Need at least {team_size * 2} players")

        sorted_players = sorted(players, key=lambda x: x.overall_rating, reverse=True)

        best_teams: Optional[Tuple[TeamComposition, TeamComposition]] = None
        best_balance = 0.0

        for team1_players in combinations(sorted_players, team_size):
            remaining = [p for p in sorted_players if p not in team1_players]
            for team2_players in combinations(remaining, team_size):
                team1 = self._calculate_team_stats(list(team1_players))
                team2 = self._calculate_team_stats(list(team2_players))

                balance_score, _ = self._evaluate_team_balance(team1, team2, consider_positions)
                if balance_score > best_balance:
                    best_balance = balance_score
                    best_teams = (team1, team2)
                    if balance_score > 0.95:
                        break
            if best_balance > 0.95:
                break

        if not best_teams:
            raise ValueError("Could not find balanced teams")

        team1, team2 = best_teams
        skill_gap = abs(team1.total_skill - team2.total_skill)
        return MatchmakingResponse(
            team1=team1,
            team2=team2,
            skill_gap=skill_gap,
            is_balanced=best_balance >= 0.8,
            balance_score=best_balance,
        )

    def suggest_game_time(
        self,
        players: List[PlayerProfile],
        team_size: int = 3,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Optional[datetime]:
        if not start_time:
            start_time = datetime.now()
        if not end_time:
            end_time = start_time + timedelta(days=7)

        all_slots = set()
        for player in players:
            availability = getattr(player, 'availability', [])
            for slot in availability:
                if start_time <= slot <= end_time:
                    all_slots.add(slot)

        best_slot: Optional[datetime] = None
        max_available = 0
        for slot in sorted(all_slots):
            available = len(self.find_available_players(players, slot))
            if available >= team_size * 2 and available > max_available:
                best_slot = slot
                max_available = available
        return best_slot

    @staticmethod
    def generate_mock_players(num_players: int = 10) -> List[PlayerProfile]:
        positions = ['guard', 'forward', 'center']
        players: List[PlayerProfile] = []
        for i in range(num_players):
            skill_scores = {
                'points': np.random.normal(50, 15),
                'assists': np.random.normal(50, 15),
                'rebounds': np.random.normal(50, 15),
                'steals': np.random.normal(50, 15),
                'blocks': np.random.normal(50, 15),
                'field_goal_percentage': np.random.normal(50, 10),
                'three_point_percentage': np.random.normal(35, 8),
            }
            skill_scores = {k: max(0, min(100, v)) for k, v in skill_scores.items()}
            overall_rating = (
                0.3 * skill_scores['points'] +
                0.2 * skill_scores['assists'] +
                0.2 * skill_scores['rebounds'] +
                0.15 * skill_scores['steals'] +
                0.15 * skill_scores['blocks']
            )
            players.append(PlayerProfile(
                player_id=i + 1,
                name=f"Player_{i + 1}",
                position=positions[i % len(positions)],
                skill_scores=skill_scores,
                overall_rating=overall_rating,
            ))
        return players

