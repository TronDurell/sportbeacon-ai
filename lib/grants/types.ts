export interface GrantConfig {
  category: GrantCategory;
  amount: {
    min: number;
    max: number;
  };
  location: {
    country?: string;
    state?: string;
    city?: string;
  };
  eligibility: {
    organizationType: OrganizationType[];
    focusAreas: FocusArea[];
    experienceLevel: ExperienceLevel;
  };
  deadline: {
    from: Date;
    to: Date;
  };
}

export type GrantCategory = 
  | 'sports_development'
  | 'youth_programs'
  | 'community_health'
  | 'technology_innovation'
  | 'education'
  | 'social_impact'
  | 'research'
  | 'infrastructure';

export type OrganizationType = 
  | 'nonprofit'
  | 'school'
  | 'university'
  | 'government'
  | 'community_organization'
  | 'sports_club'
  | 'youth_center';

export type FocusArea = 
  | 'sports_equipment'
  | 'facility_improvement'
  | 'coach_training'
  | 'youth_development'
  | 'community_engagement'
  | 'technology_integration'
  | 'health_wellness'
  | 'education_programs';

export type ExperienceLevel = 
  | 'new_organization'
  | 'established_organization'
  | 'experienced_grantee'
  | 'any';

export interface GrantOpportunity {
  id: string;
  title: string;
  description: string;
  amount: {
    min: number;
    max: number;
    currency: string;
  };
  category: GrantCategory;
  focusAreas: FocusArea[];
  eligibility: {
    organizationTypes: OrganizationType[];
    experienceLevel: ExperienceLevel;
    requirements: string[];
  };
  deadline: Date;
  applicationUrl: string;
  contactInfo: {
    email: string;
    phone?: string;
    website?: string;
  };
  successRate: number;
  averageProcessingTime: number;
  tags: string[];
}

export interface ApplicationDraft {
  grantId: string;
  sections: ApplicationSection[];
  completionPercentage: number;
  estimatedTimeToComplete: number;
  lastUpdated: Date;
  status: DraftStatus;
}

export interface ApplicationSection {
  id: string;
  title: string;
  content: string;
  required: boolean;
  completed: boolean;
  wordLimit?: number;
  currentWordCount: number;
}

export type DraftStatus = 
  | 'draft'
  | 'in_progress'
  | 'review'
  | 'ready_to_submit'
  | 'submitted';

export interface DeadlineAlert {
  grantId: string;
  grantTitle: string;
  deadline: Date;
  daysRemaining: number;
  priority: 'high' | 'medium' | 'low';
  userId: string;
} 