from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from pydantic import BaseModel

# Stub models to avoid circular imports
class PlayerStatRecord(BaseModel):
    player_id: int
    player_name: str
    game_date: datetime
    points: float
    assists: float
    rebounds: float
    steals: float
    blocks: float
    field_goal_percentage: float
    three_point_percentage: float
    result: str

class PlayerAnalysisResponse(BaseModel):
    player_name: str
    normalized_stats: Dict[str, float]
    top_skills: List[str]
    growth_areas: List[str]
    recent_trends: Dict[str, float]

class PlayerInsightResponse(BaseModel):
    player_id: int
    player_name: str
    win_rate: float
    games_played: int
    avg_points: float
    avg_assists: float
    avg_rebounds: float

class PlayerInsightEngine:
    def __init__(self):
        self.scaler = StandardScaler()
        self.stats_history = {}
        
    def _convert_to_dataframe(self, stats: List[PlayerStatRecord]) -> pd.DataFrame:
        """Convert PlayerStatRecord list to pandas DataFrame."""
        if not stats:
            return pd.DataFrame()
        
        data = []
        for stat in stats:
            data.append({
                'player_id': stat.player_id,
                'player_name': stat.player_name,
                'game_date': stat.game_date,
                'points': stat.points,
                'assists': stat.assists,
                'rebounds': stat.rebounds,
                'steals': stat.steals,
                'blocks': stat.blocks,
                'field_goal_percentage': stat.field_goal_percentage,
                'three_point_percentage': stat.three_point_percentage,
                'result': stat.result
            })
        
        return pd.DataFrame(data)
    
    def normalize_stats(self, stats_df: pd.DataFrame) -> Dict[str, float]:
        """Normalize player statistics using StandardScaler."""
        if stats_df.empty:
            return {}
        
        # Select numerical columns for normalization
        numerical_cols = ['points', 'assists', 'rebounds', 'steals', 'blocks', 
                         'field_goal_percentage', 'three_point_percentage']
        
        # Filter columns that exist in the DataFrame
        available_cols = [col for col in numerical_cols if col in stats_df.columns]
        
        if not available_cols:
            return {}
        
        # Extract numerical data
        numerical_data = stats_df[available_cols].values
        
        # Handle single row case
        if numerical_data.shape[0] == 1:
            numerical_data = numerical_data.reshape(1, -1)
        
        # Normalize using StandardScaler
        try:
            normalized_data = self.scaler.fit_transform(numerical_data)
            
            # Convert back to dictionary with column names
            normalized_stats = {}
            for i, col in enumerate(available_cols):
                normalized_stats[col] = float(normalized_data[0, i]) if normalized_data.shape[0] == 1 else float(normalized_data[:, i].mean())
            
            return normalized_stats
        except Exception as e:
            # Fallback to simple normalization if StandardScaler fails
            normalized_stats = {}
            for col in available_cols:
                values = stats_df[col].dropna()
                if len(values) > 0:
                    mean_val = values.mean()
                    std_val = values.std()
                    if std_val > 0:
                        normalized_stats[col] = (values.iloc[-1] - mean_val) / std_val
                    else:
                        normalized_stats[col] = 0.0
                else:
                    normalized_stats[col] = 0.0
            return normalized_stats
    
    def calculate_player_trends(self, stats_df: pd.DataFrame) -> Dict[str, float]:
        """Calculate recent performance trends compared to earlier games."""
        if stats_df.empty or len(stats_df) < 4:
            return {}
        
        # Sort by game date
        stats_df = stats_df.sort_values('game_date')
        
        # Split into recent (last 3 games) and previous (games before that)
        recent_games = stats_df.tail(3)
        previous_games = stats_df.iloc[:-3] if len(stats_df) > 3 else stats_df
        
        if previous_games.empty:
            return {}
        
        trends = {}
        numerical_cols = ['points', 'assists', 'rebounds', 'steals', 'blocks']
        available_cols = [col for col in numerical_cols if col in stats_df.columns]
        
        for col in available_cols:
            recent_avg = recent_games[col].mean()
            previous_avg = previous_games[col].mean()
            trends[col] = recent_avg - previous_avg
        
        return trends
    
    def identify_top_skills(self, stats_df: pd.DataFrame) -> List[str]:
        """Identify player's top skills based on statistical performance."""
        if stats_df.empty:
            return []
        
        # Calculate average performance for each skill
        skill_metrics = {
            'scoring': 'points',
            'playmaking': 'assists', 
            'rebounding': 'rebounds',
            'defense': 'steals',
            'shot_blocking': 'blocks',
            'shooting_efficiency': 'field_goal_percentage',
            'three_point_shooting': 'three_point_percentage'
        }
        
        skill_scores = {}
        for skill_name, metric in skill_metrics.items():
            if metric in stats_df.columns:
                avg_value = stats_df[metric].mean()
                # Normalize by typical ranges for each metric
                if metric == 'points':
                    skill_scores[skill_name] = avg_value / 25.0  # Normalize to 25 ppg
                elif metric == 'assists':
                    skill_scores[skill_name] = avg_value / 8.0   # Normalize to 8 apg
                elif metric == 'rebounds':
                    skill_scores[skill_name] = avg_value / 10.0  # Normalize to 10 rpg
                elif metric == 'steals':
                    skill_scores[skill_name] = avg_value / 2.0   # Normalize to 2 spg
                elif metric == 'blocks':
                    skill_scores[skill_name] = avg_value / 2.0   # Normalize to 2 bpg
                elif metric in ['field_goal_percentage', 'three_point_percentage']:
                    skill_scores[skill_name] = avg_value / 100.0  # Convert to 0-1 scale
        
        # Sort skills by score and return top 3
        sorted_skills = sorted(skill_scores.items(), key=lambda x: x[1], reverse=True)
        return [skill[0] for skill in sorted_skills[:3]]
    
    def get_growth_areas(self, stats_df: pd.DataFrame) -> List[str]:
        """Identify areas where the player needs improvement."""
        if stats_df.empty:
            return []
        
        # Calculate average performance for each skill
        skill_metrics = {
            'scoring': 'points',
            'playmaking': 'assists', 
            'rebounding': 'rebounds',
            'defense': 'steals',
            'shot_blocking': 'blocks',
            'shooting_efficiency': 'field_goal_percentage',
            'three_point_shooting': 'three_point_percentage'
        }
        
        skill_scores = {}
        for skill_name, metric in skill_metrics.items():
            if metric in stats_df.columns:
                avg_value = stats_df[metric].mean()
                # Normalize by typical ranges for each metric
                if metric == 'points':
                    skill_scores[skill_name] = avg_value / 25.0
                elif metric == 'assists':
                    skill_scores[skill_name] = avg_value / 8.0
                elif metric == 'rebounds':
                    skill_scores[skill_name] = avg_value / 10.0
                elif metric == 'steals':
                    skill_scores[skill_name] = avg_value / 2.0
                elif metric == 'blocks':
                    skill_scores[skill_name] = avg_value / 2.0
                elif metric in ['field_goal_percentage', 'three_point_percentage']:
                    skill_scores[skill_name] = avg_value / 100.0
        
        # Sort skills by score and return bottom 3 (growth areas)
        sorted_skills = sorted(skill_scores.items(), key=lambda x: x[1])
        return [skill[0] for skill in sorted_skills[:3]]
    
    def calculate_win_rate(self, stats_df: pd.DataFrame) -> float:
        """Calculate player's win rate from game results."""
        if stats_df.empty or 'result' not in stats_df.columns:
            return 0.0
        
        total_games = len(stats_df)
        wins = len(stats_df[stats_df['result'] == 'win'])
        
        return wins / total_games if total_games > 0 else 0.0
    
    def generate_player_report(self, stats_df: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive player analysis report."""
        if stats_df.empty:
            return {
                'player_name': 'Unknown',
                'games_played': 0,
                'win_rate': 0.0,
                'avg_stats': {},
                'top_skills': [],
                'growth_areas': [],
                'trends': {},
                'recommendations': []
            }
        
        player_name = stats_df['player_name'].iloc[0] if 'player_name' in stats_df.columns else 'Unknown'
        games_played = len(stats_df)
        
        # Calculate various metrics
        win_rate = self.calculate_win_rate(stats_df)
        normalized_stats = self.normalize_stats(stats_df)
        top_skills = self.identify_top_skills(stats_df)
        growth_areas = self.get_growth_areas(stats_df)
        trends = self.calculate_player_trends(stats_df)
        
        # Calculate average stats
        avg_stats = {}
        numerical_cols = ['points', 'assists', 'rebounds', 'steals', 'blocks', 
                         'field_goal_percentage', 'three_point_percentage']
        for col in numerical_cols:
            if col in stats_df.columns:
                avg_stats[col] = float(stats_df[col].mean())
        
        # Generate recommendations based on analysis
        recommendations = []
        if win_rate < 0.4:
            recommendations.append("Focus on team play and decision-making to improve win rate")
        if 'scoring' in growth_areas:
            recommendations.append("Work on shooting mechanics and shot selection")
        if 'playmaking' in growth_areas:
            recommendations.append("Practice passing and court vision")
        if 'defense' in growth_areas:
            recommendations.append("Improve defensive positioning and awareness")
        
        return {
            'player_name': player_name,
            'games_played': games_played,
            'win_rate': win_rate,
            'avg_stats': avg_stats,
            'top_skills': top_skills,
            'growth_areas': growth_areas,
            'trends': trends,
            'recommendations': recommendations
        }
    
    def analyze_player_performance(self, stats: List[PlayerStatRecord]) -> PlayerAnalysisResponse:
        """Analyze player performance and provide insights."""
        if not stats:
            return PlayerAnalysisResponse(
                player_name="Unknown",
                normalized_stats={},
                top_skills=[],
                growth_areas=[],
                recent_trends={}
            )
        
        # Convert to DataFrame
        stats_df = self._convert_to_dataframe(stats)
        player_name = stats[0].player_name
        
        # Calculate insights
        normalized_stats = self.normalize_stats(stats_df)
        top_skills = self.identify_top_skills(stats_df)
        growth_areas = self.get_growth_areas(stats_df)
        recent_trends = self.calculate_player_trends(stats_df)
        
        return PlayerAnalysisResponse(
            player_name=player_name,
            normalized_stats=normalized_stats,
            top_skills=top_skills,
            growth_areas=growth_areas,
            recent_trends=recent_trends
        )
    
    def get_player_insights(self, stats: List[PlayerStatRecord]) -> PlayerInsightResponse:
        """Get comprehensive player insights."""
        if not stats:
            return PlayerInsightResponse(
                player_id=0,
                player_name="Unknown",
                win_rate=0.0,
                games_played=0,
                avg_points=0.0,
                avg_assists=0.0,
                avg_rebounds=0.0
            )
        
        # Convert to DataFrame
        stats_df = self._convert_to_dataframe(stats)
        
        player_id = stats[0].player_id
        player_name = stats[0].player_name
        games_played = len(stats)
        
        # Calculate metrics
        win_rate = self.calculate_win_rate(stats_df)
        avg_points = float(stats_df['points'].mean()) if 'points' in stats_df.columns else 0.0
        avg_assists = float(stats_df['assists'].mean()) if 'assists' in stats_df.columns else 0.0
        avg_rebounds = float(stats_df['rebounds'].mean()) if 'rebounds' in stats_df.columns else 0.0
        
        return PlayerInsightResponse(
            player_id=player_id,
            player_name=player_name,
            win_rate=win_rate,
            games_played=games_played,
            avg_points=avg_points,
            avg_assists=avg_assists,
            avg_rebounds=avg_rebounds
        ) 