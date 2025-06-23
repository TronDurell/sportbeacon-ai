import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from config.sportRules import (
    getSportRule,
    getSportStats,
    getSportScoringMetrics,
    getSportDrillCategories,
    getSportAchievementTypes,
    getSportColorScheme,
    getSportIcon,
    isTeamSport,
    hasPositions,
    getSportPositions,
    formatSportStat,
    getAvailableSports,
    validateSportStat,
    sportRules,
    defaultSportRule
)

class TestSportRules(unittest.TestCase):
    """Test cases for sport rules configuration and helper functions."""

    def setUp(self):
        """Set up test fixtures."""
        self.known_sports = ['basketball', 'soccer', 'track', 'boxing', 'tennis', 'mma', 'swimming', 'volleyball', 'baseball', 'football']
        self.unknown_sport = 'unknown_sport'

    def test_get_sport_rule_known_sports(self):
        """Test getting sport rules for known sports."""
        for sport in self.known_sports:
            rule = getSportRule(sport)
            self.assertIsNotNone(rule)
            self.assertEqual(rule.name, sport)
            self.assertIsInstance(rule.displayName, str)
            self.assertIsInstance(rule.primaryStats, list)
            self.assertIsInstance(rule.secondaryStats, list)
            self.assertIsInstance(rule.scoringMetrics, list)

    def test_get_sport_rule_unknown_sport(self):
        """Test getting sport rule for unknown sport returns default."""
        rule = getSportRule(self.unknown_sport)
        self.assertEqual(rule.name, 'default')
        self.assertEqual(rule.displayName, 'Other Sport')

    def test_get_sport_rule_case_insensitive(self):
        """Test that sport rule lookup is case insensitive."""
        rule1 = getSportRule('BASKETBALL')
        rule2 = getSportRule('basketball')
        self.assertEqual(rule1.name, rule2.name)

    def test_get_sport_rule_whitespace_handling(self):
        """Test that sport rule lookup handles whitespace."""
        rule1 = getSportRule(' basketball ')
        rule2 = getSportRule('basketball')
        self.assertEqual(rule1.name, rule2.name)

    def test_get_sport_stats(self):
        """Test getting sport stats."""
        basketball_stats = getSportStats('basketball')
        self.assertIn('points', basketball_stats)
        self.assertIn('rebounds', basketball_stats)
        self.assertIn('assists', basketball_stats)

        soccer_stats = getSportStats('soccer')
        self.assertIn('goals', soccer_stats)
        self.assertIn('assists', soccer_stats)
        self.assertIn('tackles', soccer_stats)

    def test_get_sport_scoring_metrics(self):
        """Test getting sport scoring metrics."""
        basketball_metrics = getSportScoringMetrics('basketball')
        self.assertIn('points_per_game', basketball_metrics)
        self.assertIn('efficiency_rating', basketball_metrics)

        track_metrics = getSportScoringMetrics('track')
        self.assertIn('time_improvement', track_metrics)
        self.assertIn('rank_progression', track_metrics)

    def test_get_sport_drill_categories(self):
        """Test getting sport drill categories."""
        basketball_drills = getSportDrillCategories('basketball')
        self.assertIn('shooting', basketball_drills)
        self.assertIn('dribbling', basketball_drills)
        self.assertIn('defense', basketball_drills)

        soccer_drills = getSportDrillCategories('soccer')
        self.assertIn('passing', soccer_drills)
        self.assertIn('shooting', soccer_drills)
        self.assertIn('dribbling', soccer_drills)

    def test_get_sport_achievement_types(self):
        """Test getting sport achievement types."""
        basketball_achievements = getSportAchievementTypes('basketball')
        self.assertIn('scoring_milestone', basketball_achievements)
        self.assertIn('defensive_excellence', basketball_achievements)

        boxing_achievements = getSportAchievementTypes('boxing')
        self.assertIn('knockout', boxing_achievements)
        self.assertIn('technical_victory', boxing_achievements)

    def test_get_sport_color_scheme(self):
        """Test getting sport color scheme."""
        basketball_colors = getSportColorScheme('basketball')
        self.assertIn('primary', basketball_colors)
        self.assertIn('secondary', basketball_colors)
        self.assertIn('accent', basketball_colors)
        self.assertIsInstance(basketball_colors['primary'], str)
        self.assertTrue(basketball_colors['primary'].startswith('#'))

    def test_get_sport_icon(self):
        """Test getting sport icon."""
        basketball_icon = getSportIcon('basketball')
        self.assertEqual(basketball_icon, '🏀')

        soccer_icon = getSportIcon('soccer')
        self.assertEqual(soccer_icon, '⚽')

    def test_is_team_sport(self):
        """Test team sport detection."""
        self.assertTrue(isTeamSport('basketball'))  # 5 players
        self.assertTrue(isTeamSport('soccer'))      # 11 players
        self.assertFalse(isTeamSport('track'))      # 1 player
        self.assertFalse(isTeamSport('boxing'))     # 1 player

    def test_has_positions(self):
        """Test position detection."""
        self.assertTrue(hasPositions('basketball'))
        self.assertTrue(hasPositions('soccer'))
        self.assertFalse(hasPositions('track'))
        self.assertFalse(hasPositions('boxing'))

    def test_get_sport_positions(self):
        """Test getting sport positions."""
        basketball_positions = getSportPositions('basketball')
        self.assertIn('point_guard', basketball_positions)
        self.assertIn('shooting_guard', basketball_positions)
        self.assertIn('center', basketball_positions)

        soccer_positions = getSportPositions('soccer')
        self.assertIn('goalkeeper', soccer_positions)
        self.assertIn('defender', soccer_positions)
        self.assertIn('midfielder', soccer_positions)

        # Individual sports should return empty list
        track_positions = getSportPositions('track')
        self.assertEqual(track_positions, [])

    def test_format_sport_stat(self):
        """Test stat formatting."""
        # Test percentage formatting
        self.assertEqual(formatSportStat('field_goal_percentage', 0.456, 'basketball'), '45.6%')
        self.assertEqual(formatSportStat('win_ratio', 0.75, 'tennis'), '75.0%')

        # Test time formatting
        self.assertEqual(formatSportStat('time', 12.34, 'track'), '12.34s')
        self.assertEqual(formatSportStat('duration', 125, 'swimming'), '2:05')

        # Test distance formatting
        self.assertEqual(formatSportStat('distance', 100.5, 'track'), '100.5m')
        self.assertEqual(formatSportStat('jump_distance', 25.3, 'track'), '25.3m')

        # Test regular number formatting
        self.assertEqual(formatSportStat('points', 25, 'basketball'), '25')

    def test_get_available_sports(self):
        """Test getting list of available sports."""
        sports = getAvailableSports()
        self.assertIsInstance(sports, list)
        self.assertGreater(len(sports), 0)
        for sport in self.known_sports:
            self.assertIn(sport, sports)

    def test_validate_sport_stat(self):
        """Test stat validation."""
        # Valid basketball stats
        self.assertTrue(validateSportStat('points', 'basketball'))
        self.assertTrue(validateSportStat('rebounds', 'basketball'))
        self.assertTrue(validateSportStat('assists', 'basketball'))

        # Valid soccer stats
        self.assertTrue(validateSportStat('goals', 'soccer'))
        self.assertTrue(validateSportStat('assists', 'soccer'))
        self.assertTrue(validateSportStat('tackles', 'soccer'))

        # Invalid stats
        self.assertFalse(validateSportStat('invalid_stat', 'basketball'))
        self.assertFalse(validateSportStat('points', 'soccer'))

    def test_sport_rules_structure(self):
        """Test that all sport rules have required structure."""
        for sport_name, rule in sportRules.items():
            # Test required fields
            self.assertIsInstance(rule.name, str)
            self.assertIsInstance(rule.displayName, str)
            self.assertIsInstance(rule.primaryStats, list)
            self.assertIsInstance(rule.secondaryStats, list)
            self.assertIsInstance(rule.scoringMetrics, list)
            self.assertIsInstance(rule.performanceIndicators, list)
            self.assertIsInstance(rule.drillCategories, list)
            self.assertIsInstance(rule.achievementTypes, list)
            self.assertIsInstance(rule.colorScheme, dict)
            self.assertIsInstance(rule.icon, str)
            self.assertIsInstance(rule.unitSystem, str)
            self.assertIsInstance(rule.timeFormat, str)
            self.assertIsInstance(rule.teamSize, int)
            self.assertIsInstance(rule.hasPositions, bool)
            self.assertIsInstance(rule.seasonType, str)

            # Test color scheme structure
            self.assertIn('primary', rule.colorScheme)
            self.assertIn('secondary', rule.colorScheme)
            self.assertIn('accent', rule.colorScheme)

            # Test valid unit system
            self.assertIn(rule.unitSystem, ['metric', 'imperial', 'mixed'])

            # Test valid time format
            self.assertIn(rule.timeFormat, ['seconds', 'minutes', 'periods'])

            # Test valid season type
            self.assertIn(rule.seasonType, ['continuous', 'seasonal', 'tournament'])

            # Test team size is positive
            self.assertGreater(rule.teamSize, 0)

            # Test positions if sport has positions
            if rule.hasPositions:
                self.assertIsInstance(rule.positions, list)
                self.assertGreater(len(rule.positions), 0)

    def test_default_sport_rule(self):
        """Test default sport rule structure."""
        self.assertEqual(defaultSportRule.name, 'default')
        self.assertEqual(defaultSportRule.displayName, 'Other Sport')
        self.assertIsInstance(defaultSportRule.primaryStats, list)
        self.assertIsInstance(defaultSportRule.secondaryStats, list)
        self.assertIsInstance(defaultSportRule.scoringMetrics, list)
        self.assertFalse(defaultSportRule.hasPositions)
        self.assertEqual(defaultSportRule.teamSize, 1)

    def test_sport_specific_validation(self):
        """Test sport-specific validation scenarios."""
        # Basketball specific tests
        basketball_rule = getSportRule('basketball')
        self.assertEqual(basketball_rule.teamSize, 5)
        self.assertTrue(basketball_rule.hasPositions)
        self.assertIn('point_guard', basketball_rule.positions)
        self.assertIn('points', basketball_rule.primaryStats)
        self.assertIn('field_goal_percentage', basketball_rule.secondaryStats)

        # Soccer specific tests
        soccer_rule = getSportRule('soccer')
        self.assertEqual(soccer_rule.teamSize, 11)
        self.assertTrue(soccer_rule.hasPositions)
        self.assertIn('goalkeeper', soccer_rule.positions)
        self.assertIn('goals', soccer_rule.primaryStats)
        self.assertIn('pass_accuracy', soccer_rule.secondaryStats)

        # Track specific tests
        track_rule = getSportRule('track')
        self.assertEqual(track_rule.teamSize, 1)
        self.assertFalse(track_rule.hasPositions)
        self.assertIn('time', track_rule.primaryStats)
        self.assertIn('distance', track_rule.primaryStats)

    def test_edge_cases(self):
        """Test edge cases and error handling."""
        # Empty string
        rule = getSportRule('')
        self.assertEqual(rule.name, 'default')

        # None value
        rule = getSportRule(None)
        self.assertEqual(rule.name, 'default')

        # Very long sport name
        long_sport = 'a' * 1000
        rule = getSportRule(long_sport)
        self.assertEqual(rule.name, 'default')

        # Special characters
        rule = getSportRule('basketball!@#$%')
        self.assertEqual(rule.name, 'default')

    def test_stat_formatting_edge_cases(self):
        """Test stat formatting edge cases."""
        # Zero values
        self.assertEqual(formatSportStat('points', 0, 'basketball'), '0')
        self.assertEqual(formatSportStat('field_goal_percentage', 0, 'basketball'), '0.0%')

        # Negative values
        self.assertEqual(formatSportStat('points', -5, 'basketball'), '-5')
        self.assertEqual(formatSportStat('time', -12.34, 'track'), '-12.34s')

        # Very large values
        self.assertEqual(formatSportStat('points', 999999, 'basketball'), '999999')
        self.assertEqual(formatSportStat('distance', 999999.9, 'track'), '999999.9m')

        # Very small decimal values
        self.assertEqual(formatSportStat('field_goal_percentage', 0.001, 'basketball'), '0.1%')

    def test_performance_indicators(self):
        """Test performance indicators for different sports."""
        basketball_rule = getSportRule('basketball')
        self.assertIn('speed', basketball_rule.performanceIndicators)
        self.assertIn('agility', basketball_rule.performanceIndicators)
        self.assertIn('jump_height', basketball_rule.performanceIndicators)

        swimming_rule = getSportRule('swimming')
        self.assertIn('speed', swimming_rule.performanceIndicators)
        self.assertIn('endurance', swimming_rule.performanceIndicators)
        self.assertIn('technique', swimming_rule.performanceIndicators)
        self.assertIn('breathing', swimming_rule.performanceIndicators)

    def test_achievement_types_sport_specific(self):
        """Test that achievement types are sport-specific."""
        basketball_achievements = getSportAchievementTypes('basketball')
        self.assertIn('scoring_milestone', basketball_achievements)
        self.assertIn('defensive_excellence', basketball_achievements)
        self.assertNotIn('knockout', basketball_achievements)  # Boxing specific

        boxing_achievements = getSportAchievementTypes('boxing')
        self.assertIn('knockout', boxing_achievements)
        self.assertIn('technical_victory', boxing_achievements)
        self.assertNotIn('scoring_milestone', boxing_achievements)  # Basketball specific

if __name__ == '__main__':
    unittest.main() 