import { Insight, DrillSchedule } from './index';
import { PlayerEvaluation } from './scout';

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  team: string;
  sport: string;
  level: string;
  xp: {
    current: number;
    total: number;
    level: number;
    progress: number;
  };
  badges: {
    earned: Array<{
      id: string;
      name: string;
      icon: string;
      earnedAt: string;
    }>;
    inProgress: Array<{
      id: string;
      name: string;
      icon: string;
      progress: number;
      requirement: number;
    }>;
  };
  stats: {
    drillsCompleted: number;
    totalTime: number;
    averagePerformance: number;
    consistency: number;
  };
  recentActivity: {
    drills: DrillSchedule[];
    insights: Insight[];
  };
}

export interface DrillDetail {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  videoUrl: string;
  thumbnail: string;
  tags: string[];
  equipment: string[];
  targetSkills: string[];
  performance: {
    history: Array<{
      date: string;
      score: number;
      duration: number;
      notes?: string;
    }>;
    average: number;
    best: number;
    trend: 'improving' | 'steady' | 'declining';
  };
  relatedDrills: Array<{
    id: string;
    name: string;
    difficulty: string;
    similarity: number;
  }>;
  insights: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  aiSuggestions: string[];
}

export interface PlayerStats {
  gamesPlayed: number;
  goalsScored: number;
  assists: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  passAccuracy: number;
  shotAccuracy: number;
  tacklesWon: number;
  distanceCovered: number;
}

export interface PlayerHistory {
  teamId: string;
  teamName: string;
  startDate: string;
  endDate?: string;
  position: string;
  appearances: number;
  goals: number;
  assists: number;
}

export interface ScoutPlayer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  height: number;
  weight: number;
  preferredFoot: 'left' | 'right' | 'both';
  primaryPosition: string;
  alternatePositions: string[];
  currentTeam: {
    id: string;
    name: string;
    league: string;
  };
  stats: PlayerStats;
  history: PlayerHistory[];
  evaluation?: PlayerEvaluation;
  lastWatched?: string;
  watchlist: boolean;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'inactive' | 'transfer' | 'injured';
  mediaUrls: {
    profileImage?: string;
    highlightVideos?: string[];
  };
}
