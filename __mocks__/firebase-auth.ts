// Mock for firebase/auth
export const getAuth = jest.fn(() => ({
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}));

export const signInWithEmailAndPassword = jest.fn();
export const signOut = jest.fn();
export const createUserWithEmailAndPassword = jest.fn();
export const onAuthStateChanged = jest.fn();

export default {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
};