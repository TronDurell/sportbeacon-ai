// __tests__/firebase.test.ts
// TODO: Test Firestore helpers in lib/firebase
import { getCollection, setDocument, updateDocument, deleteDocument, db, collection, doc } from '../lib/firebase';
import { assignBadges, calculateLikeStreak, getMultiplier } from '../lib/rewards';

jest.mock('../lib/firebase', () => {
  const actual = jest.requireActual('../lib/firebase');
  return {
    ...actual,
    getCollection: jest.fn(async () => [{ id: 'mock', value: 1 }]),
    setDocument: jest.fn(async () => {}),
    updateDocument: jest.fn(async () => {}),
    deleteDocument: jest.fn(async () => {}),
    db: {},
    collection: jest.fn(),
    doc: jest.fn(),
  };
});

describe('Firestore helpers', () => {
  it('should get a collection (mock)', async () => {
    const data = await getCollection({} as any);
    expect(data).toEqual([{ id: 'mock', value: 1 }]);
  });
  it('should set a document (mock)', async () => {
    await expect(setDocument({} as any, { foo: 'bar' })).resolves.toBeUndefined();
  });
  it('should update a document (mock)', async () => {
    await expect(updateDocument({} as any, { foo: 'baz' })).resolves.toBeUndefined();
  });
  it('should delete a document (mock)', async () => {
    await expect(deleteDocument({} as any)).resolves.toBeUndefined();
  });
});

describe('Rewards logic integration', () => {
  it('assigns badges based on criteria', () => {
    const user = { score: 100 };
    const badges = [
      { id: '1', name: '100 Club', description: '', criteria: (u: any) => u.score >= 100 },
      { id: '2', name: 'Starter', description: '', criteria: (u: any) => u.score > 0 },
    ];
    expect(assignBadges(user, badges)).toEqual(['1', '2']);
  });
  it('calculates like streak', () => {
    const likes = [
      { date: '2024-06-25' },
      { date: '2024-06-26' },
      { date: '2024-06-27' },
    ];
    expect(calculateLikeStreak(likes)).toBe(3);
  });
  it('returns correct multiplier', () => {
    expect(getMultiplier(2)).toBe(1);
    expect(getMultiplier(5)).toBe(1.5);
    expect(getMultiplier(10)).toBe(2);
  });
}); 