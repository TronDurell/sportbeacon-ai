from datetime import datetime, timedelta
from itertools import combinations
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np
from backend.models import MatchmakingResponse, PlayerProfile, TeamComposition


class MatchmakingEngine:
    # Cap keeps 3v3/5v5 partition search well under ~10k evaluations
    # (C(12, 6) unique 3v3 rosters, C(12, 10) unique 5v5 rosters).
    MAX_POOL_SIZE = 12

    def __init__(self):
        self._skill_weights = {
            "points": 0.3,
            "assists": 0.2,
            "rebounds": 0.15,
            "steals": 0.15,
            "blocks": 0.1,
            "field_goal_percentage": 0.05,
            "three_point_percentage": 0.05,
        }
        self.position_requirements = {
            3: {"guard": 1, "forward": 1, "center": 1},
            5: {"guard": 2, "forward": 2, "center": 1},
        }
        self.balance_weights = {
            "skill_gap": 0.6,
            "position_balance": 0.4,
        }

    def calculate_overall_rating(self, player: PlayerProfile) -> float:
        """Calculate weighted overall rating from player skills."""
        skill_map: Dict[str, float] = getattr(player, "skill_scores", None) or getattr(
            player, "skill_ratings", {}
        )
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
            availability = getattr(player, "availability", [])
            for slot in availability:
                if abs(slot - game_time) <= time_window:
                    available.append(player)
                    break
        return available

    def _unique_players(self, players: Sequence[PlayerProfile]) -> List[PlayerProfile]:
        unique: List[PlayerProfile] = []
        seen = set()
        for player in players:
            if player.player_id in seen:
                continue
            seen.add(player.player_id)
            unique.append(player)
        return unique

    def _player_ids(self, players: Iterable[PlayerProfile]) -> Tuple[int, ...]:
        return tuple(sorted(p.player_id for p in players))

    def _calculate_team_stats(self, team: List[PlayerProfile]) -> TeamComposition:
        total_skill = sum(player.overall_rating for player in team)
        avg_skill = total_skill / len(team) if team else 0.0
        positions = {
            "guard": sum(1 for p in team if p.position == "guard"),
            "forward": sum(1 for p in team if p.position == "forward"),
            "center": sum(1 for p in team if p.position == "center"),
        }
        return TeamComposition(
            players=team,
            total_skill=total_skill,
            average_skill=avg_skill,
            positions=positions,
        )

    def _position_requirement_score(self, team: TeamComposition, team_size: int) -> float:
        requirements = self.position_requirements.get(team_size)
        if not requirements:
            return 1.0
        deviation = 0
        for position, required in requirements.items():
            actual = team.positions.get(position, 0)
            deviation += abs(actual - required)
        max_deviation = 2 * team_size
        if max_deviation <= 0:
            return 1.0
        return max(0.0, 1.0 - (deviation / max_deviation))

    def _evaluate_team_balance(
        self,
        team1: TeamComposition,
        team2: TeamComposition,
        consider_positions: bool = True,
        team_size: Optional[int] = None,
    ) -> Tuple[float, bool]:
        skill_gap = abs(team1.total_skill - team2.total_skill)
        max_possible_gap = max(team1.total_skill, team2.total_skill)
        normalized_skill_gap = 1 - (
            skill_gap / max_possible_gap if max_possible_gap > 0 else 0
        )

        position_balance = 1.0
        if consider_positions:
            size = team_size or len(team1.players)
            position_balance = (
                self._position_requirement_score(team1, size)
                + self._position_requirement_score(team2, size)
            ) / 2.0

        balance_score = (
            self.balance_weights["skill_gap"] * normalized_skill_gap
            + self.balance_weights["position_balance"] * position_balance
        )
        return balance_score, balance_score >= 0.8

    def _partition_sort_key(
        self, team1: TeamComposition, team2: TeamComposition
    ) -> Tuple[Tuple[int, ...], Tuple[int, ...]]:
        ids1 = self._player_ids(team1.players)
        ids2 = self._player_ids(team2.players)
        return (ids1, ids2) if ids1 <= ids2 else (ids2, ids1)

    def create_balanced_teams(
        self,
        players: List[PlayerProfile],
        team_size: int = 3,
        consider_positions: bool = True,
    ) -> MatchmakingResponse:
        if team_size not in [3, 5]:
            raise ValueError("Team size must be either 3 or 5")

        unique_players = self._unique_players(players)
        if len(unique_players) < team_size * 2:
            raise ValueError(f"Need at least {team_size * 2} players")

        ranked = sorted(
            unique_players, key=lambda player: (-player.overall_rating, player.player_id)
        )
        pool = ranked[: self.MAX_POOL_SIZE]
        needed = team_size * 2

        best_teams: Optional[Tuple[TeamComposition, TeamComposition]] = None
        best_balance = -1.0
        best_key: Optional[Tuple[Tuple[int, ...], Tuple[int, ...]]] = None

        for roster in combinations(pool, needed):
            roster_list = list(roster)
            for team1_players in combinations(roster_list, team_size):
                team1_ids = {player.player_id for player in team1_players}
                team2_players = [player for player in roster_list if player.player_id not in team1_ids]
                if min(p.player_id for p in team1_players) > min(p.player_id for p in team2_players):
                    continue

                team1 = self._calculate_team_stats(list(team1_players))
                team2 = self._calculate_team_stats(team2_players)
                balance_score, _ = self._evaluate_team_balance(
                    team1, team2, consider_positions, team_size
                )
                partition_key = self._partition_sort_key(team1, team2)
                better_score = balance_score > best_balance + 1e-12
                tied_but_stable = (
                    abs(balance_score - best_balance) <= 1e-12
                    and (best_key is None or partition_key < best_key)
                )
                if better_score or tied_but_stable:
                    best_balance = balance_score
                    best_teams = (team1, team2)
                    best_key = partition_key

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
            availability = getattr(player, "availability", [])
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
        positions = ["guard", "forward", "center"]
        players: List[PlayerProfile] = []
        for i in range(num_players):
            skill_scores = {
                "points": np.random.normal(50, 15),
                "assists": np.random.normal(50, 15),
                "rebounds": np.random.normal(50, 15),
                "steals": np.random.normal(50, 15),
                "blocks": np.random.normal(50, 15),
                "field_goal_percentage": np.random.normal(50, 10),
                "three_point_percentage": np.random.normal(35, 8),
            }
            skill_scores = {k: max(0, min(100, v)) for k, v in skill_scores.items()}
            overall_rating = (
                0.3 * skill_scores["points"]
                + 0.2 * skill_scores["assists"]
                + 0.2 * skill_scores["rebounds"]
                + 0.15 * skill_scores["steals"]
                + 0.15 * skill_scores["blocks"]
            )
            players.append(
                PlayerProfile(
                    player_id=i + 1,
                    name=f"Player_{i + 1}",
                    position=positions[i % len(positions)],
                    skill_scores=skill_scores,
                    overall_rating=overall_rating,
                )
            )
        return players
