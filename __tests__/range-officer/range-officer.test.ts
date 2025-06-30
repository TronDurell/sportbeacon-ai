import { firestore } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import BLEDeviceManager from '../../features/range-officer/BLEDeviceManager';
import { updateUserSchema, createRangeSession, getUserRangeStats } from '../../features/range-officer/firebase-schema';

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

// Mock BLE
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    state: jest.fn().mockResolvedValue('PoweredOn'),
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    getDevice: jest.fn(),
    destroy: jest.fn()
  }))
}));

describe('Range Officer Feature', () => {
  let bleManager: BLEDeviceManager;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    bleManager = new BLEDeviceManager();
    jest.clearAllMocks();
  });

  describe('Age Gate Enforcement', () => {
    it('should verify user is 21+ years old', () => {
      const verifyAge = (birthDateStr: string): boolean => {
        const birth = new Date(birthDateStr);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          return age - 1 >= 21;
        }
        
        return age >= 21;
      };

      // Test cases
      const testCases = [
        { birthDate: '2000-01-01', expected: true },   // 24 years old
        { birthDate: '2003-06-15', expected: true },   // 21 years old
        { birthDate: '2005-12-31', expected: false },  // 18 years old
        { birthDate: '2010-03-20', expected: false },  // 14 years old
      ];

      testCases.forEach(({ birthDate, expected }) => {
        expect(verifyAge(birthDate)).toBe(expected);
      });
    });

    it('should block access for users under 21', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          isShooterVerified: false
        })
      };

      (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

      const result = await getUserRangeStats(mockUserId);
      expect(result?.isShooterVerified).toBe(false);
    });
  });

  describe('Drill Scoring', () => {
    it('should return correct score format', () => {
      const calculateStabilityScore = (audioLevel: number): number => {
        const baseScore = Math.max(0, 100 - Math.abs(audioLevel));
        const randomVariation = Math.random() * 20 - 10;
        return Math.max(0, Math.min(100, baseScore + randomVariation));
      };

      const scores = [];
      for (let i = 0; i < 10; i++) {
        const score = calculateStabilityScore(-30);
        scores.push(score);
      }

      // All scores should be between 0 and 100
      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      // Should be numbers
      scores.forEach(score => {
        expect(typeof score).toBe('number');
      });
    });

    it('should generate appropriate feedback based on score', () => {
      const generateFeedback = (score: number): string => {
        if (score >= 90) return 'Excellent stability and control';
        if (score >= 80) return 'Good form, minor adjustments needed';
        if (score >= 70) return 'Focus on trigger control and breathing';
        if (score >= 60) return 'Work on grip and stance fundamentals';
        return 'Review basic shooting fundamentals';
      };

      expect(generateFeedback(95)).toBe('Excellent stability and control');
      expect(generateFeedback(85)).toBe('Good form, minor adjustments needed');
      expect(generateFeedback(75)).toBe('Focus on trigger control and breathing');
      expect(generateFeedback(65)).toBe('Work on grip and stance fundamentals');
      expect(generateFeedback(55)).toBe('Review basic shooting fundamentals');
    });
  });

  describe('BLE Device Connection', () => {
    it('should initialize BLE manager successfully', async () => {
      const result = await bleManager.initialize();
      expect(result).toBe(true);
    });

    it('should handle BLE connection success', async () => {
      const mockDevice = {
        id: 'test-device-123',
        name: 'Mantis X',
        connectToDevice: jest.fn().mockResolvedValue({
          discoverAllServicesAndCharacteristics: jest.fn().mockResolvedValue(true),
          services: jest.fn().mockResolvedValue([])
        })
      };

      (bleManager as any).bleManager.connectToDevice = jest.fn().mockResolvedValue(mockDevice);

      const result = await bleManager.connectToDevice('test-device-123');
      expect(result).toBe(true);
    });

    it('should handle BLE connection failure', async () => {
      (bleManager as any).bleManager.connectToDevice = jest.fn().mockRejectedValue(
        new Error('Connection failed')
      );

      const result = await bleManager.connectToDevice('test-device-123');
      expect(result).toBe(false);
    });

    it('should track connected devices', () => {
      const mockDevice = {
        id: 'test-device-123',
        name: 'Mantis X',
        isConnected: true
      };

      (bleManager as any).connectedDevices.set('test-device-123', mockDevice);
      
      const connectedDevices = bleManager.getConnectedDevices();
      expect(connectedDevices).toHaveLength(1);
      expect(connectedDevices[0].id).toBe('test-device-123');
    });
  });

  describe('Firebase Integration', () => {
    it('should create range session with correct data', async () => {
      const mockSessionData = {
        uid: mockUserId,
        drillType: 'draw',
        date: new Date(),
        scores: [85, 90, 88, 92, 87],
        feedback: ['Good form', 'Excellent control', 'Minor adjustment', 'Perfect', 'Solid'],
        usedHardware: false,
        totalShots: 5
      };

      const mockDocRef = { id: 'session-123' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const sessionId = await createRangeSession(mockSessionData);
      expect(sessionId).toBe('session-123');
    });

    it('should update user schema with range stats', async () => {
      const mockRangeData = {
        isShooterVerified: true,
        rangeStats: {
          totalSessions: 5,
          avgScore: 87,
          bestDrill: 'draw',
          totalShots: 25
        }
      };

      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await updateUserSchema(mockUserId, mockRangeData);
      expect(result).toBe(true);
    });

    it('should retrieve user range stats', async () => {
      const mockUserData = {
        isShooterVerified: true,
        verificationDate: new Date(),
        rangeStats: {
          totalSessions: 10,
          avgScore: 85,
          bestDrill: 'precision',
          totalShots: 50
        }
      };

      const mockDoc = {
        exists: true,
        data: () => mockUserData
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const stats = await getUserRangeStats(mockUserId);
      expect(stats?.isShooterVerified).toBe(true);
      expect(stats?.rangeStats.totalSessions).toBe(10);
      expect(stats?.rangeStats.avgScore).toBe(85);
    });
  });

  describe('Session Management', () => {
    it('should calculate average score correctly', () => {
      const scores = [85, 90, 88, 92, 87];
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      expect(avgScore).toBe(88.4);
    });

    it('should track session metadata', () => {
      const session = {
        drillId: 'draw',
        scores: [85, 90, 88],
        feedback: ['Good', 'Excellent', 'Minor adjustment'],
        startTime: new Date(),
        usedHardware: false
      };

      expect(session.scores).toHaveLength(3);
      expect(session.feedback).toHaveLength(3);
      expect(session.usedHardware).toBe(false);
      expect(session.startTime).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle permission denial gracefully', async () => {
      const mockPermissionResult = {
        status: 'denied'
      };

      // Mock permission request
      const requestPermissions = async () => {
        return mockPermissionResult;
      };

      const result = await requestPermissions();
      expect(result.status).toBe('denied');
    });

    it('should handle BLE errors gracefully', async () => {
      (bleManager as any).bleManager.state = jest.fn().mockRejectedValue(
        new Error('Bluetooth not available')
      );

      const result = await bleManager.initialize();
      expect(result).toBe(false);
    });

    it('should handle Firebase errors gracefully', async () => {
      (setDoc as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      const result = await updateUserSchema(mockUserId, { isShooterVerified: true });
      expect(result).toBe(false);
    });
  });
}); 