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
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    position: string;
    skillLevel: string;
    team: string;
    school: string;
    location: string;
    bio: string;
    avatar: string;
    isActive: boolean;
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    preferences: {
        notifications: boolean;
        publicProfile: boolean;
        shareStats: boolean;
    };
    // Legacy fields for backward compatibility
    name?: string;
    level?: number;
    xp?: {
        current: number;
        nextLevel: number;
    };
    stats?: {
        completedDrills: number;
        averagePerformance: number;
        streak: number;
        totalTime: number;
    };
    recentDrills?: {
        id: string;
        name: string;
        date: string;
        performance: number;
    }[];
    insights?: {
        type: 'improvement' | 'achievement' | 'suggestion';
        message: string;
        date: string;
    }[];
    badges?: {
        id: string;
        name: string;
        icon: string;
        progress: number;
        unlocked: boolean;
    }[];
}

// Video Annotation Types
export interface VideoAnnotation {
    id: string;
    type: 'drawing' | 'text' | 'highlight';
    timestamp: number;
    data: any;
    notes?: string;
    color: string;
    visible: boolean;
}

// Search and Filter Types
export interface SearchFilters {
    query: string;
    positions: string[];
    skillLevels: string[];
    locations: string[];
    teams: string[];
    schools: string[];
    availability: string[];
    ageRange: [number, number];
    experienceYears: [number, number];
    isActive: boolean;
    hasVideo: boolean;
    tags: string[];
}

// Monetization Types
export interface EarningsData {
    totalEarnings: number;
    thisMonth: number;
    lastMonth: number;
    pendingPayouts: number;
    totalTips: number;
    totalLikes: number;
    currentStreak: number;
    bestStreak: number;
}

export interface TipHistory {
    id: string;
    amount: number;
    fromUser: string;
    message: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
}

export interface PayoutRequest {
    id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedDate: string;
    processedDate?: string;
    method: 'stripe' | 'paypal' | 'bank';
}

// Coach Assistant Types
export interface CoachAssistantMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface PerformanceStats {
    shootingPercentage: number;
    assists: number;
    rebounds: number;
    steals: number;
    blocks: number;
    gamesPlayed: number;
    improvement: number;
}