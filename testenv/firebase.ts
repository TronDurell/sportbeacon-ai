import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";

export type TestEnv = { app: FirebaseApp; db: Firestore; auth: Auth };

export function initTestApp(projectId = process.env.FIREBASE_PROJECT_ID || "sportbeaconai-test"): TestEnv {
  const app = getApps().length ? getApp() : initializeApp({ projectId });
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Only connect to emulators when running tests
  if (process.env.FIREBASE_EMULATORS === "1") {
    try {
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    } catch (error) {
      // Already connected, ignore
    }
    
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    } catch (error) {
      // Already connected, ignore
    }
  }

  return { app, db, auth };
}
