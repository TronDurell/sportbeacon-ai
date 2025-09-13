import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyStat } from '../../tools/verifyStat';
import { admin } from 'firebase-admin';

// Mock Firebase Admin
vi.mock('firebase-admin', () => ({
  admin: {
    firestore: vi.fn(),
  },
}));

describe('verifyStat Tool', () => {
  let mockFirestore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore = {
      collection: vi.fn(),
    };
    vi.mocked(admin.firestore).mockReturnValue(mockFirestore);
  });

  it('should verify stat and update submission status', async () => {
    const mockSubmissionId = 'submission-123';
    const mockSubmission = {
      id: mockSubmissionId,
      playerId: 'player-123',
      teamId: 'team-456',
      stat: { points: 15, rebounds: 8 },
      status: 'pending',
    };

    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => mockSubmission,
        }),
        update: vi.fn().mockResolvedValue({}),
      }),
    };

    mockFirestore.collection.mockReturnValue(mockCollection);

    const result = await verifyStat({
      submissionId: mockSubmissionId,
      verified: true,
      notes: 'Stat verified successfully',
    });

    expect(result.success).toBe(true);
    expect(mockCollection.doc().update).toHaveBeenCalledWith({
      status: 'verified',
      verifiedAt: expect.any(Date),
      verifiedBy: 'agent-service',
      notes: 'Stat verified successfully',
    });
  });

  it('should reject stat and update submission status', async () => {
    const mockSubmissionId = 'submission-123';
    const mockSubmission = {
      id: mockSubmissionId,
      playerId: 'player-123',
      teamId: 'team-456',
      stat: { points: 15, rebounds: 8 },
      status: 'pending',
    };

    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => mockSubmission,
        }),
        update: vi.fn().mockResolvedValue({}),
      }),
    };

    mockFirestore.collection.mockReturnValue(mockCollection);

    const result = await verifyStat({
      submissionId: mockSubmissionId,
      verified: false,
      notes: 'Stat appears to be inflated',
    });

    expect(result.success).toBe(true);
    expect(mockCollection.doc().update).toHaveBeenCalledWith({
      status: 'rejected',
      verifiedAt: expect.any(Date),
      verifiedBy: 'agent-service',
      notes: 'Stat appears to be inflated',
    });
  });

  it('should handle non-existent submission', async () => {
    const mockSubmissionId = 'non-existent-123';

    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: false,
        }),
      }),
    };

    mockFirestore.collection.mockReturnValue(mockCollection);

    const result = await verifyStat({
      submissionId: mockSubmissionId,
      verified: true,
      notes: 'Stat verified',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Submission not found');
  });

  it('should handle Firestore errors', async () => {
    const mockSubmissionId = 'submission-123';

    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error('Firestore error')),
      }),
    };

    mockFirestore.collection.mockReturnValue(mockCollection);

    const result = await verifyStat({
      submissionId: mockSubmissionId,
      verified: true,
      notes: 'Stat verified',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Firestore error');
  });
});
