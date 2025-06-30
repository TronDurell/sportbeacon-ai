import { CreatorBadge, BadgeType, BadgeRequirement } from './types';
import { analytics } from '../ai/shared/analytics';

export class BadgeSystem {
  private badges: Map<string, CreatorBadge[]> = new Map(); // userId -> badges
  private badgeDefinitions: Map<BadgeType, BadgeRequirement[]> = new Map();

  constructor() {
    this.initializeBadgeDefinitions();
  }

  async awardBadge(userId: string, badgeType: BadgeType): Promise<CreatorBadge> {
    try {
      // Check if user already has this badge
      const userBadges = this.badges.get(userId) || [];
      const existingBadge = userBadges.find(badge => badge.type === badgeType);
      
      if (existingBadge) {
        throw new Error('User already has this badge');
      }

      // Check eligibility
      const eligible = await this.checkBadgeEligibility(userId, badgeType);
      if (!eligible) {
        throw new Error('User does not meet badge requirements');
      }

      const badge = this.createBadge(userId, badgeType);
      userBadges.push(badge);
      this.badges.set(userId, userBadges);

      await analytics.track('badge_awarded', {
        userId,
        badgeType,
        badgeName: badge.name,
        timestamp: new Date().toISOString()
      });

      return badge;
    } catch (error) {
      await analytics.track('badge_award_failed', {
        userId,
        badgeType,
        error: error.message
      });
      throw error;
    }
  }

  async getUserBadges(userId: string): Promise<CreatorBadge[]> {
    const userBadges = this.badges.get(userId) || [];
    
    await analytics.track('user_badges_accessed', {
      userId,
      badgesCount: userBadges.length,
      timestamp: new Date().toISOString()
    });

    return userBadges;
  }

  async checkEligibleBadges(userId: string): Promise<BadgeType[]> {
    try {
      const userBadges = this.badges.get(userId) || [];
      const earnedTypes = userBadges.map(badge => badge.type);
      
      const eligibleBadges: BadgeType[] = [];
      
      for (const [badgeType, requirements] of this.badgeDefinitions) {
        if (!earnedTypes.includes(badgeType)) {
          const eligible = await this.checkBadgeEligibility(userId, badgeType);
          if (eligible) {
            eligibleBadges.push(badgeType);
          }
        }
      }

      await analytics.track('eligible_badges_checked', {
        userId,
        eligibleCount: eligibleBadges.length,
        timestamp: new Date().toISOString()
      });

      return eligibleBadges;
    } catch (error) {
      await analytics.track('eligible_badges_check_failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  private async checkBadgeEligibility(userId: string, badgeType: BadgeType): Promise<boolean> {
    const requirements = this.badgeDefinitions.get(badgeType);
    if (!requirements) {
      return false;
    }

    const userStats = await this.getUserStats(userId);
    
    return requirements.every(requirement => {
      switch (requirement.type) {
        case 'views':
          return userStats.totalViews >= requirement.value;
        case 'videos':
          return userStats.publishedVideos >= requirement.value;
        case 'engagement':
          return userStats.averageEngagement >= requirement.value;
        case 'time':
          return userStats.daysActive >= requirement.value;
        case 'collaborations':
          return userStats.collaborations >= requirement.value;
        default:
          return false;
      }
    });
  }

  private createBadge(userId: string, badgeType: BadgeType): CreatorBadge {
    const badgeInfo = this.getBadgeInfo(badgeType);
    
    return {
      id: `badge-${userId}-${badgeType}-${Date.now()}`,
      userId,
      type: badgeType,
      name: badgeInfo.name,
      description: badgeInfo.description,
      icon: badgeInfo.icon,
      earnedDate: new Date(),
      requirements: this.badgeDefinitions.get(badgeType) || [],
      benefits: badgeInfo.benefits
    };
  }

  private getBadgeInfo(badgeType: BadgeType): any {
    const badgeInfo = {
      first_video: {
        name: 'First Steps',
        description: 'Published your first video',
        icon: '🎬',
        benefits: ['Unlock basic editing tools', 'Creator profile access']
      },
      viral_content: {
        name: 'Viral Sensation',
        description: 'Achieved 10,000+ views on a single video',
        icon: '🚀',
        benefits: ['Priority algorithm boost', 'Trending page access']
      },
      consistent_creator: {
        name: 'Consistency King',
        description: 'Published 10+ videos in 30 days',
        icon: '📅',
        benefits: ['Scheduled publishing', 'Batch upload tools']
      },
      community_builder: {
        name: 'Community Builder',
        description: 'Built an engaged community of 1,000+ followers',
        icon: '👥',
        benefits: ['Community features', 'Moderation tools']
      },
      skill_teacher: {
        name: 'Skill Teacher',
        description: 'Created 5+ educational videos',
        icon: '📚',
        benefits: ['Educational content boost', 'Expert verification']
      },
      sports_expert: {
        name: 'Sports Expert',
        description: 'Demonstrated deep sports knowledge across multiple videos',
        icon: '🏆',
        benefits: ['Expert badge display', 'Knowledge sharing opportunities']
      },
      trending_creator: {
        name: 'Trending Creator',
        description: 'Featured on trending page 3+ times',
        icon: '🔥',
        benefits: ['Trending algorithm boost', 'Featured creator status']
      },
      monetization_master: {
        name: 'Monetization Master',
        description: 'Earned $1,000+ through platform monetization',
        icon: '💰',
        benefits: ['Premium monetization rates', 'Financial insights']
      },
      collaboration_king: {
        name: 'Collaboration King',
        description: 'Collaborated with 10+ other creators',
        icon: '🤝',
        benefits: ['Collaboration tools', 'Network access']
      },
      innovation_leader: {
        name: 'Innovation Leader',
        description: 'Pioneered new content formats or techniques',
        icon: '💡',
        benefits: ['Innovation recognition', 'Platform influence']
      }
    };

    return badgeInfo[badgeType] || {
      name: 'Unknown Badge',
      description: 'A mysterious achievement',
      icon: '❓',
      benefits: []
    };
  }

  private async getUserStats(userId: string): Promise<any> {
    // Mock user stats - in real implementation, this would come from analytics
    return {
      totalViews: Math.floor(Math.random() * 100000) + 1000,
      publishedVideos: Math.floor(Math.random() * 50) + 5,
      averageEngagement: Math.random() * 10 + 2,
      daysActive: Math.floor(Math.random() * 365) + 30,
      collaborations: Math.floor(Math.random() * 20) + 1
    };
  }

  private initializeBadgeDefinitions(): void {
    this.badgeDefinitions.set('first_video', [
      { type: 'videos', value: 1, description: 'Publish your first video' }
    ]);

    this.badgeDefinitions.set('viral_content', [
      { type: 'views', value: 10000, description: 'Achieve 10,000+ views on a single video' }
    ]);

    this.badgeDefinitions.set('consistent_creator', [
      { type: 'videos', value: 10, description: 'Publish 10+ videos in 30 days' },
      { type: 'time', value: 30, description: 'Maintain activity for 30 days' }
    ]);

    this.badgeDefinitions.set('community_builder', [
      { type: 'engagement', value: 5, description: 'Build engaged community' }
    ]);

    this.badgeDefinitions.set('skill_teacher', [
      { type: 'videos', value: 5, description: 'Create 5+ educational videos' }
    ]);

    this.badgeDefinitions.set('sports_expert', [
      { type: 'videos', value: 20, description: 'Demonstrate sports expertise' },
      { type: 'engagement', value: 7, description: 'High engagement with expert content' }
    ]);

    this.badgeDefinitions.set('trending_creator', [
      { type: 'views', value: 50000, description: 'Achieve trending status' }
    ]);

    this.badgeDefinitions.set('monetization_master', [
      { type: 'views', value: 100000, description: 'Build substantial audience' }
    ]);

    this.badgeDefinitions.set('collaboration_king', [
      { type: 'collaborations', value: 10, description: 'Collaborate with 10+ creators' }
    ]);

    this.badgeDefinitions.set('innovation_leader', [
      { type: 'videos', value: 15, description: 'Create innovative content' },
      { type: 'engagement', value: 8, description: 'High engagement with innovative content' }
    ]);
  }

  async getBadgeAnalytics(): Promise<any> {
    const analytics = {
      totalBadgesAwarded: 0,
      badgeDistribution: {} as Record<BadgeType, number>,
      mostEarnedBadge: null as BadgeType | null,
      averageBadgesPerUser: 0
    };

    // Count all badges
    for (const userBadges of this.badges.values()) {
      analytics.totalBadgesAwarded += userBadges.length;
      
      for (const badge of userBadges) {
        analytics.badgeDistribution[badge.type] = 
          (analytics.badgeDistribution[badge.type] || 0) + 1;
      }
    }

    // Find most earned badge
    if (Object.keys(analytics.badgeDistribution).length > 0) {
      analytics.mostEarnedBadge = Object.entries(analytics.badgeDistribution)
        .sort(([,a], [,b]) => b - a)[0][0] as BadgeType;
    }

    // Calculate average
    const totalUsers = this.badges.size;
    analytics.averageBadgesPerUser = totalUsers > 0 ? 
      analytics.totalBadgesAwarded / totalUsers : 0;

    return analytics;
  }
} 