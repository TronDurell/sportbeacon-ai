// Role-based AI Onboarding Agents
// Provides personalized onboarding experience for each user type

import { analytics } from './shared/analytics';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { coachAgent } from './coachAgent';
import { scoutEval } from './scoutEval';
import { venuePredictor } from './venuePredictor';
import { eventNLPBuilder } from './eventNLPBuilder';
import { civicIndexer } from './civicIndexer';
import { 
  User,
  Player,
  Team,
  League,
  SiblingRequest,
  AgeOverrideRequest,
  WaitlistEntry,
  Record<string, unknown>
} from '../../types/interfaces';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
  data?: Record<string, unknown>;
}

export interface OnboardingProgress {
  userId: string;
  userRole: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  progress: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface OnboardingRecommendation {
  type: 'feature' | 'training' | 'connection' | 'resource';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  aiGenerated: boolean;
}

// Base Onboarding Agent
abstract class BaseOnboardingAgent {
  protected userId: string;
  protected userRole: string;
  protected progress: OnboardingProgress;

  constructor(userId: string, userRole: string) {
    this.userId = userId;
    this.userRole = userRole;
    this.progress = {
      userId,
      userRole,
      currentStep: 0,
      totalSteps: 0,
      completedSteps: [],
      progress: 0,
      startedAt: new Date()
    };
  }

  abstract getOnboardingSteps(): OnboardingStep[];
  abstract generateRecommendations(): Promise<OnboardingRecommendation[]>;
  abstract handleStepCompletion(stepId: string, data?: Record<string, unknown>): Promise<void>;

  async initialize(): Promise<void> {
    // Load existing progress
    const progressDoc = await getDoc(doc(db, 'onboardingProgress', this.userId));
    if (progressDoc.exists()) {
      this.progress = progressDoc.data() as OnboardingProgress;
    } else {
      // Initialize new progress
      const steps = this.getOnboardingSteps();
      this.progress.totalSteps = steps.length;
      await this.saveProgress();
    }

    // Track onboarding start
    analytics.track('onboarding_started', {
      userId: this.userId,
      userRole: this.userRole,
      step: this.progress.currentStep
    });
  }

  async getCurrentStep(): Promise<OnboardingStep | null> {
    const steps = this.getOnboardingSteps();
    return steps[this.progress.currentStep] || null;
  }

  async completeStep(stepId: string, data?: Record<string, unknown>): Promise<void> {
    await this.handleStepCompletion(stepId, data);
    
    this.progress.completedSteps.push(stepId);
    this.progress.currentStep++;
    this.progress.progress = (this.progress.completedSteps.length / this.progress.totalSteps) * 100;

    if (this.progress.progress >= 100) {
      this.progress.completedAt = new Date();
    }

    await this.saveProgress();

    // Track step completion
    analytics.track('onboarding_step_completed', {
      userId: this.userId,
      userRole: this.userRole,
      stepId,
      progress: this.progress.progress
    });
  }

  async getProgress(): Promise<OnboardingProgress> {
    return this.progress;
  }

  private async saveProgress(): Promise<void> {
    await setDoc(doc(db, 'onboardingProgress', this.userId), this.progress);
  }
}

// Player Onboarding Agent
export class PlayerOnboardingAgent extends BaseOnboardingAgent {
  constructor(userId: string) {
    super(userId, 'player');
  }

  getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'profile-setup',
        title: 'Complete Your Profile',
        description: 'Tell us about your sports background and preferences',
        completed: false,
        required: true,
        order: 1
      },
      {
        id: 'sport-selection',
        title: 'Choose Your Sports',
        description: 'Select the sports you want to play and your skill level',
        completed: false,
        required: true,
        order: 2
      },
      {
        id: 'location-setup',
        title: 'Set Your Location',
        description: 'Help us find nearby venues and teams',
        completed: false,
        required: true,
        order: 3
      },
      {
        id: 'goal-setting',
        title: 'Set Your Goals',
        description: 'What do you want to achieve? We\'ll personalize your experience',
        completed: false,
        required: false,
        order: 4
      },
      {
        id: 'ai-coach-intro',
        title: 'Meet Your AI Coach',
        description: 'Learn how your AI coach can help improve your game',
        completed: false,
        required: false,
        order: 5
      },
      {
        id: 'scout-alerts',
        title: 'Scout Alert Setup',
        description: 'Get notified when scouts are watching your games',
        completed: false,
        required: false,
        order: 6
      }
    ];
  }

  async generateRecommendations(): Promise<OnboardingRecommendation[]> {
    const recommendations: OnboardingRecommendation[] = [
      {
        type: 'feature',
        title: 'AI Coach Assistant',
        description: 'Get personalized training recommendations and performance insights',
        priority: 'high',
        actionUrl: '/coach-assistant',
        aiGenerated: true
      },
      {
        type: 'connection',
        title: 'Find Local Teams',
        description: 'Connect with teams in your area based on your skill level',
        priority: 'medium',
        actionUrl: '/teams',
        aiGenerated: true
      },
      {
        type: 'training',
        title: 'Skill Assessment',
        description: 'Take a quick assessment to get personalized drill recommendations',
        priority: 'medium',
        actionUrl: '/assessment',
        aiGenerated: true
      }
    ];

    return recommendations;
  }

  async handleStepCompletion(stepId: string, data?: Record<string, unknown>): Promise<void> {
    switch (stepId) {
      case 'profile-setup':
        await this.handleProfileSetup(data);
        break;
      case 'sport-selection':
        await this.handleSportSelection(data);
        break;
      case 'location-setup':
        await this.handleLocationSetup(data);
        break;
      case 'goal-setting':
        await this.handleGoalSetting(data);
        break;
      case 'ai-coach-intro':
        await this.handleAICoachIntro();
        break;
      case 'scout-alerts':
        await this.handleScoutAlertsSetup(data);
        break;
    }
  }

  private async handleProfileSetup(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      profile: data,
      onboardingCompleted: true
    });
  }

  private async handleSportSelection(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      sports: data.sports,
      skillLevels: data.skillLevels
    });
  }

  private async handleLocationSetup(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      location: data.location,
      preferredVenues: data.preferredVenues
    });
  }

  private async handleGoalSetting(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      goals: data.goals
    });
  }

  private async handleAICoachIntro(): Promise<void> {
    // Initialize AI coach for the player
    await coachAgent.initialize();
    await coachAgent.getUserRecommendations(this.userId);
  }

  private async handleScoutAlertsSetup(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      scoutAlerts: data.enabled,
      scoutPreferences: data.preferences
    });
  }
}

// Coach Onboarding Agent
export class CoachOnboardingAgent extends BaseOnboardingAgent {
  constructor(userId: string) {
    super(userId, 'coach');
  }

  getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'coach-profile',
        title: 'Coach Profile Setup',
        description: 'Complete your coaching profile and certifications',
        completed: false,
        required: true,
        order: 1
      },
      {
        id: 'team-setup',
        title: 'Team Management',
        description: 'Set up your teams and roster management',
        completed: false,
        required: true,
        order: 2
      },
      {
        id: 'training-tools',
        title: 'Training Tools',
        description: 'Learn about AI-powered training tools and drill creation',
        completed: false,
        required: true,
        order: 3
      },
      {
        id: 'scout-eval',
        title: 'Scout Evaluation',
        description: 'Set up video analysis and player evaluation tools',
        completed: false,
        required: false,
        order: 4
      },
      {
        id: 'schedule-management',
        title: 'Schedule Management',
        description: 'Learn how to manage practices, games, and team events',
        completed: false,
        required: false,
        order: 5
      }
    ];
  }

  async generateRecommendations(): Promise<OnboardingRecommendation[]> {
    const recommendations: OnboardingRecommendation[] = [
      {
        type: 'feature',
        title: 'AI Practice Planner',
        description: 'Generate personalized practice plans based on your team\'s needs',
        priority: 'high',
        actionUrl: '/practice-planner',
        aiGenerated: true
      },
      {
        type: 'training',
        title: 'Video Analysis Tools',
        description: 'Use AI to analyze player performance and provide feedback',
        priority: 'high',
        actionUrl: '/video-analysis',
        aiGenerated: true
      },
      {
        type: 'connection',
        title: 'Scout Network',
        description: 'Connect with scouts to showcase your players',
        priority: 'medium',
        actionUrl: '/scout-network',
        aiGenerated: true
      }
    ];

    return recommendations;
  }

  async handleStepCompletion(stepId: string, data?: Record<string, unknown>): Promise<void> {
    switch (stepId) {
      case 'coach-profile':
        await this.handleCoachProfile(data);
        break;
      case 'team-setup':
        await this.handleTeamSetup(data);
        break;
      case 'training-tools':
        await this.handleTrainingTools();
        break;
      case 'scout-eval':
        await this.handleScoutEvalSetup();
        break;
      case 'schedule-management':
        await this.handleScheduleManagement(data);
        break;
    }
  }

  private async handleCoachProfile(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      coachProfile: data,
      certifications: data.certifications,
      experience: data.experience
    });
  }

  private async handleTeamSetup(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      teams: data.teams,
      rosterManagement: data.rosterManagement
    });
  }

  private async handleTrainingTools(): Promise<void> {
    // Initialize AI training tools
    await coachAgent.initialize();
  }

  private async handleScoutEvalSetup(): Promise<void> {
    // Initialize ScoutEval for coach
    await scoutEval.initialize();
  }

  private async handleScheduleManagement(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      schedulePreferences: data.preferences,
      autoScheduling: data.autoScheduling
    });
  }
}

// Parent Onboarding Agent
export class ParentOnboardingAgent extends BaseOnboardingAgent {
  constructor(userId: string) {
    super(userId, 'parent');
  }

  getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'family-profile',
        title: 'Family Profile',
        description: 'Set up your family profile and add your children',
        completed: false,
        required: true,
        order: 1
      },
      {
        id: 'child-profiles',
        title: 'Child Profiles',
        description: 'Create profiles for each child with their sports preferences',
        completed: false,
        required: true,
        order: 2
      },
      {
        id: 'league-info',
        title: 'League Information',
        description: 'Learn about available leagues and registration processes',
        completed: false,
        required: true,
        order: 3
      },
      {
        id: 'communication-setup',
        title: 'Communication Preferences',
        description: 'Set up how you want to receive updates and notifications',
        completed: false,
        required: false,
        order: 4
      },
      {
        id: 'approval-workflow',
        title: 'Approval Workflow',
        description: 'Learn how to approve registrations and manage permissions',
        completed: false,
        required: false,
        order: 5
      }
    ];
  }

  async generateRecommendations(): Promise<OnboardingRecommendation[]> {
    const recommendations: OnboardingRecommendation[] = [
      {
        type: 'feature',
        title: 'Child Profile Switcher',
        description: 'Easily switch between managing multiple children\'s sports activities',
        priority: 'high',
        actionUrl: '/child-switcher',
        aiGenerated: true
      },
      {
        type: 'connection',
        title: 'League Updates',
        description: 'Get real-time updates about league schedules and changes',
        priority: 'medium',
        actionUrl: '/league-updates',
        aiGenerated: true
      },
      {
        type: 'resource',
        title: 'Parent Resources',
        description: 'Access guides and tips for supporting your child\'s sports journey',
        priority: 'low',
        actionUrl: '/parent-resources',
        aiGenerated: true
      }
    ];

    return recommendations;
  }

  async handleStepCompletion(stepId: string, data?: Record<string, unknown>): Promise<void> {
    switch (stepId) {
      case 'family-profile':
        await this.handleFamilyProfile(data);
        break;
      case 'child-profiles':
        await this.handleChildProfiles(data);
        break;
      case 'league-info':
        await this.handleLeagueInfo();
        break;
      case 'communication-setup':
        await this.handleCommunicationSetup(data);
        break;
      case 'approval-workflow':
        await this.handleApprovalWorkflow(data);
        break;
    }
  }

  private async handleFamilyProfile(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      familyProfile: data,
      familySize: data.familySize,
      address: data.address
    });
  }

  private async handleChildProfiles(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      children: data.children,
      childCount: data.children.length
    });
  }

  private async handleLeagueInfo(): Promise<void> {
    // Load league information for the parent
    const leagues = await civicIndexer.getAvailableLeagues();
    await updateDoc(doc(db, 'users', this.userId), {
      availableLeagues: leagues
    });
  }

  private async handleCommunicationSetup(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      communicationPreferences: data.preferences,
      notificationSettings: data.notifications
    });
  }

  private async handleApprovalWorkflow(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      approvalWorkflow: data.workflow,
      autoApproval: data.autoApproval
    });
  }
}

// Admin Onboarding Agent
export class AdminOnboardingAgent extends BaseOnboardingAgent {
  constructor(userId: string) {
    super(userId, 'admin');
  }

  getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'admin-profile',
        title: 'Admin Profile',
        description: 'Complete your administrative profile and permissions',
        completed: false,
        required: true,
        order: 1
      },
      {
        id: 'league-management',
        title: 'League Management',
        description: 'Learn how to manage leagues, teams, and registrations',
        completed: false,
        required: true,
        order: 2
      },
      {
        id: 'waitlist-management',
        title: 'Waitlist Management',
        description: 'Set up and manage waitlists for popular programs',
        completed: false,
        required: true,
        order: 3
      },
      {
        id: 'age-override',
        title: 'Age Override System',
        description: 'Learn how to handle age exceptions and play-up requests',
        completed: false,
        required: true,
        order: 4
      },
      {
        id: 'sibling-logic',
        title: 'Sibling Placement Logic',
        description: 'Configure automatic sibling placement and team assignment',
        completed: false,
        required: false,
        order: 5
      },
      {
        id: 'reporting-tools',
        title: 'Reporting and Analytics',
        description: 'Access comprehensive reporting and analytics tools',
        completed: false,
        required: false,
        order: 6
      }
    ];
  }

  async generateRecommendations(): Promise<OnboardingRecommendation[]> {
    const recommendations: OnboardingRecommendation[] = [
      {
        type: 'feature',
        title: 'Central Operations Dashboard',
        description: 'Manage all operations from a centralized dashboard',
        priority: 'high',
        actionUrl: '/admin-dashboard',
        aiGenerated: true
      },
      {
        type: 'training',
        title: 'AI-Powered Decision Support',
        description: 'Get AI recommendations for complex administrative decisions',
        priority: 'high',
        actionUrl: '/ai-decisions',
        aiGenerated: true
      },
      {
        type: 'connection',
        title: 'Staff Management',
        description: 'Manage staff training and performance tracking',
        priority: 'medium',
        actionUrl: '/staff-management',
        aiGenerated: true
      }
    ];

    return recommendations;
  }

  async handleStepCompletion(stepId: string, data?: Record<string, unknown>): Promise<void> {
    switch (stepId) {
      case 'admin-profile':
        await this.handleAdminProfile(data);
        break;
      case 'league-management':
        await this.handleLeagueManagement(data);
        break;
      case 'waitlist-management':
        await this.handleWaitlistManagement(data);
        break;
      case 'age-override':
        await this.handleAgeOverride(data);
        break;
      case 'sibling-logic':
        await this.handleSiblingLogic(data);
        break;
      case 'reporting-tools':
        await this.handleReportingTools();
        break;
    }
  }

  private async handleAdminProfile(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      adminProfile: data,
      permissions: data.permissions,
      accessLevel: data.accessLevel
    });
  }

  private async handleLeagueManagement(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      managedLeagues: data.leagues,
      leaguePermissions: data.permissions
    });
  }

  private async handleWaitlistManagement(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      waitlistManagement: data.settings,
      autoProcessing: data.autoProcessing
    });
  }

  private async handleAgeOverride(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      ageOverrideSettings: data.settings,
      approvalWorkflow: data.workflow
    });
  }

  private async handleSiblingLogic(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      siblingLogicSettings: data.settings,
      autoPlacement: data.autoPlacement
    });
  }

  private async handleReportingTools(): Promise<void> {
    // Initialize reporting tools
    await civicIndexer.initialize();
  }
}

// Scout Onboarding Agent
export class ScoutOnboardingAgent extends BaseOnboardingAgent {
  constructor(userId: string) {
    super(userId, 'scout');
  }

  getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'scout-profile',
        title: 'Scout Profile',
        description: 'Complete your scouting profile and organization details',
        completed: false,
        required: true,
        order: 1
      },
      {
        id: 'evaluation-tools',
        title: 'Evaluation Tools',
        description: 'Learn how to use AI-powered video analysis and evaluation tools',
        completed: false,
        required: true,
        order: 2
      },
      {
        id: 'player-database',
        title: 'Player Database',
        description: 'Access the comprehensive player database and search tools',
        completed: false,
        required: true,
        order: 3
      },
      {
        id: 'highlight-review',
        title: 'Highlight Review',
        description: 'Learn how to review and analyze player highlight reels',
        completed: false,
        required: false,
        order: 4
      },
      {
        id: 'report-generation',
        title: 'Report Generation',
        description: 'Create detailed scouting reports with AI assistance',
        completed: false,
        required: false,
        order: 5
      }
    ];
  }

  async generateRecommendations(): Promise<OnboardingRecommendation[]> {
    const recommendations: OnboardingRecommendation[] = [
      {
        type: 'feature',
        title: 'AI Video Analysis',
        description: 'Use AI to analyze player videos and generate detailed reports',
        priority: 'high',
        actionUrl: '/video-analysis',
        aiGenerated: true
      },
      {
        type: 'connection',
        title: 'Player Network',
        description: 'Connect with players and coaches in your scouting network',
        priority: 'high',
        actionUrl: '/player-network',
        aiGenerated: true
      },
      {
        type: 'training',
        title: 'Scouting Best Practices',
        description: 'Access training materials and best practices for scouting',
        priority: 'medium',
        actionUrl: '/scouting-guide',
        aiGenerated: true
      }
    ];

    return recommendations;
  }

  async handleStepCompletion(stepId: string, data?: Record<string, unknown>): Promise<void> {
    switch (stepId) {
      case 'scout-profile':
        await this.handleScoutProfile(data);
        break;
      case 'evaluation-tools':
        await this.handleEvaluationTools();
        break;
      case 'player-database':
        await this.handlePlayerDatabase(data);
        break;
      case 'highlight-review':
        await this.handleHighlightReview();
        break;
      case 'report-generation':
        await this.handleReportGeneration(data);
        break;
    }
  }

  private async handleScoutProfile(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      scoutProfile: data,
      organization: data.organization,
      scoutingAreas: data.scoutingAreas
    });
  }

  private async handleEvaluationTools(): Promise<void> {
    // Initialize ScoutEval for scout
    await scoutEval.initialize();
  }

  private async handlePlayerDatabase(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      playerDatabaseAccess: data.access,
      searchPreferences: data.preferences
    });
  }

  private async handleHighlightReview(): Promise<void> {
    // Set up highlight review tools
    await updateDoc(doc(db, 'users', this.userId), {
      highlightReviewEnabled: true
    });
  }

  private async handleReportGeneration(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      reportTemplates: data.templates,
      autoGeneration: data.autoGeneration
    });
  }
}

// Referee Onboarding Agent
export class RefereeOnboardingAgent extends BaseOnboardingAgent {
  constructor(userId: string) {
    super(userId, 'referee');
  }

  getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'referee-profile',
        title: 'Referee Profile',
        description: 'Complete your referee profile and certifications',
        completed: false,
        required: true,
        order: 1
      },
      {
        id: 'rule-database',
        title: 'Rule Database',
        description: 'Access comprehensive rule books and AI-powered rule assistance',
        completed: false,
        required: true,
        order: 2
      },
      {
        id: 'match-logging',
        title: 'Match Logging',
        description: 'Learn how to log matches, incidents, and generate reports',
        completed: false,
        required: true,
        order: 3
      },
      {
        id: 'dispute-resolution',
        title: 'Dispute Resolution',
        description: 'Learn how to handle disputes and conflict resolution',
        completed: false,
        required: false,
        order: 4
      },
      {
        id: 'schedule-management',
        title: 'Schedule Management',
        description: 'Manage your officiating schedule and availability',
        completed: false,
        required: false,
        order: 5
      }
    ];
  }

  async generateRecommendations(): Promise<OnboardingRecommendation[]> {
    const recommendations: OnboardingRecommendation[] = [
      {
        type: 'feature',
        title: 'AI Rule Assistant',
        description: 'Get instant rule clarifications and interpretations',
        priority: 'high',
        actionUrl: '/rule-assistant',
        aiGenerated: true
      },
      {
        type: 'training',
        title: 'Referee Training',
        description: 'Access training materials and certification programs',
        priority: 'medium',
        actionUrl: '/referee-training',
        aiGenerated: true
      },
      {
        type: 'connection',
        title: 'Referee Network',
        description: 'Connect with other referees and share experiences',
        priority: 'low',
        actionUrl: '/referee-network',
        aiGenerated: true
      }
    ];

    return recommendations;
  }

  async handleStepCompletion(stepId: string, data?: Record<string, unknown>): Promise<void> {
    switch (stepId) {
      case 'referee-profile':
        await this.handleRefereeProfile(data);
        break;
      case 'rule-database':
        await this.handleRuleDatabase();
        break;
      case 'match-logging':
        await this.handleMatchLogging(data);
        break;
      case 'dispute-resolution':
        await this.handleDisputeResolution(data);
        break;
      case 'schedule-management':
        await this.handleScheduleManagement(data);
        break;
    }
  }

  private async handleRefereeProfile(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      refereeProfile: data,
      certifications: data.certifications,
      experience: data.experience
    });
  }

  private async handleRuleDatabase(): Promise<void> {
    // Initialize rule database access
    await updateDoc(doc(db, 'users', this.userId), {
      ruleDatabaseAccess: true,
      aiRuleAssistant: true
    });
  }

  private async handleMatchLogging(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      matchLoggingEnabled: true,
      loggingPreferences: data.preferences
    });
  }

  private async handleDisputeResolution(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      disputeResolutionAccess: true,
      resolutionWorkflow: data.workflow
    });
  }

  private async handleScheduleManagement(data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'users', this.userId), {
      scheduleManagement: data.settings,
      availability: data.availability
    });
  }
}

// Factory function to create appropriate onboarding agent
export function createOnboardingAgent(userId: string, userRole: string): BaseOnboardingAgent {
  switch (userRole.toLowerCase()) {
    case 'player':
      return new PlayerOnboardingAgent(userId);
    case 'coach':
      return new CoachOnboardingAgent(userId);
    case 'parent':
      return new ParentOnboardingAgent(userId);
    case 'admin':
      return new AdminOnboardingAgent(userId);
    case 'scout':
      return new ScoutOnboardingAgent(userId);
    case 'referee':
      return new RefereeOnboardingAgent(userId);
    default:
      throw new Error(`Unsupported user role: ${userRole}`);
  }
}

// Export all agents for direct use
export {
  PlayerOnboardingAgent,
  CoachOnboardingAgent,
  ParentOnboardingAgent,
  AdminOnboardingAgent,
  ScoutOnboardingAgent,
  RefereeOnboardingAgent
}; 