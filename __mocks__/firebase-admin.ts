// Mock for firebase-admin
export const initializeApp = jest.fn();
export const getApps = jest.fn(() => []);
export const getApp = jest.fn();
export const deleteApp = jest.fn();

export const getFirestore = jest.fn(() => ({
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    add: jest.fn(),
    where: jest.fn(() => ({
      get: jest.fn(),
    })),
  })),
}));

export const getAuth = jest.fn(() => ({
  verifyIdToken: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

export const credential = {
  applicationDefault: jest.fn(),
  cert: jest.fn(),
};

export default {
  initializeApp,
  getApps,
  getApp,
  deleteApp,
  getFirestore,
  getAuth,
  credential,
};
