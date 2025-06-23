import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json
import os
from dotenv import load_dotenv
import openai
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Add multilingual support
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic'
}

# Seasonal challenge configurations
SEASONAL_CHALLENGES = {
    'summer_2024': {
        'name': 'Summer Fitness Challenge',
        'duration': '3 months',
        'goals': ['increase_strength', 'improve_endurance', 'team_building'],
        'rewards': {'beacon_multiplier': 1.5, 'special_badges': True}
    },
    'winter_2024': {
        'name': 'Winter Training Camp',
        'duration': '2 months',
        'goals': ['skill_refinement', 'mental_toughness', 'consistency'],
        'rewards': {'beacon_multiplier': 2.0, 'special_badges': True}
    }
}

class CoachAISummary:
    """AI-powered coaching summary generator for teams and players."""
    
    def __init__(self):
        self.cache = {}
        self.cache_duration = timedelta(hours=1)
        self.language = 'en'  # Default language
        self.seasonal_challenge = None
    
    def set_language(self, language: str):
        """Set the language for AI summaries."""
        if language in SUPPORTED_LANGUAGES:
            self.language = language
        else:
            self.language = 'en'  # Fallback to English
    
    def set_seasonal_challenge(self, challenge_id: str):
        """Set active seasonal challenge."""
        self.seasonal_challenge = SEASONAL_CHALLENGES.get(challenge_id)
    
    async def generate_team_summary(self, team_id: str, timeframe: str = 'week', language: str = None) -> Dict[str, Any]:
        """
        Generate AI-powered team summary with multilingual support.
        
        Args:
            team_id: Team identifier
            timeframe: Time period for analysis ('week', 'month', 'season')
            language: Language code for summary generation
            
        Returns:
            Dictionary containing AI-generated summary
        """
        if language:
            self.set_language(language)
            
        try:
            # Check cache first
            cache_key = f"team_summary_{team_id}_{timeframe}_{self.language}"
            if cache_key in self.cache:
                cached_data = self.cache[cache_key]
                if datetime.now() - cached_data['timestamp'] < self.cache_duration:
                    return cached_data['summary']
            
            # Get team data
            team_data = await self._get_team_data(team_id, timeframe)
            
            # Generate summary using AI with language support
            summary = await self._generate_ai_summary(team_data, 'team', timeframe)
            
            # Cache the result
            self.cache[cache_key] = {
                'summary': summary,
                'timestamp': datetime.now()
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating team summary: {e}")
            return self._generate_fallback_summary(team_id, 'team', timeframe)
    
    async def generate_player_summary(self, player_id: str, timeframe: str = 'week', language: str = None) -> Dict[str, Any]:
        """
        Generate AI-powered player summary with multilingual support.
        
        Args:
            player_id: Player identifier
            timeframe: Time period for analysis ('week', 'month', 'season')
            language: Language code for summary generation
            
        Returns:
            Dictionary containing AI-generated summary
        """
        if language:
            self.set_language(language)
            
        try:
            # Check cache first
            cache_key = f"player_summary_{player_id}_{timeframe}_{self.language}"
            if cache_key in self.cache:
                cached_data = self.cache[cache_key]
                if datetime.now() - cached_data['timestamp'] < self.cache_duration:
                    return cached_data['summary']
            
            # Get player data
            player_data = await self._get_player_data(player_id, timeframe)
            
            # Generate summary using AI with language support
            summary = await self._generate_ai_summary(player_data, 'player', timeframe)
            
            # Cache the result
            self.cache[cache_key] = {
                'summary': summary,
                'timestamp': datetime.now()
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating player summary: {e}")
            return self._generate_fallback_summary(player_id, 'player', timeframe)
    
    async def generate_seasonal_challenge_summary(self, team_id: str, challenge_id: str, language: str = None) -> Dict[str, Any]:
        """
        Generate seasonal challenge summary.
        
        Args:
            team_id: Team identifier
            challenge_id: Seasonal challenge identifier
            language: Language code for summary generation
            
        Returns:
            Dictionary containing seasonal challenge summary
        """
        if language:
            self.set_language(language)
            
        self.set_seasonal_challenge(challenge_id)
        
        try:
            # Get team data for the challenge period
            team_data = await self._get_team_data(team_id, 'season')
            
            # Generate challenge-specific summary
            summary = await self._generate_challenge_summary(team_data, challenge_id)
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating seasonal challenge summary: {e}")
            return self._generate_fallback_challenge_summary(team_id, challenge_id)
    
    async def generate_weekly_report(self, team_id: str) -> Dict[str, Any]:
        """
        Generate comprehensive weekly team report.
        
        Args:
            team_id: Team identifier
            
        Returns:
            Dictionary containing weekly report
        """
        try:
            # Get team data for the week
            team_data = await self._get_team_data(team_id, 'week')
            
            # Generate comprehensive report
            report = {
                'team_id': team_id,
                'report_type': 'weekly',
                'generated_at': datetime.now().isoformat(),
                'timeframe': 'week',
                'summary': await self._generate_ai_summary(team_data, 'team', 'week'),
                'highlights': await self._extract_highlights(team_data),
                'recommendations': await self._generate_recommendations(team_data),
                'trends': await self._analyze_trends(team_data),
                'milestones': await self._identify_milestones(team_data),
                'next_week_focus': await self._generate_next_week_focus(team_data)
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating weekly report: {e}")
            return self._generate_fallback_weekly_report(team_id)
    
    async def _get_team_data(self, team_id: str, timeframe: str) -> Dict[str, Any]:
        """Get comprehensive team data for analysis."""
        try:
            # This would typically fetch from your database
            # For now, return mock data
            return {
                'team_id': team_id,
                'team_name': 'Mock Team',
                'timeframe': timeframe,
                'members': [
                    {
                        'player_id': 'player1',
                        'name': 'Jordan',
                        'sport': 'basketball',
                        'stats': {
                            'beacon_earned': 1500,
                            'drills_completed': 25,
                            'current_streak': 7,
                            'avg_score': 85.5,
                            'points': 92,
                            'rebounds': 8,
                            'assists': 12
                        },
                        'achievements': ['scoring_milestone', 'playmaking'],
                        'performance_trend': 'up'
                    },
                    {
                        'player_id': 'player2',
                        'name': 'Sarah',
                        'sport': 'basketball',
                        'stats': {
                            'beacon_earned': 1200,
                            'drills_completed': 22,
                            'current_streak': 5,
                            'avg_score': 78.2,
                            'points': 67,
                            'rebounds': 12,
                            'assists': 8
                        },
                        'achievements': ['defensive_excellence'],
                        'performance_trend': 'stable'
                    }
                ],
                'team_stats': {
                    'total_beacon_earned': 2700,
                    'total_drills_completed': 47,
                    'avg_team_score': 81.85,
                    'team_activity_score': 85.2
                },
                'recent_activity': [
                    {'type': 'drill_completion', 'player': 'Jordan', 'drill': '3-Point Shooting', 'score': 92},
                    {'type': 'achievement', 'player': 'Sarah', 'achievement': 'Defensive Excellence'},
                    {'type': 'streak_milestone', 'player': 'Jordan', 'streak': 7}
                ]
            }
        except Exception as e:
            logger.error(f"Error getting team data: {e}")
            return {}
    
    async def _get_player_data(self, player_id: str, timeframe: str) -> Dict[str, Any]:
        """Get comprehensive player data for analysis."""
        try:
            # This would typically fetch from your database
            # For now, return mock data
            return {
                'player_id': player_id,
                'name': 'Jordan',
                'sport': 'basketball',
                'timeframe': timeframe,
                'stats': {
                    'beacon_earned': 1500,
                    'drills_completed': 25,
                    'current_streak': 7,
                    'avg_score': 85.5,
                    'points': 92,
                    'rebounds': 8,
                    'assists': 12,
                    'steals': 3,
                    'blocks': 2
                },
                'achievements': ['scoring_milestone', 'playmaking'],
                'performance_trend': 'up',
                'recent_drills': [
                    {'name': '3-Point Shooting', 'score': 92, 'date': '2024-01-15'},
                    {'name': 'Ball Handling', 'score': 88, 'date': '2024-01-14'},
                    {'name': 'Defense', 'score': 85, 'date': '2024-01-13'}
                ],
                'goals': ['Improve 3-point accuracy', 'Increase assists per game'],
                'coach_notes': ['Excellent work ethic', 'Great team player']
            }
        except Exception as e:
            logger.error(f"Error getting player data: {e}")
            return {}
    
    async def _generate_ai_summary(self, data: Dict[str, Any], entity_type: str, timeframe: str) -> Dict[str, Any]:
        """Generate AI summary using OpenAI with multilingual support."""
        try:
            # Prepare prompt based on entity type and language
            if entity_type == 'team':
                prompt = self._create_team_prompt(data, timeframe)
            else:
                prompt = self._create_player_prompt(data, timeframe)
            
            # Add language instruction
            if self.language != 'en':
                language_name = SUPPORTED_LANGUAGES[self.language]
                prompt += f"\n\nPlease provide the summary in {language_name}."
            
            # Add seasonal challenge context
            if self.seasonal_challenge:
                prompt += f"\n\nThis summary is part of the {self.seasonal_challenge['name']}. Focus on progress toward challenge goals: {', '.join(self.seasonal_challenge['goals'])}."
            
            # Call OpenAI API
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are an expert sports coach and analyst. Provide motivational, insightful, and actionable summaries of team and player performance. Use sports terminology and maintain an encouraging tone. Respond in {SUPPORTED_LANGUAGES.get(self.language, 'English')}."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            ai_summary = response.choices[0].message.content
            
            return {
                'ai_generated': True,
                'summary_text': ai_summary,
                'key_points': self._extract_key_points(ai_summary),
                'motivational_quote': self._generate_motivational_quote(data),
                'generated_at': datetime.now().isoformat(),
                'language': self.language,
                'seasonal_challenge': self.seasonal_challenge['name'] if self.seasonal_challenge else None
            }
            
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            # Fallback to mock summary
            return self._generate_mock_summary(data, entity_type, timeframe)
    
    def _create_team_prompt(self, data: Dict[str, Any], timeframe: str) -> str:
        """Create prompt for team summary."""
        members = data.get('members', [])
        team_stats = data.get('team_stats', {})
        
        prompt = f"""
        Analyze this {timeframe} team performance data and provide a motivational summary:
        
        Team: {data.get('team_name', 'Unknown Team')}
        Timeframe: {timeframe}
        
        Team Stats:
        - Total BEACON earned: {team_stats.get('total_beacon_earned', 0)}
        - Total drills completed: {team_stats.get('total_drills_completed', 0)}
        - Average team score: {team_stats.get('avg_team_score', 0)}
        - Team activity score: {team_stats.get('team_activity_score', 0)}
        
        Top Performers:
        """
        
        for member in members[:3]:  # Top 3 performers
            stats = member.get('stats', {})
            prompt += f"""
        - {member.get('name', 'Unknown')}: {stats.get('beacon_earned', 0)} BEACON, {stats.get('drills_completed', 0)} drills, {stats.get('current_streak', 0)} day streak
            """
        
        prompt += """
        
        Recent Activity:
        """
        
        for activity in data.get('recent_activity', [])[:5]:
            prompt += f"- {activity.get('type', 'activity')}: {activity.get('player', 'Unknown')} - {activity.get('drill', activity.get('achievement', 'activity'))}\n"
        
        prompt += """
        
        Please provide:
        1. A motivational summary of team performance
        2. Highlight top achievements and improvements
        3. Identify areas for team focus
        4. Include an encouraging message for continued success
        
        Keep it concise, motivational, and actionable.
        """
        
        return prompt
    
    def _create_player_prompt(self, data: Dict[str, Any], timeframe: str) -> str:
        """Create prompt for player summary."""
        stats = data.get('stats', {})
        
        prompt = f"""
        Analyze this {timeframe} player performance data and provide a motivational summary:
        
        Player: {data.get('name', 'Unknown Player')}
        Sport: {data.get('sport', 'Unknown')}
        Timeframe: {timeframe}
        
        Performance Stats:
        - BEACON earned: {stats.get('beacon_earned', 0)}
        - Drills completed: {stats.get('drills_completed', 0)}
        - Current streak: {stats.get('current_streak', 0)} days
        - Average score: {stats.get('avg_score', 0)}
        
        Sport-specific stats:
        """
        
        for key, value in stats.items():
            if key not in ['beacon_earned', 'drills_completed', 'current_streak', 'avg_score']:
                prompt += f"- {key}: {value}\n"
        
        prompt += f"""
        
        Achievements: {', '.join(data.get('achievements', []))}
        Performance trend: {data.get('performance_trend', 'stable')}
        
        Recent drills:
        """
        
        for drill in data.get('recent_drills', [])[:3]:
            prompt += f"- {drill.get('name', 'Unknown')}: {drill.get('score', 0)} points\n"
        
        prompt += """
        
        Please provide:
        1. A motivational summary of individual performance
        2. Highlight key strengths and improvements
        3. Suggest areas for focus and development
        4. Include personalized encouragement
        
        Keep it concise, motivational, and actionable.
        """
        
        return prompt
    
    def _extract_key_points(self, summary: str) -> List[str]:
        """Extract key points from AI summary."""
        # Simple extraction - in production, you might use more sophisticated NLP
        sentences = summary.split('. ')
        key_points = []
        
        for sentence in sentences[:3]:  # Take first 3 sentences as key points
            if sentence.strip():
                key_points.append(sentence.strip() + '.')
        
        return key_points
    
    def _generate_motivational_quote(self, data: Dict[str, Any]) -> str:
        """Generate a motivational quote based on performance."""
        quotes = [
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "The only way to do great work is to love what you do.",
            "Champions keep playing until they get it right.",
            "Hard work beats talent when talent doesn't work hard.",
            "The difference between the impossible and the possible lies in determination.",
            "Every expert was once a beginner.",
            "Your attitude determines your altitude.",
            "The only limit to your impact is your imagination and commitment."
        ]
        
        # Select quote based on performance
        if data.get('performance_trend') == 'up':
            return quotes[0]  # Success quote
        elif data.get('performance_trend') == 'down':
            return quotes[3]  # Hard work quote
        else:
            return quotes[6]  # Attitude quote
    
    def _generate_mock_summary(self, data: Dict[str, Any], entity_type: str, timeframe: str) -> Dict[str, Any]:
        """Generate mock summary when AI is unavailable."""
        if entity_type == 'team':
            summary_text = f"This {timeframe}, the team showed excellent dedication and teamwork. With {data.get('team_stats', {}).get('total_drills_completed', 0)} drills completed and {data.get('team_stats', {}).get('total_beacon_earned', 0)} BEACON earned, the team is building strong momentum. Keep up the great work and focus on maintaining consistency in training."
        else:
            stats = data.get('stats', {})
            summary_text = f"This {timeframe}, {data.get('name', 'the player')} demonstrated strong commitment to improvement. Completing {stats.get('drills_completed', 0)} drills and earning {stats.get('beacon_earned', 0)} BEACON shows excellent progress. The {stats.get('current_streak', 0)}-day streak reflects consistent dedication."
        
        return {
            'ai_generated': False,
            'summary_text': summary_text,
            'key_points': [summary_text],
            'motivational_quote': "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            'generated_at': datetime.now().isoformat()
        }
    
    async def _extract_highlights(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract key highlights from team data."""
        highlights = []
        
        # Top performers
        members = data.get('members', [])
        if members:
            top_performer = max(members, key=lambda x: x.get('stats', {}).get('beacon_earned', 0))
            highlights.append({
                'type': 'top_performer',
                'title': f"🏅 Top Performer: {top_performer.get('name', 'Unknown')}",
                'description': f"{top_performer.get('stats', {}).get('beacon_earned', 0)} BEACON earned",
                'icon': '🏅'
            })
        
        # Streak leader
        if members:
            streak_leader = max(members, key=lambda x: x.get('stats', {}).get('current_streak', 0))
            streak_days = streak_leader.get('stats', {}).get('current_streak', 0)
            if streak_days > 3:
                highlights.append({
                    'type': 'streak_leader',
                    'title': f"🔥 Streak Leader: {streak_leader.get('name', 'Unknown')}",
                    'description': f"{streak_days} day streak",
                    'icon': '🔥'
                })
        
        # Recent achievements
        for activity in data.get('recent_activity', []):
            if activity.get('type') == 'achievement':
                highlights.append({
                    'type': 'achievement',
                    'title': f"🏆 Achievement: {activity.get('player', 'Unknown')}",
                    'description': f"Earned {activity.get('achievement', 'achievement')}",
                    'icon': '🏆'
                })
        
        return highlights[:5]  # Limit to 5 highlights
    
    async def _generate_recommendations(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate coaching recommendations."""
        recommendations = []
        
        team_stats = data.get('team_stats', {})
        members = data.get('members', [])
        
        # Analyze team performance and generate recommendations
        if team_stats.get('avg_team_score', 0) < 80:
            recommendations.append({
                'type': 'improvement',
                'title': 'Focus on Skill Development',
                'description': 'Team average score suggests room for improvement in fundamental skills.',
                'priority': 'high'
            })
        
        if team_stats.get('total_drills_completed', 0) < 50:
            recommendations.append({
                'type': 'activity',
                'title': 'Increase Training Volume',
                'description': 'Consider adding more drill sessions to improve consistency.',
                'priority': 'medium'
            })
        
        # Individual recommendations
        for member in members:
            stats = member.get('stats', {})
            if stats.get('current_streak', 0) < 3:
                recommendations.append({
                    'type': 'motivation',
                    'title': f'Encourage {member.get("name", "player")}',
                    'description': 'Help build consistent training habits.',
                    'priority': 'medium'
                })
        
        return recommendations[:3]  # Limit to 3 recommendations
    
    async def _analyze_trends(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze performance trends."""
        trends = []
        
        members = data.get('members', [])
        
        # Count performance trends
        up_count = sum(1 for m in members if m.get('performance_trend') == 'up')
        down_count = sum(1 for m in members if m.get('performance_trend') == 'down')
        stable_count = sum(1 for m in members if m.get('performance_trend') == 'stable')
        
        if up_count > len(members) / 2:
            trends.append({
                'type': 'positive',
                'title': '📈 Team Momentum Building',
                'description': f'{up_count} players showing improvement',
                'trend': 'up'
            })
        elif down_count > len(members) / 2:
            trends.append({
                'type': 'negative',
                'title': '📉 Performance Dip Detected',
                'description': f'{down_count} players need support',
                'trend': 'down'
            })
        else:
            trends.append({
                'type': 'stable',
                'title': '➡️ Consistent Performance',
                'description': 'Team maintaining steady progress',
                'trend': 'stable'
            })
        
        return trends
    
    async def _identify_milestones(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify team and individual milestones."""
        milestones = []
        
        team_stats = data.get('team_stats', {})
        members = data.get('members', [])
        
        # Team milestones
        if team_stats.get('total_beacon_earned', 0) >= 1000:
            milestones.append({
                'type': 'team',
                'title': '💰 1000+ BEACON Milestone',
                'description': 'Team has earned over 1000 BEACON tokens',
                'achieved': True
            })
        
        if team_stats.get('total_drills_completed', 0) >= 50:
            milestones.append({
                'type': 'team',
                'title': '🏋️ 50+ Drills Completed',
                'description': 'Team has completed 50+ training drills',
                'achieved': True
            })
        
        # Individual milestones
        for member in members:
            stats = member.get('stats', {})
            if stats.get('current_streak', 0) >= 7:
                milestones.append({
                    'type': 'individual',
                    'title': f'🔥 {member.get("name", "Player")} 7-Day Streak',
                    'description': 'Excellent consistency in training',
                    'achieved': True
                })
        
        return milestones
    
    async def _generate_next_week_focus(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate focus areas for next week."""
        team_stats = data.get('team_stats', {})
        members = data.get('members', [])
        
        # Analyze current performance to suggest focus areas
        focus_areas = []
        
        if team_stats.get('avg_team_score', 0) < 85:
            focus_areas.append('Skill refinement and technique improvement')
        
        if len([m for m in members if m.get('stats', {}).get('current_streak', 0) < 5]) > len(members) / 2:
            focus_areas.append('Building consistent training habits')
        
        if team_stats.get('total_drills_completed', 0) < 60:
            focus_areas.append('Increasing training volume and intensity')
        
        return {
            'primary_focus': focus_areas[0] if focus_areas else 'Maintain current momentum',
            'secondary_focus': focus_areas[1] if len(focus_areas) > 1 else 'Team building and communication',
            'target_metrics': {
                'target_drills': team_stats.get('total_drills_completed', 0) + 10,
                'target_score': min(team_stats.get('avg_team_score', 0) + 5, 100),
                'target_streak': 5
            }
        }
    
    def _generate_fallback_summary(self, entity_id: str, entity_type: str, timeframe: str) -> Dict[str, Any]:
        """Generate fallback summary when data is unavailable."""
        return {
            'ai_generated': False,
            'summary_text': f"Unable to generate {entity_type} summary for {timeframe}. Please try again later.",
            'key_points': ['Data temporarily unavailable'],
            'motivational_quote': "The only way to do great work is to love what you do.",
            'generated_at': datetime.now().isoformat(),
            'error': 'Data unavailable'
        }
    
    def _generate_fallback_weekly_report(self, team_id: str) -> Dict[str, Any]:
        """Generate fallback weekly report."""
        return {
            'team_id': team_id,
            'report_type': 'weekly',
            'generated_at': datetime.now().isoformat(),
            'timeframe': 'week',
            'summary': self._generate_fallback_summary(team_id, 'team', 'week'),
            'highlights': [],
            'recommendations': [],
            'trends': [],
            'milestones': [],
            'next_week_focus': {
                'primary_focus': 'Data collection and analysis',
                'secondary_focus': 'Team engagement',
                'target_metrics': {
                    'target_drills': 0,
                    'target_score': 0,
                    'target_streak': 0
                }
            },
            'error': 'Unable to generate complete report'
        }
    
    async def _generate_challenge_summary(self, data: Dict[str, Any], challenge_id: str) -> Dict[str, Any]:
        """Generate seasonal challenge specific summary."""
        challenge = SEASONAL_CHALLENGES.get(challenge_id)
        if not challenge:
            return self._generate_fallback_challenge_summary(data.get('team_id'), challenge_id)
        
        try:
            # Create challenge-specific prompt
            prompt = f"""
            Analyze team performance for the {challenge['name']} ({challenge['duration']}).
            
            Challenge Goals: {', '.join(challenge['goals'])}
            
            Team Data:
            - Total BEACON earned: {data.get('team_stats', {}).get('total_beacon_earned', 0)}
            - Total drills completed: {data.get('team_stats', {}).get('total_drills_completed', 0)}
            - Average team score: {data.get('team_stats', {}).get('avg_team_score', 0)}
            
            Please provide:
            1. Progress assessment toward challenge goals
            2. Key achievements during the challenge
            3. Areas for improvement
            4. Motivational message for continued success
            5. Challenge completion status and rewards earned
            
            Keep it concise, motivational, and focused on the challenge objectives.
            """
            
            # Add language instruction
            if self.language != 'en':
                language_name = SUPPORTED_LANGUAGES[self.language]
                prompt += f"\n\nPlease provide the summary in {language_name}."
            
            # Call OpenAI API
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are an expert sports coach analyzing seasonal challenge performance. Provide detailed assessment and motivation. Respond in {SUPPORTED_LANGUAGES.get(self.language, 'English')}."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=600,
                temperature=0.7
            )
            
            challenge_summary = response.choices[0].message.content
            
            return {
                'ai_generated': True,
                'summary_text': challenge_summary,
                'key_points': self._extract_key_points(challenge_summary),
                'challenge_info': challenge,
                'progress_assessment': self._assess_challenge_progress(data, challenge),
                'rewards_earned': self._calculate_challenge_rewards(data, challenge),
                'generated_at': datetime.now().isoformat(),
                'language': self.language
            }
            
        except Exception as e:
            logger.error(f"Error generating challenge summary: {e}")
            return self._generate_fallback_challenge_summary(data.get('team_id'), challenge_id)
    
    def _assess_challenge_progress(self, data: Dict[str, Any], challenge: Dict[str, Any]) -> Dict[str, Any]:
        """Assess progress toward challenge goals."""
        team_stats = data.get('team_stats', {})
        members = data.get('members', [])
        
        progress = {}
        
        for goal in challenge['goals']:
            if goal == 'increase_strength':
                # Assess strength improvements
                avg_score = team_stats.get('avg_team_score', 0)
                progress[goal] = {
                    'status': 'excellent' if avg_score > 85 else 'good' if avg_score > 75 else 'needs_improvement',
                    'score': avg_score,
                    'target': 85
                }
            elif goal == 'improve_endurance':
                # Assess endurance through streak data
                avg_streak = sum(m.get('stats', {}).get('current_streak', 0) for m in members) / max(len(members), 1)
                progress[goal] = {
                    'status': 'excellent' if avg_streak > 7 else 'good' if avg_streak > 5 else 'needs_improvement',
                    'score': avg_streak,
                    'target': 7
                }
            elif goal == 'team_building':
                # Assess team cohesion through activity
                activity_score = team_stats.get('team_activity_score', 0)
                progress[goal] = {
                    'status': 'excellent' if activity_score > 80 else 'good' if activity_score > 60 else 'needs_improvement',
                    'score': activity_score,
                    'target': 80
                }
        
        return progress
    
    def _calculate_challenge_rewards(self, data: Dict[str, Any], challenge: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate rewards earned from challenge."""
        team_stats = data.get('team_stats', {})
        base_beacon = team_stats.get('total_beacon_earned', 0)
        multiplier = challenge.get('rewards', {}).get('beacon_multiplier', 1.0)
        
        return {
            'base_beacon': base_beacon,
            'multiplier': multiplier,
            'bonus_beacon': base_beacon * (multiplier - 1),
            'total_beacon': base_beacon * multiplier,
            'special_badges': challenge.get('rewards', {}).get('special_badges', False)
        }
    
    def _generate_fallback_challenge_summary(self, team_id: str, challenge_id: str) -> Dict[str, Any]:
        """Generate fallback challenge summary."""
        challenge = SEASONAL_CHALLENGES.get(challenge_id, {})
        
        return {
            'ai_generated': False,
            'summary_text': f"Unable to generate {challenge.get('name', 'challenge')} summary. Please try again later.",
            'key_points': ['Challenge data temporarily unavailable'],
            'challenge_info': challenge,
            'progress_assessment': {},
            'rewards_earned': {'base_beacon': 0, 'multiplier': 1.0, 'bonus_beacon': 0, 'total_beacon': 0},
            'generated_at': datetime.now().isoformat(),
            'language': self.language,
            'error': 'Data unavailable'
        }
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages."""
        return SUPPORTED_LANGUAGES
    
    def get_seasonal_challenges(self) -> Dict[str, Dict[str, Any]]:
        """Get list of available seasonal challenges."""
        return SEASONAL_CHALLENGES
    
    def clear_language_cache(self, language: str = None):
        """Clear cache for specific language or all languages."""
        if language:
            # Clear cache for specific language
            keys_to_remove = [key for key in self.cache.keys() if f"_{language}" in key]
            for key in keys_to_remove:
                del self.cache[key]
        else:
            # Clear all cache
            self.cache.clear()
        
        logger.info(f"Cleared cache for language: {language or 'all'}")

# Global instance
coach_ai_summary = CoachAISummary() 