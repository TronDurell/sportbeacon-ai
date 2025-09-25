"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertFails = exports.assertSucceeds = exports.cleanupEnv = exports.initRulesEnv = exports.initAdmin = void 0;
// functions/src/__tests__/utils/testEnv.ts
const app_1 = require("firebase-admin/app");
const rules_unit_testing_1 = require("@firebase/rules-unit-testing");
Object.defineProperty(exports, "assertSucceeds", { enumerable: true, get: function () { return rules_unit_testing_1.assertSucceeds; } });
Object.defineProperty(exports, "assertFails", { enumerable: true, get: function () { return rules_unit_testing_1.assertFails; } });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let adminInited = false;
let testEnv;
async function initAdmin() {
    if (!adminInited) {
        // Check if any app is already initialized
        const apps = (0, app_1.getApps)();
        if (apps.length === 0) {
            // No apps exist, initialize with test config
            (0, app_1.initializeApp)({
                projectId: process.env.FIREBASE_PROJECT_ID || "sportbeaconai-test",
            }, "test-app");
        }
        else {
            // App already exists, use the default one
            console.log("Firebase app already initialized, using existing app");
        }
        adminInited = true;
    }
    // Try to get test-app first, fallback to default
    try {
        return (0, app_1.getApp)("test-app");
    }
    catch {
        return (0, app_1.getApp)();
    }
}
exports.initAdmin = initAdmin;
async function initRulesEnv(projectId = process.env.FIREBASE_PROJECT_ID || "sportbeaconai-test") {
    try {
        const rulesPath = path.resolve(process.cwd(), "firestore.rules");
        const rules = fs.readFileSync(rulesPath, "utf8");
        testEnv = await (0, rules_unit_testing_1.initializeTestEnvironment)({
            projectId,
            firestore: { rules }
        });
        return testEnv;
    }
    catch (error) {
        console.warn("Could not load firestore.rules, using default test rules:", error);
        // Fallback to basic test rules
        testEnv = await (0, rules_unit_testing_1.initializeTestEnvironment)({
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
exports.initRulesEnv = initRulesEnv;
async function cleanupEnv() {
    if (testEnv) {
        await testEnv.clearFirestore();
    }
}
exports.cleanupEnv = cleanupEnv;
//# sourceMappingURL=testEnv.js.map