// TownRecAgent core logic (voice+chat, OpenAI function-calling, multilingual, context, Firestore integration)
import { logTownRecAgentInteraction } from '../log/townRecAgentLogger';
import { getLeagueSchedule, getTeamRoster, getCoachAssignments, getPlayerRegistrationStatus, getFacilitySchedule } from '../models/townRecUtils';
import { League, Team, Player, Coach, Game, Practice, Facility, Payment, RegionalLeague, School } from '../models/townRecTypes';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { smartVenueManager, SmartVenue } from '../maps/smartVenues';
import { RecurringEventEngine } from '../events/RecurringEventEngine';

export interface TownRecAgentContext {
  townName: string;
  staffRole: string;
  language?: string;
  userId?: string;
}

interface AgentContext {
  userRole: 'coordinator' | 'director' | 'staff' | 'schoolAdmin' | 'schoolCoach';
  sessionMemory: { [key: string]: any };
}

export interface TownRecRecommendation {
  id: string;
  type: 'venue' | 'event' | 'training' | 'social' | 'infrastructure' | 'economic';
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: {
    participants: number;
    revenue: number;
    engagement: number;
    community: number;
  };
  data: any;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CivicInsight {
  id: string;
  category: 'usage' | 'revenue' | 'engagement' | 'infrastructure' | 'community';
  title: string;
  description: string;
  metrics: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  recommendations: string[];
  timestamp: Date;
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
      radius: number; // miles
    };
    budget: {
      min: number;
      max: number;
    };
  };
  behavior: {
    eventsAttended: number;
    venuesVisited: string[];
    averageSessionDuration: number;
    preferredTimes: string[];
    socialConnections: string[];
  };
  goals: {
    fitness: string[];
    social: string[];
    skill: string[];
    competitive: string[];
  };
}

export interface TownRecContext {
  user: UserProfile;
  currentLocation: { latitude: number; longitude: number };
  currentTime: Date;
  weather: any;
  nearbyVenues: SmartVenue[];
  recentActivity: any[];
  communityMetrics: any;
}

export class TownRecAgent {
  private static instance: TownRecAgent;
  private context: AgentContext;
  private eventEngine: RecurringEventEngine;
  private userProfiles: Map<string, UserProfile> = new Map();
  private recommendations: Map<string, TownRecRecommendation[]> = new Map();
  private insights: CivicInsight[] = [];

  static getInstance(): TownRecAgent {
    if (!TownRecAgent.instance) {
      TownRecAgent.instance = new TownRecAgent();
    }
    return TownRecAgent.instance;
  }

  constructor() {
    this.context = { userRole: 'coordinator', sessionMemory: {} };
    this.eventEngine = new RecurringEventEngine();
  }

  // Initialize the agent
  async initialize(): Promise<void> {
    try {
      await this.eventEngine.initialize();
      await smartVenueManager.initialize();
      await this.loadUserProfiles();
      await this.generateInitialInsights();
    } catch (error) {
      console.error('Failed to initialize TownRecAgent:', error);
    }
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
          },
          behavior: {
            eventsAttended: userData.eventsAttended || 0,
            venuesVisited: userData.venuesVisited || [],
            averageSessionDuration: userData.averageSessionDuration || 60,
            preferredTimes: userData.preferredTimes || [],
            socialConnections: userData.socialConnections || [],
          },
          goals: {
            fitness: userData.goals?.fitness || [],
            social: userData.goals?.social || [],
            skill: userData.goals?.skill || [],
            competitive: userData.goals?.competitive || [],
          },
        };
        
        this.userProfiles.set(profile.id, profile);
      });
    } catch (error) {
      console.error('Failed to load user profiles:', error);
    }
  }

  // Generate initial civic insights
  private async generateInitialInsights(): Promise<void> {
    try {
      const venues = smartVenueManager.getVenues();
      const analytics = smartVenueManager.getVenueAnalytics();
      
      // Usage insights
      this.insights.push({
        id: 'usage-001',
        category: 'usage',
        title: 'Venue Utilization',
        description: `Average venue occupancy is ${analytics.averageOccupancy.toFixed(1)}%`,
        metrics: {
          current: analytics.averageOccupancy,
          previous: analytics.averageOccupancy * 0.9, // Simulated previous
          change: 10,
          trend: 'up',
        },
        recommendations: [
          'Consider adding more evening events to increase utilization',
          'Promote underutilized venues through targeted marketing',
        ],
        timestamp: new Date(),
      });

      // Revenue insights
      this.insights.push({
        id: 'revenue-001',
        category: 'revenue',
        title: 'Revenue Generation',
        description: `Total revenue from venues: $${analytics.totalRevenue.toLocaleString()}`,
        metrics: {
          current: analytics.totalRevenue,
          previous: analytics.totalRevenue * 0.85,
          change: 15,
          trend: 'up',
        },
        recommendations: [
          'Implement dynamic pricing for peak hours',
          'Add premium amenities to increase revenue per user',
        ],
        timestamp: new Date(),
      });

      // Infrastructure insights
      this.insights.push({
        id: 'infrastructure-001',
        category: 'infrastructure',
        title: 'Maintenance Alerts',
        description: `${analytics.maintenanceIssues} venues have maintenance issues`,
        metrics: {
          current: analytics.maintenanceIssues,
          previous: analytics.maintenanceIssues * 1.2,
          change: -20,
          trend: 'down',
        },
        recommendations: [
          'Schedule preventive maintenance for all venues',
          'Implement real-time monitoring for critical systems',
        ],
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to generate initial insights:', error);
    }
  }

  // Get personalized recommendations for a user
  async getRecommendations(userId: string, context?: Partial<TownRecContext>): Promise<TownRecRecommendation[]> {
    try {
      const user = this.userProfiles.get(userId);
      if (!user) {
        throw new Error('User profile not found');
      }

      const fullContext = await this.buildContext(user, context);
      const recommendations: TownRecRecommendation[] = [];

      // Venue recommendations
      const venueRecs = await this.generateVenueRecommendations(user, fullContext);
      recommendations.push(...venueRecs);

      // Event recommendations
      const eventRecs = await this.generateEventRecommendations(user, fullContext);
      recommendations.push(...eventRecs);

      // Training recommendations
      const trainingRecs = await this.generateTrainingRecommendations(user, fullContext);
      recommendations.push(...trainingRecs);

      // Social recommendations
      const socialRecs = await this.generateSocialRecommendations(user, fullContext);
      recommendations.push(...socialRecs);

      // Infrastructure recommendations
      const infrastructureRecs = await this.generateInfrastructureRecommendations(user, fullContext);
      recommendations.push(...infrastructureRecs);

      // Economic recommendations
      const economicRecs = await this.generateEconomicRecommendations(user, fullContext);
      recommendations.push(...economicRecs);

      // Sort by priority and confidence
      recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });

      // Store recommendations
      this.recommendations.set(userId, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  // Build context for recommendations
  private async buildContext(user: UserProfile, context?: Partial<TownRecContext>): Promise<TownRecContext> {
    const currentLocation = context?.currentLocation || user.preferences.location;
    const currentTime = context?.currentTime || new Date();
    
    // Get nearby venues
    const nearbyVenues = smartVenueManager.filterVenues({
      sportTypes: user.preferences.sports,
      amenities: [],
      availability: 'all',
      priceRange: user.preferences.budget,
      distance: user.preferences.location.radius,
      rating: 0,
    }, currentLocation);

    // Get recent activity
    const recentActivity = await this.getRecentActivity(user.id);

    // Get community metrics
    const communityMetrics = await this.getCommunityMetrics(user.preferences.location);

    return {
      user,
      currentLocation,
      currentTime,
      weather: context?.weather || null,
      nearbyVenues,
      recentActivity,
      communityMetrics,
    };
  }

  // Generate venue recommendations
  private async generateVenueRecommendations(user: UserProfile, context: TownRecContext): Promise<TownRecRecommendation[]> {
    const recommendations: TownRecRecommendation[] = [];
    const { nearbyVenues, currentTime } = context;

    // Find underutilized venues
    const underutilizedVenues = nearbyVenues.filter(venue => 
      venue.sensors.occupancy.current < venue.sensors.occupancy.max * 0.3
    );

    for (const venue of underutilizedVenues) {
      if (user.preferences.sports.includes(venue.type)) {
        recommendations.push({
          id: `venue-${venue.id}`,
          type: 'venue',
          title: `Try ${venue.name}`,
          description: `${venue.name} has plenty of space available and matches your interests in ${venue.type}`,
          confidence: 0.8,
          priority: 'medium',
          impact: {
            participants: 1,
            revenue: venue.pricing.hourlyRate,
            engagement: 0.7,
            community: 0.5,
          },
          data: venue,
          createdAt: new Date(),
        });
      }
    }

    // Weather-based recommendations
    if (context.weather) {
      const indoorVenues = nearbyVenues.filter(venue => 
        venue.amenities.lighting && venue.type !== 'field'
      );

      if (context.weather.precipitation > 0.1) {
        for (const venue of indoorVenues) {
          recommendations.push({
            id: `weather-${venue.id}`,
            type: 'venue',
            title: `Stay dry at ${venue.name}`,
            description: `It's raining! ${venue.name} offers indoor facilities perfect for today's weather`,
            confidence: 0.9,
            priority: 'high',
            impact: {
              participants: 1,
              revenue: venue.pricing.hourlyRate,
              engagement: 0.8,
              community: 0.6,
            },
            data: venue,
            createdAt: new Date(),
          });
        }
      }
    }

    return recommendations;
  }

  // Generate event recommendations
  private async generateEventRecommendations(user: UserProfile, context: TownRecContext): Promise<TownRecRecommendation[]> {
    const recommendations: TownRecRecommendation[] = [];
    
    // Get upcoming events
    const upcomingEvents = await this.eventEngine.getUpcomingEvents({
      sportTypes: user.preferences.sports,
      location: user.preferences.location,
      timeRange: { start: new Date(), end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    for (const event of upcomingEvents) {
      const confidence = this.calculateEventConfidence(user, event);
      
      if (confidence > 0.5) {
        recommendations.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.title,
          description: event.description,
          confidence,
          priority: 'medium',
          impact: {
            participants: event.maxParticipants,
            revenue: event.fee || 0,
            engagement: 0.8,
            community: 0.9,
          },
          data: event,
          createdAt: new Date(),
        });
      }
    }

    return recommendations;
  }

  // Generate training recommendations
  private async generateTrainingRecommendations(user: UserProfile, context: TownRecContext): Promise<TownRecRecommendation[]> {
    const recommendations: TownRecRecommendation[] = [];

    // Skill-based recommendations
    if (user.goals.skill.length > 0) {
      for (const skill of user.goals.skill) {
        recommendations.push({
          id: `training-${skill}`,
          type: 'training',
          title: `Improve your ${skill}`,
          description: `Based on your goals, we recommend focusing on ${skill} development. Consider joining a training program or finding a coach.`,
          confidence: 0.7,
          priority: 'medium',
          impact: {
            participants: 1,
            revenue: 50,
            engagement: 0.9,
            community: 0.3,
          },
          data: { skill, userLevel: user.preferences.skillLevel },
          createdAt: new Date(),
        });
      }
    }

    return recommendations;
  }

  // Generate social recommendations
  private async generateSocialRecommendations(user: UserProfile, context: TownRecContext): Promise<TownRecRecommendation[]> {
    const recommendations: TownRecRecommendation[] = [];

    // Find users with similar interests
    const similarUsers = Array.from(this.userProfiles.values()).filter(profile => 
      profile.id !== user.id &&
      profile.preferences.sports.some(sport => user.preferences.sports.includes(sport)) &&
      this.calculateDistance(user.preferences.location, profile.preferences.location) < 5
    );

    if (similarUsers.length > 0) {
      recommendations.push({
        id: 'social-connections',
        type: 'social',
        title: 'Connect with local players',
        description: `Found ${similarUsers.length} players nearby with similar interests. Consider organizing a meetup!`,
        confidence: 0.6,
        priority: 'medium',
        impact: {
          participants: similarUsers.length,
          revenue: 0,
          engagement: 0.8,
          community: 0.9,
        },
        data: { similarUsers: similarUsers.slice(0, 5) },
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  // Generate infrastructure recommendations
  private async generateInfrastructureRecommendations(user: UserProfile, context: TownRecContext): Promise<TownRecRecommendation[]> {
    const recommendations: TownRecRecommendation[] = [];
    const { nearbyVenues } = context;

    // Check for maintenance issues
    const venuesWithIssues = nearbyVenues.filter(venue => 
      venue.maintenance.issues.length > 0
    );

    if (venuesWithIssues.length > 0) {
      recommendations.push({
        id: 'maintenance-alert',
        type: 'infrastructure',
        title: 'Venue maintenance needed',
        description: `${venuesWithIssues.length} nearby venues have maintenance issues that may affect your experience`,
        confidence: 0.9,
        priority: 'high',
        impact: {
          participants: venuesWithIssues.length,
          revenue: 0,
          engagement: 0.3,
          community: 0.7,
        },
        data: { venuesWithIssues },
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  // Generate economic recommendations
  private async generateEconomicRecommendations(user: UserProfile, context: TownRecContext): Promise<TownRecRecommendation[]> {
    const recommendations: TownRecRecommendation[] = [];

    // Budget optimization
    const expensiveVenues = context.nearbyVenues.filter(venue => 
      venue.pricing.hourlyRate > user.preferences.budget.max
    );

    if (expensiveVenues.length > 0) {
      const affordableVenues = context.nearbyVenues.filter(venue => 
        venue.pricing.hourlyRate <= user.preferences.budget.max
      );

      if (affordableVenues.length > 0) {
        recommendations.push({
          id: 'budget-optimization',
          type: 'economic',
          title: 'Save money on venues',
          description: `Consider these more affordable venues to stay within your budget of $${user.preferences.budget.max}/hour`,
          confidence: 0.8,
          priority: 'medium',
          impact: {
            participants: 1,
            revenue: -user.preferences.budget.max,
            engagement: 0.6,
            community: 0.4,
          },
          data: { affordableVenues },
          createdAt: new Date(),
        });
      }
    }

    return recommendations;
  }

  // Calculate event confidence based on user preferences
  private calculateEventConfidence(user: UserProfile, event: any): number {
    let confidence = 0.5;

    // Sport preference match
    if (user.preferences.sports.includes(event.sportType)) {
      confidence += 0.2;
    }

    // Time preference match
    const eventHour = new Date(event.startTime).getHours();
    const isPreferredTime = user.behavior.preferredTimes.some(time => {
      if (time === 'morning' && eventHour >= 6 && eventHour <= 12) return true;
      if (time === 'afternoon' && eventHour >= 12 && eventHour <= 18) return true;
      if (time === 'evening' && eventHour >= 18 && eventHour <= 22) return true;
      return false;
    });

    if (isPreferredTime) {
      confidence += 0.2;
    }

    // Budget match
    if (event.fee <= user.preferences.budget.max) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  // Calculate distance between two locations
  private calculateDistance(loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.deg2rad(loc2.latitude - loc1.latitude);
    const dLon = this.deg2rad(loc2.longitude - loc1.longitude);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(loc1.latitude)) * Math.cos(this.deg2rad(loc2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Get recent activity for a user
  private async getRecentActivity(userId: string): Promise<any[]> {
    try {
      const activityQuery = query(
        collection(db, 'user_activity'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(activityQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }
  }

  // Get community metrics
  private async getCommunityMetrics(location: { latitude: number; longitude: number }): Promise<any> {
    try {
      // This would aggregate community data
      return {
        totalUsers: this.userProfiles.size,
        activeUsers: Array.from(this.userProfiles.values()).filter(u => 
          this.calculateDistance(location, u.preferences.location) < 10
        ).length,
        totalEvents: 0, // Would be calculated from events collection
        totalRevenue: 0, // Would be calculated from transactions
      };
    } catch (error) {
      console.error('Failed to get community metrics:', error);
      return {};
    }
  }

  // Get civic insights
  getInsights(): CivicInsight[] {
    return this.insights;
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const user = this.userProfiles.get(userId);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.userProfiles.set(userId, updatedUser);
      
      // Update in Firestore
      // Implementation would update the user document
    }
  }

  // Cleanup
  cleanup(): void {
    this.userProfiles.clear();
    this.recommendations.clear();
    this.insights = [];
  }
}

// Export singleton instance
export const townRecAgent = TownRecAgent.getInstance(); 