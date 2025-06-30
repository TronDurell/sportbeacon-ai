export interface CivicConfig {
  metricsEnabled: boolean;
  realTimeTracking: boolean;
  publicReporting: boolean;
  stakeholderNotifications: boolean;
}

export interface CityMetrics {
  cityId: string;
  name: string;
  population: number;
  sportsParticipation: {
    youth: number; // percentage
    adult: number; // percentage
    senior: number; // percentage
  };
  facilities: {
    total: number;
    accessible: number;
    maintained: number;
    utilization: number; // percentage
  };
  programs: {
    active: number;
    participants: number;
    satisfaction: number; // average rating
  };
  economic: {
    sportsRevenue: number;
    jobsCreated: number;
    tourismImpact: number;
  };
  health: {
    obesityRate: number;
    physicalActivity: number; // percentage
    mentalHealth: number; // rating
  };
  social: {
    communityEngagement: number; // percentage
    crimeReduction: number; // percentage
    socialCohesion: number; // rating
  };
  environmental: {
    greenSpaces: number; // acres
    carbonFootprint: number; // reduction percentage
    sustainabilityScore: number; // rating
  };
  technology: {
    digitalAdoption: number; // percentage
    smartInfrastructure: number; // rating
    innovationIndex: number; // rating
  };
  overallScore: number; // 0-100
  lastUpdated: Date;
}

export interface CivicInitiative {
  id: string;
  name: string;
  description: string;
  category: InitiativeCategory;
  targetMetrics: string[];
  budget: number;
  timeline: {
    start: Date;
    end: Date;
  };
  stakeholders: string[];
  status: InitiativeStatus;
  impact: ImpactMetrics;
}

export type InitiativeCategory = 
  | 'youth_development'
  | 'facility_improvement'
  | 'community_engagement'
  | 'health_wellness'
  | 'economic_development'
  | 'environmental_sustainability'
  | 'technology_integration'
  | 'sports_equity';

export type InitiativeStatus = 
  | 'planning'
  | 'active'
  | 'completed'
  | 'evaluated'
  | 'suspended';

export interface ImpactMetrics {
  participants: number;
  reach: number;
  satisfaction: number;
  outcomes: Record<string, number>;
  costEffectiveness: number;
  sustainability: number;
}

export interface ImpactReport {
  cityId: string;
  timeframe: string;
  initiatives: CivicInitiative[];
  metrics: CityMetrics;
  trends: TrendAnalysis;
  recommendations: Recommendation[];
  generatedAt: Date;
}

export interface TrendAnalysis {
  period: string;
  changes: {
    sportsParticipation: number; // percentage change
    facilities: number; // percentage change
    programs: number; // percentage change
    economic: number; // percentage change
    health: number; // percentage change
    social: number; // percentage change
    environmental: number; // percentage change
    technology: number; // percentage change
  };
  insights: string[];
  predictions: Prediction[];
}

export interface Prediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  cost: 'high' | 'medium' | 'low';
  timeline: string;
  stakeholders: string[];
  expectedOutcomes: string[];
}

export interface StakeholderEngagement {
  stakeholderId: string;
  name: string;
  role: string;
  engagementLevel: number; // 0-100
  feedback: Feedback[];
  lastContact: Date;
}

export interface Feedback {
  id: string;
  type: 'survey' | 'interview' | 'focus_group' | 'public_comment';
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  timestamp: Date;
}

export interface CivicDashboard {
  cityId: string;
  metrics: CityMetrics;
  activeInitiatives: CivicInitiative[];
  recentReports: ImpactReport[];
  stakeholderEngagement: StakeholderEngagement[];
  alerts: CivicAlert[];
}

export interface CivicAlert {
  id: string;
  type: 'metric_change' | 'initiative_update' | 'stakeholder_feedback' | 'system_issue';
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  actionRequired: boolean;
  actionUrl?: string;
} 