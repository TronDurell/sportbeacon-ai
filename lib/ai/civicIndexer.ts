import { Platform } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface CivicHealthIndex {
  zipCode: string;
  town: string;
  state: string;
  metrics: CivicMetrics;
  scores: CivicScores;
  trends: CivicTrends;
  insights: CivicInsight[];
  recommendations: string[];
  lastUpdated: Date;
  dataQuality: number; // 0-1
}

export interface CivicMetrics {
  population: number;
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  totalVenues: number;
  totalRevenue: number;
  totalTips: number;
  totalLikes: number;
  totalViews: number;
  averageSessionDuration: number;
  userEngagement: number; // 0-1
  venueUtilization: number; // 0-1
  economicActivity: number; // 0-1
  socialConnectivity: number; // 0-1
  accessibility: number; // 0-1
}

export interface CivicScores {
  overall: number; // 0-100
  engagement: number; // 0-100
  access: number; // 0-100
  economic: number; // 0-100
  social: number; // 0-100
  health: number; // 0-100
  sustainability: number; // 0-100
}

export interface CivicTrends {
  userGrowth: number; // percentage
  eventGrowth: number; // percentage
  revenueGrowth: number; // percentage
  engagementGrowth: number; // percentage
  venueGrowth: number; // percentage
  period: 'week' | 'month' | 'quarter' | 'year';
}

export interface CivicInsight {
  id: string;
  type: 'opportunity' | 'challenge' | 'trend' | 'anomaly';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  data: any;
  timestamp: Date;
}

export interface ZoneAnalysis {
  zipCode: string;
  classification: 'underserved' | 'developing' | 'thriving' | 'saturated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  opportunities: string[];
  challenges: string[];
  grantEligibility: GrantEligibility[];
  sponsorRecommendations: SponsorRecommendation[];
}

export interface GrantEligibility {
  grantType: string;
  name: string;
  amount: number;
  matchRequired: number;
  deadline: Date;
  probability: number; // 0-1
  requirements: string[];
}

export interface SponsorRecommendation {
  sponsorType: string;
  name: string;
  fitScore: number; // 0-1
  potentialValue: number;
  contactInfo: string;
  pitchPoints: string[];
}

export interface DemographicData {
  zipCode: string;
  population: number;
  medianAge: number;
  medianIncome: number;
  povertyRate: number;
  educationLevel: string;
  racialDiversity: number; // 0-1
  householdSize: number;
  homeOwnershipRate: number;
}

export class CivicIndexer {
  private static instance: CivicIndexer;
  private healthIndices: Map<string, CivicHealthIndex> = new Map();
  private zoneAnalyses: Map<string, ZoneAnalysis> = new Map();
  private demographicData: Map<string, DemographicData> = new Map();
  private insights: CivicInsight[] = [];

  static getInstance(): CivicIndexer {
    if (!CivicIndexer.instance) {
      CivicIndexer.instance = new CivicIndexer();
    }
    return CivicIndexer.instance;
  }

  constructor() {
    this.initialize();
  }

  // Initialize the civic indexer
  async initialize(): Promise<void> {
    try {
      console.log('Initializing CivicIndexer...');
      
      // Load demographic data
      await this.loadDemographicData();
      
      // Calculate health indices for all ZIP codes
      await this.calculateAllHealthIndices();
      
      // Analyze zones
      await this.analyzeAllZones();
      
      // Generate insights
      await this.generateInsights();
      
      // Start periodic updates
      this.startPeriodicUpdates();
      
      console.log('CivicIndexer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize CivicIndexer:', error);
    }
  }

  // Load demographic data
  private async loadDemographicData(): Promise<void> {
    try {
      // This would load from a demographics API or database
      // For now, create mock data
      const mockDemographics: DemographicData[] = [
        {
          zipCode: '27513',
          population: 45000,
          medianAge: 35,
          medianIncome: 75000,
          povertyRate: 8.5,
          educationLevel: 'bachelor',
          racialDiversity: 0.7,
          householdSize: 2.8,
          homeOwnershipRate: 0.65,
        },
        {
          zipCode: '27511',
          population: 38000,
          medianAge: 42,
          medianIncome: 85000,
          povertyRate: 6.2,
          educationLevel: 'graduate',
          racialDiversity: 0.6,
          householdSize: 2.5,
          homeOwnershipRate: 0.72,
        },
      ];

      mockDemographics.forEach(demo => {
        this.demographicData.set(demo.zipCode, demo);
      });
    } catch (error) {
      console.error('Failed to load demographic data:', error);
    }
  }

  // Calculate health indices for all ZIP codes
  private async calculateAllHealthIndices(): Promise<void> {
    try {
      // Get all unique ZIP codes from venues and users
      const zipCodes = await this.getUniqueZipCodes();
      
      for (const zipCode of zipCodes) {
        const healthIndex = await this.calculateHealthIndex(zipCode);
        if (healthIndex) {
          this.healthIndices.set(zipCode, healthIndex);
        }
      }
    } catch (error) {
      console.error('Failed to calculate health indices:', error);
    }
  }

  // Get unique ZIP codes
  private async getUniqueZipCodes(): Promise<string[]> {
    try {
      const zipCodes = new Set<string>();

      // Get ZIP codes from venues
      const venuesQuery = query(collection(db, 'venues'));
      const venuesSnapshot = await getDocs(venuesQuery);
      venuesSnapshot.docs.forEach(doc => {
        const venue = doc.data();
        if (venue.location?.zipCode) {
          zipCodes.add(venue.location.zipCode);
        }
      });

      // Get ZIP codes from users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      usersSnapshot.docs.forEach(doc => {
        const user = doc.data();
        if (user.location?.zipCode) {
          zipCodes.add(user.location.zipCode);
        }
      });

      return Array.from(zipCodes);
    } catch (error) {
      console.error('Failed to get unique ZIP codes:', error);
      return [];
    }
  }

  // Calculate health index for a specific ZIP code
  private async calculateHealthIndex(zipCode: string): Promise<CivicHealthIndex | null> {
    try {
      // Get data for this ZIP code
      const metrics = await this.getZipCodeMetrics(zipCode);
      const scores = this.calculateScores(metrics, zipCode);
      const trends = await this.calculateTrends(zipCode);
      const insights = this.generateZipCodeInsights(zipCode, metrics, scores);
      const recommendations = this.generateRecommendations(zipCode, metrics, scores);

      const healthIndex: CivicHealthIndex = {
        zipCode,
        town: this.getTownFromZipCode(zipCode),
        state: 'NC', // Would be determined from ZIP code
        metrics,
        scores,
        trends,
        insights,
        recommendations,
        lastUpdated: new Date(),
        dataQuality: this.calculateDataQuality(zipCode),
      };

      return healthIndex;
    } catch (error) {
      console.error(`Failed to calculate health index for ZIP ${zipCode}:`, error);
      return null;
    }
  }

  // Get metrics for a ZIP code
  private async getZipCodeMetrics(zipCode: string): Promise<CivicMetrics> {
    try {
      // Get users in this ZIP code
      const usersQuery = query(
        collection(db, 'users'),
        where('location.zipCode', '==', zipCode)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => doc.data());

      // Get events in this ZIP code
      const eventsQuery = query(
        collection(db, 'events'),
        where('venue.zipCode', '==', zipCode)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => doc.data());

      // Get venues in this ZIP code
      const venuesQuery = query(
        collection(db, 'venues'),
        where('location.zipCode', '==', zipCode)
      );
      const venuesSnapshot = await getDocs(venuesQuery);
      const venues = venuesSnapshot.docs.map(doc => doc.data());

      // Get tips/revenue data
      const tipsQuery = query(
        collection(db, 'stripe.tips'),
        where('venue.zipCode', '==', zipCode)
      );
      const tipsSnapshot = await getDocs(tipsQuery);
      const tips = tipsSnapshot.docs.map(doc => doc.data());

      // Calculate metrics
      const totalUsers = users.length;
      const activeUsers = users.filter(u => 
        u.lastActive && new Date(u.lastActive) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;

      const totalEvents = events.length;
      const totalVenues = venues.length;
      const totalRevenue = tips.reduce((sum, tip) => sum + tip.amount, 0);
      const totalTips = tips.length;

      const totalLikes = users.reduce((sum, user) => sum + (user.totalLikes || 0), 0);
      const totalViews = users.reduce((sum, user) => sum + (user.totalViews || 0), 0);

      const averageSessionDuration = users.length > 0 ? 
        users.reduce((sum, user) => sum + (user.averageSessionDuration || 0), 0) / users.length : 0;

      const userEngagement = totalUsers > 0 ? activeUsers / totalUsers : 0;
      const venueUtilization = totalVenues > 0 ? 
        venues.reduce((sum, venue) => sum + (venue.sensors?.occupancy?.current || 0), 0) / 
        venues.reduce((sum, venue) => sum + (venue.sensors?.occupancy?.max || 1), 0) : 0;

      const economicActivity = this.calculateEconomicActivity(totalRevenue, totalUsers, zipCode);
      const socialConnectivity = this.calculateSocialConnectivity(users, events);
      const accessibility = this.calculateAccessibility(venues, totalUsers);

      return {
        population: this.demographicData.get(zipCode)?.population || 0,
        totalUsers,
        activeUsers,
        totalEvents,
        totalVenues,
        totalRevenue,
        totalTips,
        totalLikes,
        totalViews,
        averageSessionDuration,
        userEngagement,
        venueUtilization,
        economicActivity,
        socialConnectivity,
        accessibility,
      };
    } catch (error) {
      console.error(`Failed to get metrics for ZIP ${zipCode}:`, error);
      return this.getDefaultMetrics();
    }
  }

  // Calculate scores based on metrics
  private calculateScores(metrics: CivicMetrics, zipCode: string): CivicScores {
    const demographic = this.demographicData.get(zipCode);
    
    // Engagement score (0-100)
    const engagement = Math.min(100, 
      (metrics.userEngagement * 40) + 
      (metrics.venueUtilization * 30) + 
      (metrics.averageSessionDuration / 120 * 30)
    );

    // Access score (0-100)
    const access = Math.min(100,
      (metrics.totalVenues / Math.max(metrics.population / 10000, 1) * 40) +
      (metrics.accessibility * 40) +
      (demographic?.homeOwnershipRate || 0.5) * 20
    );

    // Economic score (0-100)
    const economic = Math.min(100,
      (metrics.economicActivity * 50) +
      (metrics.totalRevenue / Math.max(metrics.population, 1) * 1000 * 30) +
      ((demographic?.medianIncome || 50000) / 100000 * 20)
    );

    // Social score (0-100)
    const social = Math.min(100,
      (metrics.socialConnectivity * 40) +
      (metrics.totalEvents / Math.max(metrics.population / 10000, 1) * 30) +
      ((demographic?.racialDiversity || 0.5) * 30)
    );

    // Health score (0-100)
    const health = Math.min(100,
      (metrics.userEngagement * 30) +
      (metrics.averageSessionDuration / 120 * 40) +
      ((100 - (demographic?.povertyRate || 10)) / 100 * 30)
    );

    // Sustainability score (0-100)
    const sustainability = Math.min(100,
      (metrics.venueUtilization * 40) +
      (metrics.totalEvents / Math.max(metrics.totalVenues, 1) * 30) +
      (metrics.userEngagement * 30)
    );

    // Overall score
    const overall = (engagement + access + economic + social + health + sustainability) / 6;

    return {
      overall: Math.round(overall),
      engagement: Math.round(engagement),
      access: Math.round(access),
      economic: Math.round(economic),
      social: Math.round(social),
      health: Math.round(health),
      sustainability: Math.round(sustainability),
    };
  }

  // Calculate trends
  private async calculateTrends(zipCode: string): Promise<CivicTrends> {
    try {
      // This would compare current data with historical data
      // For now, return mock trends
      return {
        userGrowth: 12.5,
        eventGrowth: 8.3,
        revenueGrowth: 15.7,
        engagementGrowth: 6.2,
        venueGrowth: 2.1,
        period: 'month',
      };
    } catch (error) {
      console.error(`Failed to calculate trends for ZIP ${zipCode}:`, error);
      return {
        userGrowth: 0,
        eventGrowth: 0,
        revenueGrowth: 0,
        engagementGrowth: 0,
        venueGrowth: 0,
        period: 'month',
      };
    }
  }

  // Generate insights for a ZIP code
  private generateZipCodeInsights(zipCode: string, metrics: CivicMetrics, scores: CivicScores): CivicInsight[] {
    const insights: CivicInsight[] = [];

    // Engagement insights
    if (metrics.userEngagement < 0.3) {
      insights.push({
        id: `insight-${Date.now()}-${Math.random()}`,
        type: 'challenge',
        title: 'Low User Engagement',
        description: `Only ${(metrics.userEngagement * 100).toFixed(1)}% of users are active. Consider targeted engagement campaigns.`,
        impact: 'medium',
        confidence: 0.8,
        data: { currentEngagement: metrics.userEngagement, targetEngagement: 0.5 },
        timestamp: new Date(),
      });
    }

    // Access insights
    if (metrics.totalVenues < metrics.population / 10000) {
      insights.push({
        id: `insight-${Date.now()}-${Math.random()}`,
        type: 'opportunity',
        title: 'Venue Development Opportunity',
        description: `Area has ${metrics.population} people but only ${metrics.totalVenues} venues. High potential for new facility development.`,
        impact: 'high',
        confidence: 0.9,
        data: { population: metrics.population, venues: metrics.totalVenues, ratio: metrics.population / metrics.totalVenues },
        timestamp: new Date(),
      });
    }

    // Economic insights
    if (metrics.totalRevenue > 10000) {
      insights.push({
        id: `insight-${Date.now()}-${Math.random()}`,
        type: 'trend',
        title: 'Strong Economic Activity',
        description: `Area generated $${metrics.totalRevenue.toLocaleString()} in sports-related revenue this month.`,
        impact: 'high',
        confidence: 0.9,
        data: { revenue: metrics.totalRevenue, events: metrics.totalEvents },
        timestamp: new Date(),
      });
    }

    return insights;
  }

  // Generate recommendations
  private generateRecommendations(zipCode: string, metrics: CivicMetrics, scores: CivicScores): string[] {
    const recommendations: string[] = [];

    if (scores.engagement < 50) {
      recommendations.push('Implement user engagement campaigns with incentives and rewards');
    }

    if (scores.access < 50) {
      recommendations.push('Develop partnerships with local facilities to increase venue access');
    }

    if (scores.economic < 50) {
      recommendations.push('Create economic development programs for sports-related businesses');
    }

    if (scores.social < 50) {
      recommendations.push('Organize community events to build social connections');
    }

    return recommendations;
  }

  // Analyze all zones
  private async analyzeAllZones(): Promise<void> {
    try {
      for (const [zipCode, healthIndex] of this.healthIndices.entries()) {
        const zoneAnalysis = this.analyzeZone(zipCode, healthIndex);
        this.zoneAnalyses.set(zipCode, zoneAnalysis);
      }
    } catch (error) {
      console.error('Failed to analyze zones:', error);
    }
  }

  // Analyze a specific zone
  private analyzeZone(zipCode: string, healthIndex: CivicHealthIndex): ZoneAnalysis {
    const { scores, metrics } = healthIndex;
    const demographic = this.demographicData.get(zipCode);

    // Determine classification
    let classification: ZoneAnalysis['classification'];
    if (scores.overall < 30) {
      classification = 'underserved';
    } else if (scores.overall < 60) {
      classification = 'developing';
    } else if (scores.overall < 80) {
      classification = 'thriving';
    } else {
      classification = 'saturated';
    }

    // Determine priority
    let priority: ZoneAnalysis['priority'];
    if (classification === 'underserved' && demographic?.povertyRate > 15) {
      priority = 'critical';
    } else if (classification === 'underserved') {
      priority = 'high';
    } else if (classification === 'developing') {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Generate opportunities
    const opportunities: string[] = [];
    if (scores.access < 50) {
      opportunities.push('Venue development and facility partnerships');
    }
    if (scores.engagement < 50) {
      opportunities.push('Community engagement programs');
    }
    if (scores.economic < 50) {
      opportunities.push('Sports business development');
    }

    // Generate challenges
    const challenges: string[] = [];
    if (demographic?.povertyRate > 15) {
      challenges.push('High poverty rate affecting participation');
    }
    if (metrics.totalVenues < 2) {
      challenges.push('Limited venue access');
    }
    if (metrics.userEngagement < 0.3) {
      challenges.push('Low user engagement');
    }

    // Generate grant eligibility
    const grantEligibility = this.generateGrantEligibility(zipCode, classification, demographic);

    // Generate sponsor recommendations
    const sponsorRecommendations = this.generateSponsorRecommendations(zipCode, scores, demographic);

    return {
      zipCode,
      classification,
      priority,
      opportunities,
      challenges,
      grantEligibility,
      sponsorRecommendations,
    };
  }

  // Generate grant eligibility
  private generateGrantEligibility(zipCode: string, classification: string, demographic?: DemographicData): GrantEligibility[] {
    const grants: GrantEligibility[] = [];

    if (classification === 'underserved') {
      grants.push({
        grantType: 'Community Development',
        name: 'Sports Facility Development Grant',
        amount: 50000,
        matchRequired: 0.2,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        probability: 0.8,
        requirements: ['Non-profit organization', 'Community benefit plan', 'Matching funds'],
      });
    }

    if (demographic?.povertyRate > 15) {
      grants.push({
        grantType: 'Youth Development',
        name: 'Youth Sports Access Grant',
        amount: 25000,
        matchRequired: 0.1,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        probability: 0.9,
        requirements: ['Youth-focused programs', 'Financial need documentation', 'Program evaluation plan'],
      });
    }

    return grants;
  }

  // Generate sponsor recommendations
  private generateSponsorRecommendations(zipCode: string, scores: CivicScores, demographic?: DemographicData): SponsorRecommendation[] {
    const sponsors: SponsorRecommendation[] = [];

    if (scores.economic > 60) {
      sponsors.push({
        sponsorType: 'Corporate',
        name: 'Local Sports Equipment Store',
        fitScore: 0.9,
        potentialValue: 10000,
        contactInfo: 'contact@localsports.com',
        pitchPoints: ['High engagement area', 'Growing sports community', 'Brand alignment'],
      });
    }

    if (demographic?.medianIncome > 70000) {
      sponsors.push({
        sponsorType: 'Health & Wellness',
        name: 'Regional Health Network',
        fitScore: 0.8,
        potentialValue: 15000,
        contactInfo: 'partnerships@healthnetwork.org',
        pitchPoints: ['Health-conscious community', 'Active lifestyle focus', 'Community health initiatives'],
      });
    }

    return sponsors;
  }

  // Generate insights
  private async generateInsights(): Promise<void> {
    try {
      // Compare zones
      const zoneComparisons = this.compareZones();
      
      // Identify patterns
      const patterns = this.identifyPatterns();
      
      // Generate recommendations
      const recommendations = this.generateGlobalRecommendations();
      
      this.insights = [...zoneComparisons, ...patterns, ...recommendations];
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  }

  // Compare zones
  private compareZones(): CivicInsight[] {
    const insights: CivicInsight[] = [];
    const zones = Array.from(this.healthIndices.values());

    // Find best performing zone
    const bestZone = zones.reduce((best, current) => 
      current.scores.overall > best.scores.overall ? current : best
    );

    // Find worst performing zone
    const worstZone = zones.reduce((worst, current) => 
      current.scores.overall < worst.scores.overall ? current : worst
    );

    insights.push({
      id: `insight-${Date.now()}-${Math.random()}`,
      type: 'trend',
      title: 'Zone Performance Comparison',
      description: `${bestZone.town} (${bestZone.zipCode}) leads with ${bestZone.scores.overall}/100, while ${worstZone.town} (${worstZone.zipCode}) needs support at ${worstZone.scores.overall}/100.`,
      impact: 'high',
      confidence: 0.9,
      data: { bestZone, worstZone, gap: bestZone.scores.overall - worstZone.scores.overall },
      timestamp: new Date(),
    });

    return insights;
  }

  // Identify patterns
  private identifyPatterns(): CivicInsight[] {
    const insights: CivicInsight[] = [];
    const zones = Array.from(this.healthIndices.values());

    // Check for underserved zones
    const underservedZones = zones.filter(zone => zone.scores.overall < 40);
    if (underservedZones.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-${Math.random()}`,
        type: 'challenge',
        title: 'Multiple Underserved Zones',
        description: `${underservedZones.length} zones have health scores below 40. Consider targeted intervention programs.`,
        impact: 'critical',
        confidence: 0.9,
        data: { underservedZones, count: underservedZones.length },
        timestamp: new Date(),
      });
    }

    return insights;
  }

  // Generate global recommendations
  private generateGlobalRecommendations(): CivicInsight[] {
    const insights: CivicInsight[] = [];

    insights.push({
      id: `insight-${Date.now()}-${Math.random()}`,
      type: 'opportunity',
      title: 'System-wide Improvement Opportunity',
      description: 'Implement cross-zone programs to share best practices and resources.',
      impact: 'high',
      confidence: 0.8,
      data: { recommendation: 'Cross-zone collaboration program' },
      timestamp: new Date(),
    });

    return insights;
  }

  // Start periodic updates
  private startPeriodicUpdates(): void {
    setInterval(async () => {
      await this.updateAllIndices();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  // Update all indices
  private async updateAllIndices(): Promise<void> {
    try {
      await this.calculateAllHealthIndices();
      await this.analyzeAllZones();
      await this.generateInsights();
    } catch (error) {
      console.error('Failed to update indices:', error);
    }
  }

  // Helper methods
  private getTownFromZipCode(zipCode: string): string {
    // This would use a ZIP code database
    const townMap: { [key: string]: string } = {
      '27513': 'Cary',
      '27511': 'Cary',
      '27601': 'Raleigh',
      '27602': 'Raleigh',
    };
    return townMap[zipCode] || 'Unknown';
  }

  private calculateDataQuality(zipCode: string): number {
    // This would assess data completeness and reliability
    return 0.85; // Mock value
  }

  private getDefaultMetrics(): CivicMetrics {
    return {
      population: 0,
      totalUsers: 0,
      activeUsers: 0,
      totalEvents: 0,
      totalVenues: 0,
      totalRevenue: 0,
      totalTips: 0,
      totalLikes: 0,
      totalViews: 0,
      averageSessionDuration: 0,
      userEngagement: 0,
      venueUtilization: 0,
      economicActivity: 0,
      socialConnectivity: 0,
      accessibility: 0,
    };
  }

  private calculateEconomicActivity(revenue: number, users: number, zipCode: string): number {
    const demographic = this.demographicData.get(zipCode);
    if (!demographic) return 0;
    
    const revenuePerCapita = revenue / Math.max(demographic.population, 1);
    const incomeFactor = demographic.medianIncome / 75000; // Normalize to $75k
    
    return Math.min(1, (revenuePerCapita * 1000 + incomeFactor) / 2);
  }

  private calculateSocialConnectivity(users: any[], events: any[]): number {
    if (users.length === 0) return 0;
    
    const avgConnections = users.reduce((sum, user) => sum + (user.socialConnections?.length || 0), 0) / users.length;
    const eventParticipation = events.reduce((sum, event) => sum + (event.participants?.length || 0), 0);
    
    return Math.min(1, (avgConnections / 10 + eventParticipation / users.length) / 2);
  }

  private calculateAccessibility(venues: any[], users: number): number {
    if (venues.length === 0 || users === 0) return 0;
    
    const venuesPerUser = venues.length / users;
    const avgDistance = venues.reduce((sum, venue) => sum + (venue.distance || 5), 0) / venues.length;
    
    return Math.min(1, (venuesPerUser * 10 + (10 - avgDistance) / 10) / 2);
  }

  // Public methods
  getHealthIndex(zipCode: string): CivicHealthIndex | undefined {
    return this.healthIndices.get(zipCode);
  }

  getAllHealthIndices(): CivicHealthIndex[] {
    return Array.from(this.healthIndices.values());
  }

  getZoneAnalysis(zipCode: string): ZoneAnalysis | undefined {
    return this.zoneAnalyses.get(zipCode);
  }

  getAllZoneAnalyses(): ZoneAnalysis[] {
    return Array.from(this.zoneAnalyses.values());
  }

  getInsights(): CivicInsight[] {
    return this.insights;
  }

  getUnderservedZones(): ZoneAnalysis[] {
    return Array.from(this.zoneAnalyses.values()).filter(zone => zone.classification === 'underserved');
  }

  getHighPriorityZones(): ZoneAnalysis[] {
    return Array.from(this.zoneAnalyses.values()).filter(zone => 
      zone.priority === 'high' || zone.priority === 'critical'
    );
  }

  // Cleanup
  cleanup(): void {
    this.healthIndices.clear();
    this.zoneAnalyses.clear();
    this.demographicData.clear();
    this.insights = [];
  }
}

// Export singleton instance
export const civicIndexer = CivicIndexer.getInstance(); 