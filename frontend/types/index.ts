export type InteractionType = 'like' | 'comment' | 'share';

export interface DrillFeedback {
  enjoyment: number;
  difficulty: number;
  comment?: string;
  improvements?: string[];
  challenges?: string[];
}

export interface DrillPerformance {
  score: number;
  duration: number;
  completedAt: string;
}

export interface DrillDetail {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  duration: number;
  equipment: string[];
  objectives: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'pending' | 'acknowledged' | 'completed';
  performance?: DrillPerformance;
  feedback?: DrillFeedback;
  relatedDrills?: string[];
  updatedAt: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  sport: string;
  level: string;
  lastActive: string;
  weeklyProgress: {
    drillsCompleted: number;
    totalDrills: number;
    performance: number;
  };
  insights: Array<{
    type: 'fatigue' | 'performance_drop' | 'improvement';
    severity: number;
    message: string;
  }>;
}

export interface Insight {
  id: string;
  playerId: string;
  type: 'fatigue' | 'performance_drop' | 'improvement';
  severity: number;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface FeedItem {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface DrillSchedule {
  id: string;
  playerId: string;
  drillId: string;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'missed';
  notes?: string;
  performance?: {
    score: number;
    feedback: string;
    metrics: Record<string, number>;
  };
}

export interface APIResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface APIError {
  status: number;
  message: string;
  details?: Record<string, any>;
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: {
    current: number;
    nextLevel: number;
  };
  stats: {
    completedDrills: number;
    averagePerformance: number;
    streak: number;
    totalTime: number;
  };
  recentDrills: {
    id: string;
    name: string;
    date: string;
    performance: number;
  }[];
  insights: {
    type: 'improvement' | 'achievement' | 'suggestion';
    message: string;
    date: string;
  }[];
  badges: {
    id: string;
    name: string;
    icon: string;
    progress: number;
    unlocked: boolean;
  }[];
}
