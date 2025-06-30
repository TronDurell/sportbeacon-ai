import { firestore } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, GeoPoint } from 'firebase/firestore';
import { analytics } from './shared/analytics';

export interface SkillGraph {
  shooting_accuracy: number;
  footwork_agility: number;
  vertical_jump: number;
  consistency: 'low' | 'medium' | 'high';
  reaction_time: number;
  endurance: number;
  mental_focus: number;
  weakAreas: string[];
  strongAreas: string[];
}

export interface Event {
  id: string;
  name: string;
  type: 'range' | 'competition' | 'training' | 'community';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
  };
  tags: string[];
  description: string;
  date: Date;
  duration: number; // minutes
  maxParticipants: number;
  currentParticipants: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requirements: string[];
  features: {
    dryFire: boolean;
    aiEnabled: boolean;
    communityRange: boolean;
    indoor: boolean;
    outdoor: boolean;
    longRange: boolean;
    shortRange: boolean;
    movingTargets: boolean;
    staticTargets: boolean;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  rating: number;
  reviewCount: number;
}

export interface EventRecommendation {
  event: Event;
  matchScore: number;
  reasons: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedTravelTime: number; // minutes
  skillGap: number; // How much this event will improve skills
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

export class EventRecommender {
  private static instance: EventRecommender;

  static getInstance(): EventRecommender {
    if (!EventRecommender.instance) {
      EventRecommender.instance = new EventRecommender();
    }
    return EventRecommender.instance;
  }

  /**
   * Get personalized event recommendations
   */
  async getEventRecommendations(
    uid: string,
    userLocation: UserLocation,
    radiusKm: number = 50,
    maxResults: number = 10
  ): Promise<EventRecommendation[]> {
    try {
      // Get user's skill graph
      const skillGraph = await this.getUserSkillGraph(uid);
      
      // Get events within radius
      const events = await this.getEventsInRadius(userLocation, radiusKm);
      
      // Calculate match scores and filter
      const recommendations = events
        .map(event => this.calculateEventMatch(event, skillGraph, userLocation))
        .filter(rec => rec.matchScore > 0.3) // Minimum match threshold
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, maxResults);

      // Track analytics
      await analytics.track('event_recommendations_generated', {
        userId: uid,
        eventsFound: events.length,
        recommendationsGenerated: recommendations.length,
        radiusKm,
        timestamp: new Date().toISOString()
      });

      return recommendations;
    } catch (error) {
      console.error('Failed to get event recommendations:', error);
      throw error;
    }
  }

  /**
   * Get user's skill graph from Firestore
   */
  private async getUserSkillGraph(uid: string): Promise<SkillGraph> {
    try {
      const skillGraphRef = doc(firestore, 'users', uid, 'skillGraph.json');
      const skillGraphDoc = await getDoc(skillGraphRef);
      
      if (skillGraphDoc.exists()) {
        const data = skillGraphDoc.data();
        return {
          shooting_accuracy: data.shooting_accuracy || 75,
          footwork_agility: data.footwork_agility || 70,
          vertical_jump: data.vertical_jump || 20,
          consistency: data.consistency || 'medium',
          reaction_time: data.reaction_time || 2500,
          endurance: data.endurance || 70,
          mental_focus: data.mental_focus || 75,
          weakAreas: data.weakAreas || [],
          strongAreas: data.strongAreas || []
        };
      }
      
      return this.getDefaultSkillGraph();
    } catch (error) {
      console.error('Failed to get user skill graph:', error);
      return this.getDefaultSkillGraph();
    }
  }

  /**
   * Get events within specified radius
   */
  private async getEventsInRadius(userLocation: UserLocation, radiusKm: number): Promise<Event[]> {
    try {
      const eventsRef = collection(firestore, 'events');
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const q = query(
        eventsRef,
        where('date', '>=', now),
        where('date', '<=', thirtyDaysFromNow),
        orderBy('date', 'asc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const events: Event[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const eventLocation = data.location;
        
        // Calculate distance
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          eventLocation.latitude,
          eventLocation.longitude
        );

        // Filter by radius
        if (distance <= radiusKm) {
          events.push({
            id: doc.id,
            name: data.name,
            type: data.type,
            location: eventLocation,
            tags: data.tags || [],
            description: data.description,
            date: data.date.toDate(),
            duration: data.duration,
            maxParticipants: data.maxParticipants,
            currentParticipants: data.currentParticipants || 0,
            difficulty: data.difficulty,
            requirements: data.requirements || [],
            features: data.features || {},
            contact: data.contact || {},
            rating: data.rating || 0,
            reviewCount: data.reviewCount || 0
          });
        }
      });

      return events;
    } catch (error) {
      console.error('Failed to get events in radius:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Calculate how well an event matches user's skills
   */
  private calculateEventMatch(
    event: Event,
    skillGraph: SkillGraph,
    userLocation: UserLocation
  ): EventRecommendation {
    let matchScore = 0;
    const reasons: string[] = [];
    let skillGap = 0;

    // Distance factor (closer = higher score)
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      event.location.latitude,
      event.location.longitude
    );
    const distanceScore = Math.max(0, 1 - (distance / 50)); // 50km max
    matchScore += distanceScore * 0.2;

    // Skill level matching
    const difficultyScores = {
      beginner: 0.3,
      intermediate: 0.6,
      advanced: 0.9
    };
    
    const userSkillLevel = this.calculateUserSkillLevel(skillGraph);
    const eventDifficulty = difficultyScores[event.difficulty];
    
    // Prefer events slightly above user's current level
    const skillMatch = 1 - Math.abs(userSkillLevel - eventDifficulty);
    matchScore += skillMatch * 0.3;
    
    if (skillMatch > 0.7) {
      reasons.push(`Matches your skill level (${event.difficulty})`);
    }

    // Feature preferences based on weak areas
    if (skillGraph.weakAreas.includes('shooting_accuracy') && event.features.staticTargets) {
      matchScore += 0.15;
      reasons.push('Great for improving accuracy');
      skillGap += 0.1;
    }

    if (skillGraph.weakAreas.includes('reaction_time') && event.features.movingTargets) {
      matchScore += 0.15;
      reasons.push('Perfect for reaction time training');
      skillGap += 0.15;
    }

    if (skillGraph.weakAreas.includes('consistency') && event.features.aiEnabled) {
      matchScore += 0.1;
      reasons.push('AI feedback will help consistency');
      skillGap += 0.05;
    }

    // Event type preferences
    if (skillGraph.shooting_accuracy >= 90 && event.type === 'competition') {
      matchScore += 0.1;
      reasons.push('High accuracy - ready for competition');
    }

    if (skillGraph.consistency === 'high' && event.type === 'training') {
      matchScore += 0.05;
      reasons.push('Consistent performance - training focused');
    }

    // Community features
    if (event.features.communityRange) {
      matchScore += 0.05;
      reasons.push('Community-focused environment');
    }

    // Rating factor
    if (event.rating >= 4.5) {
      matchScore += 0.05;
      reasons.push('Highly rated by community');
    }

    // Availability factor
    const availabilityScore = 1 - (event.currentParticipants / event.maxParticipants);
    matchScore += availabilityScore * 0.1;

    // Calculate estimated travel time (rough estimate)
    const estimatedTravelTime = Math.round(distance * 2); // 30 km/h average

    // Determine priority
    let priority: 'high' | 'medium' | 'low';
    if (matchScore >= 0.8) priority = 'high';
    else if (matchScore >= 0.6) priority = 'medium';
    else priority = 'low';

    return {
      event,
      matchScore: Math.round(matchScore * 100) / 100,
      reasons,
      priority,
      estimatedTravelTime,
      skillGap: Math.round(skillGap * 100) / 100
    };
  }

  /**
   * Calculate user's overall skill level (0-1)
   */
  private calculateUserSkillLevel(skillGraph: SkillGraph): number {
    const weights = {
      shooting_accuracy: 0.35,
      consistency: 0.25,
      reaction_time: 0.20,
      mental_focus: 0.15,
      endurance: 0.05
    };

    const consistencyScore = skillGraph.consistency === 'high' ? 0.9 : 
                           skillGraph.consistency === 'medium' ? 0.6 : 0.3;

    const reactionTimeScore = Math.max(0, 1 - (skillGraph.reaction_time / 5000));

    const weightedScore = 
      (skillGraph.shooting_accuracy / 100) * weights.shooting_accuracy +
      consistencyScore * weights.consistency +
      reactionTimeScore * weights.reaction_time +
      (skillGraph.mental_focus / 100) * weights.mental_focus +
      (skillGraph.endurance / 100) * weights.endurance;

    return Math.min(1, Math.max(0, weightedScore));
  }

  /**
   * Get default skill graph for new users
   */
  private getDefaultSkillGraph(): SkillGraph {
    return {
      shooting_accuracy: 75,
      footwork_agility: 70,
      vertical_jump: 20,
      consistency: 'medium',
      reaction_time: 2500,
      endurance: 70,
      mental_focus: 75,
      weakAreas: ['shooting_accuracy', 'consistency'],
      strongAreas: []
    };
  }

  /**
   * Get events by type and location
   */
  async getEventsByType(
    type: string,
    userLocation: UserLocation,
    radiusKm: number = 50
  ): Promise<Event[]> {
    try {
      const eventsRef = collection(firestore, 'events');
      const now = new Date();

      const q = query(
        eventsRef,
        where('type', '==', type),
        where('date', '>=', now),
        orderBy('date', 'asc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const events: Event[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const eventLocation = data.location;
        
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          eventLocation.latitude,
          eventLocation.longitude
        );

        if (distance <= radiusKm) {
          events.push({
            id: doc.id,
            name: data.name,
            type: data.type,
            location: eventLocation,
            tags: data.tags || [],
            description: data.description,
            date: data.date.toDate(),
            duration: data.duration,
            maxParticipants: data.maxParticipants,
            currentParticipants: data.currentParticipants || 0,
            difficulty: data.difficulty,
            requirements: data.requirements || [],
            features: data.features || {},
            contact: data.contact || {},
            rating: data.rating || 0,
            reviewCount: data.reviewCount || 0
          });
        }
      });

      return events;
    } catch (error) {
      console.error('Failed to get events by type:', error);
      return [];
    }
  }

  /**
   * Get events with specific features
   */
  async getEventsWithFeatures(
    features: string[],
    userLocation: UserLocation,
    radiusKm: number = 50
  ): Promise<Event[]> {
    try {
      const eventsRef = collection(firestore, 'events');
      const now = new Date();

      const q = query(
        eventsRef,
        where('date', '>=', now),
        orderBy('date', 'asc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const events: Event[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const eventLocation = data.location;
        
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          eventLocation.latitude,
          eventLocation.longitude
        );

        if (distance <= radiusKm) {
          const eventFeatures = data.features || {};
          const hasAllFeatures = features.every(feature => eventFeatures[feature]);
          
          if (hasAllFeatures) {
            events.push({
              id: doc.id,
              name: data.name,
              type: data.type,
              location: eventLocation,
              tags: data.tags || [],
              description: data.description,
              date: data.date.toDate(),
              duration: data.duration,
              maxParticipants: data.maxParticipants,
              currentParticipants: data.currentParticipants || 0,
              difficulty: data.difficulty,
              requirements: data.requirements || [],
              features: eventFeatures,
              contact: data.contact || {},
              rating: data.rating || 0,
              reviewCount: data.reviewCount || 0
            });
          }
        }
      });

      return events;
    } catch (error) {
      console.error('Failed to get events with features:', error);
      return [];
    }
  }
}

// Export singleton instance
export const eventRecommender = EventRecommender.getInstance(); 