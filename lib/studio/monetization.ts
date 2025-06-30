import { MonetizationTier, TierRequirement, Sponsorship, MonetizationData } from './types';
import { analytics } from '../ai/shared/analytics';

export class MonetizationEngine {
  private tiers: MonetizationTier[] = [];
  private userTiers: Map<string, MonetizationTier> = new Map();
  private sponsorships: Map<string, Sponsorship[]> = new Map(); // userId -> sponsorships

  constructor() {
    this.initializeTiers();
  }

  async getTiers(userId: string): Promise<MonetizationTier[]> {
    try {
      const userTier = this.userTiers.get(userId);
      const availableTiers = this.tiers.filter(tier => 
        !userTier || this.tierLevel(tier) > this.tierLevel(userTier)
      );

      await analytics.track('monetization_tiers_accessed', {
        userId,
        currentTier: userTier?.name || 'none',
        availableTiers: availableTiers.length,
        timestamp: new Date().toISOString()
      });

      return availableTiers;
    } catch (error) {
      await analytics.track('monetization_tiers_access_failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async checkEligibility(userId: string, tierId: string): Promise<boolean> {
    try {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier) {
        throw new Error('Tier not found');
      }

      const userStats = await this.getUserStats(userId);
      const eligible = tier.requirements.every(requirement => {
        switch (requirement.type) {
          case 'views':
            return userStats.totalViews >= requirement.value;
          case 'subscribers':
            return userStats.subscribers >= requirement.value;
          case 'videos':
            return userStats.publishedVideos >= requirement.value;
          case 'engagement':
            return userStats.averageEngagement >= requirement.value;
          case 'time':
            return userStats.daysActive >= requirement.timeframe;
          default:
            return false;
        }
      });

      await analytics.track('monetization_eligibility_checked', {
        userId,
        tierId,
        eligible,
        requirements: tier.requirements,
        userStats,
        timestamp: new Date().toISOString()
      });

      return eligible;
    } catch (error) {
      await analytics.track('monetization_eligibility_check_failed', {
        userId,
        tierId,
        error: error.message
      });
      throw error;
    }
  }

  async upgradeTier(userId: string, tierId: string): Promise<MonetizationTier> {
    try {
      const eligible = await this.checkEligibility(userId, tierId);
      if (!eligible) {
        throw new Error('User does not meet tier requirements');
      }

      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier) {
        throw new Error('Tier not found');
      }

      this.userTiers.set(userId, tier);

      await analytics.track('monetization_tier_upgraded', {
        userId,
        tierId,
        tierName: tier.name,
        revenueShare: tier.revenueShare,
        timestamp: new Date().toISOString()
      });

      return tier;
    } catch (error) {
      await analytics.track('monetization_tier_upgrade_failed', {
        userId,
        tierId,
        error: error.message
      });
      throw error;
    }
  }

  async calculateRevenue(userId: string, views: number, engagement: number): Promise<number> {
    try {
      const tier = this.userTiers.get(userId);
      if (!tier) {
        return 0; // No monetization without tier
      }

      // Base revenue calculation
      const baseRevenue = views * 0.001; // $0.001 per view
      const engagementBonus = engagement * 0.01; // $0.01 per engagement
      const totalRevenue = (baseRevenue + engagementBonus) * tier.revenueShare;

      await analytics.track('revenue_calculated', {
        userId,
        tierId: tier.id,
        views,
        engagement,
        baseRevenue,
        engagementBonus,
        totalRevenue,
        timestamp: new Date().toISOString()
      });

      return Math.round(totalRevenue * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      await analytics.track('revenue_calculation_failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async addSponsorship(userId: string, sponsorship: Omit<Sponsorship, 'id'>): Promise<Sponsorship> {
    try {
      const newSponsorship: Sponsorship = {
        ...sponsorship,
        id: `sponsorship-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };

      if (!this.sponsorships.has(userId)) {
        this.sponsorships.set(userId, []);
      }

      this.sponsorships.get(userId)!.push(newSponsorship);

      await analytics.track('sponsorship_added', {
        userId,
        sponsorshipId: newSponsorship.id,
        sponsor: newSponsorship.sponsor,
        amount: newSponsorship.amount,
        timestamp: new Date().toISOString()
      });

      return newSponsorship;
    } catch (error) {
      await analytics.track('sponsorship_add_failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async getUserSponsorships(userId: string): Promise<Sponsorship[]> {
    const userSponsorships = this.sponsorships.get(userId) || [];
    
    await analytics.track('user_sponsorships_accessed', {
      userId,
      sponsorshipsCount: userSponsorships.length,
      timestamp: new Date().toISOString()
    });

    return userSponsorships;
  }

  private async getUserStats(userId: string): Promise<any> {
    // Mock user stats - in real implementation, this would come from analytics
    return {
      totalViews: Math.floor(Math.random() * 100000) + 1000,
      subscribers: Math.floor(Math.random() * 1000) + 100,
      publishedVideos: Math.floor(Math.random() * 50) + 5,
      averageEngagement: Math.random() * 10 + 2,
      daysActive: Math.floor(Math.random() * 365) + 30
    };
  }

  private tierLevel(tier: MonetizationTier): number {
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return tierOrder.indexOf(tier.name.toLowerCase());
  }

  private initializeTiers(): void {
    this.tiers = [
      {
        id: 'bronze',
        name: 'Bronze Creator',
        requirements: [
          { type: 'views', value: 1000, timeframe: 30 },
          { type: 'videos', value: 5, timeframe: 30 }
        ],
        benefits: [
          'Basic monetization',
          'Creator badge',
          'Analytics access'
        ],
        revenueShare: 0.5,
        badge: '🥉'
      },
      {
        id: 'silver',
        name: 'Silver Creator',
        requirements: [
          { type: 'views', value: 10000, timeframe: 30 },
          { type: 'subscribers', value: 100, timeframe: 30 },
          { type: 'engagement', value: 3, timeframe: 30 }
        ],
        benefits: [
          'Enhanced monetization',
          'Sponsorship opportunities',
          'Priority support'
        ],
        revenueShare: 0.6,
        badge: '🥈'
      },
      {
        id: 'gold',
        name: 'Gold Creator',
        requirements: [
          { type: 'views', value: 50000, timeframe: 30 },
          { type: 'subscribers', value: 500, timeframe: 30 },
          { type: 'engagement', value: 5, timeframe: 30 }
        ],
        benefits: [
          'Premium monetization',
          'Exclusive sponsorships',
          'Creator events access'
        ],
        revenueShare: 0.7,
        badge: '🥇'
      },
      {
        id: 'platinum',
        name: 'Platinum Creator',
        requirements: [
          { type: 'views', value: 100000, timeframe: 30 },
          { type: 'subscribers', value: 1000, timeframe: 30 },
          { type: 'engagement', value: 7, timeframe: 30 }
        ],
        benefits: [
          'Maximum monetization',
          'Brand partnerships',
          'Platform features'
        ],
        revenueShare: 0.8,
        badge: '💎'
      }
    ];
  }

  async getMonetizationAnalytics(): Promise<any> {
    const analytics = {
      totalMonetizedUsers: this.userTiers.size,
      tierDistribution: {} as Record<string, number>,
      totalRevenue: 0,
      averageRevenuePerUser: 0,
      topEarners: [] as any[]
    };

    // Tier distribution
    for (const tier of this.userTiers.values()) {
      analytics.tierDistribution[tier.name] = 
        (analytics.tierDistribution[tier.name] || 0) + 1;
    }

    // Mock revenue data
    const totalUsers = this.userTiers.size;
    if (totalUsers > 0) {
      analytics.totalRevenue = totalUsers * 150; // Mock average
      analytics.averageRevenuePerUser = analytics.totalRevenue / totalUsers;
    }

    return analytics;
  }
} 