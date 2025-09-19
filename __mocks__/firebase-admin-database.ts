// Mock for firebase-admin/database
export const getDatabase = jest.fn(() => ({
  ref: jest.fn(() => ({
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ val: () => null, exists: () => false }),
    update: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    push: jest.fn().mockResolvedValue({ key: 'mock-key' }),
    child: jest.fn().mockReturnThis(),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn().mockResolvedValue({ val: () => null, exists: () => false })
  })),
  goOffline: jest.fn(),
  goOnline: jest.fn()
}));

export default {
  getDatabase
};
