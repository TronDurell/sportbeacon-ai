"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTestApp = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
function initTestApp(projectId = process.env.FIREBASE_PROJECT_ID || "sportbeaconai-test") {
    const app = (0, app_1.getApps)().length ? (0, app_1.getApp)() : (0, app_1.initializeApp)({ projectId });
    const db = (0, firestore_1.getFirestore)(app);
    const auth = (0, auth_1.getAuth)(app);
    // Only connect to emulators when running tests
    if (process.env.FIREBASE_EMULATORS === "1") {
        try {
            (0, firestore_1.connectFirestoreEmulator)(db, "127.0.0.1", 8080);
        }
        catch (error) {
            // Already connected, ignore
        }
        try {
            (0, auth_1.connectAuthEmulator)(auth, "http://127.0.0.1:9099", { disableWarnings: true });
        }
        catch (error) {
            // Already connected, ignore
        }
    }
    return { app, db, auth };
}
exports.initTestApp = initTestApp;
//# sourceMappingURL=firebase.js.map