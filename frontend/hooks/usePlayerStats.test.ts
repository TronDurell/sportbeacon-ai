import { renderHook } from '@testing-library/react-hooks';
import { usePlayerStats } from './usePlayerStats';
import { getDoc, doc } from 'firebase/firestore';

jest.mock('firebase/firestore');

const mockVenueId = 'testVenueId';

const mockData = {
  name: 'Player One',
  winRate: 75,
  trend: 'upward',
};

describe('usePlayerStats', () => {
  it('should return loading state initially', () => {
    const { result } = renderHook(() => usePlayerStats(mockVenueId));
    expect(result.current.loading).toBe(true);
  });

  it('should return player stats on success', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => mockData });
    const { result, waitForNextUpdate } = renderHook(() => usePlayerStats(mockVenueId));
    await waitForNextUpdate();
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return error state if fetching fails', async () => {
    (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore error'));
    const { result, waitForNextUpdate } = renderHook(() => usePlayerStats(mockVenueId));
    await waitForNextUpdate();
    expect(result.current.error).toBe('Firestore error');
    expect(result.current.loading).toBe(false);
  });
}); 