import { renderHook, act } from '@testing-library/react-hooks';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useGameInsights } from './useGameInsights';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

describe('useGameInsights', () => {
  const playerId = 'test-player-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set loading to true when fetching begins', async () => {
    (getDocs as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { result, waitForNextUpdate } = renderHook(() => useGameInsights(playerId));
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
  });

  it('should populate insights and set loading to false on successful fetch', async () => {
    const mockInsights = [{ id: '1', playerId: 'test-player-id' }];
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: mockInsights.map(doc => ({ id: doc.id, data: () => doc })) });
    const { result, waitForNextUpdate } = renderHook(() => useGameInsights(playerId));
    await waitForNextUpdate();
    expect(result.current.insights).toEqual(mockInsights);
    expect(result.current.loading).toBe(false);
  });

  it('should set error and loading to false on fetch failure', async () => {
    const errorMessage = 'Failed to fetch';
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    const { result, waitForNextUpdate } = renderHook(() => useGameInsights(playerId));
    await waitForNextUpdate();
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.loading).toBe(false);
  });

  it('should update state when playerId changes', async () => {
    const { result, rerender, waitForNextUpdate } = renderHook(({ id }) => useGameInsights(id), {
      initialProps: { id: playerId },
    });
    await waitForNextUpdate();
    const newPlayerId = 'new-test-player-id';
    rerender({ id: newPlayerId });
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.insights).toEqual([]);
  });
}); 