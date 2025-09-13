// functions/src/__tests__/utils/testEnv.ts
import { getApps, initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { initializeTestEnvironment, RulesTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";

let adminInited = false;
let testEnv: RulesTestEnvironment;

export async function initAdmin() {
  if (!adminInited) {
    // Check if any app is already initialized
    const apps = getApps();
    if (apps.length === 0) {
      // No apps exist, initialize with test config
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "sportbeaconai-test",
      }, "test-app");
    } else {
      // App already exists, use the default one
      console.log("Firebase app already initialized, using existing app");
    }
    adminInited = true;
  }
  // Try to get test-app first, fallback to default
  try {
    return getApp("test-app");
  } catch {
    return getApp();
  }
}

export async function initRulesEnv(projectId = process.env.FIREBASE_PROJECT_ID || "sportbeaconai-test") {
  try {
    const rulesPath = path.resolve(process.cwd(), "firestore.rules");
    const rules = fs.readFileSync(rulesPath, "utf8");
    testEnv = await initializeTestEnvironment({ 
      projectId, 
      firestore: { rules } 
    });
    return testEnv;
  } catch (error) {
    console.warn("Could not load firestore.rules, using default test rules:", error);
    // Fallback to basic test rules
    testEnv = await initializeTestEnvironment({ 
      projectId, 
      firestore: { 
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /{document=**} {
                allow read, write: if true; // Allow all for testing
              }
            }
          }
        `
      } 
    });
    return testEnv;
  }
}

export async function cleanupEnv() {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
}

export { assertSucceeds, assertFails };
