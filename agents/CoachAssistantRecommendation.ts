import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { analytics } from '../lib/ai/shared/analytics';

const firestore = getFirestore();

interface RecommendationRequest {
  userId: string;
  childId: string;
  originalLeagueId: string;
  rejectionReason: string;
  rejectionType: 'gender-conflict' | 'age-conflict' | 'skill-level' | 'capacity' | 'other';
  userPreferences?: {
    preferredDays?: string[];
    preferredTimes?: string[];
    maxTravelDistance?: number;
    budget?: number;
  };
}

interface AlternativeLeague {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  genderPolicy: 'co-ed' | 'boys-only' | 'girls-only' | 'open';
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  schedule: {
    days: string[];
    times: string[];
    startDate: Date;
    endDate: Date;
  };
  cost: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  capacity: {
    current: number;
    max: number;
  };
  description: string;
  benefits: string[];
}

interface TrainingProgram {
  id: string;
  name: string;
  type: 'individual' | 'group' | 'camp' | 'clinic';
  sport: string;
  ageGroup: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  schedule: {
    days: string[];
    times: string[];
    startDate: Date;
    endDate: Date;
  };
  cost: number;
  instructor: {
    name: string;
    credentials: string[];
    experience: number;
  };
  description: string;
  benefits: string[];
  maxParticipants?: number;
}

interface Recommendation {
  type: 'alternative_league' | 'training_program' | 'hybrid';
  alternatives: (AlternativeLeague | TrainingProgram)[];
  message: string;
  followUpMessage: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string[];
}

export class CoachAssistantRecommendation {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Generate recommendations based on rejection
   */
  async generateRecommendations(request: RecommendationRequest): Promise<Recommendation> {
    try {
      console.log('🎯 Generating recommendations for user:', request.userId);

      // Track recommendation request
      await analytics.track('coach_assistant_recommendation_requested', {
        userId: request.userId,
        childId: request.childId,
        rejectionType: request.rejectionType,
        rejectionReason: request.rejectionReason,
        timestamp: new Date().toISOString()
      });

      let recommendation: Recommendation;

      switch (request.rejectionType) {
        case 'gender-conflict':
          recommendation = await this.handleGenderConflict(request);
          break;
        case 'age-conflict':
          recommendation = await this.handleAgeConflict(request);
          break;
        case 'skill-level':
          recommendation = await this.handleSkillLevelConflict(request);
          break;
        case 'capacity':
          recommendation = await this.handleCapacityConflict(request);
          break;
        default:
          recommendation = await this.handleGeneralRejection(request);
      }

      // Store recommendation
      await this.storeRecommendation(request, recommendation);

      // Track recommendation generated
      await analytics.track('coach_assistant_recommendation_generated', {
        userId: request.userId,
        recommendationType: recommendation.type,
        alternativesCount: recommendation.alternatives.length,
        priority: recommendation.priority,
        timestamp: new Date().toISOString()
      });

      return recommendation;

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.generateFallbackRecommendation(request);
    }
  }

  /**
   * Handle gender conflict rejections
   */
  private async handleGenderConflict(request: RecommendationRequest): Promise<Recommendation> {
    const alternatives = await this.findCoedLeagues(request);
    const trainingPrograms = await this.findIndividualTraining(request);

    return {
      type: 'hybrid',
      alternatives: [...alternatives, ...trainingPrograms],
      message: `I understand you're looking for options after the gender policy conflict. I've found some great co-ed leagues and individual training programs that would be perfect for your child.`,
      followUpMessage: `Would you like me to help you register for any of these alternatives? I can also provide more information about the programs or help you contact the coaches directly.`,
      priority: 'high',
      reasoning: [
        'Co-ed leagues provide inclusive environments for all children',
        'Individual training programs focus on skill development regardless of gender',
        'These options maintain the same sport and age group focus'
      ]
    };
  }

  /**
   * Handle age conflict rejections
   */
  private async handleAgeConflict(request: RecommendationRequest): Promise<Recommendation> {
    const alternatives = await this.findAgeAppropriateLeagues(request);
    const trainingPrograms = await this.findAgeAppropriateTraining(request);

    return {
      type: 'hybrid',
      alternatives: [...alternatives, ...trainingPrograms],
      message: `I found some excellent options that are perfect for your child's age group. These programs are specifically designed for their developmental stage.`,
      followUpMessage: `These programs are tailored to your child's age and skill level. Would you like me to explain the differences or help you choose the best fit?`,
      priority: 'medium',
      reasoning: [
        'Age-appropriate programs ensure proper skill development',
        'Safety and competition levels are matched to age group',
        'Social development with peers of similar age'
      ]
    };
  }

  /**
   * Handle skill level conflicts
   */
  private async handleSkillLevelConflict(request: RecommendationRequest): Promise<Recommendation> {
    const trainingPrograms = await this.findSkillDevelopmentPrograms(request);
    const beginnerLeagues = await this.findBeginnerLeagues(request);

    return {
      type: 'hybrid',
      alternatives: [...trainingPrograms, ...beginnerLeagues],
      message: `I've identified some great skill development programs and beginner-friendly leagues that will help your child build confidence and improve their abilities.`,
      followUpMessage: `These programs focus on fundamental skills and gradual progression. Would you like me to explain the skill development approach or help you get started?`,
      priority: 'medium',
      reasoning: [
        'Skill development programs build fundamental abilities',
        'Beginner leagues provide supportive learning environments',
        'Gradual progression prevents frustration and builds confidence'
      ]
    };
  }

  /**
   * Handle capacity conflicts
   */
  private async handleCapacityConflict(request: RecommendationRequest): Promise<Recommendation> {
    const alternatives = await this.findAvailableLeagues(request);
    const trainingPrograms = await this.findAvailableTraining(request);

    return {
      type: 'hybrid',
      alternatives: [...alternatives, ...trainingPrograms],
      message: `I found several available programs with open spots that would be perfect for your child. These options have immediate availability.`,
      followUpMessage: `These programs have current openings and can accommodate your child right away. Would you like me to help you secure a spot or provide more details?`,
      priority: 'high',
      reasoning: [
        'Immediate availability for current season',
        'Similar program quality and structure',
        'No waiting lists or delays'
      ]
    };
  }

  /**
   * Handle general rejections
   */
  private async handleGeneralRejection(request: RecommendationRequest): Promise<Recommendation> {
    const alternatives = await this.findGeneralAlternatives(request);
    const trainingPrograms = await this.findGeneralTraining(request);

    return {
      type: 'hybrid',
      alternatives: [...alternatives, ...trainingPrograms],
      message: `I've found some excellent alternative programs that might be a great fit for your child. Let me help you explore these options.`,
      followUpMessage: `I'm here to help you find the perfect program for your child. Would you like me to explain any of these options in more detail?`,
      priority: 'medium',
      reasoning: [
        'Multiple options to consider',
        'Different approaches to the same sport',
        'Flexible scheduling and locations'
      ]
    };
  }

  /**
   * Find co-ed leagues
   */
  private async findCoedLeagues(request: RecommendationRequest): Promise<AlternativeLeague[]> {
    try {
      const leaguesRef = collection(firestore, 'leagues');
      const leaguesQuery = query(
        leaguesRef,
        where('genderPolicy', '==', 'co-ed'),
        where('sport', '==', await this.getOriginalLeagueSport(request.originalLeagueId))
      );
      
      const leaguesSnap = await getDocs(leaguesQuery);
      const leagues = leaguesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AlternativeLeague[];

      return this.filterLeaguesByPreferences(leagues, request.userPreferences);
    } catch (error) {
      console.error('Error finding co-ed leagues:', error);
      return [];
    }
  }

  /**
   * Find individual training programs
   */
  private async findIndividualTraining(request: RecommendationRequest): Promise<TrainingProgram[]> {
    try {
      const programsRef = collection(firestore, 'training_programs');
      const programsQuery = query(
        programsRef,
        where('type', '==', 'individual'),
        where('sport', '==', await this.getOriginalLeagueSport(request.originalLeagueId))
      );
      
      const programsSnap = await getDocs(programsQuery);
      const programs = programsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TrainingProgram[];

      return this.filterProgramsByPreferences(programs, request.userPreferences);
    } catch (error) {
      console.error('Error finding individual training:', error);
      return [];
    }
  }

  /**
   * Find age-appropriate leagues
   */
  private async findAgeAppropriateLeagues(request: RecommendationRequest): Promise<AlternativeLeague[]> {
    try {
      const childAge = await this.getChildAge(request.childId);
      const leaguesRef = collection(firestore, 'leagues');
      const leaguesQuery = query(
        leaguesRef,
        where('ageGroup', '==', this.getAgeGroup(childAge))
      );
      
      const leaguesSnap = await getDocs(leaguesQuery);
      const leagues = leaguesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AlternativeLeague[];

      return this.filterLeaguesByPreferences(leagues, request.userPreferences);
    } catch (error) {
      console.error('Error finding age-appropriate leagues:', error);
      return [];
    }
  }

  /**
   * Find skill development programs
   */
  private async findSkillDevelopmentPrograms(request: RecommendationRequest): Promise<TrainingProgram[]> {
    try {
      const programsRef = collection(firestore, 'training_programs');
      const programsQuery = query(
        programsRef,
        where('skillLevel', '==', 'beginner')
      );
      
      const programsSnap = await getDocs(programsQuery);
      const programs = programsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TrainingProgram[];

      return this.filterProgramsByPreferences(programs, request.userPreferences);
    } catch (error) {
      console.error('Error finding skill development programs:', error);
      return [];
    }
  }

  /**
   * Find available leagues
   */
  private async findAvailableLeagues(request: RecommendationRequest): Promise<AlternativeLeague[]> {
    try {
      const leaguesRef = collection(firestore, 'leagues');
      const leaguesQuery = query(
        leaguesRef,
        where('capacity.current', '<', 'capacity.max')
      );
      
      const leaguesSnap = await getDocs(leaguesQuery);
      const leagues = leaguesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AlternativeLeague[];

      return this.filterLeaguesByPreferences(leagues, request.userPreferences);
    } catch (error) {
      console.error('Error finding available leagues:', error);
      return [];
    }
  }

  /**
   * Find general alternatives
   */
  private async findGeneralAlternatives(request: RecommendationRequest): Promise<AlternativeLeague[]> {
    try {
      const leaguesRef = collection(firestore, 'leagues');
      const leaguesSnap = await getDocs(leaguesRef);
      const leagues = leaguesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AlternativeLeague[];

      return this.filterLeaguesByPreferences(leagues, request.userPreferences);
    } catch (error) {
      console.error('Error finding general alternatives:', error);
      return [];
    }
  }

  /**
   * Find general training programs
   */
  private async findGeneralTraining(request: RecommendationRequest): Promise<TrainingProgram[]> {
    try {
      const programsRef = collection(firestore, 'training_programs');
      const programsSnap = await getDocs(programsRef);
      const programs = programsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TrainingProgram[];

      return this.filterProgramsByPreferences(programs, request.userPreferences);
    } catch (error) {
      console.error('Error finding general training:', error);
      return [];
    }
  }

  /**
   * Filter leagues by user preferences
   */
  private filterLeaguesByPreferences(
    leagues: AlternativeLeague[], 
    preferences?: RecommendationRequest['userPreferences']
  ): AlternativeLeague[] {
    if (!preferences) return leagues.slice(0, 5);

    return leagues
      .filter(league => {
        // Filter by preferred days if specified
        if (preferences.preferredDays && preferences.preferredDays.length > 0) {
          const hasPreferredDay = preferences.preferredDays.some(day => 
            league.schedule.days.includes(day)
          );
          if (!hasPreferredDay) return false;
        }

        // Filter by budget if specified
        if (preferences.budget && league.cost > preferences.budget) {
          return false;
        }

        return true;
      })
      .slice(0, 5);
  }

  /**
   * Filter programs by user preferences
   */
  private filterProgramsByPreferences(
    programs: TrainingProgram[], 
    preferences?: RecommendationRequest['userPreferences']
  ): TrainingProgram[] {
    if (!preferences) return programs.slice(0, 5);

    return programs
      .filter(program => {
        // Filter by preferred days if specified
        if (preferences.preferredDays && preferences.preferredDays.length > 0) {
          const hasPreferredDay = preferences.preferredDays.some(day => 
            program.schedule.days.includes(day)
          );
          if (!hasPreferredDay) return false;
        }

        // Filter by budget if specified
        if (preferences.budget && program.cost > preferences.budget) {
          return false;
        }

        return true;
      })
      .slice(0, 5);
  }

  /**
   * Get original league sport
   */
  private async getOriginalLeagueSport(leagueId: string): Promise<string> {
    try {
      const leagueRef = doc(firestore, 'leagues', leagueId);
      const leagueSnap = await getDoc(leagueRef);
      return leagueSnap.data()?.sport || 'soccer';
    } catch (error) {
      console.error('Error getting original league sport:', error);
      return 'soccer';
    }
  }

  /**
   * Get child age
   */
  private async getChildAge(childId: string): Promise<number> {
    try {
      const childRef = doc(firestore, 'children', childId);
      const childSnap = await getDoc(childRef);
      const birthDate = childSnap.data()?.birthDate?.toDate();
      if (birthDate) {
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age;
      }
      return 8; // Default age
    } catch (error) {
      console.error('Error getting child age:', error);
      return 8;
    }
  }

  /**
   * Get age group based on age
   */
  private getAgeGroup(age: number): string {
    if (age < 6) return '4-5';
    if (age < 8) return '6-7';
    if (age < 10) return '8-9';
    if (age < 12) return '10-11';
    if (age < 14) return '12-13';
    if (age < 16) return '14-15';
    return '16+';
  }

  /**
   * Store recommendation in Firestore
   */
  private async storeRecommendation(request: RecommendationRequest, recommendation: Recommendation) {
    try {
      await addDoc(collection(firestore, 'recommendations'), {
        userId: request.userId,
        childId: request.childId,
        originalLeagueId: request.originalLeagueId,
        rejectionType: request.rejectionType,
        rejectionReason: request.rejectionReason,
        recommendation,
        timestamp: Timestamp.now(),
        status: 'pending'
      });
    } catch (error) {
      console.error('Error storing recommendation:', error);
    }
  }

  /**
   * Generate fallback recommendation
   */
  private generateFallbackRecommendation(request: RecommendationRequest): Recommendation {
    return {
      type: 'training_program',
      alternatives: [],
      message: `I understand you're looking for alternatives after the rejection. While I'm having trouble accessing the current program database, I can help you explore options. Please contact our support team for personalized assistance.`,
      followUpMessage: `Our team can help you find the perfect program for your child. Would you like me to connect you with a program coordinator?`,
      priority: 'medium',
      reasoning: [
        'Personalized assistance available',
        'Multiple program options exist',
        'Support team can provide current availability'
      ]
    };
  }

  /**
   * Send follow-up message via ParentChat
   */
  async sendFollowUpMessage(userId: string, recommendation: Recommendation) {
    try {
      // Store follow-up message for ParentChat interface
      await addDoc(collection(firestore, 'users', userId, 'messages'), {
        type: 'recommendation_followup',
        content: recommendation.followUpMessage,
        timestamp: Timestamp.now(),
        read: false,
        priority: recommendation.priority
      });

      // Track follow-up sent
      await analytics.track('coach_assistant_followup_sent', {
        userId,
        recommendationType: recommendation.type,
        priority: recommendation.priority,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending follow-up message:', error);
    }
  }
}

export default CoachAssistantRecommendation; 