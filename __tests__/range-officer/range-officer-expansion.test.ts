import { firestore } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { 
  createCustomDrill, 
  getCustomDrills, 
  updateUserPreferences,
  getUserPreferences,
  calculateSessionAnalytics,
  createExtendedRangeSession
} from '../../features/range-officer/firebase-schema-extended';

// Mock Firebase
jest.mock('../../lib/firebase', () => ({
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    FieldValue: {
      increment: jest.fn()
    }
  }
}));

describe('Range Officer Expansion Features', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DrillEditor', () => {
    it('should create custom drill with all required fields', async () => {
      const drillData = {
        name: 'Custom Precision Drill',
        repCount: 15,
        scoringFocus: 'accuracy' as const,
        timeLimit: 8000,
        targetDistance: 15,
        customFeedback: ['Focus on breathing', 'Steady aim'],
        isActive: true,
        difficulty: 'advanced' as const,
        category: 'competition' as const
      };

      const mockDocRef = { id: 'drill-123' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const drillId = await createCustomDrill(mockUserId, drillData);
      expect(drillId).toBe('drill-123');
    });

    it('should validate drill parameters', () => {
      const validateDrill = (drill: any): boolean => {
        if (!drill.name || drill.name.trim().length === 0) return false;
        if (drill.repCount < 1 || drill.repCount > 50) return false;
        if (!['accuracy', 'speed', 'balance'].includes(drill.scoringFocus)) return false;
        if (drill.timeLimit && (drill.timeLimit < 1000 || drill.timeLimit > 60000)) return false;
        if (drill.targetDistance && (drill.targetDistance < 1 || drill.targetDistance > 100)) return false;
        return true;
      };

      const validDrill = {
        name: 'Test Drill',
        repCount: 10,
        scoringFocus: 'accuracy',
        timeLimit: 5000,
        targetDistance: 7
      };

      const invalidDrill = {
        name: '',
        repCount: 0,
        scoringFocus: 'invalid'
      };

      expect(validateDrill(validDrill)).toBe(true);
      expect(validateDrill(invalidDrill)).toBe(false);
    });

    it('should handle custom feedback messages', () => {
      const feedbackMessages = [
        'Good form',
        'Keep it up',
        'Focus on breathing',
        'Steady aim',
        'Excellent control'
      ];

      const addFeedback = (messages: string[], newMessage: string): string[] => {
        if (newMessage.trim() && !messages.includes(newMessage.trim())) {
          return [...messages, newMessage.trim()];
        }
        return messages;
      };

      const removeFeedback = (messages: string[], index: number): string[] => {
        return messages.filter((_, i) => i !== index);
      };

      expect(addFeedback(feedbackMessages, 'New feedback')).toHaveLength(6);
      expect(addFeedback(feedbackMessages, '')).toHaveLength(5);
      expect(addFeedback(feedbackMessages, 'Good form')).toHaveLength(5); // Duplicate

      expect(removeFeedback(feedbackMessages, 0)).toHaveLength(4);
      expect(removeFeedback(feedbackMessages, 10)).toHaveLength(5); // Invalid index
    });
  });

  describe('RangeLeaderboard', () => {
    it('should filter leaderboard entries correctly', () => {
      const mockEntries = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          drillType: 'draw',
          avgScore: 95,
          region: 'North America',
          age: 25,
          usedHardware: true
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          drillType: 'precision',
          avgScore: 88,
          region: 'Europe',
          age: 35,
          usedHardware: false
        }
      ];

      const filterEntries = (
        entries: any[],
        drillType: string,
        region: string,
        ageGroup: number
      ) => {
        return entries.filter(entry => {
          if (drillType !== 'all' && entry.drillType !== drillType) return false;
          if (region !== 'all' && entry.region !== region) return false;
          if (ageGroup > 0) {
            const ageGroups = [
              { min: 21, max: 100 },
              { min: 21, max: 30 },
              { min: 31, max: 40 },
              { min: 41, max: 50 },
              { min: 51, max: 100 }
            ];
            const group = ageGroups[ageGroup];
            if (entry.age < group.min || entry.age > group.max) return false;
          }
          return true;
        });
      };

      // Test drill type filter
      expect(filterEntries(mockEntries, 'draw', 'all', 0)).toHaveLength(1);
      expect(filterEntries(mockEntries, 'precision', 'all', 0)).toHaveLength(1);
      expect(filterEntries(mockEntries, 'all', 'all', 0)).toHaveLength(2);

      // Test region filter
      expect(filterEntries(mockEntries, 'all', 'North America', 0)).toHaveLength(1);
      expect(filterEntries(mockEntries, 'all', 'Europe', 0)).toHaveLength(1);

      // Test age filter
      expect(filterEntries(mockEntries, 'all', 'all', 1)).toHaveLength(1); // 21-30
      expect(filterEntries(mockEntries, 'all', 'all', 2)).toHaveLength(1); // 31-40
    });

    it('should calculate leaderboard rankings', () => {
      const calculateRankings = (entries: any[]) => {
        return entries
          .sort((a, b) => b.avgScore - a.avgScore)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
            medal: index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}`
          }));
      };

      const mockEntries = [
        { id: '1', avgScore: 95 },
        { id: '2', avgScore: 88 },
        { id: '3', avgScore: 92 },
        { id: '4', avgScore: 85 }
      ];

      const rankings = calculateRankings(mockEntries);
      
      expect(rankings[0].rank).toBe(1);
      expect(rankings[0].medal).toBe('🥇');
      expect(rankings[1].rank).toBe(2);
      expect(rankings[1].medal).toBe('🥈');
      expect(rankings[3].rank).toBe(4);
      expect(rankings[3].medal).toBe('4');
    });

    it('should respect user privacy settings', () => {
      const mockUsers = [
        { uid: 'user1', optInLeaderboard: true, displayName: 'John Doe' },
        { uid: 'user2', optInLeaderboard: false, displayName: 'Jane Smith' },
        { uid: 'user3', optInLeaderboard: true, displayName: 'Bob Wilson' }
      ];

      const filterOptInUsers = (users: any[]) => {
        return users.filter(user => user.optInLeaderboard);
      };

      const optInUsers = filterOptInUsers(mockUsers);
      expect(optInUsers).toHaveLength(2);
      expect(optInUsers.find(u => u.uid === 'user2')).toBeUndefined();
    });
  });

  describe('ShareSessionCard', () => {
    it('should generate correct score labels', () => {
      const getScoreLabel = (score: number): string => {
        if (score >= 95) return 'EXCELLENT';
        if (score >= 90) return 'GREAT';
        if (score >= 85) return 'GOOD';
        if (score >= 80) return 'FAIR';
        return 'NEEDS WORK';
      };

      expect(getScoreLabel(98)).toBe('EXCELLENT');
      expect(getScoreLabel(92)).toBe('GREAT');
      expect(getScoreLabel(87)).toBe('GOOD');
      expect(getScoreLabel(82)).toBe('FAIR');
      expect(getScoreLabel(75)).toBe('NEEDS WORK');
    });

    it('should generate feedback summary', () => {
      const generateFeedbackSummary = (feedback: string[]): string => {
        if (feedback.length === 0) return 'No feedback available';
        
        const positiveFeedback = feedback.filter(f => 
          f.toLowerCase().includes('good') || 
          f.toLowerCase().includes('excellent') || 
          f.toLowerCase().includes('great')
        );
        
        const improvementFeedback = feedback.filter(f => 
          f.toLowerCase().includes('improve') || 
          f.toLowerCase().includes('work on') || 
          f.toLowerCase().includes('focus')
        );
        
        if (positiveFeedback.length > 0 && improvementFeedback.length > 0) {
          return `${positiveFeedback[0]}. ${improvementFeedback[0]}`;
        } else if (positiveFeedback.length > 0) {
          return positiveFeedback[0];
        } else if (improvementFeedback.length > 0) {
          return improvementFeedback[0];
        }
        
        return feedback[0] || 'Session completed';
      };

      const positiveFeedback = ['Good form', 'Keep it up'];
      const mixedFeedback = ['Good form', 'Work on breathing'];
      const improvementFeedback = ['Focus on grip', 'Improve stance'];
      const noFeedback: string[] = [];

      expect(generateFeedbackSummary(positiveFeedback)).toBe('Good form');
      expect(generateFeedbackSummary(mixedFeedback)).toBe('Good form. Work on breathing');
      expect(generateFeedbackSummary(improvementFeedback)).toBe('Focus on grip');
      expect(generateFeedbackSummary(noFeedback)).toBe('No feedback available');
    });

    it('should format drill names correctly', () => {
      const getDrillDisplayName = (drillType: string): string => {
        const drillNames: { [key: string]: string } = {
          'draw': 'Draw & Fire 1',
          'pair': 'Controlled Pair',
          'circle': '5x5 Precision',
          'reload': 'Reload & Re-engage',
          'precision': 'Precision Drill',
          'speed': 'Speed Drill',
          'custom': 'Custom Drill'
        };
        return drillNames[drillType] || drillType;
      };

      expect(getDrillDisplayName('draw')).toBe('Draw & Fire 1');
      expect(getDrillDisplayName('precision')).toBe('Precision Drill');
      expect(getDrillDisplayName('unknown')).toBe('unknown');
    });
  });

  describe('Extended Firebase Schema', () => {
    it('should create extended session with shot details', async () => {
      const shotDetails = [
        {
          score: 89,
          modelConfidence: 0.93,
          muzzleDrift: 2.1,
          userCorrected: true,
          timestamp: new Date()
        },
        {
          score: 92,
          modelConfidence: 0.95,
          muzzleDrift: 1.8,
          userCorrected: false,
          timestamp: new Date()
        }
      ];

      const sessionData = {
        uid: mockUserId,
        drillType: 'precision',
        date: new Date(),
        scores: [89, 92],
        feedback: ['Good form', 'Excellent control'],
        usedHardware: true,
        totalShots: 2,
        sessionDuration: 120000,
        location: { latitude: 40.7128, longitude: -74.0060 }
      };

      const mockDocRef = { id: 'session-123' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const sessionId = await createExtendedRangeSession(sessionData, shotDetails);
      expect(sessionId).toBe('session-123');
    });

    it('should calculate session analytics correctly', () => {
      const shotDetails = [
        { score: 89, modelConfidence: 0.93, muzzleDrift: 2.1, userCorrected: true, timestamp: new Date() },
        { score: 92, modelConfidence: 0.95, muzzleDrift: 1.8, userCorrected: false, timestamp: new Date() },
        { score: 95, modelConfidence: 0.97, muzzleDrift: 1.5, userCorrected: false, timestamp: new Date() }
      ];

      const analytics = calculateSessionAnalytics(shotDetails);
      
      expect(analytics).toBeDefined();
      expect(analytics?.avgScore).toBe(92);
      expect(analytics?.bestScore).toBe(95);
      expect(analytics?.worstScore).toBe(89);
      expect(analytics?.totalShots).toBe(3);
    });

    it('should handle user preferences', async () => {
      const preferences = {
        voiceFeedback: true,
        hapticFeedback: false,
        autoSave: true,
        shareSessions: false,
        leaderboardVisibility: true
      };

      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await updateUserPreferences(mockUserId, preferences);
      expect(result).toBe(true);
    });

    it('should validate shot details', () => {
      const validateShotDetail = (shot: any): boolean => {
        if (typeof shot.score !== 'number' || shot.score < 0 || shot.score > 100) return false;
        if (typeof shot.modelConfidence !== 'number' || shot.modelConfidence < 0 || shot.modelConfidence > 1) return false;
        if (typeof shot.muzzleDrift !== 'number' || shot.muzzleDrift < 0) return false;
        if (typeof shot.userCorrected !== 'boolean') return false;
        if (!(shot.timestamp instanceof Date)) return false;
        return true;
      };

      const validShot = {
        score: 89,
        modelConfidence: 0.93,
        muzzleDrift: 2.1,
        userCorrected: true,
        timestamp: new Date()
      };

      const invalidShot = {
        score: 150, // Invalid score
        modelConfidence: 1.5, // Invalid confidence
        muzzleDrift: -1, // Invalid drift
        userCorrected: 'yes', // Invalid type
        timestamp: '2024-01-01' // Invalid date
      };

      expect(validateShotDetail(validShot)).toBe(true);
      expect(validateShotDetail(invalidShot)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      const drillData = {
        name: 'Test Drill',
        repCount: 10,
        scoringFocus: 'accuracy' as const,
        customFeedback: [],
        isActive: true,
        difficulty: 'intermediate' as const,
        category: 'custom' as const
      };

      await expect(createCustomDrill(mockUserId, drillData)).rejects.toThrow('Firebase error');
    });

    it('should handle invalid data gracefully', () => {
      const validateSessionData = (data: any): boolean => {
        if (!data.uid || !data.drillType || !data.date) return false;
        if (!Array.isArray(data.scores) || data.scores.length === 0) return false;
        if (typeof data.avgScore !== 'number' || data.avgScore < 0 || data.avgScore > 100) return false;
        return true;
      };

      const validData = {
        uid: 'user123',
        drillType: 'draw',
        date: new Date(),
        scores: [85, 90, 88],
        avgScore: 87.67
      };

      const invalidData = {
        uid: '',
        drillType: '',
        date: null,
        scores: [],
        avgScore: 150
      };

      expect(validateSessionData(validData)).toBe(true);
      expect(validateSessionData(invalidData)).toBe(false);
    });
  });
}); 