import "@testing-library/jest-dom";
import "whatwg-fetch";

// TextEncoder/Decoder (JSDOM <-> Node shims)
import { TextEncoder, TextDecoder } from "node:util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;

// Minimal Firebase admin/client mocks (adjust if you already have fuller mocks)
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({ app: true })),
  getApps: jest.fn(() => []),
}));
jest.mock("firebase/auth", () => ({ getAuth: jest.fn(() => ({ currentUser: null })) }));
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

// If tests import AdminAuthProvider from app code:
// jest.mock("path/to/AdminAuthProvider", () => ({
//   AdminAuthProvider: ({ children }: any) => children ?? null,
// }));
