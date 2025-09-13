export type InteractionType = 'like' | 'comment' | 'share';

// Re-export scout types
export type { ScoutNote, PlayerEvaluation } from './scout';

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

// Player interface for trainer API
export interface Player {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    age: number;
    position: string;
    team: { id: string; name: string };
    skills: Array<{ name: string; level: number }>;
    scoutRating: number;
    createdAt: Date;
    updatedAt: Date;
    // Additional properties for compatibility
    name?: string;
    avatar?: string;
    sport?: string;
    level?: string;
    weeklyProgress?: number;
}

export interface Insight {
    id: string;
    type: 'improvement' | 'fatigue' | 'performance_drop' | string; // Allow string for flexibility
    content: string;
    metric: number; // Changed from string to number for consistency
    timestamp: DateString; // Standardized to DateString
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    acknowledged: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FeedItem {
    id: string;
    type: string;
    content: string;
    author: { id: string; name: string; avatar: string } | string; // Support both formats
    timestamp: DateString; // Standardized to DateString
    likes: number;
    comments: number;
    shares: number;
    createdAt: string;
    updatedAt: string;
    stats: {
        views: number;
        likes: number;
        shares: number;
        comments: number;
    };
    userInteraction: {
        liked: boolean;
        shared: boolean;
        bookmarked: boolean;
    };
}

// Message interface - consolidated single source of truth
export interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'system';
    status: 'sent' | 'delivered' | 'read' | 'unread';
    timestamp: DateString;
    createdAt: DateString;
    updatedAt?: DateString;
    role?: 'user' | 'trainer' | 'ai';
    metadata?: Record<string, any>;
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

// Standardized date type - use ISO string format consistently
export type DateString = string; // ISO 8601 date string format
export type ISODate = string; // Alias for clarity

// Consolidated PlayerProfile interface - single source of truth
export interface PlayerProfile {
    // Core identification
    id: string;
    userId: string;
    
    // Basic information
    firstName: string;
    lastName: string;
    displayName?: string;
    email: string;
    phone: string;
    phoneNumber?: string; // Legacy compatibility
    dateOfBirth: DateString; // Standardized to ISO date string
    avatar?: string;
    bio?: string;
    location?: string;
    age?: number;
    
    // Sports information
    sport?: string;
    sports?: {
        primary: string;
        secondary?: string[];
        positions: string[];
        experience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
        yearsPlaying: number;
    };
    position: string;
    skillLevel: string;
    level?: string; // Legacy compatibility
    
    // Team and organization
    team: string | { id: string; name: string };
    school?: string;
    
    // Status and preferences
    isActive: boolean;
    preferences?: {
        notifications: boolean;
        publicProfile: boolean;
        shareStats: boolean;
    };
    
    // Scout-specific properties
    scoutRating?: number;
    potential?: number;
    
    // Emergency contact
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    
    // Experience and progression
    xp?: {
        current: number;
        total?: number;
        level?: number;
        nextLevel?: number;
        progress?: number;
    };
    
    // Performance metrics
    stats?: {
        completedDrills?: number;
        drillsCompleted?: number; // Legacy compatibility
        averagePerformance: number;
        streak?: number;
        totalTime: number;
        consistency?: number;
        gamesPlayed?: number;
        wins?: number;
        losses?: number;
    };
    
    // Performance tracking
    performance?: {
        totalGames: number;
        wins: number;
        losses: number;
        winRate: number;
        averageScore: number;
        bestScore: number;
        totalPoints: number;
        achievements: string[];
    };
    
    // Skills and abilities
    skills?: Record<string, {
        level: number;
        experience?: number;
    }>;
    
    // Achievements and badges
    achievements?: string[];
    badges?: {
        id: string;
        name: string;
        icon: string;
        progress: number;
        unlocked: boolean;
        earned?: Array<{
            id: string;
            name: string;
            icon: string;
            earnedAt: string;
        }>;
        inProgress?: Array<{
            id: string;
            name: string;
            icon: string;
            progress: number;
            requirement: number;
        }>;
    };
    
    // Social features
    social?: {
        followers: number;
        following: number;
        isVerified: boolean;
        isPublic: boolean;
        allowMessages: boolean;
        allowTips: boolean;
    };
    
    // Financial information
    financial?: {
        totalEarnings: number;
        totalTips: number;
        stripeAccountId?: string;
        payoutEnabled: boolean;
        preferredPayoutMethod: 'stripe' | 'paypal' | 'bank';
    };
    
    // Activity tracking
    recentDrills?: {
        id: string;
        name: string;
        date: DateString;
        performance: number;
    }[];
    recentActivity?: {
        drills: any[]; // Will be properly typed later
        insights: any[]; // Will be properly typed later
    };
    
    // Insights and recommendations
    insights?: {
        type: 'improvement' | 'achievement' | 'suggestion';
        message: string;
        date: DateString;
    }[];
    
    // Legacy compatibility fields
    name?: string; // Maps to displayName or firstName + lastName
    
    // Timestamps
    createdAt: DateString;
    updatedAt: DateString;
    
    // Document metadata (for Firestore)
    createdBy?: string;
    updatedBy?: string;
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

// Badge interface
export interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: string;
    requirements: {
        type: string;
        value: number;
        description: string;
    };
    rewards: {
        xp: number;
        title?: string;
        color?: string;
    };
    unlocked: boolean;
    progress: number;
    earnedAt?: DateString;
}

// Video Metadata interface
export interface VideoMetadata {
    id: string;
    title: string;
    description: string;
    duration: number;
    thumbnail: string;
    uploadDate: DateString;
    views: number;
    likes: number;
    tags: string[];
    category: string;
    quality: '720p' | '1080p' | '4K';
    fileSize: number;
    mimeType: string;
    status: 'processing' | 'ready' | 'failed';
}

// Tip Response interface
export interface TipResponse {
    id: string;
    tipId: string;
    recipientId: string;
    senderId: string;
    amount: number;
    currency: string;
    message?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    createdAt: DateString;
    completedAt?: DateString;
    transactionId?: string;
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

// Missing interfaces that were referenced in errors
export interface Tip {
    id: string;
    tipId: string; // Stripe payment intent ID
    fromUserId: string;
    toUserId: string;
    fromUserProfile?: {
        displayName: string;
        avatar?: string;
    };
    toUserProfile?: {
        displayName: string;
        avatar?: string;
    };
    
    // Tip Details
    amount: number; // Amount in cents
    currency: string;
    message?: string;
    isAnonymous: boolean;
    
    // Stripe Integration
    stripePaymentIntentId: string;
    stripeTransferId?: string;
    stripeAccountId?: string;
    
    // Status and Processing
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
    processingFee: number;
    platformFee: number;
    creatorAmount: number; // Amount after fees
    
    // Metadata
    createdAt: DateString;
    updatedAt: DateString;
    processedAt?: DateString;
    refundedAt?: DateString;
    
    // Analytics
    category?: string;
    tags?: string[];
    source: 'web' | 'mobile' | 'api';
}

export interface CreatorDashboard {
    id: string;
    userId: string;
    
    // Overview Metrics
    overview: {
        totalEarnings: number;
        totalTips: number;
        totalFollowers: number;
        totalGames: number;
        winRate: number;
        averageRating: number;
        totalViews: number;
        totalLikes: number;
    };
    
    // Financial Analytics
    financial: {
        monthlyEarnings: Array<{ month: string; amount: number }>;
        earningsBySource: Record<string, number>;
        pendingPayouts: number;
        completedPayouts: number;
        averageTipAmount: number;
        topTippers: Array<{ userId: string; displayName: string; totalAmount: number }>;
        payoutHistory: Array<{ date: DateString; amount: number; status: string }>;
    };
    
    // Performance Analytics
    performance: {
        gamesPlayed: Array<{ date: string; count: number; wins: number }>;
        winRateBySport: Record<string, number>;
        performanceTrend: Array<{ date: string; winRate: number; averageScore: number }>;
        achievements: Array<{ id: string; name: string; earnedAt: DateString; description: string }>;
        recentGames: Array<{ id: string; sport: string; result: 'win' | 'loss' | 'draw'; score: number; date: DateString }>;
    };
    
    // Social Analytics
    social: {
        followerGrowth: Array<{ date: string; count: number }>;
        engagementRate: number;
        topPosts: Array<{ id: string; type: string; views: number; likes: number; date: DateString }>;
        audienceDemographics: Record<string, number>;
        interactionHistory: Array<{ date: string; followers: number; interactions: number }>;
    };
    
    // Content Analytics
    content: {
        totalPosts: number;
        totalVideos: number;
        totalImages: number;
        viewsByContent: Record<string, number>;
        engagementByContent: Record<string, number>;
        popularContent: Array<{ id: string; type: string; title: string; views: number; likes: number }>;
        contentSchedule: Array<{ date: string; type: string; title: string; status: string }>;
    };
    
    // Goals and Targets
    goals: {
        monthlyEarningsTarget: number;
        monthlyFollowersTarget: number;
        monthlyGamesTarget: number;
        winRateTarget: number;
        currentProgress: {
            earningsProgress: number;
            followersProgress: number;
            gamesProgress: number;
            winRateProgress: number;
        };
    };
    
    // Settings and Preferences
    settings: {
        autoPayout: boolean;
        payoutThreshold: number;
        notificationPreferences: {
            newFollower: boolean;
            newTip: boolean;
            newGame: boolean;
            achievement: boolean;
            payout: boolean;
        };
        privacySettings: {
            showEarnings: boolean;
            showFollowers: boolean;
            showGames: boolean;
            showRating: boolean;
        };
    };
    
    // Metadata
    createdAt: DateString;
    updatedAt: DateString;
    lastRefreshed: DateString;
    status: 'active' | 'inactive' | 'suspended';
}

export interface MediaMetadata {
    id: string;
    userId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    mediaType: 'image' | 'video' | 'audio' | 'document';
    category: 'profile' | 'content' | 'training' | 'general';
    url: string;
    thumbnailUrl?: string;
    duration?: number;
    width?: number;
    height?: number;
    tags: string[];
    description?: string;
    isPublic: boolean;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    downloadCount: number;
    customMetadata?: Record<string, any>;
    createdAt: DateString;
    updatedAt: DateString;
}

// PlayerDetailsModalProps interface
export interface PlayerDetailsModalProps {
    open: boolean;
    onClose: () => void;
    player: Player;
    drillHistory?: DrillDetail[];
    isMobile?: boolean;
}

// AIAssistantPanelProps interface
export interface AIAssistantPanelProps {
    responses: Message[];
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
}