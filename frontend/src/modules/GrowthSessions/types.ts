// GrowthSessions Module Types
// Sports Business Intelligence Layer Type Definitions

export interface PlaymakerSession {
  type: 'Training' | 'Learning' | 'Scouting' | 'Planning' | 'Social' | 'Review';
  maxPosts: number;
  role: string;
  startTime: number;
  lastInteraction: number;
  scrollCount: number;
  rapidScrolls: number;
}

export interface CoachNudge {
  id: string;
  title: string;
  message: string;
  type: 'motivation' | 'reminder' | 'suggestion' | 'achievement' | 'warning';
  priority: 'low' | 'medium' | 'high';
  actions: Array<{
    label: string;
    aiPrompt: string;
    variant: 'primary' | 'secondary' | 'ghost';
  }>;
  expiresAt?: number;
}

export interface DrillSession {
  type: 'Training' | 'Learning' | 'Scouting' | 'Planning' | 'Social' | 'Review';
  maxPosts: number;
  role: string;
  description: string;
  ctaOptions: Array<{
    label: string;
    aiPrompt: string;
    variant: 'primary' | 'secondary' | 'ghost';
  }>;
}

export interface ScoutContent {
  id: string;
  type: 'drill' | 'highlight' | 'article' | 'video' | 'event' | 'community';
  title: string;
  description: string;
  thumbnail?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  engagement: number; // 0-100
  relevance: number; // 0-100
}

export interface ScoutFilter {
  contentTypes: string[];
  difficulty: string[];
  maxDuration: number;
  tags: string[];
  engagement: number;
}

export interface ScoutSession {
  role: string;
  intent: string;
  filters: ScoutFilter;
  contentQueue: ScoutContent[];
  viewedContent: string[];
  engagement: Record<string, number>;
}

export interface LiberationSession {
  id: string;
  userId: string;
  role: string;
  startTime: number;
  endTime?: number;
  duration: number; // in milliseconds
  scrollEvents: ScrollEvent[];
  interventions: Intervention[];
  actionsTaken: ActionTaken[];
  intent: string;
  sessionType: 'Training' | 'Learning' | 'Scouting' | 'Planning' | 'Social' | 'Review';
}

export interface ScrollEvent {
  timestamp: number;
  scrollY: number;
  scrollDirection: 'up' | 'down';
  scrollSpeed: number;
  timeSinceLastScroll: number;
}

export interface Intervention {
  id: string;
  type: 'coach_nudge' | 'scroll_break' | 'intent_reminder' | 'achievement_celebration';
  timestamp: number;
  trigger: string;
  response: 'dismissed' | 'action_taken' | 'ignored';
  timeToResponse: number;
}

export interface ActionTaken {
  id: string;
  type: 'drill_started' | 'progress_logged' | 'goal_set' | 'community_engaged' | 'coach_contacted';
  timestamp: number;
  description: string;
  aiPrompt: string;
  completionTime?: number;
}

export interface LiberationMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  totalScrollTime: number;
  totalRecoveryTime: number;
  interventionsServed: number;
  actionsCompleted: number;
  engagementRate: number;
  roleBreakdown: Record<string, number>;
  intentBreakdown: Record<string, number>;
}

export interface SessionInsight {
  type: 'positive' | 'warning' | 'opportunity';
  title: string;
  description: string;
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

// Sports Business Constants
export const SPORTS_ROLES = {
  PLAYER: 'player',
  COACH: 'coach', 
  PARENT: 'parent',
  ADMIN: 'admin'
} as const;

export const SESSION_TYPES = {
  TRAINING: 'Training',
  LEARNING: 'Learning',
  SCOUTING: 'Scouting',
  PLANNING: 'Planning',
  SOCIAL: 'Social',
  REVIEW: 'Review'
} as const;

export const CONTENT_TYPES = {
  DRILL: 'drill',
  HIGHLIGHT: 'highlight',
  ARTICLE: 'article',
  VIDEO: 'video',
  EVENT: 'event',
  COMMUNITY: 'community'
} as const;

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
} as const;

export const NUDGE_TYPES = {
  MOTIVATION: 'motivation',
  REMINDER: 'reminder',
  SUGGESTION: 'suggestion',
  ACHIEVEMENT: 'achievement',
  WARNING: 'warning'
} as const;

export const NUDGE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const; 