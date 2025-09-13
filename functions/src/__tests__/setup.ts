import { initTestApp } from "../../../testenv/firebase";

// Load test environment variables
import "dotenv/config";

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

jest.setTimeout(60000);

beforeAll(() => {
  // Set test environment variables
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_PROJECT_ID = "sportbeaconai-test";
  process.env.FIREBASE_EMULATORS = "1";
  
  // Initialize test app with emulator connections
  initTestApp(); // one app instance for all tests
});

afterEach(async () => {
  // Per-test cleanup handled in utils if needed
});
