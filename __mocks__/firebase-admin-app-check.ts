export const getAppCheck = jest.fn(() => ({
  verifyToken: jest.fn().mockResolvedValue({}),
  createToken: jest.fn().mockResolvedValue('mock-app-check-token')
}));
