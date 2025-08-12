import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import TownRecAIAgent from '../agents/townRecAIAgent';
import { ParentChatInterface } from '../agents/ParentChatInterface';
import { ParentPreferencesPanel } from '../agents/ParentPreferencesPanel';
import { TownRecIntegrityModule } from '../town-rec-integrity/TownRecIntegrityModule';
import { CoachAssistantRecommendation } from '../agents/CoachAssistantRecommendation';
import { ChatSessionAnalytics } from '../agents/ChatSessionAnalytics';

// Mock Firebase
jest.mock('firebase/app');
jest.mock('firebase/firestore');

const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() }))
  }
};

(getFirestore as jest.Mock).mockReturnValue(mockFirestore);

describe('TownRec Full Flow Integration', () => {
  let aiAgent: TownRecAIAgent;
  let integrityModule: TownRecIntegrityModule;
  let coachAssistant: CoachAssistantRecommendation;
  let chatAnalytics: ChatSessionAnalytics;

  beforeEach(() => {
    jest.clearAllMocks();
    
    aiAgent = new TownRecAIAgent('user-1');
    integrityModule = new TownRecIntegrityModule();
    coachAssistant = new CoachAssistantRecommendation('user-1');
    chatAnalytics = new ChatSessionAnalytics('user-1');
  });

  describe('Complete User Journey', () => {
    it('should handle full user journey from signup to exception resolution', async () => {
      // Step 1: User signs up and sets preferences
      const userPreferences = {
        notificationLevel: 'all' as const,
        language: 'en' as const,
        timezone: 'America/New_York',
        communicationMethod: 'text' as const,
        deiReportOptIn: true,
        avatarType: 'lottie' as const,
        voiceEnabled: true,
        autoSync: true
      };

      // Mock preference save
      const mockAddDoc = addDoc as jest.Mock;
      mockAddDoc.mockResolvedValue({ id: 'pref-1' });

      // Step 2: User tries to join a league
      const leagueJoinRequest = {
        userId: 'user-1',
        childId: 'child-1',
        leagueId: 'girls-soccer-league',
        userGender: 'male',
        userAge: 9,
        birthSex: 'male'
      };

      // Mock league validation
      const validationResult = await integrityModule.validateUserEligibility(leagueJoinRequest);
      expect(validationResult.eligible).toBe(false);
      expect(validationResult.conflictType).toBe('gender-policy-mismatch');

      // Step 3: User submits exception request
      const exceptionRequest = {
        userId: 'user-1',
        leagueId: 'girls-soccer-league',
        reason: 'Child identifies as female and wants to play with friends',
        supportingDocuments: ['identity-document.pdf'],
        urgency: 'medium'
      };

      mockAddDoc.mockResolvedValue({ id: 'exception-1' });
      const exceptionId = await integrityModule.submitExceptionRequest(exceptionRequest);
      expect(exceptionId).toBe('exception-1');

      // Step 4: AI Agent notifies user of pending request
      await aiAgent.handleDEIStatusUpdate({
        id: exceptionId,
        status: 'pending',
        reason: exceptionRequest.reason
      });

      // Step 5: Admin reviews and approves request
      const adminApproval = {
        adminId: 'admin-1',
        reason: 'Approved based on child\'s gender identity',
        overridePolicy: true
      };

      mockAddDoc.mockResolvedValue({ id: 'audit-1' });
      await integrityModule.approveExceptionRequest(exceptionId, adminApproval);

      // Step 6: AI Agent notifies user of approval
      await aiAgent.handleDEIStatusUpdate({
        id: exceptionId,
        status: 'approved',
        reason: adminApproval.reason
      });

      // Step 7: Coach Assistant provides recommendations
      const recommendation = await coachAssistant.generateRecommendations({
        userId: 'user-1',
        childId: 'child-1',
        originalLeagueId: 'girls-soccer-league',
        rejectionReason: 'Gender policy conflict',
        rejectionType: 'gender-conflict'
      });

      expect(recommendation.type).toBe('hybrid');
      expect(recommendation.alternatives.length).toBeGreaterThan(0);

      // Step 8: Send follow-up message
      await coachAssistant.sendFollowUpMessage('user-1', recommendation);

      // Step 9: Track analytics
      const sessionId = await chatAnalytics.startSession('text', 'en');
      await chatAnalytics.logMessage(
        sessionId,
        'user',
        'text',
        'I need help with league registration',
        1500,
        'neutral',
        'live-answer'
      );
      await chatAnalytics.endSession(sessionId, 4);

      // Verify all interactions were tracked
      expect(mockAddDoc).toHaveBeenCalledTimes(6); // preferences, exception, audit, approval, recommendation, analytics
    });

    it('should handle denied exception request with alternative recommendations', async () => {
      // User submits exception request
      const exceptionRequest = {
        userId: 'user-1',
        leagueId: 'competitive-league',
        reason: 'Skill level accommodation needed',
        urgency: 'low'
      };

      const mockAddDoc = addDoc as jest.Mock;
      mockAddDoc.mockResolvedValue({ id: 'exception-1' });
      const exceptionId = await integrityModule.submitExceptionRequest(exceptionRequest);

      // Admin denies request
      const adminDenial = {
        adminId: 'admin-1',
        reason: 'League is for advanced players only',
        alternativeSuggestions: ['Beginner league available', 'Skills development program']
      };

      await integrityModule.denyExceptionRequest(exceptionId, adminDenial);

      // AI Agent notifies user of denial
      await aiAgent.handleDEIStatusUpdate({
        id: exceptionId,
        status: 'denied',
        reason: adminDenial.reason
      });

      // Coach Assistant provides alternative recommendations
      const recommendation = await coachAssistant.generateRecommendations({
        userId: 'user-1',
        childId: 'child-1',
        originalLeagueId: 'competitive-league',
        rejectionReason: adminDenial.reason,
        rejectionType: 'skill-level'
      });

      expect(recommendation.type).toBe('hybrid');
      expect(recommendation.message).toContain('skill development');
      expect(recommendation.alternatives.length).toBeGreaterThan(0);

      // Send follow-up with recommendations
      await coachAssistant.sendFollowUpMessage('user-1', recommendation);
    });

    it('should handle real-time notifications and chat interactions', async () => {
      // Initialize AI Agent
      await aiAgent.init();

      // Simulate schedule update
      const scheduleUpdate = {
        id: 'update-1',
        teamId: 'team-1',
        eventId: 'game-1',
        changeType: 'time' as const,
        oldValue: '2:00 PM',
        newValue: '3:00 PM',
        timestamp: new Date(),
        affectedUsers: ['user-1']
      };

      await aiAgent.handleScheduleUpdate(scheduleUpdate);

      // Simulate weather alert
      const weatherAlert = {
        id: 'alert-1',
        leagueId: 'team-1',
        severity: 'medium' as const,
        description: 'Rain expected during game time',
        affectedEvents: ['game-1'],
        timestamp: new Date()
      };

      await aiAgent.handleWeatherAlert(weatherAlert);

      // Simulate team announcement
      const teamAnnouncement = {
        id: 'announcement-1',
        teamId: 'team-1',
        coachId: 'coach-1',
        title: 'Practice Cancelled',
        message: 'Practice is cancelled due to weather',
        priority: 'high' as const,
        timestamp: new Date(),
        requiresResponse: false
      };

      await aiAgent.handleTeamAnnouncement(teamAnnouncement);

      // Verify notifications were sent
      const mockAddDoc = addDoc as jest.Mock;
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          title: expect.stringContaining('Schedule Update'),
          data: expect.objectContaining({ type: 'schedule_update' })
        })
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          title: expect.stringContaining('Weather Alert'),
          data: expect.objectContaining({ type: 'weather_alert' })
        })
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          title: expect.stringContaining('Team Announcement'),
          data: expect.objectContaining({ type: 'team_announcement' })
        })
      );
    });

    it('should handle chat session with avatar and voice interactions', async () => {
      // Start chat session with analytics
      const sessionId = await chatAnalytics.startSession('avatar', 'en');

      // Log user message
      await chatAnalytics.logMessage(
        sessionId,
        'user',
        'voice',
        'When is the next game?',
        2000,
        'positive',
        'faq'
      );

      // Log AI response
      await chatAnalytics.logMessage(
        sessionId,
        'ai',
        'text',
        'Your next game is this Saturday at 2:00 PM! 🏈',
        1500,
        'positive',
        'faq'
      );

      // End session with satisfaction rating
      await chatAnalytics.endSession(sessionId, 5);

      // Generate daily summary
      const summary = await chatAnalytics.generateDailySummary();
      expect(summary.totalSessions).toBe(1);
      expect(summary.averageResponseTime).toBe(1500);
      expect(summary.dominantSentiment).toBe('positive');
      expect(summary.averageEmojiUsage).toBeGreaterThan(0);
    });

    it('should handle notification effectiveness tracking', async () => {
      // Log notification interactions
      await chatAnalytics.logNotificationInteraction(
        'schedule_update',
        'viewed',
        'medium',
        5000
      );

      await chatAnalytics.logNotificationInteraction(
        'weather_alert',
        'acted_on',
        'high',
        2000
      );

      await chatAnalytics.logNotificationInteraction(
        'team_announcement',
        'dismissed',
        'low',
        10000
      );

      // Generate summary to check effectiveness
      const summary = await chatAnalytics.generateDailySummary();
      expect(summary.notificationEffectiveness.viewed).toBe(1);
      expect(summary.notificationEffectiveness.actedOn).toBe(1);
      expect(summary.notificationEffectiveness.dismissed).toBe(1);
    });

    it('should handle preference changes and real-time updates', async () => {
      // Mock preference change listener
      const mockOnSnapshot = onSnapshot as jest.Mock;
      mockOnSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => ({
            notificationLevel: 'priority-only',
            language: 'es',
            communicationMethod: 'voice'
          })
        });
        return () => {};
      });

      // Initialize AI Agent (should trigger preference listener)
      await aiAgent.init();

      // Verify preferences were updated
      expect(mockOnSnapshot).toHaveBeenCalled();
    });

    it('should handle DEI report generation and export', async () => {
      // Mock exception requests data
      const mockGetDocs = getDocs as jest.Mock;
      mockGetDocs.mockResolvedValue({
        docs: [
          { data: () => ({ status: 'approved', timestamp: new Date(), leagueTown: 'Test Town' }) },
          { data: () => ({ status: 'denied', timestamp: new Date(), leagueTown: 'Test Town' }) },
          { data: () => ({ status: 'pending', timestamp: new Date(), leagueTown: 'Other Town' }) }
        ]
      });

      // Generate daily DEI report
      await aiAgent.generateDailyDEIReport();

      // Verify report was generated and stored
      const mockAddDoc = addDoc as jest.Mock;
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          metrics: expect.objectContaining({
            totalRequests: 3,
            approvedRequests: 1,
            deniedRequests: 1,
            pendingRequests: 1
          })
        })
      );
    });

    it('should handle error scenarios gracefully', async () => {
      // Mock Firebase error
      const mockAddDoc = addDoc as jest.Mock;
      mockAddDoc.mockRejectedValue(new Error('Firebase connection failed'));

      // Try to submit exception request (should handle error gracefully)
      try {
        await integrityModule.submitExceptionRequest({
          userId: 'user-1',
          leagueId: 'league-1',
          reason: 'Test exception',
          urgency: 'low'
        });
      } catch (error) {
        expect(error.message).toBe('Firebase connection failed');
      }

      // Try to generate recommendation (should return fallback)
      const recommendation = await coachAssistant.generateRecommendations({
        userId: 'user-1',
        childId: 'child-1',
        originalLeagueId: 'league-1',
        rejectionReason: 'Test rejection',
        rejectionType: 'other'
      });

      expect(recommendation.type).toBe('training_program');
      expect(recommendation.message).toContain('personalized assistance');
    });
  });

  describe('UI Component Integration', () => {
    it('should render ParentChatInterface with avatar support', () => {
      const { getByText, getByTestId } = render(
        <ParentChatInterface
          userId="user-1"
          agentId="ai-agent-1"
          onClose={() => {}}
          avatarType="lottie"
          voiceEnabled={true}
        />
      );

      expect(getByText('Town Rec AI Assistant')).toBeTruthy();
      expect(getByTestId('avatar-toggle')).toBeTruthy();
      expect(getByTestId('voice-button')).toBeTruthy();
    });

    it('should render ParentPreferencesPanel with all options', () => {
      const { getByText, getByTestId } = render(
        <ParentPreferencesPanel
          userId="user-1"
          onClose={() => {}}
          onPreferencesChange={() => {}}
        />
      );

      expect(getByText('AI Assistant Preferences')).toBeTruthy();
      expect(getByText('Notifications')).toBeTruthy();
      expect(getByText('Language & Timezone')).toBeTruthy();
      expect(getByText('Communication Method')).toBeTruthy();
      expect(getByText('Avatar Settings')).toBeTruthy();
      expect(getByText('Privacy & Data')).toBeTruthy();
    });

    it('should handle preference changes and save to Firestore', async () => {
      const mockUpdateDoc = updateDoc as jest.Mock;
      mockUpdateDoc.mockResolvedValue(undefined);

      const { getByText, getByTestId } = render(
        <ParentPreferencesPanel
          userId="user-1"
          onClose={() => {}}
          onPreferencesChange={() => {}}
        />
      );

      // Change notification level
      fireEvent.press(getByTestId('notification-priority-only'));

      // Save preferences
      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            notificationLevel: 'priority-only'
          })
        );
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent users efficiently', async () => {
      const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      const promises = users.map(async (userId) => {
        const agent = new TownRecAIAgent(userId);
        await agent.init();
        return agent.onChat('Hello');
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      expect(results.every(result => typeof result === 'string')).toBe(true);
    });

    it('should handle large numbers of exception requests', async () => {
      const mockAddDoc = addDoc as jest.Mock;
      mockAddDoc.mockResolvedValue({ id: 'exception-1' });

      const requests = Array.from({ length: 100 }, (_, i) => ({
        userId: `user-${i}`,
        leagueId: 'league-1',
        reason: `Test exception ${i}`,
        urgency: 'low' as const
      }));

      const promises = requests.map(request => 
        integrityModule.submitExceptionRequest(request)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(100);
      expect(mockAddDoc).toHaveBeenCalledTimes(100);
    });

    it('should generate analytics summaries efficiently', async () => {
      const mockGetDocs = getDocs as jest.Mock;
      mockGetDocs.mockResolvedValue({
        docs: Array.from({ length: 1000 }, (_, i) => ({
          data: () => ({
            status: i % 3 === 0 ? 'approved' : i % 3 === 1 ? 'denied' : 'pending',
            timestamp: new Date(),
            leagueTown: `Town ${i % 10}`
          })
        }))
      });

      const startTime = Date.now();
      await aiAgent.generateDailyDEIReport();
      const endTime = Date.now();

      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
}); 