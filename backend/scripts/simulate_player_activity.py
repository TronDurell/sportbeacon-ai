#!/usr/bin/env python3
"""
SportBeaconAI Player Activity Simulation Script
Simulates realistic player behavior for testing and development
"""

import asyncio
import random
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import firebase_admin
from firebase_admin import firestore
import requests
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase
db = firestore.client()

# Simulation Configuration
SIMULATION_CONFIG = {
    'num_players': 100,
    'simulation_days': 30,
    'active_hours': {
        'start': 6,  # 6 AM
        'end': 22    # 10 PM
    },
    'activity_probabilities': {
        'daily_login': 0.85,
        'drill_completion': 0.70,
        'highlight_upload': 0.30,
        'social_interaction': 0.60,
        'tip_given': 0.20,
        'tip_received': 0.15,
        'achievement_earned': 0.10,
        'streak_continued': 0.80
    },
    'sports_distribution': {
        'basketball': 0.25,
        'soccer': 0.20,
        'volleyball': 0.15,
        'baseball': 0.15,
        'football': 0.10,
        'tennis': 0.08,
        'track': 0.07
    },
    'performance_levels': {
        'beginner': 0.30,
        'intermediate': 0.45,
        'advanced': 0.20,
        'elite': 0.05
    }
}

class PlayerActivitySimulator:
    def __init__(self):
        self.players = []
        self.simulation_data = {
            'start_time': None,
            'end_time': None,
            'total_activities': 0,
            'activities_by_type': {},
            'performance_metrics': {}
        }

    async def run_simulation(self, config: Dict = None) -> Dict[str, Any]:
        """Run the complete player activity simulation"""
        try:
            logger.info("Starting SportBeaconAI Player Activity Simulation")
            
            # Use provided config or default
            sim_config = config or SIMULATION_CONFIG
            self.simulation_data['start_time'] = datetime.now()

            # Generate players
            await self.generate_players(sim_config['num_players'])
            
            # Run daily simulations
            for day in range(sim_config['simulation_days']):
                logger.info(f"Simulating day {day + 1}/{sim_config['simulation_days']}")
                await self.simulate_day(day, sim_config)
                
                # Small delay to prevent overwhelming the system
                await asyncio.sleep(0.1)

            # Generate simulation report
            self.simulation_data['end_time'] = datetime.now()
            report = await self.generate_simulation_report()
            
            logger.info("Simulation completed successfully")
            return report

        except Exception as e:
            logger.error(f"Error running simulation: {e}")
            return {'error': str(e)}

    async def generate_players(self, num_players: int) -> None:
        """Generate simulated players with realistic profiles"""
        try:
            logger.info(f"Generating {num_players} simulated players")
            
            for i in range(num_players):
                player = await self.create_player_profile(i)
                self.players.append(player)
                
                # Save player to database
                await self.save_player_to_db(player)
                
                if (i + 1) % 10 == 0:
                    logger.info(f"Generated {i + 1}/{num_players} players")

        except Exception as e:
            logger.error(f"Error generating players: {e}")

    async def create_player_profile(self, player_id: int) -> Dict[str, Any]:
        """Create a realistic player profile"""
        try:
            # Generate basic info
            first_names = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake', 'Cameron']
            last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
            
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            username = f"{first_name.lower()}{last_name.lower()}{random.randint(100, 999)}"
            
            # Assign sport and performance level
            sport = self.weighted_choice(SIMULATION_CONFIG['sports_distribution'])
            performance_level = self.weighted_choice(SIMULATION_CONFIG['performance_levels'])
            
            # Generate realistic stats based on performance level
            stats = self.generate_performance_stats(performance_level, sport)
            
            # Generate age and experience
            age = random.randint(12, 35)
            experience_years = max(1, age - 8)
            
            player = {
                'id': f"sim_player_{player_id}",
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'email': f"{username}@simulation.sportbeacon.ai",
                'age': age,
                'sport': sport,
                'performance_level': performance_level,
                'experience_years': experience_years,
                'stats': stats,
                'created_at': datetime.now(),
                'last_active': datetime.now(),
                'current_streak': 0,
                'total_drills_completed': 0,
                'total_highlights': 0,
                'total_tips_given': 0,
                'total_tips_received': 0,
                'total_achievements': 0,
                'beacon_balance': 0,
                'followers': 0,
                'following': 0,
                'team_id': None,
                'is_simulated': True
            }
            
            return player

        except Exception as e:
            logger.error(f"Error creating player profile: {e}")
            return {}

    def weighted_choice(self, choices: Dict[str, float]) -> str:
        """Make a weighted random choice"""
        items = list(choices.items())
        weights = [item[1] for item in items]
        return random.choices(items, weights=weights)[0][0]

    def generate_performance_stats(self, level: str, sport: str) -> Dict[str, Any]:
        """Generate realistic performance stats based on level and sport"""
        base_stats = {
            'beginner': {'min': 30, 'max': 60},
            'intermediate': {'min': 55, 'max': 80},
            'advanced': {'min': 75, 'max': 90},
            'elite': {'min': 85, 'max': 100}
        }
        
        level_range = base_stats[level]
        
        # Sport-specific stats
        if sport == 'basketball':
            stats = {
                'shooting_percentage': random.randint(level_range['min'], level_range['max']),
                'free_throw_percentage': random.randint(level_range['min'], level_range['max']),
                'rebounds_per_game': random.randint(3, 12),
                'assists_per_game': random.randint(2, 8),
                'steals_per_game': random.randint(1, 4),
                'blocks_per_game': random.randint(0, 3)
            }
        elif sport == 'soccer':
            stats = {
                'passing_accuracy': random.randint(level_range['min'], level_range['max']),
                'shooting_accuracy': random.randint(level_range['min'], level_range['max']),
                'dribbling_skill': random.randint(level_range['min'], level_range['max']),
                'tackles_per_game': random.randint(2, 8),
                'goals_per_game': random.randint(0, 2),
                'assists_per_game': random.randint(0, 3)
            }
        else:
            # Generic stats for other sports
            stats = {
                'overall_skill': random.randint(level_range['min'], level_range['max']),
                'speed': random.randint(level_range['min'], level_range['max']),
                'strength': random.randint(level_range['min'], level_range['max']),
                'endurance': random.randint(level_range['min'], level_range['max']),
                'coordination': random.randint(level_range['min'], level_range['max'])
            }
        
        return stats

    async def save_player_to_db(self, player: Dict[str, Any]) -> None:
        """Save player to Firestore database"""
        try:
            db.collection('users').document(player['id']).set(player)
        except Exception as e:
            logger.error(f"Error saving player to DB: {e}")

    async def simulate_day(self, day: int, config: Dict) -> None:
        """Simulate a full day of player activities"""
        try:
            current_date = datetime.now() - timedelta(days=config['simulation_days'] - day - 1)
            
            for player in self.players:
                # Determine if player is active today
                if random.random() < config['activity_probabilities']['daily_login']:
                    await self.simulate_player_day(player, current_date, config)
                
                # Small delay between players
                await asyncio.sleep(0.01)

        except Exception as e:
            logger.error(f"Error simulating day {day}: {e}")

    async def simulate_player_day(self, player: Dict[str, Any], date: datetime, config: Dict) -> None:
        """Simulate a single player's activities for the day"""
        try:
            activities = []
            
            # Determine active hours for this player
            active_start = random.randint(config['active_hours']['start'], 10)
            active_end = random.randint(18, config['active_hours']['end'])
            
            # Simulate login
            login_time = date.replace(hour=active_start, minute=random.randint(0, 59))
            activities.append({
                'type': 'login',
                'timestamp': login_time,
                'player_id': player['id']
            })
            
            # Simulate drills
            if random.random() < config['activity_probabilities']['drill_completion']:
                num_drills = random.randint(1, 5)
                for i in range(num_drills):
                    drill_time = login_time + timedelta(hours=random.randint(1, active_end - active_start))
                    await self.simulate_drill_completion(player, drill_time)
                    activities.append({
                        'type': 'drill_completion',
                        'timestamp': drill_time,
                        'player_id': player['id']
                    })
            
            # Simulate highlight upload
            if random.random() < config['activity_probabilities']['highlight_upload']:
                highlight_time = login_time + timedelta(hours=random.randint(2, active_end - active_start))
                await self.simulate_highlight_upload(player, highlight_time)
                activities.append({
                    'type': 'highlight_upload',
                    'timestamp': highlight_time,
                    'player_id': player['id']
                })
            
            # Simulate social interactions
            if random.random() < config['activity_probabilities']['social_interaction']:
                num_interactions = random.randint(1, 3)
                for i in range(num_interactions):
                    interaction_time = login_time + timedelta(hours=random.randint(1, active_end - active_start))
                    await self.simulate_social_interaction(player, interaction_time)
                    activities.append({
                        'type': 'social_interaction',
                        'timestamp': interaction_time,
                        'player_id': player['id']
                    })
            
            # Simulate tipping
            if random.random() < config['activity_probabilities']['tip_given']:
                tip_time = login_time + timedelta(hours=random.randint(1, active_end - active_start))
                await self.simulate_tip_given(player, tip_time)
                activities.append({
                    'type': 'tip_given',
                    'timestamp': tip_time,
                    'player_id': player['id']
                })
            
            # Simulate receiving tips
            if random.random() < config['activity_probabilities']['tip_received']:
                tip_time = login_time + timedelta(hours=random.randint(1, active_end - active_start))
                await self.simulate_tip_received(player, tip_time)
                activities.append({
                    'type': 'tip_received',
                    'timestamp': tip_time,
                    'player_id': player['id']
                })
            
            # Simulate achievements
            if random.random() < config['activity_probabilities']['achievement_earned']:
                achievement_time = login_time + timedelta(hours=random.randint(1, active_end - active_start))
                await self.simulate_achievement_earned(player, achievement_time)
                activities.append({
                    'type': 'achievement_earned',
                    'timestamp': achievement_time,
                    'player_id': player['id']
                })
            
            # Update player stats
            await self.update_player_stats(player, activities)
            
            # Track simulation data
            self.simulation_data['total_activities'] += len(activities)
            for activity in activities:
                activity_type = activity['type']
                if activity_type not in self.simulation_data['activities_by_type']:
                    self.simulation_data['activities_by_type'][activity_type] = 0
                self.simulation_data['activities_by_type'][activity_type] += 1

        except Exception as e:
            logger.error(f"Error simulating player day: {e}")

    async def simulate_drill_completion(self, player: Dict[str, Any], timestamp: datetime) -> None:
        """Simulate drill completion"""
        try:
            drill_types = ['shooting', 'passing', 'dribbling', 'defense', 'conditioning', 'tactics']
            drill_type = random.choice(drill_types)
            
            # Generate realistic drill performance
            base_score = player['stats'].get('overall_skill', 70)
            performance_variance = random.randint(-20, 20)
            drill_score = max(0, min(100, base_score + performance_variance))
            
            drill_data = {
                'player_id': player['id'],
                'drill_type': drill_type,
                'sport': player['sport'],
                'score': drill_score,
                'duration': random.randint(300, 1800),  # 5-30 minutes
                'timestamp': timestamp,
                'is_simulated': True
            }
            
            # Save to database
            db.collection('drill_logs').add(drill_data)
            
            # Update player stats
            player['total_drills_completed'] += 1
            player['beacon_balance'] += random.randint(5, 15)

        except Exception as e:
            logger.error(f"Error simulating drill completion: {e}")

    async def simulate_highlight_upload(self, player: Dict[str, Any], timestamp: datetime) -> None:
        """Simulate highlight upload"""
        try:
            highlight_titles = [
                f"Amazing {player['sport']} play!",
                f"Best {player['sport']} moment",
                f"Incredible {player['sport']} highlight",
                f"Epic {player['sport']} play",
                f"Unbelievable {player['sport']} move"
            ]
            
            highlight_data = {
                'player_id': player['id'],
                'title': random.choice(highlight_titles),
                'description': f"Check out this amazing {player['sport']} play!",
                'sport': player['sport'],
                'video_url': f"https://simulation.sportbeacon.ai/videos/{player['id']}_{timestamp.timestamp()}.mp4",
                'thumbnail_url': f"https://simulation.sportbeacon.ai/thumbnails/{player['id']}_{timestamp.timestamp()}.jpg",
                'timestamp': timestamp,
                'views': random.randint(10, 1000),
                'likes': random.randint(0, 100),
                'comments': random.randint(0, 20),
                'is_simulated': True
            }
            
            # Save to database
            db.collection('highlights').add(highlight_data)
            
            # Update player stats
            player['total_highlights'] += 1
            player['beacon_balance'] += random.randint(10, 25)

        except Exception as e:
            logger.error(f"Error simulating highlight upload: {e}")

    async def simulate_social_interaction(self, player: Dict[str, Any], timestamp: datetime) -> None:
        """Simulate social interaction (like, comment, follow)"""
        try:
            interaction_types = ['like', 'comment', 'follow']
            interaction_type = random.choice(interaction_types)
            
            # Find another player to interact with
            other_players = [p for p in self.players if p['id'] != player['id']]
            if other_players:
                target_player = random.choice(other_players)
                
                interaction_data = {
                    'from_player_id': player['id'],
                    'to_player_id': target_player['id'],
                    'type': interaction_type,
                    'timestamp': timestamp,
                    'is_simulated': True
                }
                
                # Save to database
                db.collection('social_interactions').add(interaction_data)
                
                # Update player stats
                if interaction_type == 'follow':
                    player['following'] += 1
                    target_player['followers'] += 1
                
                player['beacon_balance'] += random.randint(1, 3)

        except Exception as e:
            logger.error(f"Error simulating social interaction: {e}")

    async def simulate_tip_given(self, player: Dict[str, Any], timestamp: datetime) -> None:
        """Simulate giving a tip"""
        try:
            # Find another player to tip
            other_players = [p for p in self.players if p['id'] != player['id']]
            if other_players and player['beacon_balance'] > 10:
                target_player = random.choice(other_players)
                tip_amount = random.randint(5, min(50, player['beacon_balance']))
                
                tip_data = {
                    'from_player_id': player['id'],
                    'to_player_id': target_player['id'],
                    'amount': tip_amount,
                    'timestamp': timestamp,
                    'is_simulated': True
                }
                
                # Save to database
                db.collection('tips').add(tip_data)
                
                # Update player stats
                player['beacon_balance'] -= tip_amount
                player['total_tips_given'] += 1
                target_player['beacon_balance'] += tip_amount
                target_player['total_tips_received'] += 1

        except Exception as e:
            logger.error(f"Error simulating tip given: {e}")

    async def simulate_tip_received(self, player: Dict[str, Any], timestamp: datetime) -> None:
        """Simulate receiving a tip"""
        try:
            # Find another player to receive tip from
            other_players = [p for p in self.players if p['id'] != player['id']]
            if other_players:
                from_player = random.choice(other_players)
                tip_amount = random.randint(5, 25)
                
                if from_player['beacon_balance'] >= tip_amount:
                    tip_data = {
                        'from_player_id': from_player['id'],
                        'to_player_id': player['id'],
                        'amount': tip_amount,
                        'timestamp': timestamp,
                        'is_simulated': True
                    }
                    
                    # Save to database
                    db.collection('tips').add(tip_data)
                    
                    # Update player stats
                    player['beacon_balance'] += tip_amount
                    player['total_tips_received'] += 1
                    from_player['beacon_balance'] -= tip_amount
                    from_player['total_tips_given'] += 1

        except Exception as e:
            logger.error(f"Error simulating tip received: {e}")

    async def simulate_achievement_earned(self, player: Dict[str, Any], timestamp: datetime) -> None:
        """Simulate earning an achievement"""
        try:
            achievements = [
                'First Drill', 'Drill Master', 'Streak Champion', 'Social Butterfly',
                'Highlight Creator', 'Tip Giver', 'Team Player', 'Skill Master'
            ]
            
            achievement_data = {
                'player_id': player['id'],
                'type': random.choice(achievements),
                'description': f"Earned {random.choice(achievements)} achievement",
                'timestamp': timestamp,
                'is_simulated': True
            }
            
            # Save to database
            db.collection('achievements').add(achievement_data)
            
            # Update player stats
            player['total_achievements'] += 1
            player['beacon_balance'] += random.randint(20, 50)

        except Exception as e:
            logger.error(f"Error simulating achievement earned: {e}")

    async def update_player_stats(self, player: Dict[str, Any], activities: List[Dict]) -> None:
        """Update player statistics based on daily activities"""
        try:
            # Update streak
            if any(activity['type'] in ['drill_completion', 'highlight_upload'] for activity in activities):
                player['current_streak'] += 1
            else:
                player['current_streak'] = 0
            
            # Update last active time
            player['last_active'] = max(activity['timestamp'] for activity in activities)
            
            # Save updated player to database
            await self.save_player_to_db(player)

        except Exception as e:
            logger.error(f"Error updating player stats: {e}")

    async def generate_simulation_report(self) -> Dict[str, Any]:
        """Generate comprehensive simulation report"""
        try:
            duration = self.simulation_data['end_time'] - self.simulation_data['start_time']
            
            # Calculate performance metrics
            total_players = len(self.players)
            active_players = len([p for p in self.players if p['total_drills_completed'] > 0])
            
            avg_drills_per_player = sum(p['total_drills_completed'] for p in self.players) / total_players
            avg_highlights_per_player = sum(p['total_highlights'] for p in self.players) / total_players
            avg_beacon_balance = sum(p['beacon_balance'] for p in self.players) / total_players
            
            # Sport distribution
            sport_distribution = {}
            for player in self.players:
                sport = player['sport']
                sport_distribution[sport] = sport_distribution.get(sport, 0) + 1
            
            # Performance level distribution
            level_distribution = {}
            for player in self.players:
                level = player['performance_level']
                level_distribution[level] = level_distribution.get(level, 0) + 1
            
            report = {
                'simulation_summary': {
                    'start_time': self.simulation_data['start_time'].isoformat(),
                    'end_time': self.simulation_data['end_time'].isoformat(),
                    'duration_seconds': duration.total_seconds(),
                    'total_players': total_players,
                    'active_players': active_players,
                    'activity_rate': active_players / total_players
                },
                'activity_summary': {
                    'total_activities': self.simulation_data['total_activities'],
                    'activities_by_type': self.simulation_data['activities_by_type'],
                    'avg_activities_per_player': self.simulation_data['total_activities'] / total_players
                },
                'performance_metrics': {
                    'avg_drills_per_player': round(avg_drills_per_player, 2),
                    'avg_highlights_per_player': round(avg_highlights_per_player, 2),
                    'avg_beacon_balance': round(avg_beacon_balance, 2),
                    'total_beacon_distributed': sum(p['beacon_balance'] for p in self.players),
                    'total_tips_given': sum(p['total_tips_given'] for p in self.players),
                    'total_tips_received': sum(p['total_tips_received'] for p in self.players),
                    'total_achievements': sum(p['total_achievements'] for p in self.players)
                },
                'player_distribution': {
                    'sport_distribution': sport_distribution,
                    'level_distribution': level_distribution
                },
                'top_performers': {
                    'most_drills': sorted(self.players, key=lambda p: p['total_drills_completed'], reverse=True)[:5],
                    'most_highlights': sorted(self.players, key=lambda p: p['total_highlights'], reverse=True)[:5],
                    'highest_beacon': sorted(self.players, key=lambda p: p['beacon_balance'], reverse=True)[:5],
                    'longest_streaks': sorted(self.players, key=lambda p: p['current_streak'], reverse=True)[:5]
                }
            }
            
            # Save report to database
            db.collection('simulation_reports').add({
                'report': report,
                'timestamp': datetime.now(),
                'simulation_id': f"sim_{int(time.time())}"
            })
            
            return report

        except Exception as e:
            logger.error(f"Error generating simulation report: {e}")
            return {'error': str(e)}

async def main():
    """Main function to run the simulation"""
    try:
        simulator = PlayerActivitySimulator()
        report = await simulator.run_simulation()
        
        print("Simulation Report:")
        print(json.dumps(report, indent=2, default=str))
        
    except Exception as e:
        logger.error(f"Error in main: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 