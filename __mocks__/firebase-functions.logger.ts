// Mock for firebase-functions/logger
export const info = jest.fn();
export const warn = jest.fn();
export const error = jest.fn();
export const debug = jest.fn();

export default {
  info,
  warn,
  error,
  debug,
};