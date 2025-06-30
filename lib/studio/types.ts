export interface StudioConfig {
  maxVideoDuration: number; // in minutes
  allowedFormats: string[];
  maxFileSize: number; // in MB
  autoModeration: boolean;
  monetizationEnabled: boolean;
  badgeSystemEnabled: boolean;
}

export interface VideoProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: VideoCategory;
  status: ProjectStatus;
  assets: VideoAsset[];
  metadata: VideoMetadata;
  analytics: VideoAnalytics;
  monetization: MonetizationData;
  createdAt: Date;
  updatedAt: Date;
}

export type VideoCategory = 
  | 'sports_highlight'
  | 'training_tutorial'
  | 'game_analysis'
  | 'coach_interview'
  | 'player_profile'
  | 'team_celebration'
  | 'skill_showcase'
  | 'community_event';

export type ProjectStatus = 
  | 'draft'
  | 'editing'
  | 'review'
  | 'published'
  | 'archived';

export interface VideoAsset {
  id: string;
  type: 'video' | 'image' | 'audio' | 'text';
  url: string;
  duration?: number;
  size: number;
  format: string;
  thumbnail?: string;
}

export interface VideoMetadata {
  tags: string[];
  location?: {
    city: string;
    state: string;
    country: string;
  };
  participants: string[];
  equipment: string[];
  weather?: string;
  date: Date;
}

export interface VideoAnalytics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  watchTime: number;
  engagementRate: number;
  audienceRetention: number;
  demographics: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
    devices: Record<string, number>;
  };
}

export interface MonetizationData {
  enabled: boolean;
  tier: MonetizationTier;
  revenue: number;
  subscribers: number;
  sponsorships: Sponsorship[];
  adRevenue: number;
  tips: number;
}

export interface MonetizationTier {
  id: string;
  name: string;
  requirements: TierRequirement[];
  benefits: string[];
  revenueShare: number;
  badge: string;
}

export interface TierRequirement {
  type: 'views' | 'subscribers' | 'videos' | 'engagement' | 'time';
  value: number;
  timeframe: number; // in days
}

export interface Sponsorship {
  id: string;
  sponsor: string;
  amount: number;
  duration: number;
  requirements: string[];
  status: 'active' | 'pending' | 'completed';
}

export interface CreatorBadge {
  id: string;
  userId: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  earnedDate: Date;
  requirements: BadgeRequirement[];
  benefits: string[];
}

export type BadgeType = 
  | 'first_video'
  | 'viral_content'
  | 'consistent_creator'
  | 'community_builder'
  | 'skill_teacher'
  | 'sports_expert'
  | 'trending_creator'
  | 'monetization_master'
  | 'collaboration_king'
  | 'innovation_leader';

export interface BadgeRequirement {
  type: 'views' | 'videos' | 'engagement' | 'time' | 'collaborations';
  value: number;
  description: string;
}

export interface StudioAnalytics {
  totalProjects: number;
  publishedVideos: number;
  totalViews: number;
  totalRevenue: number;
  activeCreators: number;
  averageEngagement: number;
  topCategories: VideoCategory[];
  trendingTags: string[];
} 