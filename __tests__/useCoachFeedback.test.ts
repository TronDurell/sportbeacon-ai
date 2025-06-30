import { renderHook, waitFor } from '@testing-library/react-hooks';
import { useCoachFeedback } from '../frontend/hooks/useCoachFeedback';
import { firestore } from '../lib/firebase';
import { analytics } from '../lib/ai/shared/analytics';

// Mock Firebase
jest.mock('../lib/firebase', () => ({
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(),
    setDoc: jest.fn()
  }
}));

// Mock analytics
jest.mock('../lib/ai/shared/analytics', () => ({
  analytics: {
    track: jest.fn()
  }
}));

// Mock useAuth
jest.mock('../frontend/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123' }
  })
}));

describe('useCoachFeedback', () => {
  const mockOnSnapshot = firestore.onSnapshot as jest.Mock;
  const mockSetDoc = firestore.setDoc as jest.Mock;
  const mockAnalyticsTrack = analytics.track as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation((query, onNext, onError) => {
      // Simulate successful snapshot
      onNext({
        docs: [
          {
            id: 'session-1',
            data: () => ({
              uid: 'test-user-123',
              drillType: 'precision_drill',
              avgScore: 85,
              totalShots: 25,
              scores: [80, 85, 90, 85, 85],
              date: { toDate: () => new Date() },
              sessionDuration: 900000, // 15 minutes
              feedback: ['Good form', 'Focus on breathing']
            })
          }
        ]
      });
      return () => {}; // Return unsubscribe function
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useCoachFeedback());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.sessions).toEqual([]);
    expect(result.current.feedback).toBeNull();
  });

  it('should load sessions and generate feedback', async () => {
    const { result } = renderHook(() => useCoachFeedback());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].avgScore).toBe(85);
    expect(result.current.sessions[0].drillType).toBe('precision_drill');
  });

  it('should handle errors gracefully', async () => {
    mockOnSnapshot.mockImplementation((query, onNext, onError) => {
      onError(new Error('Firebase error'));
      return () => {};
    });

    const { result } = renderHook(() => useCoachFeedback());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load session data');
  });

  it('should save next drill to Firestore', async () => {
    const { result } = renderHook(() => useCoachFeedback());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        drillId: expect.any(String),
        drillName: expect.any(String),
        reason: expect.any(String),
        difficulty: expect.any(String)
      })
    );
  });

  it('should track analytics when feedback is generated', async () => {
    const { result } = renderHook(() => useCoachFeedback());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockAnalyticsTrack).toHaveBeenCalledWith(
      'coach_feedback_generated',
      expect.objectContaining({
        userId: 'test-user-123',
        sessionCount: 1,
        avgScore: 85,
        trends: expect.any(Object),
        timestamp: expect.any(String)
      })
    );
  });

  it('should refresh feedback when requested', async () => {
    const { result } = renderHook(() => useCoachFeedback());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialFeedback = result.current.feedback;
    
    result.current.refreshFeedback();

    await waitFor(() => {
      expect(result.current.feedback).not.toBe(initialFeedback);
    });
  });

  it('should handle empty sessions gracefully', async () => {
    mockOnSnapshot.mockImplementation((query, onNext, onError) => {
      onNext({ docs: [] });
      return () => {};
    });

    const { result } = renderHook(() => useCoachFeedback());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sessions).toHaveLength(0);
    expect(result.current.feedback).toBeNull();
  });

  it('should calculate trends correctly', async () => {
    mockOnSnapshot.mockImplementation((query, onNext, onError) => {
      onNext({
        docs: [
          {
            id: 'session-1',
            data: () => ({
              uid: 'test-user-123',
              drillType: 'precision_drill',
              avgScore: 90,
              totalShots: 25,
              scores: [85, 90, 95, 90, 90],
              date: { toDate: () => new Date(Date.now() - 86400000) }, // 1 day ago
              sessionDuration: 900000,
              feedback: []
            })
          },
          {
            id: 'session-2',
            data: () => ({
              uid: 'test-user-123',
              drillType: 'precision_drill',
              avgScore: 85,
              totalShots: 25,
              scores: [80, 85, 90, 85, 85],
              date: { toDate: () => new Date(Date.now() - 172800000) }, // 2 days ago
              sessionDuration: 900000,
              feedback: []
            })
          }
        ]
      });
      return () => {};
    });

    const { result } = renderHook(() => useCoachFeedback());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.feedback).toBeTruthy();
    expect(result.current.feedback?.trends).toBeDefined();
  });
}); 