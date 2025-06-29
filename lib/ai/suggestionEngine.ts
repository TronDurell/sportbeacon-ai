import { Platform } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Suggestion {
  id: string;
  type: 'admin' | 'creator' | 'town' | 'user' | 'system';
  category: 'venue' | 'event' | 'marketing' | 'revenue' | 'engagement' | 'infrastructure' | 'community';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  impact: SuggestionImpact;
  data: any;
  actionable: boolean;
  estimatedEffort: 'low' | 'medium' | 'high';
  estimatedCost: number;
  timeline: 'immediate' | 'short-term' | 'long-term';
  dependencies: string[];
  createdAt: Date;
  expiresAt?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
  assignedTo?: string;
  completedAt?: Date;
}

export interface SuggestionImpact {
  users: number;
  revenue: number;
  engagement: number;
  community: number;
  efficiency: number; // 0-1
  sustainability: number; // 0-1
}

export interface TrendAnalysis {
  id: string;
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  period: 'day' | 'week' | 'month' | 'quarter';
  timestamp: Date;
}

export interface LearningPattern {
  id: string;
  pattern: string;
  successRate: number; // 0-1
  frequency: number;
  lastOccurrence: Date;
  impact: number; // 0-1
  recommendations: string[];
}

export interface ActionItem {
  id: string;
  suggestionId: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export class SuggestionEngine {
  private static instance: SuggestionEngine;
  private suggestions: Map<string, Suggestion[]> = new Map();
  private trends: TrendAnalysis[] = [];
  private patterns: LearningPattern[] = [];
  private actionItems: Map<string, ActionItem[]> = new Map();
  private learningData: Map<string, any[]> = new Map();

  static getInstance(): SuggestionEngine {
    if (!SuggestionEngine.instance) {
      SuggestionEngine.instance = new SuggestionEngine();
    }
    return SuggestionEngine.instance;
  }

  constructor() {
    this.initialize();
  }

  // Initialize the suggestion engine
  async initialize(): Promise<void> {
    try {
      console.log('Initializing SuggestionEngine...');
      
      // Load historical data
      await this.loadHistoricalData();
      
      // Analyze trends
      await this.analyzeTrends();
      
      // Learn patterns
      await this.learnPatterns();
      
      // Generate suggestions
      await this.generateSuggestions();
      
      // Start periodic updates
      this.startPeriodicUpdates();
      
      console.log('SuggestionEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SuggestionEngine:', error);
    }
  }

  // Load historical data
  private async loadHistoricalData(): Promise<void> {
    try {
      // Load events data
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('startTime', 'desc'),
        limit(1000)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load user activity data
      const activityQuery = query(
        collection(db, 'user_activity'),
        orderBy('timestamp', 'desc'),
        limit(5000)
      );
      const activitySnapshot = await getDocs(activityQuery);
      const activity = activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load revenue data
      const revenueQuery = query(
        collection(db, 'stripe.tips'),
        orderBy('createdAt', 'desc'),
        limit(2000)
      );
      const revenueSnapshot = await getDocs(revenueQuery);
      const revenue = revenueSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load venue data
      const venuesQuery = query(collection(db, 'venues'));
      const venuesSnapshot = await getDocs(venuesQuery);
      const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Organize data by time periods
      this.organizeHistoricalData(events, activity, revenue, venues);
      
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }

  // Organize historical data by time periods
  private organizeHistoricalData(events: any[], activity: any[], revenue: any[], venues: any[]): void {
    const now = new Date();
    const periods = {
      current: { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now },
      previous: { start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      month: { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now },
      quarter: { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now },
    };

    for (const [periodName, period] of Object.entries(periods)) {
      const periodData = {
        events: events.filter(e => {
          const eventTime = new Date(e.startTime);
          return eventTime >= period.start && eventTime <= period.end;
        }),
        activity: activity.filter(a => {
          const activityTime = new Date(a.timestamp);
          return activityTime >= period.start && activityTime <= period.end;
        }),
        revenue: revenue.filter(r => {
          const revenueTime = new Date(r.createdAt);
          return revenueTime >= period.start && revenueTime <= period.end;
        }),
        venues: venues,
      };

      this.learningData.set(periodName, [periodData]);
    }
  }

  // Analyze trends
  private async analyzeTrends(): Promise<void> {
    try {
      const currentData = this.learningData.get('current')?.[0];
      const previousData = this.learningData.get('previous')?.[0];

      if (!currentData || !previousData) return;

      // Analyze event trends
      const eventTrend = this.calculateTrend(
        currentData.events.length,
        previousData.events.length,
        'events'
      );
      this.trends.push(eventTrend);

      // Analyze revenue trends
      const currentRevenue = currentData.revenue.reduce((sum: number, r: any) => sum + r.amount, 0);
      const previousRevenue = previousData.revenue.reduce((sum: number, r: any) => sum + r.amount, 0);
      const revenueTrend = this.calculateTrend(currentRevenue, previousRevenue, 'revenue');
      this.trends.push(revenueTrend);

      // Analyze user activity trends
      const currentActivity = currentData.activity.length;
      const previousActivity = previousData.activity.length;
      const activityTrend = this.calculateTrend(currentActivity, previousActivity, 'user_activity');
      this.trends.push(activityTrend);

      // Analyze venue utilization trends
      const currentUtilization = this.calculateVenueUtilization(currentData.venues);
      const previousUtilization = this.calculateVenueUtilization(previousData.venues);
      const utilizationTrend = this.calculateTrend(currentUtilization, previousUtilization, 'venue_utilization');
      this.trends.push(utilizationTrend);

    } catch (error) {
      console.error('Failed to analyze trends:', error);
    }
  }

  // Calculate trend
  private calculateTrend(current: number, previous: number, metric: string): TrendAnalysis {
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    const trend: 'up' | 'down' | 'stable' = Math.abs(change) < 5 ? 'stable' : change > 0 ? 'up' : 'down';
    
    return {
      id: `trend-${Date.now()}-${Math.random()}`,
      metric,
      currentValue: current,
      previousValue: previous,
      change,
      trend,
      confidence: Math.min(1, Math.abs(change) / 100),
      period: 'week',
      timestamp: new Date(),
    };
  }

  // Calculate venue utilization
  private calculateVenueUtilization(venues: any[]): number {
    if (venues.length === 0) return 0;
    
    const totalUtilization = venues.reduce((sum, venue) => {
      const occupancy = venue.sensors?.occupancy || { current: 0, max: 1 };
      return sum + (occupancy.current / Math.max(occupancy.max, 1));
    }, 0);
    
    return totalUtilization / venues.length;
  }

  // Learn patterns
  private async learnPatterns(): Promise<void> {
    try {
      const monthData = this.learningData.get('month')?.[0];
      if (!monthData) return;

      // Learn event patterns
      const eventPatterns = this.learnEventPatterns(monthData.events);
      this.patterns.push(...eventPatterns);

      // Learn revenue patterns
      const revenuePatterns = this.learnRevenuePatterns(monthData.revenue);
      this.patterns.push(...revenuePatterns);

      // Learn user behavior patterns
      const behaviorPatterns = this.learnBehaviorPatterns(monthData.activity);
      this.patterns.push(...behaviorPatterns);

    } catch (error) {
      console.error('Failed to learn patterns:', error);
    }
  }

  // Learn event patterns
  private learnEventPatterns(events: any[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];

    // Analyze event timing patterns
    const timeSlots = events.reduce((acc: { [key: string]: number }, event: any) => {
      const hour = new Date(event.startTime).getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {});

    const mostPopularTime = Object.entries(timeSlots).reduce((a, b) => a[1] > b[1] ? a : b);
    patterns.push({
      id: `pattern-${Date.now()}-${Math.random()}`,
      pattern: `Most events occur in ${mostPopularTime[0]}`,
      successRate: 0.8,
      frequency: mostPopularTime[1],
      lastOccurrence: new Date(),
      impact: 0.7,
      recommendations: [
        'Schedule more events during popular time slots',
        'Offer incentives for off-peak events',
      ],
    });

    // Analyze sport popularity
    const sportCounts = events.reduce((acc: { [key: string]: number }, event: any) => {
      acc[event.sportType] = (acc[event.sportType] || 0) + 1;
      return acc;
    }, {});

    const mostPopularSport = Object.entries(sportCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    patterns.push({
      id: `pattern-${Date.now()}-${Math.random()}`,
      pattern: `${mostPopularSport[0]} is the most popular sport`,
      successRate: 0.9,
      frequency: mostPopularSport[1],
      lastOccurrence: new Date(),
      impact: 0.8,
      recommendations: [
        'Focus resources on popular sports',
        'Develop programs for underserved sports',
      ],
    });

    return patterns;
  }

  // Learn revenue patterns
  private learnRevenuePatterns(revenue: any[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];

    // Analyze tip patterns
    const tipAmounts = revenue.map(r => r.amount);
    const avgTip = tipAmounts.reduce((sum, amount) => sum + amount, 0) / tipAmounts.length;
    const highTips = tipAmounts.filter(amount => amount > avgTip * 1.5);

    if (highTips.length > 0) {
      patterns.push({
        id: `pattern-${Date.now()}-${Math.random()}`,
        pattern: 'High-value tips occur regularly',
        successRate: 0.7,
        frequency: highTips.length,
        lastOccurrence: new Date(),
        impact: 0.6,
        recommendations: [
          'Identify factors that lead to high tips',
          'Replicate successful creator strategies',
        ],
      });
    }

    return patterns;
  }

  // Learn behavior patterns
  private learnBehaviorPatterns(activity: any[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];

    // Analyze engagement patterns
    const engagementTypes = activity.reduce((acc: { [key: string]: number }, act: any) => {
      acc[act.type] = (acc[act.type] || 0) + 1;
      return acc;
    }, {});

    const mostEngagingType = Object.entries(engagementTypes).reduce((a, b) => a[1] > b[1] ? a : b);
    patterns.push({
      id: `pattern-${Date.now()}-${Math.random()}`,
      pattern: `${mostEngagingType[0]} generates the most engagement`,
      successRate: 0.8,
      frequency: mostEngagingType[1],
      lastOccurrence: new Date(),
      impact: 0.7,
      recommendations: [
        'Increase focus on high-engagement activities',
        'Develop similar engagement opportunities',
      ],
    });

    return patterns;
  }

  // Generate suggestions
  private async generateSuggestions(): Promise<void> {
    try {
      // Generate admin suggestions
      const adminSuggestions = this.generateAdminSuggestions();
      this.suggestions.set('admin', adminSuggestions);

      // Generate creator suggestions
      const creatorSuggestions = this.generateCreatorSuggestions();
      this.suggestions.set('creator', creatorSuggestions);

      // Generate town suggestions
      const townSuggestions = this.generateTownSuggestions();
      this.suggestions.set('town', townSuggestions);

      // Generate user suggestions
      const userSuggestions = this.generateUserSuggestions();
      this.suggestions.set('user', userSuggestions);

      // Generate system suggestions
      const systemSuggestions = this.generateSystemSuggestions();
      this.suggestions.set('system', systemSuggestions);

    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  }

  // Generate admin suggestions
  private generateAdminSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Analyze trends for admin insights
    const revenueTrend = this.trends.find(t => t.metric === 'revenue');
    const eventTrend = this.trends.find(t => t.metric === 'events');
    const activityTrend = this.trends.find(t => t.metric === 'user_activity');

    // Revenue optimization suggestions
    if (revenueTrend && revenueTrend.trend === 'down') {
      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random()}`,
        type: 'admin',
        category: 'revenue',
        title: 'Revenue Decline Detected',
        description: 'Revenue has decreased by ' + Math.abs(revenueTrend.change).toFixed(1) + '%. Consider implementing revenue optimization strategies.',
        priority: 'high',
        confidence: revenueTrend.confidence,
        impact: {
          users: 0,
          revenue: 1000,
          engagement: 0.1,
          community: 0.1,
          efficiency: 0.3,
          sustainability: 0.2,
        },
        data: { trend: revenueTrend, strategies: this.getRevenueStrategies() },
        actionable: true,
        estimatedEffort: 'medium',
        estimatedCost: 500,
        timeline: 'short-term',
        dependencies: [],
        createdAt: new Date(),
      });
    }

    // User engagement suggestions
    if (activityTrend && activityTrend.trend === 'down') {
      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random()}`,
        type: 'admin',
        category: 'engagement',
        title: 'User Engagement Decline',
        description: 'User activity has decreased. Implement engagement campaigns to re-engage users.',
        priority: 'medium',
        confidence: activityTrend.confidence,
        impact: {
          users: 100,
          revenue: 500,
          engagement: 0.4,
          community: 0.3,
          efficiency: 0.2,
          sustainability: 0.3,
        },
        data: { trend: activityTrend, campaigns: this.getEngagementCampaigns() },
        actionable: true,
        estimatedEffort: 'medium',
        estimatedCost: 300,
        timeline: 'short-term',
        dependencies: [],
        createdAt: new Date(),
      });
    }

    // Infrastructure suggestions
    const venueUtilizationTrend = this.trends.find(t => t.metric === 'venue_utilization');
    if (venueUtilizationTrend && venueUtilizationTrend.currentValue < 0.5) {
      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random()}`,
        type: 'admin',
        category: 'infrastructure',
        title: 'Low Venue Utilization',
        description: 'Venue utilization is below 50%. Consider venue optimization strategies.',
        priority: 'medium',
        confidence: 0.8,
        impact: {
          users: 50,
          revenue: 200,
          engagement: 0.2,
          community: 0.2,
          efficiency: 0.5,
          sustainability: 0.4,
        },
        data: { utilization: venueUtilizationTrend.currentValue, strategies: this.getVenueStrategies() },
        actionable: true,
        estimatedEffort: 'high',
        estimatedCost: 1000,
        timeline: 'long-term',
        dependencies: [],
        createdAt: new Date(),
      });
    }

    return suggestions;
  }

  // Generate creator suggestions
  private generateCreatorSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Analyze creator patterns
    const creatorPatterns = this.patterns.filter(p => 
      p.pattern.includes('tip') || p.pattern.includes('engagement')
    );

    // High-value content suggestions
    if (creatorPatterns.some(p => p.pattern.includes('tip'))) {
      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random()}`,
        type: 'creator',
        category: 'revenue',
        title: 'Optimize for Higher Tips',
        description: 'Analysis shows certain content types generate higher tips. Focus on high-value content creation.',
        priority: 'medium',
        confidence: 0.7,
        impact: {
          users: 0,
          revenue: 200,
          engagement: 0.3,
          community: 0.2,
          efficiency: 0.4,
          sustainability: 0.3,
        },
        data: { patterns: creatorPatterns, contentTypes: this.getHighValueContentTypes() },
        actionable: true,
        estimatedEffort: 'medium',
        estimatedCost: 100,
        timeline: 'short-term',
        dependencies: [],
        createdAt: new Date(),
      });
    }

    return suggestions;
  }

  // Generate town suggestions
  private generateTownSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Community development suggestions
    const communityPatterns = this.patterns.filter(p => 
      p.pattern.includes('engagement') || p.pattern.includes('event')
    );

    if (communityPatterns.length > 0) {
      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random()}`,
        type: 'town',
        category: 'community',
        title: 'Community Development Opportunity',
        description: 'High engagement patterns detected. Invest in community development programs.',
        priority: 'medium',
        confidence: 0.8,
        impact: {
          users: 200,
          revenue: 0,
          engagement: 0.5,
          community: 0.8,
          efficiency: 0.3,
          sustainability: 0.6,
        },
        data: { patterns: communityPatterns, programs: this.getCommunityPrograms() },
        actionable: true,
        estimatedEffort: 'high',
        estimatedCost: 2000,
        timeline: 'long-term',
        dependencies: [],
        createdAt: new Date(),
      });
    }

    return suggestions;
  }

  // Generate user suggestions
  private generateUserSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Personal engagement suggestions
    suggestions.push({
      id: `suggestion-${Date.now()}-${Math.random()}`,
      type: 'user',
      category: 'engagement',
      title: 'Increase Your Activity',
      description: 'Regular participation leads to better connections and opportunities.',
      priority: 'low',
      confidence: 0.6,
      impact: {
        users: 1,
        revenue: 50,
        engagement: 0.4,
        community: 0.3,
        efficiency: 0.2,
        sustainability: 0.3,
      },
      data: { activities: this.getUserActivities() },
      actionable: true,
      estimatedEffort: 'low',
      estimatedCost: 0,
      timeline: 'immediate',
      dependencies: [],
      createdAt: new Date(),
    });

    return suggestions;
  }

  // Generate system suggestions
  private generateSystemSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // System optimization suggestions
    const systemPatterns = this.patterns.filter(p => 
      p.pattern.includes('utilization') || p.pattern.includes('efficiency')
    );

    if (systemPatterns.length > 0) {
      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random()}`,
        type: 'system',
        category: 'infrastructure',
        title: 'System Optimization',
        description: 'System patterns indicate optimization opportunities for better performance.',
        priority: 'medium',
        confidence: 0.7,
        impact: {
          users: 0,
          revenue: 0,
          engagement: 0.1,
          community: 0.1,
          efficiency: 0.6,
          sustainability: 0.5,
        },
        data: { patterns: systemPatterns, optimizations: this.getSystemOptimizations() },
        actionable: true,
        estimatedEffort: 'medium',
        estimatedCost: 500,
        timeline: 'short-term',
        dependencies: [],
        createdAt: new Date(),
      });
    }

    return suggestions;
  }

  // Helper methods for suggestion data
  private getRevenueStrategies(): string[] {
    return [
      'Implement dynamic pricing',
      'Launch premium features',
      'Develop sponsorship programs',
      'Create subscription models',
    ];
  }

  private getEngagementCampaigns(): string[] {
    return [
      'User onboarding improvements',
      'Gamification features',
      'Community challenges',
      'Reward programs',
    ];
  }

  private getVenueStrategies(): string[] {
    return [
      'Venue marketing campaigns',
      'Partnership development',
      'Facility improvements',
      'Event programming',
    ];
  }

  private getHighValueContentTypes(): string[] {
    return [
      'Tutorial videos',
      'Behind-the-scenes content',
      'Live streaming',
      'Exclusive content',
    ];
  }

  private getCommunityPrograms(): string[] {
    return [
      'Youth sports programs',
      'Senior fitness classes',
      'Community tournaments',
      'Wellness initiatives',
    ];
  }

  private getUserActivities(): string[] {
    return [
      'Join events regularly',
      'Connect with other users',
      'Share content',
      'Participate in challenges',
    ];
  }

  private getSystemOptimizations(): string[] {
    return [
      'Database optimization',
      'Caching improvements',
      'API performance tuning',
      'Resource allocation',
    ];
  }

  // Start periodic updates
  private startPeriodicUpdates(): void {
    setInterval(async () => {
      await this.updateSuggestions();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  // Update suggestions
  private async updateSuggestions(): Promise<void> {
    try {
      await this.analyzeTrends();
      await this.learnPatterns();
      await this.generateSuggestions();
    } catch (error) {
      console.error('Failed to update suggestions:', error);
    }
  }

  // Public methods
  getSuggestions(type: string): Suggestion[] {
    return this.suggestions.get(type) || [];
  }

  getAllSuggestions(): Suggestion[] {
    return Array.from(this.suggestions.values()).flat();
  }

  getTrends(): TrendAnalysis[] {
    return this.trends;
  }

  getPatterns(): LearningPattern[] {
    return this.patterns;
  }

  getActionItems(userId: string): ActionItem[] {
    return this.actionItems.get(userId) || [];
  }

  // Create action item from suggestion
  async createActionItem(suggestionId: string, assignee: string, dueDate: Date): Promise<ActionItem | null> {
    try {
      const allSuggestions = this.getAllSuggestions();
      const suggestion = allSuggestions.find(s => s.id === suggestionId);
      
      if (!suggestion) return null;

      const actionItem: ActionItem = {
        id: `action-${Date.now()}-${Math.random()}`,
        suggestionId,
        title: suggestion.title,
        description: suggestion.description,
        assignee,
        dueDate,
        status: 'pending',
        priority: suggestion.priority,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to Firestore
      await addDoc(collection(db, 'action_items'), {
        ...actionItem,
        dueDate: actionItem.dueDate.toISOString(),
        createdAt: actionItem.createdAt.toISOString(),
        updatedAt: actionItem.updatedAt.toISOString(),
      });

      // Update local state
      if (!this.actionItems.has(assignee)) {
        this.actionItems.set(assignee, []);
      }
      this.actionItems.get(assignee)!.push(actionItem);

      return actionItem;
    } catch (error) {
      console.error('Failed to create action item:', error);
      return null;
    }
  }

  // Update action item progress
  async updateActionProgress(actionId: string, progress: number, status?: ActionItem['status']): Promise<void> {
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'action_items', actionId), {
        progress,
        status: status || 'in-progress',
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      for (const [userId, items] of this.actionItems.entries()) {
        const item = items.find(i => i.id === actionId);
        if (item) {
          item.progress = progress;
          if (status) item.status = status;
          item.updatedAt = new Date();
          break;
        }
      }
    } catch (error) {
      console.error('Failed to update action progress:', error);
    }
  }

  // Dismiss suggestion
  async dismissSuggestion(suggestionId: string, reason?: string): Promise<void> {
    try {
      // Update suggestion status
      await updateDoc(doc(db, 'suggestions', suggestionId), {
        status: 'dismissed',
        dismissedAt: new Date().toISOString(),
        dismissReason: reason,
      });

      // Update local state
      for (const [type, suggestions] of this.suggestions.entries()) {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
          suggestion.status = 'dismissed';
          break;
        }
      }
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
    }
  }

  // Get high-priority suggestions
  getHighPrioritySuggestions(): Suggestion[] {
    return this.getAllSuggestions().filter(s => 
      s.priority === 'high' || s.priority === 'critical'
    );
  }

  // Get actionable suggestions
  getActionableSuggestions(): Suggestion[] {
    return this.getAllSuggestions().filter(s => s.actionable);
  }

  // Cleanup
  cleanup(): void {
    this.suggestions.clear();
    this.trends = [];
    this.patterns = [];
    this.actionItems.clear();
    this.learningData.clear();
  }
}

// Export singleton instance
export const suggestionEngine = SuggestionEngine.getInstance(); 