// Mock for firebase/app
export const initializeApp = jest.fn(() => ({
  name: 'test-app',
  options: {},
}));

export const getApp = jest.fn(() => ({
  name: 'test-app',
  options: {},
}));

export const getApps = jest.fn(() => []);

export const deleteApp = jest.fn();

export default {
  initializeApp,
  getApp,
  getApps,
  deleteApp,
};