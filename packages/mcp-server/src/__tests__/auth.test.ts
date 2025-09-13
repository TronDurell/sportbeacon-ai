import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateFirebaseIdToken, validateServiceKey } from '../auth';
import { admin } from 'firebase-admin';

// Mock Firebase Admin
vi.mock('firebase-admin', () => ({
  admin: {
    auth: vi.fn(),
  },
}));

describe('MCP Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateFirebaseIdToken', () => {
    it('should validate coach token and return correct role', async () => {
      const mockToken = 'valid-coach-token';
      const mockDecodedToken = {
        uid: 'coach-123',
        role: 'coach',
        teamId: 'team-456',
      };

      vi.mocked(admin.auth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue(mockDecodedToken),
      } as any);

      const result = await validateFirebaseIdToken(mockToken);

      expect(result).toEqual({
        uid: 'coach-123',
        role: 'coach',
        teamId: 'team-456',
      });
    });

    it('should validate admin token and return correct role', async () => {
      const mockToken = 'valid-admin-token';
      const mockDecodedToken = {
        uid: 'admin-123',
        role: 'admin',
      };

      vi.mocked(admin.auth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue(mockDecodedToken),
      } as any);

      const result = await validateFirebaseIdToken(mockToken);

      expect(result).toEqual({
        uid: 'admin-123',
        role: 'admin',
      });
    });

    it('should throw error for invalid token', async () => {
      vi.mocked(admin.auth).mockReturnValue({
        verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token')),
      } as any);

      await expect(validateFirebaseIdToken('invalid-token')).rejects.toThrow('Invalid token');
    });
  });

  describe('validateServiceKey', () => {
    it('should validate service key and return agent-service role', async () => {
      const mockServiceKey = 'valid-service-key';
      const mockDecodedToken = {
        uid: 'agent-service-123',
        role: 'agent-service',
      };

      vi.mocked(admin.auth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue(mockDecodedToken),
      } as any);

      const result = await validateServiceKey(mockServiceKey);

      expect(result).toEqual({
        uid: 'agent-service-123',
        role: 'agent-service',
      });
    });

    it('should throw error for invalid service key', async () => {
      vi.mocked(admin.auth).mockReturnValue({
        verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid service key')),
      } as any);

      await expect(validateServiceKey('invalid-service-key')).rejects.toThrow('Invalid service key');
    });
  });
});
