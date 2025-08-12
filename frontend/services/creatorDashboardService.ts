import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Timestamp } from 'firebase/firestore';

// Creator Dashboard Types
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
    payoutHistory: Array<{ date: Timestamp; amount: number; status: string }>;
  };
  
  // Performance Analytics
  performance: {
    gamesPlayed: Array<{ date: string; count: number; wins: number }>;
    winRateBySport: Record<string, number>;
    performanceTrend: Array<{ date: string; winRate: number; averageScore: number }>;
    achievements: Array<{ id: string; name: string; earnedAt: Timestamp; description: string }>;
    recentGames: Array<{ id: string; sport: string; result: 'win' | 'loss' | 'draw'; score: number; date: Timestamp }>;
  };
  
  // Social Analytics
  social: {
    followerGrowth: Array<{ date: string; count: number }>;
    engagementRate: number;
    topPosts: Array<{ id: string; type: string; views: number; likes: number; date: Timestamp }>;
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastRefreshed: Timestamp;
  status: 'active' | 'inactive' | 'suspended';
}

// Dashboard Update Types
export interface DashboardUpdate {
  overview?: Partial<CreatorDashboard['overview']>;
  financial?: Partial<CreatorDashboard['financial']>;
  performance?: Partial<CreatorDashboard['performance']>;
  social?: Partial<CreatorDashboard['social']>;
  content?: Partial<CreatorDashboard['content']>;
  goals?: Partial<CreatorDashboard['goals']>;
  settings?: Partial<CreatorDashboard['settings']>;
}

// Dashboard Analytics
export interface DashboardAnalytics {
  totalCreators: number;
  activeCreators: number;
  totalEarnings: number;
  averageEarnings: number;
  topEarners: Array<{ userId: string; displayName: string; earnings: number }>;
  earningsDistribution: Record<string, number>;
  creatorGrowth: Array<{ date: string; count: number }>;
  platformMetrics: {
    totalTips: number;
    totalGames: number;
    totalFollowers: number;
    averageEngagement: number;
  };
}

// Creator Insights
export interface CreatorInsights {
  userId: string;
  insights: {
    bestPerformingContent: string;
    optimalPostingTime: string;
    topEngagementSource: string;
    audienceGrowthRate: number;
    earningsGrowthRate: number;
    recommendedActions: string[];
  };
  predictions: {
    nextMonthEarnings: number;
    nextMonthFollowers: number;
    trendingSports: string[];
    marketOpportunities: string[];
  };
}

/**
 * Comprehensive Creator Dashboard Service
 * Handles creator analytics and dashboard management with real-time Firestore integration
 */
export class CreatorDashboardService {
  private static instance: CreatorDashboardService;
  private listeners: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): CreatorDashboardService {
    if (!CreatorDashboardService.instance) {
      CreatorDashboardService.instance = new CreatorDashboardService();
    }
    return CreatorDashboardService.instance;
  }

  // Create Creator Dashboard
  async createCreatorDashboard(
    userId: string,
    initialData?: Partial<CreatorDashboard>
  ): Promise<string> {
    const dashboardRef = doc(collection(db, 'creatorDashboards'));
    
    const defaultDashboard: CreatorDashboard = {
      id: dashboardRef.id,
      userId,
      overview: {
        totalEarnings: 0,
        totalTips: 0,
        totalFollowers: 0,
        totalGames: 0,
        winRate: 0,
        averageRating: 0,
        totalViews: 0,
        totalLikes: 0
      },
      financial: {
        monthlyEarnings: [],
        earningsBySource: {},
        pendingPayouts: 0,
        completedPayouts: 0,
        averageTipAmount: 0,
        topTippers: [],
        payoutHistory: []
      },
      performance: {
        gamesPlayed: [],
        winRateBySport: {},
        performanceTrend: [],
        achievements: [],
        recentGames: []
      },
      social: {
        followerGrowth: [],
        engagementRate: 0,
        topPosts: [],
        audienceDemographics: {},
        interactionHistory: []
      },
      content: {
        totalPosts: 0,
        totalVideos: 0,
        totalImages: 0,
        viewsByContent: {},
        engagementByContent: {},
        popularContent: [],
        contentSchedule: []
      },
      goals: {
        monthlyEarningsTarget: 0,
        monthlyFollowersTarget: 0,
        monthlyGamesTarget: 0,
        winRateTarget: 0,
        currentProgress: {
          earningsProgress: 0,
          followersProgress: 0,
          gamesProgress: 0,
          winRateProgress: 0
        }
      },
      settings: {
        autoPayout: false,
        payoutThreshold: 10000, // $100 in cents
        notificationPreferences: {
          newFollower: true,
          newTip: true,
          newGame: true,
          achievement: true,
          payout: true
        },
        privacySettings: {
          showEarnings: true,
          showFollowers: true,
          showGames: true,
          showRating: true
        }
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      lastRefreshed: serverTimestamp() as Timestamp,
      status: 'active',
      ...initialData
    };

    await setDoc(dashboardRef, defaultDashboard);
    return dashboardRef.id;
  }

  // Get Creator Dashboard
  async getCreatorDashboard(userId: string): Promise<CreatorDashboard | null> {
    const q = query(
      collection(db, 'creatorDashboards'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as CreatorDashboard;
    }

    return null;
  }

  // Update Creator Dashboard
  async updateCreatorDashboard(
    userId: string,
    updates: DashboardUpdate
  ): Promise<void> {
    const dashboard = await this.getCreatorDashboard(userId);
    if (!dashboard) {
      throw new Error('Creator dashboard not found');
    }

    const dashboardRef = doc(db, 'creatorDashboards', dashboard.id);
    
    await updateDoc(dashboardRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      lastRefreshed: serverTimestamp()
    });
  }

  // Refresh Dashboard Data
  async refreshDashboardData(userId: string): Promise<void> {
    // This would integrate with other services to fetch fresh data
    // For now, we'll just update the lastRefreshed timestamp
    await this.updateCreatorDashboard(userId, {});
  }

  // Update Financial Data
  async updateFinancialData(
    userId: string,
    financial: Partial<CreatorDashboard['financial']>
  ): Promise<void> {
    await this.updateCreatorDashboard(userId, { financial });
  }

  // Update Performance Data
  async updatePerformanceData(
    userId: string,
    performance: Partial<CreatorDashboard['performance']>
  ): Promise<void> {
    await this.updateCreatorDashboard(userId, { performance });
  }

  // Update Social Data
  async updateSocialData(
    userId: string,
    social: Partial<CreatorDashboard['social']>
  ): Promise<void> {
    await this.updateCreatorDashboard(userId, { social });
  }

  // Update Content Data
  async updateContentData(
    userId: string,
    content: Partial<CreatorDashboard['content']>
  ): Promise<void> {
    await this.updateCreatorDashboard(userId, { content });
  }

  // Update Goals
  async updateGoals(
    userId: string,
    goals: Partial<CreatorDashboard['goals']>
  ): Promise<void> {
    await this.updateCreatorDashboard(userId, { goals });
  }

  // Update Settings
  async updateSettings(
    userId: string,
    settings: Partial<CreatorDashboard['settings']>
  ): Promise<void> {
    await this.updateCreatorDashboard(userId, { settings });
  }

  // Get Creator Insights
  async getCreatorInsights(userId: string): Promise<CreatorInsights | null> {
    const dashboard = await this.getCreatorDashboard(userId);
    if (!dashboard) {
      return null;
    }

    // Calculate insights based on dashboard data
    const insights = this.calculateInsights(dashboard);
    const predictions = this.generatePredictions(dashboard);

    return {
      userId,
      insights,
      predictions
    };
  }

  // Get Dashboard Analytics
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const q = query(
      collection(db, 'creatorDashboards'),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    const dashboards = querySnapshot.docs.map(doc => 
      ({ id: doc.id, ...doc.data() }) as CreatorDashboard
    );

    // Calculate analytics
    const totalCreators = dashboards.length;
    const activeCreators = dashboards.filter(d => d.status === 'active').length;
    const totalEarnings = dashboards.reduce((sum, d) => sum + d.overview.totalEarnings, 0);
    const averageEarnings = totalCreators > 0 ? totalEarnings / totalCreators : 0;

    // Get top earners
    const topEarners = dashboards
      .sort((a, b) => b.overview.totalEarnings - a.overview.totalEarnings)
      .slice(0, 10)
      .map(d => ({
        userId: d.userId,
        displayName: 'Creator', // Would need to fetch from user profile
        earnings: d.overview.totalEarnings
      }));

    // Calculate earnings distribution
    const earningsDistribution: Record<string, number> = {
      '0-1000': 0,
      '1000-5000': 0,
      '5000-10000': 0,
      '10000-50000': 0,
      '50000+': 0
    };

    dashboards.forEach(dashboard => {
      const earnings = dashboard.overview.totalEarnings;
      if (earnings < 1000) earningsDistribution['0-1000']++;
      else if (earnings < 5000) earningsDistribution['1000-5000']++;
      else if (earnings < 10000) earningsDistribution['5000-10000']++;
      else if (earnings < 50000) earningsDistribution['10000-50000']++;
      else earningsDistribution['50000+']++;
    });

    // Calculate platform metrics
    const platformMetrics = {
      totalTips: dashboards.reduce((sum, d) => sum + d.overview.totalTips, 0),
      totalGames: dashboards.reduce((sum, d) => sum + d.overview.totalGames, 0),
      totalFollowers: dashboards.reduce((sum, d) => sum + d.overview.totalFollowers, 0),
      averageEngagement: dashboards.reduce((sum, d) => sum + d.social.engagementRate, 0) / totalCreators
    };

    return {
      totalCreators,
      activeCreators,
      totalEarnings,
      averageEarnings,
      topEarners,
      earningsDistribution,
      creatorGrowth: [], // Would need historical data
      platformMetrics
    };
  }

  // Real-time Dashboard Listener
  subscribeToCreatorDashboard(
    userId: string,
    callback: (dashboard: CreatorDashboard | null) => void
  ): () => void {
    const q = query(
      collection(db, 'creatorDashboards'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const dashboard = { id: doc.id, ...doc.data() } as CreatorDashboard;
        callback(dashboard);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to creator dashboard:', error);
      callback(null);
    });

    const listenerId = `dashboard_${userId}`;
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Real-time Analytics Listener
  subscribeToDashboardAnalytics(
    callback: (analytics: DashboardAnalytics) => void
  ): () => void {
    const q = query(
      collection(db, 'creatorDashboards'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const dashboards = querySnapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as CreatorDashboard
      );

      const analytics = await this.calculateAnalytics(dashboards);
      callback(analytics);
    }, (error) => {
      console.error('Error listening to dashboard analytics:', error);
      callback({
        totalCreators: 0,
        activeCreators: 0,
        totalEarnings: 0,
        averageEarnings: 0,
        topEarners: [],
        earningsDistribution: {},
        creatorGrowth: [],
        platformMetrics: {
          totalTips: 0,
          totalGames: 0,
          totalFollowers: 0,
          averageEngagement: 0
        }
      });
    });

    const listenerId = 'analytics';
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Real-time Insights Listener
  subscribeToCreatorInsights(
    userId: string,
    callback: (insights: CreatorInsights | null) => void
  ): () => void {
    const q = query(
      collection(db, 'creatorDashboards'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const dashboard = { id: doc.id, ...doc.data() } as CreatorDashboard;
        
        const insights = this.calculateInsights(dashboard);
        const predictions = this.generatePredictions(dashboard);

        callback({
          userId,
          insights,
          predictions
        });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to creator insights:', error);
      callback(null);
    });

    const listenerId = `insights_${userId}`;
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Calculate Insights Helper
  private calculateInsights(dashboard: CreatorDashboard): CreatorInsights['insights'] {
    const { financial, performance, social, content } = dashboard;

    // Determine best performing content
    const bestPerformingContent = content.popularContent.length > 0 
      ? content.popularContent[0].type 
      : 'No content yet';

    // Calculate optimal posting time (simplified)
    const optimalPostingTime = '6:00 PM'; // Would need actual data analysis

    // Determine top engagement source
    const topEngagementSource = social.engagementRate > 0.05 ? 'Social Media' : 'Direct';

    // Calculate growth rates
    const audienceGrowthRate = social.followerGrowth.length > 1 
      ? (social.followerGrowth[social.followerGrowth.length - 1].count - social.followerGrowth[0].count) / social.followerGrowth[0].count
      : 0;

    const earningsGrowthRate = financial.monthlyEarnings.length > 1
      ? (financial.monthlyEarnings[financial.monthlyEarnings.length - 1].amount - financial.monthlyEarnings[0].amount) / financial.monthlyEarnings[0].amount
      : 0;

    // Generate recommended actions
    const recommendedActions: string[] = [];
    
    if (social.engagementRate < 0.05) {
      recommendedActions.push('Increase social media engagement');
    }
    
    if (financial.averageTipAmount < 500) {
      recommendedActions.push('Encourage higher tip amounts');
    }
    
    if (performance.winRate < 0.5) {
      recommendedActions.push('Focus on improving game performance');
    }

    return {
      bestPerformingContent,
      optimalPostingTime,
      topEngagementSource,
      audienceGrowthRate,
      earningsGrowthRate,
      recommendedActions
    };
  }

  // Generate Predictions Helper
  private generatePredictions(dashboard: CreatorDashboard): CreatorInsights['predictions'] {
    const { financial, social, performance } = dashboard;

    // Simple linear prediction for next month
    const nextMonthEarnings = financial.monthlyEarnings.length > 0
      ? financial.monthlyEarnings[financial.monthlyEarnings.length - 1].amount * 1.1
      : 0;

    const nextMonthFollowers = social.followerGrowth.length > 0
      ? social.followerGrowth[social.followerGrowth.length - 1].count * 1.05
      : 0;

    // Determine trending sports based on performance
    const trendingSports = Object.entries(performance.winRateBySport)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([sport]) => sport);

    // Generate market opportunities
    const marketOpportunities: string[] = [];
    
    if (financial.averageTipAmount < 1000) {
      marketOpportunities.push('Premium content creation');
    }
    
    if (social.engagementRate < 0.1) {
      marketOpportunities.push('Community building');
    }

    return {
      nextMonthEarnings,
      nextMonthFollowers,
      trendingSports,
      marketOpportunities
    };
  }

  // Calculate Analytics Helper
  private async calculateAnalytics(dashboards: CreatorDashboard[]): Promise<DashboardAnalytics> {
    const totalCreators = dashboards.length;
    const activeCreators = dashboards.filter(d => d.status === 'active').length;
    const totalEarnings = dashboards.reduce((sum, d) => sum + d.overview.totalEarnings, 0);
    const averageEarnings = totalCreators > 0 ? totalEarnings / totalCreators : 0;

    const topEarners = dashboards
      .sort((a, b) => b.overview.totalEarnings - a.overview.totalEarnings)
      .slice(0, 10)
      .map(d => ({
        userId: d.userId,
        displayName: 'Creator',
        earnings: d.overview.totalEarnings
      }));

    const earningsDistribution: Record<string, number> = {
      '0-1000': 0,
      '1000-5000': 0,
      '5000-10000': 0,
      '10000-50000': 0,
      '50000+': 0
    };

    dashboards.forEach(dashboard => {
      const earnings = dashboard.overview.totalEarnings;
      if (earnings < 1000) earningsDistribution['0-1000']++;
      else if (earnings < 5000) earningsDistribution['1000-5000']++;
      else if (earnings < 10000) earningsDistribution['5000-10000']++;
      else if (earnings < 50000) earningsDistribution['10000-50000']++;
      else earningsDistribution['50000+']++;
    });

    const platformMetrics = {
      totalTips: dashboards.reduce((sum, d) => sum + d.overview.totalTips, 0),
      totalGames: dashboards.reduce((sum, d) => sum + d.overview.totalGames, 0),
      totalFollowers: dashboards.reduce((sum, d) => sum + d.overview.totalFollowers, 0),
      averageEngagement: dashboards.reduce((sum, d) => sum + d.social.engagementRate, 0) / totalCreators
    };

    return {
      totalCreators,
      activeCreators,
      totalEarnings,
      averageEarnings,
      topEarners,
      earningsDistribution,
      creatorGrowth: [],
      platformMetrics
    };
  }

  // Batch Operations
  async batchUpdateDashboards(updates: Array<{ userId: string; updates: DashboardUpdate }>): Promise<void> {
    const batch = writeBatch(db);

    for (const { userId, updates } of updates) {
      const dashboard = await this.getCreatorDashboard(userId);
      if (dashboard) {
        const dashboardRef = doc(db, 'creatorDashboards', dashboard.id);
        batch.update(dashboardRef, {
          ...updates,
          updatedAt: serverTimestamp(),
          lastRefreshed: serverTimestamp()
        });
      }
    }

    await batch.commit();
  }

  // Transaction Operations
  async updateDashboardWithTransaction(
    userId: string,
    updates: DashboardUpdate
  ): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const dashboard = await this.getCreatorDashboard(userId);
      if (!dashboard) {
        throw new Error('Creator dashboard not found');
      }

      const dashboardRef = doc(db, 'creatorDashboards', dashboard.id);
      transaction.update(dashboardRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        lastRefreshed: serverTimestamp()
      });
    });
  }

  // Cleanup Listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  // Get Listener Count (for debugging)
  getListenerCount(): number {
    return this.listeners.size;
  }
}

export default CreatorDashboardService; 