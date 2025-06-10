import { renderHook, waitFor } from '@testing-library/react';
import { useDrillSuggestions, DrillSuggestion } from './useDrillSuggestions';
import { collection, query, where, getDocs } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  db: {},
}));

describe('useDrillSuggestions', () => {
  it('returns drill suggestions from Firestore', async () => {
    const mockDocs = [
      { id: '1', data: () => ({ name: 'A', description: 'a', difficulty: 1, duration: 10 }) },
      { id: '2', data: () => ({ name: 'B', description: 'b', difficulty: 2, duration: 20 }) },
    ];
    (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs });

    const { result } = renderHook(() => useDrillSuggestions('p1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const expected: DrillSuggestion[] = [
      { id: '1', name: 'A', description: 'a', difficulty: 1, duration: 10 },
      { id: '2', name: 'B', description: 'b', difficulty: 2, duration: 20 },
    ];

    expect(result.current.suggestions).toEqual(expected);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
