// Mock for test utilities
export const clearFirestoreData = jest.fn().mockResolvedValue(undefined);
export const clearAuthData = jest.fn().mockResolvedValue(undefined);
export const clearDatabaseData = jest.fn().mockResolvedValue(undefined);

export default {
  clearFirestoreData,
  clearAuthData,
  clearDatabaseData
};
