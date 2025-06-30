import { GrantConfig, GrantOpportunity, GrantCategory, FocusArea } from './types';
import { analytics } from '../ai/shared/analytics';

export class GrantFinderAI {
  private grantDatabase: GrantOpportunity[] = [];

  constructor() {
    this.initializeGrantDatabase();
  }

  async findGrants(criteria: GrantConfig): Promise<GrantOpportunity[]> {
    try {
      const matches = this.filterGrants(criteria);
      
      await analytics.track('grants_searched', {
        criteria,
        matchesFound: matches.length,
        timestamp: new Date().toISOString()
      });

      return matches;
    } catch (error) {
      await analytics.track('grant_search_failed', {
        error: error.message,
        criteria
      });
      throw error;
    }
  }

  private filterGrants(criteria: GrantConfig): GrantOpportunity[] {
    return this.grantDatabase.filter(grant => {
      // Category filter
      if (criteria.category && grant.category !== criteria.category) {
        return false;
      }

      // Amount filter
      if (grant.amount.max < criteria.amount.min || grant.amount.min > criteria.amount.max) {
        return false;
      }

      // Location filter
      if (criteria.location.country && !grant.tags.includes(criteria.location.country.toLowerCase())) {
        return false;
      }

      // Focus areas filter
      if (criteria.eligibility.focusAreas.length > 0) {
        const hasMatchingFocus = criteria.eligibility.focusAreas.some(focus => 
          grant.focusAreas.includes(focus)
        );
        if (!hasMatchingFocus) {
          return false;
        }
      }

      // Deadline filter
      if (grant.deadline < criteria.deadline.from || grant.deadline > criteria.deadline.to) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by deadline (earliest first) and then by amount (highest first)
      if (a.deadline.getTime() !== b.deadline.getTime()) {
        return a.deadline.getTime() - b.deadline.getTime();
      }
      return b.amount.max - a.amount.max;
    });
  }

  private initializeGrantDatabase(): void {
    this.grantDatabase = [
      {
        id: 'grant-001',
        title: 'Youth Sports Development Initiative',
        description: 'Supporting organizations that develop youth sports programs in underserved communities.',
        amount: { min: 5000, max: 50000, currency: 'USD' },
        category: 'youth_programs',
        focusAreas: ['youth_development', 'sports_equipment', 'coach_training'],
        eligibility: {
          organizationTypes: ['nonprofit', 'school', 'community_organization'],
          experienceLevel: 'established_organization',
          requirements: ['501(c)(3) status', '2+ years of operation', 'youth focus']
        },
        deadline: new Date('2024-06-30'),
        applicationUrl: 'https://example.com/grant-001',
        contactInfo: {
          email: 'grants@example.com',
          phone: '+1-555-0123',
          website: 'https://example.com'
        },
        successRate: 0.15,
        averageProcessingTime: 90,
        tags: ['youth', 'sports', 'development', 'usa']
      },
      {
        id: 'grant-002',
        title: 'Community Health Through Sports',
        description: 'Promoting physical activity and health awareness through community sports programs.',
        amount: { min: 10000, max: 100000, currency: 'USD' },
        category: 'community_health',
        focusAreas: ['health_wellness', 'community_engagement', 'facility_improvement'],
        eligibility: {
          organizationTypes: ['nonprofit', 'government', 'community_organization'],
          experienceLevel: 'any',
          requirements: ['health focus', 'community impact', 'measurable outcomes']
        },
        deadline: new Date('2024-08-15'),
        applicationUrl: 'https://example.com/grant-002',
        contactInfo: {
          email: 'healthgrants@example.com',
          website: 'https://health.example.com'
        },
        successRate: 0.12,
        averageProcessingTime: 120,
        tags: ['health', 'community', 'wellness', 'usa']
      },
      {
        id: 'grant-003',
        title: 'Technology Innovation in Sports',
        description: 'Supporting innovative technology solutions for sports training and performance.',
        amount: { min: 25000, max: 200000, currency: 'USD' },
        category: 'technology_innovation',
        focusAreas: ['technology_integration', 'sports_equipment', 'education_programs'],
        eligibility: {
          organizationTypes: ['nonprofit', 'university', 'sports_club'],
          experienceLevel: 'experienced_grantee',
          requirements: ['technology expertise', 'innovation focus', 'prototype available']
        },
        deadline: new Date('2024-09-30'),
        applicationUrl: 'https://example.com/grant-003',
        contactInfo: {
          email: 'techgrants@example.com',
          phone: '+1-555-0456'
        },
        successRate: 0.08,
        averageProcessingTime: 150,
        tags: ['technology', 'innovation', 'sports', 'usa']
      }
    ];
  }

  async getGrantRecommendations(userId: string, organizationProfile: any): Promise<GrantOpportunity[]> {
    // AI-powered recommendations based on organization profile
    const recommendations = this.grantDatabase
      .filter(grant => grant.successRate > 0.1) // Higher success rate
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    await analytics.track('grant_recommendations_generated', {
      userId,
      recommendationsCount: recommendations.length,
      timestamp: new Date().toISOString()
    });

    return recommendations;
  }
} 