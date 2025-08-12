import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SiblingPairingQueue } from '../../lib/townRec/SiblingPairingQueue';
import { apiService } from '../../frontend/src/services/api';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

// Mock API service
jest.mock('../../frontend/src/services/api', () => ({
  apiService: {
    submitSiblingPairingRequest: jest.fn(),
    getWaitlistStatus: jest.fn(),
  },
}));

describe('Town Rec Sibling Pairing', () => {
  let siblingPairingQueue: SiblingPairingQueue;
  const mockParentId = 'parent-123';
  const mockSiblingIds = ['sibling-1', 'sibling-2'];
  const mockLeagueId = 'league-456';

  beforeEach(() => {
    siblingPairingQueue = new SiblingPairingQueue();
    jest.clearAllMocks();
  });

  afterEach(() => {
    siblingPairingQueue.cleanup();
  });

  describe('SiblingPairingQueue', () => {
    it('should initialize with empty queue', () => {
      expect(siblingPairingQueue.getQueueLength()).toBe(0);
      expect(siblingPairingQueue.getPendingRequests()).toEqual([]);
    });

    it('should add sibling pairing request to queue', async () => {
      const request = {
        parentId: mockParentId,
        siblingIds: mockSiblingIds,
        leagueId: mockLeagueId,
        preferences: { sameTeam: true, sameTime: true },
        createdAt: new Date(),
      };

      await siblingPairingQueue.addRequest(request);

      expect(siblingPairingQueue.getQueueLength()).toBe(1);
      expect(siblingPairingQueue.getPendingRequests()).toHaveLength(1);
      expect(siblingPairingQueue.getPendingRequests()[0]).toMatchObject({
        parentId: mockParentId,
        siblingIds: mockSiblingIds,
        leagueId: mockLeagueId,
      });
    });

    it('should validate sibling pairing request data', async () => {
      const invalidRequest = {
        parentId: '', // Invalid empty parent ID
        siblingIds: [], // Invalid empty sibling IDs
        leagueId: mockLeagueId,
        preferences: {},
        createdAt: new Date(),
      };

      await expect(siblingPairingQueue.addRequest(invalidRequest)).rejects.toThrow(
        'Invalid sibling pairing request: parentId and siblingIds are required'
      );
    });

    it('should process sibling pairing requests in order', async () => {
      const request1 = {
        parentId: 'parent-1',
        siblingIds: ['sibling-1'],
        leagueId: mockLeagueId,
        preferences: {},
        createdAt: new Date(Date.now() - 1000), // Earlier timestamp
      };

      const request2 = {
        parentId: 'parent-2',
        siblingIds: ['sibling-2'],
        leagueId: mockLeagueId,
        preferences: {},
        createdAt: new Date(), // Later timestamp
      };

      await siblingPairingQueue.addRequest(request2);
      await siblingPairingQueue.addRequest(request1);

      const pendingRequests = siblingPairingQueue.getPendingRequests();
      expect(pendingRequests[0].parentId).toBe('parent-1'); // Should be first due to earlier timestamp
      expect(pendingRequests[1].parentId).toBe('parent-2');
    });

    it('should handle duplicate sibling pairing requests', async () => {
      const request = {
        parentId: mockParentId,
        siblingIds: mockSiblingIds,
        leagueId: mockLeagueId,
        preferences: {},
        createdAt: new Date(),
      };

      await siblingPairingQueue.addRequest(request);
      await siblingPairingQueue.addRequest(request); // Duplicate request

      expect(siblingPairingQueue.getQueueLength()).toBe(1); // Should not add duplicate
    });

    it('should approve sibling pairing request', async () => {
      const request = {
        parentId: mockParentId,
        siblingIds: mockSiblingIds,
        leagueId: mockLeagueId,
        preferences: {},
        createdAt: new Date(),
      };

      await siblingPairingQueue.addRequest(request);
      const requestId = siblingPairingQueue.getPendingRequests()[0].id;

      await siblingPairingQueue.approveRequest(requestId, 'admin-123');

      expect(siblingPairingQueue.getQueueLength()).toBe(0);
      expect(siblingPairingQueue.getApprovedRequests()).toHaveLength(1);
    });

    it('should reject sibling pairing request', async () => {
      const request = {
        parentId: mockParentId,
        siblingIds: mockSiblingIds,
        leagueId: mockLeagueId,
        preferences: {},
        createdAt: new Date(),
      };

      await siblingPairingQueue.addRequest(request);
      const requestId = siblingPairingQueue.getPendingRequests()[0].id;

      await siblingPairingQueue.rejectRequest(requestId, 'admin-123', 'Insufficient space');

      expect(siblingPairingQueue.getQueueLength()).toBe(0);
      expect(siblingPairingQueue.getRejectedRequests()).toHaveLength(1);
    });

    it('should handle non-existent request approval', async () => {
      await expect(siblingPairingQueue.approveRequest('non-existent-id', 'admin-123')).rejects.toThrow(
        'Sibling pairing request not found'
      );
    });

    it('should handle non-existent request rejection', async () => {
      await expect(siblingPairingQueue.rejectRequest('non-existent-id', 'admin-123', 'Reason')).rejects.toThrow(
        'Sibling pairing request not found'
      );
    });
  });

  describe('API Integration', () => {
    it('should submit sibling pairing request via API', async () => {
      const mockApiResponse = { requestId: 'req-123', status: 'pending' };
      (apiService.submitSiblingPairingRequest as jest.Mock).mockResolvedValue(mockApiResponse);

      const requestData = {
        parentId: mockParentId,
        siblingIds: mockSiblingIds,
        leagueId: mockLeagueId,
        preferences: { sameTeam: true },
      };

      const result = await apiService.submitSiblingPairingRequest(requestData);

      expect(apiService.submitSiblingPairingRequest).toHaveBeenCalledWith(requestData);
      expect(result).toEqual(mockApiResponse);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API request failed');
      (apiService.submitSiblingPairingRequest as jest.Mock).mockRejectedValue(mockError);

      const requestData = {
        parentId: mockParentId,
        siblingIds: mockSiblingIds,
        leagueId: mockLeagueId,
        preferences: {},
      };

      await expect(apiService.submitSiblingPairingRequest(requestData)).rejects.toThrow('API request failed');
    });

    it('should validate input data before API submission', async () => {
      const invalidData = {
        parentId: '', // Invalid empty string
        siblingIds: mockSiblingIds,
        leagueId: mockLeagueId,
        preferences: {},
      };

      await expect(apiService.submitSiblingPairingRequest(invalidData)).rejects.toThrow(
        'Missing required field: parentId'
      );
    });
  });

  describe('Waitlist Integration', () => {
    it('should get waitlist status for player', async () => {
      const mockWaitlistResponse = {
        position: 5,
        estimatedWaitTime: '2-3 weeks',
        status: 'waitlisted',
      };
      (apiService.getWaitlistStatus as jest.Mock).mockResolvedValue(mockWaitlistResponse);

      const playerId = 'player-123';
      const result = await apiService.getWaitlistStatus(playerId);

      expect(apiService.getWaitlistStatus).toHaveBeenCalledWith(playerId);
      expect(result).toEqual(mockWaitlistResponse);
    });

    it('should validate player ID format for waitlist status', async () => {
      const invalidPlayerId = 'invalid-id';

      await expect(apiService.getWaitlistStatus(invalidPlayerId)).rejects.toThrow(
        'Invalid player ID format'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (apiService.submitSiblingPairingRequest as jest.Mock).mockRejectedValue(networkError);

      const requestData = {
        parentId: mockParentId,
        siblingIds: mockSiblingIds,
        leagueId: mockLeagueId,
        preferences: {},
      };

      await expect(apiService.submitSiblingPairingRequest(requestData)).rejects.toThrow('Network error');
    });

    it('should handle validation errors', async () => {
      const invalidRequest = {
        parentId: mockParentId,
        siblingIds: [], // Invalid empty array
        leagueId: mockLeagueId,
        preferences: {},
      };

      await expect(apiService.submitSiblingPairingRequest(invalidRequest)).rejects.toThrow(
        'siblingIds must be a non-empty array'
      );
    });
  });

  describe('Performance', () => {
    it('should handle large number of requests efficiently', async () => {
      const requests = Array.from({ length: 100 }, (_, i) => ({
        parentId: `parent-${i}`,
        siblingIds: [`sibling-${i}`],
        leagueId: mockLeagueId,
        preferences: {},
        createdAt: new Date(),
      }));

      const startTime = performance.now();
      
      for (const request of requests) {
        await siblingPairingQueue.addRequest(request);
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(siblingPairingQueue.getQueueLength()).toBe(100);
      expect(processingTime).toBeLessThan(1000); // Should process 100 requests in under 1 second
    });

    it('should maintain queue order under load', async () => {
      const requests = Array.from({ length: 50 }, (_, i) => ({
        parentId: `parent-${i}`,
        siblingIds: [`sibling-${i}`],
        leagueId: mockLeagueId,
        preferences: {},
        createdAt: new Date(Date.now() - i * 1000), // Decreasing timestamps
      }));

      // Add requests in reverse order
      for (let i = requests.length - 1; i >= 0; i--) {
        await siblingPairingQueue.addRequest(requests[i]);
      }

      const pendingRequests = siblingPairingQueue.getPendingRequests();
      
      // Should be ordered by creation time (earliest first)
      for (let i = 0; i < pendingRequests.length - 1; i++) {
        expect(pendingRequests[i].createdAt.getTime()).toBeLessThanOrEqual(
          pendingRequests[i + 1].createdAt.getTime()
        );
      }
    });
  });
}); 