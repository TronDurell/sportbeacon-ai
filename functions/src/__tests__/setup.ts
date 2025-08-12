import {initializeTestEnvironment} from "@firebase/rules-unit-testing";
import {getFirestore, connectFirestoreEmulator} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";

// Mock logger to prevent console output during tests
jest.mock("firebase-functions/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock external services
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({messageId: "test-message-id"}),
  })),
}));

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({id: "test-session-id"}),
      },
    },
  }));
});

// Global test setup
beforeAll(async () => {
  // Initialize Firebase Admin for testing
  if (!process.env.FIREBASE_PROJECT_ID) {
    process.env.FIREBASE_PROJECT_ID = "sportbeacon-test";
  }

  // Initialize app if not already initialized
  try {
    initializeApp();
  } catch (error) {
    // App already initialized
  }

  // Connect to Firestore emulator
  const db = getFirestore();
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (error) {
    // Already connected
  }
});

// Global test teardown
afterAll(async () => {
  // Clean up any remaining connections
});

// Helper to clear all Firestore data between tests
export const clearFirestoreData = async () => {
  const db = getFirestore();
  const collections = ["waitlists", "ageOverrides", "siblingPairings", "registrations", "townStaffSessions", "notifications", "townStaffAuditLogs"];

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
};
