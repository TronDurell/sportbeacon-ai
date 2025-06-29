import { Platform } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface CoachRecommendation {
  id: string;
  userId: string;
  type: 'workout' | 'earnings' | 'league' | 'social' | 'skill' | 'recovery';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  data: any;
  actionable: boolean;
  estimatedImpact: {
    fitness: number; // 0-1
    earnings: number; // dollars
    social: number; // 0-1
    skill: number; // 0-1
  };
  createdAt: Date;
  expiresAt?: Date;
  completed?: boolean;
  fcmNotificationSent?: boolean;
}

export interface AIPerformanceReport {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  summary: {
    workoutsCompleted: number;
    totalDuration: number;
    caloriesBurned: number;
    earningsGenerated: number;
    socialConnections: number;
    skillImprovements: string[];
  };
  metrics: {
    fitnessScore: number; // 0-100
    earningsScore: number; // 0-100
    socialScore: number; // 0-100
    skillScore: number; // 0-100
    consistencyScore: number; // 0-100
  };
  trends: {
    fitness: 'improving' | 'declining' | 'stable';
    earnings: 'improving' | 'declining' | 'stable';
    social: 'improving' | 'declining' | 'stable';
    skills: 'improving' | 'declining' | 'stable';
  };
  recommendations: CoachRecommendation[];
  insights: string[];
  nextWeekGoals: string[];
  createdAt: Date;
  fcmSent: boolean;
}

export interface UserProfile {
  id: string;
  preferences: {
    sports: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    availability: {
      weekdays: string[];
      weekends: string[];
      timeSlots: string[];
    };
    location: {
      latitude: number;
      longitude: number;
      radius: number;
    };
    budget: {
      min: number;
      max: number;
    };
    notificationPreferences: {
      weeklyReports: boolean;
      workoutReminders: boolean;
      earningsAlerts: boolean;
      socialSuggestions: boolean;
    };
  };
  behavior: {
    eventsAttended: number;
    venuesVisited: string[];
    averageSessionDuration: number;
    preferredTimes: string[];
    socialConnections: string[];
    workoutHistory: WorkoutSession[];
    earningsHistory: EarningsRecord[];
    contentEngagement: ContentEngagement[];
  };
  goals: {
    fitness: string[];
    social: string[];
    skill: string[];
    competitive: string[];
    earnings: number;
  };
  metrics: {
    currentFitness: number; // 0-1
    currentEarnings: number;
    socialEngagement: number; // 0-1
    skillLevel: number; // 0-1
    consistency: number; // 0-1
  };
}

export interface WorkoutSession {
  id: string;
  date: Date;
  sport: string;
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high';
  calories: number;
  skills: string[];
  notes: string;
  location?: {
    latitude: number;
    longitude: number;
    venueId?: string;
  };
  participants?: string[];
  equipment?: string[];
}

export interface EarningsRecord {
  id: string;
  date: Date;
  amount: number;
  source: 'tips' | 'events' | 'coaching' | 'sponsorships' | 'content' | 'merchandise';
  eventId?: string;
  description: string;
  platform?: string;
  audience?: number;
}

export interface ContentEngagement {
  id: string;
  date: Date;
  contentType: 'video' | 'photo' | 'story' | 'live' | 'post';
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  revenue: number;
}

export interface LeagueRecommendation {
  id: string;
  name: string;
  sport: string;
  skillLevel: string;
  location: {
    latitude: number;
    longitude: number;
    distance: number;
  };
  schedule: string;
  cost: number;
  participants: number;
  maxParticipants: number;
  description: string;
  matchScore: number; // 0-1
  earningsPotential: number;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  week: number;
  sessions: WorkoutSession[];
  goals: string[];
  progress: {
    completed: number;
    total: number;
    adherence: number; // 0-1
  };
  earningsTarget: number;
  socialGoals: string[];
}

export interface MonetizationStrategy {
  id: string;
  type: 'content' | 'coaching' | 'events' | 'sponsorships' | 'merchandise';
  title: string;
  description: string;
  potentialEarnings: number;
  effortRequired: 'low' | 'medium' | 'high';
  timeToMarket: number; // days
  requirements: string[];
  successRate: number; // 0-1
}

export class CoachAgent {
  private static instance: CoachAgent;
  private userProfiles: Map<string, UserProfile> = new Map();
  private recommendations: Map<string, CoachRecommendation[]> = new Map();
  private workoutPlans: Map<string, WorkoutPlan[]> = new Map();
  private learningData: Map<string, any[]> = new Map();
  private performanceReports: Map<string, AIPerformanceReport[]> = new Map();
  private weeklyReportTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): CoachAgent {
    if (!CoachAgent.instance) {
      CoachAgent.instance = new CoachAgent();
    }
    return CoachAgent.instance;
  }

  constructor() {
    this.initialize();
  }

  // Initialize the coach agent with weekly report scheduling
  async initialize(): Promise<void> {
    try {
      console.log('Initializing CoachAgent with weekly reports...');
      
      // Load user profiles
      await this.loadUserProfiles();
      
      // Load learning data
      await this.loadLearningData();
      
      // Generate initial recommendations
      await this.generateRecommendations();
      
      // Start recommendation loop
      this.startRecommendationLoop();
      
      // Schedule weekly performance reports
      this.scheduleWeeklyReports();
      
      console.log('CoachAgent initialized successfully with weekly reports');
    } catch (error) {
      console.error('Failed to initialize CoachAgent:', error);
    }
  }

  // Schedule weekly AI performance reports for all users
  private scheduleWeeklyReports(): void {
    // Schedule for every Sunday at 9 AM
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(9, 0, 0, 0);
    
    const timeUntilNextSunday = nextSunday.getTime() - now.getTime();
    
    // Schedule the first report
    setTimeout(() => {
      this.generateWeeklyReports();
      // Then schedule recurring reports every 7 days
      setInterval(() => {
        this.generateWeeklyReports();
      }, 7 * 24 * 60 * 60 * 1000);
    }, timeUntilNextSunday);
  }

  // Generate weekly AI performance reports for all users
  private async generateWeeklyReports(): Promise<void> {
    try {
      console.log('Generating weekly AI performance reports...');
      
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      
      for (const [userId, profile] of this.userProfiles) {
        const report = await this.createPerformanceReport(userId, profile, weekStart, now);
        if (report) {
          // Store report
          if (!this.performanceReports.has(userId)) {
            this.performanceReports.set(userId, []);
          }
          this.performanceReports.get(userId)!.push(report);
          
          // Save to Firestore
          await this.savePerformanceReport(report);
          
          // Send FCM notification
          await this.sendWeeklyReportNotification(report);
        }
      }
      
      console.log('Weekly AI performance reports generated and sent');
    } catch (error) {
      console.error('Failed to generate weekly reports:', error);
    }
  }

  // Create performance report for a user
  private async createPerformanceReport(
    userId: string, 
    profile: UserProfile, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<AIPerformanceReport | null> {
    try {
      // Get weekly data
      const weeklyWorkouts = profile.behavior.workoutHistory.filter(
        w => w.date >= weekStart && w.date <= weekEnd
      );
      
      const weeklyEarnings = profile.behavior.earningsHistory.filter(
        e => e.date >= weekStart && e.date <= weekEnd
      );
      
      const weeklyContent = profile.behavior.contentEngagement.filter(
        c => c.date >= weekStart && c.date <= weekEnd
      );

      // Calculate summary
      const summary = {
        workoutsCompleted: weeklyWorkouts.length,
        totalDuration: weeklyWorkouts.reduce((sum, w) => sum + w.duration, 0),
        caloriesBurned: weeklyWorkouts.reduce((sum, w) => sum + w.calories, 0),
        earningsGenerated: weeklyEarnings.reduce((sum, e) => sum + e.amount, 0),
        socialConnections: weeklyWorkouts.reduce((sum, w) => sum + (w.participants?.length || 0), 0),
        skillImprovements: this.identifySkillImprovements(weeklyWorkouts),
      };

      // Calculate metrics
      const metrics = {
        fitnessScore: this.calculateFitnessScore(weeklyWorkouts, profile),
        earningsScore: this.calculateEarningsScore(weeklyEarnings, profile),
        socialScore: this.calculateSocialScore(weeklyWorkouts, profile),
        skillScore: this.calculateSkillScore(weeklyWorkouts, profile),
        consistencyScore: this.calculateConsistencyScore(weeklyWorkouts, profile),
      };

      // Analyze trends
      const trends = {
        fitness: this.analyzeFitnessTrend(weeklyWorkouts, profile),
        earnings: this.analyzeEarningsTrend(weeklyEarnings, profile),
        social: this.analyzeSocialTrend(weeklyWorkouts, profile),
        skills: this.analyzeSkillTrend(weeklyWorkouts, profile),
      };

      // Generate recommendations
      const recommendations = await this.generateWeeklyRecommendations(userId, profile, summary, metrics);

      // Generate insights
      const insights = this.generateWeeklyInsights(summary, metrics, trends);

      // Set next week goals
      const nextWeekGoals = this.generateNextWeekGoals(profile, summary, metrics);

      const report: AIPerformanceReport = {
        id: `report-${userId}-${weekStart.getTime()}`,
        userId,
        weekStart,
        weekEnd,
        summary,
        metrics,
        trends,
        recommendations,
        insights,
        nextWeekGoals,
        createdAt: new Date(),
        fcmSent: false,
      };

      return report;
    } catch (error) {
      console.error(`Failed to create performance report for user ${userId}:`, error);
      return null;
    }
  }

  // Save performance report to Firestore
  private async savePerformanceReport(report: AIPerformanceReport): Promise<void> {
    try {
      await addDoc(collection(db, 'ai_performance_reports'), {
        ...report,
        timestamp: serverTimestamp(),
      });
      console.log(`Saved performance report for user ${report.userId}`);
    } catch (error) {
      console.error('Failed to save performance report:', error);
    }
  }

  // Send FCM notification for weekly report
  private async sendWeeklyReportNotification(report: AIPerformanceReport): Promise<void> {
    try {
      const userProfile = this.userProfiles.get(report.userId);
      if (!userProfile?.preferences.notificationPreferences.weeklyReports) {
        return;
      }

      const title = '🏆 Your Weekly AI Performance Report';
      const body = `You completed ${report.summary.workoutsCompleted} workouts and earned $${report.summary.earningsGenerated.toFixed(2)} this week!`;

      console.log(`FCM: Sending weekly report notification to ${report.userId}`);
      
      // Placeholder for FCM integration
      // await sendNotification({
      //   title,
      //   body,
      //   data: { 
      //     reportId: report.id, 
      //     userId: report.userId,
      //     type: 'weekly-report'
      //   },
      //   topic: `user-${report.userId}`,
      // });

      report.fcmSent = true;
    } catch (error) {
      console.error('Failed to send weekly report notification:', error);
    }
  }

  // Enhanced learning from workout logs, Stripe tips, and content engagement
  private async loadLearningData(): Promise<void> {
    try {
      // Load Stripe tips data
      const tipsQuery = query(
        collection(db, 'stripe.tips'),
        orderBy('createdAt', 'desc'),
        limit(5000)
      );
      const tipsSnapshot = await getDocs(tipsQuery);
      const tipsData = tipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load content engagement data
      const contentQuery = query(
        collection(db, 'content_engagement'),
        orderBy('date', 'desc'),
        limit(3000)
      );
      const contentSnapshot = await getDocs(contentQuery);
      const contentData = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load workout logs
      const workoutQuery = query(
        collection(db, 'workout_sessions'),
        orderBy('date', 'desc'),
        limit(10000)
      );
      const workoutSnapshot = await getDocs(workoutQuery);
      const workoutData = workoutSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Process learning data
      this.processLearningData(tipsData, contentData, workoutData);
      
    } catch (error) {
      console.error('Failed to load learning data:', error);
    }
  }

  // Process learning data for AI insights
  private processLearningData(tipsData: any[], contentData: any[], workoutData: any[]): void {
    // Analyze tipping patterns
    const tippingPatterns = this.analyzeTippingPatterns(tipsData);
    
    // Analyze content performance
    const contentPerformance = this.analyzeContentPerformance(contentData);
    
    // Analyze workout patterns
    const workoutPatterns = this.analyzeWorkoutPatterns(workoutData);
    
    // Store insights
    this.learningData.set('tipping_patterns', tippingPatterns);
    this.learningData.set('content_performance', contentPerformance);
    this.learningData.set('workout_patterns', workoutPatterns);
  }

  // Analyze tipping patterns for monetization insights
  private analyzeTippingPatterns(tipsData: any[]): any[] {
    const patterns = [];
    
    // Group by user
    const userTips = new Map<string, any[]>();
    tipsData.forEach(tip => {
      if (!userTips.has(tip.userId)) {
        userTips.set(tip.userId, []);
      }
      userTips.get(tip.userId)!.push(tip);
    });

    // Analyze each user's tipping patterns
    for (const [userId, tips] of userTips) {
      const totalTips = tips.reduce((sum, t) => sum + t.amount, 0);
      const averageTip = totalTips / tips.length;
      const tipFrequency = tips.length;
      
      patterns.push({
        userId,
        totalTips,
        averageTip,
        tipFrequency,
        bestPerformingContent: this.findBestPerformingContent(tips),
        optimalPostingTimes: this.findOptimalPostingTimes(tips),
        audienceEngagement: this.calculateAudienceEngagement(tips),
      });
    }

    return patterns;
  }

  // Analyze content performance
  private analyzeContentPerformance(contentData: any[]): any[] {
    const performance = [];
    
    // Group by user
    const userContent = new Map<string, any[]>();
    contentData.forEach(content => {
      if (!userContent.has(content.userId)) {
        userContent.set(content.userId, []);
      }
      userContent.get(content.userId)!.push(content);
    });

    // Analyze each user's content performance
    for (const [userId, content] of userContent) {
      const totalViews = content.reduce((sum, c) => sum + c.views, 0);
      const totalRevenue = content.reduce((sum, c) => sum + c.revenue, 0);
      const averageEngagement = content.reduce((sum, c) => sum + c.engagementRate, 0) / content.length;
      
      performance.push({
        userId,
        totalViews,
        totalRevenue,
        averageEngagement,
        bestContentTypes: this.findBestContentTypes(content),
        optimalPlatforms: this.findOptimalPlatforms(content),
        revenuePerView: totalRevenue / totalViews,
      });
    }

    return performance;
  }

  // Generate monetization strategies based on learning data
  private generateMonetizationStrategies(userId: string, profile: UserProfile): MonetizationStrategy[] {
    const strategies: MonetizationStrategy[] = [];
    
    const tippingPatterns = this.learningData.get('tipping_patterns') || [];
    const contentPerformance = this.learningData.get('content_performance') || [];
    
    const userTippingPattern = tippingPatterns.find(p => p.userId === userId);
    const userContentPerformance = contentPerformance.find(p => p.userId === userId);

    // Content monetization strategy
    if (userContentPerformance && userContentPerformance.averageEngagement > 0.05) {
      strategies.push({
        id: `strategy-${userId}-content`,
        type: 'content',
        title: 'Premium Content Creation',
        description: 'Create exclusive content for your engaged audience',
        potentialEarnings: userContentPerformance.totalRevenue * 2,
        effortRequired: 'medium',
        timeToMarket: 7,
        requirements: ['High engagement rate', 'Consistent posting'],
        successRate: 0.8,
      });
    }

    // Coaching strategy
    if (profile.metrics.skillLevel > 0.7) {
      strategies.push({
        id: `strategy-${userId}-coaching`,
        type: 'coaching',
        title: 'Personal Training Sessions',
        description: 'Offer one-on-one coaching based on your expertise',
        potentialEarnings: 500,
        effortRequired: 'high',
        timeToMarket: 14,
        requirements: ['High skill level', 'Teaching ability'],
        successRate: 0.7,
      });
    }

    // Event hosting strategy
    if (profile.behavior.eventsAttended > 10) {
      strategies.push({
        id: `strategy-${userId}-events`,
        type: 'events',
        title: 'Premium Event Hosting',
        description: 'Host exclusive events with premium pricing',
        potentialEarnings: 1000,
        effortRequired: 'high',
        timeToMarket: 21,
        requirements: ['Event experience', 'Network'],
        successRate: 0.6,
      });
    }

    return strategies;
  }

  // Enhanced earnings recommendations with monetization strategies
  private async generateEarningsRecommendations(userId: string, profile: UserProfile): Promise<CoachRecommendation[]> {
    const recommendations: CoachRecommendation[] = [];
    
    const strategies = this.generateMonetizationStrategies(userId, profile);
    const recentEarnings = profile.behavior.earningsHistory.slice(0, 10);

    // Add strategy-based recommendations
    for (const strategy of strategies) {
      recommendations.push({
        id: `earnings-${strategy.id}`,
        userId,
        type: 'earnings',
        title: strategy.title,
        description: strategy.description,
        priority: strategy.potentialEarnings > 500 ? 'high' : 'medium',
        confidence: strategy.successRate,
        data: strategy,
        actionable: true,
        estimatedImpact: {
          fitness: 0.1,
          earnings: strategy.potentialEarnings,
          social: 0.3,
          skill: 0.2,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
    }

    // Add specific tips based on recent performance
    const totalRecentEarnings = recentEarnings.reduce((sum, e) => sum + e.amount, 0);
    if (totalRecentEarnings < profile.goals.earnings * 0.5) {
      recommendations.push({
        id: `earnings-boost-${userId}`,
        userId,
        type: 'earnings',
        title: 'Boost Your Earnings',
        description: 'Your recent earnings are below your goal. Try these strategies to increase income.',
        priority: 'high',
        confidence: 0.8,
        data: { currentEarnings: totalRecentEarnings, targetEarnings: profile.goals.earnings },
        actionable: true,
        estimatedImpact: {
          fitness: 0.1,
          earnings: 200,
          social: 0.2,
          skill: 0.1,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }

    return recommendations;
  }

  // Helper methods for performance report generation
  private identifySkillImprovements(workouts: WorkoutSession[]): string[] {
    const skillCounts = new Map<string, number>();
    
    workouts.forEach(workout => {
      workout.skills.forEach(skill => {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      });
    });

    return Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill]) => skill);
  }

  private calculateFitnessScore(workouts: WorkoutSession[], profile: UserProfile): number {
    if (workouts.length === 0) return 0;
    
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
    const averageIntensity = workouts.reduce((sum, w) => {
      const intensityValue = w.intensity === 'high' ? 3 : w.intensity === 'medium' ? 2 : 1;
      return sum + intensityValue;
    }, 0) / workouts.length;

    return Math.min(100, (totalDuration * 0.3 + totalCalories * 0.4 + averageIntensity * 20));
  }

  private calculateEarningsScore(earnings: EarningsRecord[], profile: UserProfile): number {
    if (earnings.length === 0) return 0;
    
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const targetEarnings = profile.goals.earnings / 52; // Weekly target
    
    return Math.min(100, (totalEarnings / targetEarnings) * 100);
  }

  private calculateSocialScore(workouts: WorkoutSession[], profile: UserProfile): number {
    if (workouts.length === 0) return 0;
    
    const socialWorkouts = workouts.filter(w => (w.participants?.length || 0) > 0);
    const totalParticipants = workouts.reduce((sum, w) => sum + (w.participants?.length || 0), 0);
    
    return Math.min(100, (socialWorkouts.length / workouts.length) * 50 + (totalParticipants / workouts.length) * 10);
  }

  private calculateSkillScore(workouts: WorkoutSession[], profile: UserProfile): number {
    if (workouts.length === 0) return profile.metrics.skillLevel * 100;
    
    const uniqueSkills = new Set<string>();
    workouts.forEach(w => w.skills.forEach(s => uniqueSkills.add(s)));
    
    return Math.min(100, (uniqueSkills.size / 10) * 50 + profile.metrics.skillLevel * 50);
  }

  private calculateConsistencyScore(workouts: WorkoutSession[], profile: UserProfile): number {
    if (workouts.length === 0) return 0;
    
    const daysWithWorkouts = new Set(workouts.map(w => w.date.toDateString())).size;
    const weekDays = 7;
    
    return Math.min(100, (daysWithWorkouts / weekDays) * 100);
  }

  // Trend analysis methods
  private analyzeFitnessTrend(workouts: WorkoutSession[], profile: UserProfile): 'improving' | 'declining' | 'stable' {
    if (workouts.length < 2) return 'stable';
    
    const recentWorkouts = workouts.slice(0, 3);
    const olderWorkouts = workouts.slice(-3);
    
    const recentAvgDuration = recentWorkouts.reduce((sum, w) => sum + w.duration, 0) / recentWorkouts.length;
    const olderAvgDuration = olderWorkouts.reduce((sum, w) => sum + w.duration, 0) / olderWorkouts.length;
    
    if (recentAvgDuration > olderAvgDuration * 1.1) return 'improving';
    if (recentAvgDuration < olderAvgDuration * 0.9) return 'declining';
    return 'stable';
  }

  private analyzeEarningsTrend(earnings: EarningsRecord[], profile: UserProfile): 'improving' | 'declining' | 'stable' {
    if (earnings.length < 2) return 'stable';
    
    const recentEarnings = earnings.slice(0, 3);
    const olderEarnings = earnings.slice(-3);
    
    const recentAvg = recentEarnings.reduce((sum, e) => sum + e.amount, 0) / recentEarnings.length;
    const olderAvg = olderEarnings.reduce((sum, e) => sum + e.amount, 0) / olderEarnings.length;
    
    if (recentAvg > olderAvg * 1.1) return 'improving';
    if (recentAvg < olderAvg * 0.9) return 'declining';
    return 'stable';
  }

  private analyzeSocialTrend(workouts: WorkoutSession[], profile: UserProfile): 'improving' | 'declining' | 'stable' {
    if (workouts.length < 2) return 'stable';
    
    const recentWorkouts = workouts.slice(0, 3);
    const olderWorkouts = workouts.slice(-3);
    
    const recentSocial = recentWorkouts.filter(w => (w.participants?.length || 0) > 0).length;
    const olderSocial = olderWorkouts.filter(w => (w.participants?.length || 0) > 0).length;
    
    if (recentSocial > olderSocial) return 'improving';
    if (recentSocial < olderSocial) return 'declining';
    return 'stable';
  }

  private analyzeSkillTrend(workouts: WorkoutSession[], profile: UserProfile): 'improving' | 'declining' | 'stable' {
    if (workouts.length < 2) return 'stable';
    
    const recentWorkouts = workouts.slice(0, 3);
    const olderWorkouts = workouts.slice(-3);
    
    const recentSkills = new Set(recentWorkouts.flatMap(w => w.skills)).size;
    const olderSkills = new Set(olderWorkouts.flatMap(w => w.skills)).size;
    
    if (recentSkills > olderSkills) return 'improving';
    if (recentSkills < olderSkills) return 'declining';
    return 'stable';
  }

  // Generate weekly insights
  private generateWeeklyInsights(summary: any, metrics: any, trends: any): string[] {
    const insights: string[] = [];
    
    if (summary.workoutsCompleted >= 5) {
      insights.push('Great consistency! You completed 5+ workouts this week.');
    }
    
    if (metrics.fitnessScore > 80) {
      insights.push('Excellent fitness performance! You\'re in the top tier.');
    }
    
    if (metrics.earningsScore > 80) {
      insights.push('Outstanding earnings! You exceeded your weekly target.');
    }
    
    if (trends.fitness === 'improving') {
      insights.push('Your fitness is trending upward - keep up the momentum!');
    }
    
    if (trends.earnings === 'improving') {
      insights.push('Your earnings are growing - your strategies are working!');
    }
    
    return insights;
  }

  // Generate next week goals
  private generateNextWeekGoals(profile: UserProfile, summary: any, metrics: any): string[] {
    const goals: string[] = [];
    
    // Fitness goals
    if (summary.workoutsCompleted < 4) {
      goals.push('Complete at least 4 workouts next week');
    } else {
      goals.push('Maintain your workout consistency');
    }
    
    // Earnings goals
    if (metrics.earningsScore < 70) {
      goals.push('Increase earnings by 20% next week');
    } else {
      goals.push('Maintain your strong earnings performance');
    }
    
    // Social goals
    if (summary.socialConnections < 3) {
      goals.push('Connect with at least 3 new people next week');
    }
    
    // Skill goals
    if (summary.skillImprovements.length > 0) {
      goals.push(`Focus on improving: ${summary.skillImprovements[0]}`);
    }
    
    return goals;
  }

  // Get performance reports for a user
  getPerformanceReports(userId: string): AIPerformanceReport[] {
    return this.performanceReports.get(userId) || [];
  }

  // Get latest performance report
  getLatestPerformanceReport(userId: string): AIPerformanceReport | undefined {
    const reports = this.getPerformanceReports(userId);
    return reports.length > 0 ? reports[reports.length - 1] : undefined;
  }

  // Load user profiles from Firestore
  private async loadUserProfiles(): Promise<void> {
    try {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      
      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        const profile: UserProfile = {
          id: doc.id,
          preferences: {
            sports: userData.preferredSports || [],
            skillLevel: userData.skillLevel || 'intermediate',
            availability: {
              weekdays: userData.availability?.weekdays || ['monday', 'wednesday', 'friday'],
              weekends: userData.availability?.weekends || ['saturday', 'sunday'],
              timeSlots: userData.availability?.timeSlots || ['morning', 'evening'],
            },
            location: {
              latitude: userData.location?.latitude || 0,
              longitude: userData.location?.longitude || 0,
              radius: userData.location?.radius || 10,
            },
            budget: {
              min: userData.budget?.min || 0,
              max: userData.budget?.max || 100,
            },
            notificationPreferences: {
              weeklyReports: userData.notificationPreferences?.weeklyReports || false,
              workoutReminders: userData.notificationPreferences?.workoutReminders || false,
              earningsAlerts: userData.notificationPreferences?.earningsAlerts || false,
              socialSuggestions: userData.notificationPreferences?.socialSuggestions || false,
            },
          },
          behavior: {
            eventsAttended: userData.eventsAttended || 0,
            venuesVisited: userData.venuesVisited || [],
            averageSessionDuration: userData.averageSessionDuration || 60,
            preferredTimes: userData.preferredTimes || [],
            socialConnections: userData.socialConnections || [],
            workoutHistory: userData.workoutHistory || [],
            earningsHistory: userData.earningsHistory || [],
            contentEngagement: userData.contentEngagement || [],
          },
          goals: {
            fitness: userData.goals?.fitness || [],
            social: userData.goals?.social || [],
            skill: userData.goals?.skill || [],
            competitive: userData.goals?.competitive || [],
            earnings: userData.goals?.earnings || 0,
          },
          metrics: {
            currentFitness: userData.metrics?.currentFitness || 0.5,
            currentEarnings: userData.metrics?.currentEarnings || 0,
            socialEngagement: userData.metrics?.socialEngagement || 0.5,
            skillLevel: userData.metrics?.skillLevel || 0.5,
            consistency: userData.metrics?.consistency || 0.5,
          },
        };
        
        this.userProfiles.set(profile.id, profile);
      });
    } catch (error) {
      console.error('Failed to load user profiles:', error);
    }
  }

  // Generate recommendations for all users
  private async generateRecommendations(): Promise<void> {
    try {
      for (const [userId, profile] of this.userProfiles.entries()) {
        const recommendations = await this.generateUserRecommendations(userId, profile);
        this.recommendations.set(userId, recommendations);
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    }
  }

  // Generate recommendations for a specific user
  private async generateUserRecommendations(userId: string, profile: UserProfile): Promise<CoachRecommendation[]> {
    const recommendations: CoachRecommendation[] = [];

    // Workout recommendations
    const workoutRecs = await this.generateWorkoutRecommendations(userId, profile);
    recommendations.push(...workoutRecs);

    // Earnings recommendations
    const earningsRecs = await this.generateEarningsRecommendations(userId, profile);
    recommendations.push(...earningsRecs);

    // League recommendations
    const leagueRecs = await this.generateLeagueRecommendations(userId, profile);
    recommendations.push(...leagueRecs);

    // Social recommendations
    const socialRecs = await this.generateSocialRecommendations(userId, profile);
    recommendations.push(...socialRecs);

    // Skill development recommendations
    const skillRecs = await this.generateSkillRecommendations(userId, profile);
    recommendations.push(...skillRecs);

    // Recovery recommendations
    const recoveryRecs = await this.generateRecoveryRecommendations(userId, profile);
    recommendations.push(...recoveryRecs);

    return recommendations;
  }

  // Generate workout recommendations
  private async generateWorkoutRecommendations(userId: string, profile: UserProfile): Promise<CoachRecommendation[]> {
    const recommendations: CoachRecommendation[] = [];

    // Analyze workout history
    const recentWorkouts = profile.behavior.workoutHistory
      .filter(w => new Date(w.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalDuration = recentWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const averageIntensity = this.calculateAverageIntensity(recentWorkouts);
    const consistency = this.calculateWorkoutConsistency(recentWorkouts);

    // Check for consistency issues
    if (consistency < 0.6) {
      recommendations.push({
        id: `workout-${Date.now()}-${Math.random()}`,
        userId,
        type: 'workout',
        title: 'Improve Workout Consistency',
        description: `You've been inconsistent with your workouts. Try setting a regular schedule for ${profile.preferences.sports[0] || 'your preferred sport'}.`,
        priority: 'high',
        confidence: 0.8,
        actionable: true,
        estimatedImpact: {
          fitness: 0.3,
          earnings: 0,
          social: 0.1,
          skill: 0.2,
        },
        data: {
          currentConsistency: consistency,
          targetConsistency: 0.8,
          suggestedSchedule: this.generateSuggestedSchedule(profile),
        },
        createdAt: new Date(),
      });
    }

    // Check for intensity issues
    if (averageIntensity < 0.6 && profile.metrics.currentFitness > 0.7) {
      recommendations.push({
        id: `workout-${Date.now()}-${Math.random()}`,
        userId,
        type: 'workout',
        title: 'Increase Workout Intensity',
        description: 'Your workouts have been low intensity. Try incorporating high-intensity intervals to improve fitness faster.',
        priority: 'medium',
        confidence: 0.7,
        actionable: true,
        estimatedImpact: {
          fitness: 0.4,
          earnings: 0,
          social: 0,
          skill: 0.3,
        },
        data: {
          currentIntensity: averageIntensity,
          targetIntensity: 0.8,
          suggestedWorkouts: this.generateIntensityWorkouts(profile),
        },
        createdAt: new Date(),
      });
    }

    // Check for variety issues
    const sportVariety = new Set(recentWorkouts.map(w => w.sport)).size;
    if (sportVariety < 2 && profile.preferences.sports.length > 1) {
      recommendations.push({
        id: `workout-${Date.now()}-${Math.random()}`,
        userId,
        type: 'workout',
        title: 'Add Sport Variety',
        description: `You've been focusing on one sport. Try mixing in ${profile.preferences.sports.find(s => s !== recentWorkouts[0]?.sport) || 'other sports'} for better overall fitness.`,
        priority: 'low',
        confidence: 0.6,
        actionable: true,
        estimatedImpact: {
          fitness: 0.2,
          earnings: 0,
          social: 0.2,
          skill: 0.4,
        },
        data: {
          currentSports: Array.from(new Set(recentWorkouts.map(w => w.sport))),
          suggestedSports: profile.preferences.sports.filter(s => !recentWorkouts.some(w => w.sport === s)),
        },
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  // Generate league recommendations
  private async generateLeagueRecommendations(userId: string, profile: UserProfile): Promise<CoachRecommendation[]> {
    const recommendations: CoachRecommendation[] = [];

    // Find nearby leagues
    const nearbyLeagues = await this.findNearbyLeagues(profile.preferences.location, profile.preferences.sports);
    
    // Filter by skill level and availability
    const suitableLeagues = nearbyLeagues.filter(league => 
      league.skillLevel === profile.preferences.skillLevel &&
      league.cost <= profile.preferences.budget.max &&
      league.participants < league.maxParticipants
    );

    if (suitableLeagues.length > 0) {
      const bestLeague = suitableLeagues.sort((a, b) => b.matchScore - a.matchScore)[0];
      
      recommendations.push({
        id: `league-${Date.now()}-${Math.random()}`,
        userId,
        type: 'league',
        title: `Join ${bestLeague.name}`,
        description: `Perfect match for your skill level and schedule. ${bestLeague.description}`,
        priority: 'medium',
        confidence: bestLeague.matchScore,
        actionable: true,
        estimatedImpact: {
          fitness: 0.4,
          earnings: 0,
          social: 0.6,
          skill: 0.5,
        },
        data: {
          league: bestLeague,
          alternatives: suitableLeagues.slice(1, 3),
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      });
    }

    return recommendations;
  }

  // Generate social recommendations
  private async generateSocialRecommendations(userId: string, profile: UserProfile): Promise<CoachRecommendation[]> {
    const recommendations: CoachRecommendation[] = [];

    // Check social connections
    if (profile.behavior.socialConnections.length < 5) {
      recommendations.push({
        id: `social-${Date.now()}-${Math.random()}`,
        userId,
        type: 'social',
        title: 'Expand Your Network',
        description: 'You have few social connections. Try attending more events or joining group activities to meet new people.',
        priority: 'medium',
        confidence: 0.7,
        actionable: true,
        estimatedImpact: {
          fitness: 0.1,
          earnings: 50,
          social: 0.5,
          skill: 0.2,
        },
        data: {
          currentConnections: profile.behavior.socialConnections.length,
          targetConnections: 10,
          suggestedActivities: this.generateSocialActivities(profile),
        },
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  // Generate skill recommendations
  private async generateSkillRecommendations(userId: string, profile: UserProfile): Promise<CoachRecommendation[]> {
    const recommendations: CoachRecommendation[] = [];

    // Analyze skill gaps
    const skillGoals = profile.goals.skill;
    const currentSkills = this.assessCurrentSkills(profile);

    for (const goal of skillGoals) {
      if (!currentSkills.includes(goal)) {
        recommendations.push({
          id: `skill-${Date.now()}-${Math.random()}`,
          userId,
          type: 'skill',
          title: `Develop ${goal} Skills`,
          description: `Focus on improving your ${goal} to reach your skill development goals.`,
          priority: 'medium',
          confidence: 0.8,
          actionable: true,
          estimatedImpact: {
            fitness: 0.2,
            earnings: 100,
            social: 0.1,
            skill: 0.6,
          },
          data: {
            targetSkill: goal,
            currentSkills,
            trainingPlan: this.generateSkillTrainingPlan(goal, profile),
          },
          createdAt: new Date(),
        });
      }
    }

    return recommendations;
  }

  // Generate recovery recommendations
  private async generateRecoveryRecommendations(userId: string, profile: UserProfile): Promise<CoachRecommendation[]> {
    const recommendations: CoachRecommendation[] = [];

    // Check for overtraining
    const recentWorkouts = profile.behavior.workoutHistory
      .filter(w => new Date(w.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const totalDuration = recentWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const highIntensityWorkouts = recentWorkouts.filter(w => w.intensity === 'high').length;

    if (totalDuration > 600 && highIntensityWorkouts > 3) { // More than 10 hours/week with 3+ high intensity
      recommendations.push({
        id: `recovery-${Date.now()}-${Math.random()}`,
        userId,
        type: 'recovery',
        title: 'Take a Recovery Day',
        description: 'You\'ve been training hard. Consider a rest day or light activity to prevent overtraining.',
        priority: 'high',
        confidence: 0.8,
        actionable: true,
        estimatedImpact: {
          fitness: 0.1,
          earnings: 0,
          social: 0,
          skill: 0.1,
        },
        data: {
          weeklyDuration: totalDuration,
          highIntensityCount: highIntensityWorkouts,
          recoveryActivities: ['stretching', 'yoga', 'light walking', 'swimming'],
        },
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  // Helper methods
  private calculateAverageIntensity(workouts: WorkoutSession[]): number {
    if (workouts.length === 0) return 0;
    
    const intensityMap = { low: 0.3, medium: 0.6, high: 0.9 };
    const totalIntensity = workouts.reduce((sum, w) => sum + intensityMap[w.intensity], 0);
    return totalIntensity / workouts.length;
  }

  private calculateWorkoutConsistency(workouts: WorkoutSession[]): number {
    if (workouts.length === 0) return 0;
    
    const daysWithWorkouts = new Set(workouts.map(w => new Date(w.date).toDateString())).size;
    const totalDays = 30; // Last 30 days
    return daysWithWorkouts / totalDays;
  }

  private generateSuggestedSchedule(profile: UserProfile): any {
    return {
      weekdays: profile.preferences.availability.weekdays.slice(0, 3),
      weekends: profile.preferences.availability.weekends,
      timeSlots: profile.preferences.availability.timeSlots,
    };
  }

  private generateIntensityWorkouts(profile: UserProfile): any[] {
    return [
      { sport: profile.preferences.sports[0], duration: 30, intensity: 'high', type: 'intervals' },
      { sport: profile.preferences.sports[0], duration: 45, intensity: 'medium', type: 'endurance' },
    ];
  }

  private generateEarningsStrategies(profile: UserProfile, recentEarnings: EarningsRecord[]): string[] {
    const strategies = [];
    
    if (profile.behavior.eventsAttended > 5) {
      strategies.push('Start coaching sessions for beginners');
    }
    
    if (profile.metrics.skillLevel > 0.7) {
      strategies.push('Offer skill development workshops');
    }
    
    if (profile.behavior.socialConnections.length > 10) {
      strategies.push('Network for sponsorship opportunities');
    }
    
    return strategies;
  }

  private async findNearbyLeagues(location: any, sports: string[]): Promise<LeagueRecommendation[]> {
    // This would query a leagues database
    // For now, return mock data
    return [
      {
        id: 'league-1',
        name: 'Cary Basketball League',
        sport: 'basketball',
        skillLevel: 'intermediate',
        location: {
          latitude: location.latitude + 0.01,
          longitude: location.longitude + 0.01,
          distance: 2.5,
        },
        schedule: 'Tuesday/Thursday 7PM',
        cost: 50,
        participants: 45,
        maxParticipants: 60,
        description: 'Competitive intermediate basketball league',
        matchScore: 0.85,
        earningsPotential: 0,
      },
    ];
  }

  private generateSocialActivities(profile: UserProfile): string[] {
    return [
      'Join a local sports club',
      'Attend community events',
      'Participate in tournaments',
      'Volunteer at sports events',
    ];
  }

  private assessCurrentSkills(profile: UserProfile): string[] {
    // This would analyze workout history and achievements
    return ['basic', 'intermediate'];
  }

  private generateSkillTrainingPlan(skill: string, profile: UserProfile): any {
    return {
      skill,
      exercises: [
        { name: `${skill} drills`, duration: 20, frequency: '3x/week' },
        { name: `${skill} practice`, duration: 30, frequency: '2x/week' },
      ],
      timeline: '8 weeks',
    };
  }

  // Start recommendation loop
  private startRecommendationLoop(): void {
    setInterval(async () => {
      await this.updateRecommendations();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  // Update recommendations
  private async updateRecommendations(): Promise<void> {
    try {
      await this.generateRecommendations();
    } catch (error) {
      console.error('Failed to update recommendations:', error);
    }
  }

  // Get recommendations for a user
  getUserRecommendations(userId: string): CoachRecommendation[] {
    return this.recommendations.get(userId) || [];
  }

  // Get workout plan for a user
  getUserWorkoutPlan(userId: string, week: number): WorkoutPlan | undefined {
    const plans = this.workoutPlans.get(userId);
    return plans?.find(p => p.week === week);
  }

  // Mark recommendation as completed
  async completeRecommendation(userId: string, recommendationId: string): Promise<void> {
    const userRecs = this.recommendations.get(userId);
    if (userRecs) {
      const rec = userRecs.find(r => r.id === recommendationId);
      if (rec) {
        rec.completed = true;
        await updateDoc(doc(db, 'coach_recommendations', recommendationId), {
          completed: true,
          completedAt: new Date(),
        });
      }
    }
  }

  // Add workout session
  async addWorkoutSession(userId: string, session: WorkoutSession): Promise<void> {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.behavior.workoutHistory.push(session);
      await addDoc(collection(db, 'workout_sessions'), {
        userId,
        ...session,
        date: session.date.toISOString(),
      });
    }
  }

  // Add earnings record
  async addEarningsRecord(userId: string, record: EarningsRecord): Promise<void> {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.behavior.earningsHistory.push(record);
      await addDoc(collection(db, 'earnings_records'), {
        userId,
        ...record,
        date: record.date.toISOString(),
      });
    }
  }

  // Update user metrics
  async updateUserMetrics(userId: string, metrics: Partial<UserProfile['metrics']>): Promise<void> {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.metrics = { ...profile.metrics, ...metrics };
      await updateDoc(doc(db, 'users', userId), {
        metrics: profile.metrics,
      });
    }
  }

  // Cleanup
  cleanup(): void {
    this.userProfiles.clear();
    this.recommendations.clear();
    this.workoutPlans.clear();
    this.learningData.clear();
    this.performanceReports.clear();
    this.weeklyReportTimers.clear();
  }
}

// Export singleton instance
export const coachAgent = CoachAgent.getInstance(); 