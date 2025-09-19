import "@testing-library/jest-dom";
import { vi } from "vitest";
import { mockUseAuthValue } from "./mocks/useAuth.mock";

// JSDOM shims (safe no-ops)
Object.defineProperty(global, "matchMedia", {
  value: () => ({ matches: false, addListener() {}, removeListener() {} }),
});

// Auto-mock useAuth to return a stable test user
vi.mock("../src/hooks/useAuth", () => ({
  useAuth: () => mockUseAuthValue,
}));

// Mock memory SDK
vi.mock("@sportbeacon/memory-sdk", () => ({
  createMemoryClient: () => ({ 
    writeEvent: async () => ({ ok: true }), 
    writeSnapshot: async () => ({ ok: true }), 
    calculateKPI: () => ({ name: "events.count", value: 0, unit: "count" }) 
  })
}));

// Mock heavy external services
vi.mock("../src/services/agents", () => import("./__mocks__/agents"));
vi.mock("../src/services/video", () => import("./__mocks__/video"));
vi.mock("storybook", () => import("./__mocks__/storybook"));

// Mock Firebase
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn()
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn()
}));
