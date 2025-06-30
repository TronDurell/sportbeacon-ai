export interface ChapterConfig {
  name: string;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: [number, number];
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  settings: {
    autoOnboarding: boolean;
    customBranding: boolean;
    analyticsEnabled: boolean;
  };
  features: {
    coachAgent: boolean;
    scoutEval: boolean;
    civicIndexer: boolean;
    venuePredictor: boolean;
  };
}

export interface ChapterMetrics {
  chapterId: string;
  activeUsers: number;
  totalEvents: number;
  revenue: number;
  engagement: {
    dailyActive: number;
    weeklyActive: number;
    monthlyActive: number;
  };
  performance: {
    responseTime: number;
    uptime: number;
    errorRate: number;
  };
}

export interface OnboardingFlow {
  chapterId: string;
  steps: OnboardingStep[];
  completionRate: number;
  averageTime: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  estimatedTime: number;
} 