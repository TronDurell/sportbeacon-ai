import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPlayerStats } from '../../tools/getPlayerStats';
import { admin } from 'firebase-admin';

// Mock Firebase Admin
vi.mock('firebase-admin', () => ({
  admin: {
    firestore: vi.fn(),
  },
}));

describe('getPlayerStats Tool', () => {
  let mockFirestore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore = {
      collection: vi.fn(),
    };
    vi.mocked(admin.firestore).mockReturnValue(mockFirestore);
  });

  it('should return player stats for valid player ID', async () => {
    const mockPlayerId = 'player-123';
    const mockStats = [
      { id: 'stat-1', gameDate: '2025-01-01', points: 15, rebounds: 8 },
      { id: 'stat-2', gameDate: '2025-01-02', points: 22, rebounds: 12 },
    ];

    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({
                docs: mockStats.map(stat => ({
                  id: stat.id,
                  data: () => stat,
                })),
              }),
            }),
          }),
        }),
      }),
    };

    mockFirestore.collection.mockReturnValue(mockCollection);

    const result = await getPlayerStats({
      playerId: mockPlayerId,
      limit: 10,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockStats);
  });

  it('should handle empty stats result', async () => {
    const mockPlayerId = 'player-123';

    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({
                docs: [],
              }),
            }),
          }),
        }),
      }),
    };

    mockFirestore.collection.mockReturnValue(mockCollection);

    const result = await getPlayerStats({
      playerId: mockPlayerId,
      limit: 10,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle Firestore errors', async () => {
    const mockPlayerId = 'player-123';

    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockRejectedValue(new Error('Firestore error')),
            }),
          }),
        }),
      }),
    };

    mockFirestore.collection.mockReturnValue(mockCollection);

    const result = await getPlayerStats({
      playerId: mockPlayerId,
      limit: 10,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Firestore error');
  });
});
