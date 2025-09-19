import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
if (!getApps().length) {
  try { initializeApp({ credential: applicationDefault() }); } catch {}
}
process.env.FIRESTORE_EMULATOR_HOST ??= "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "localhost:9099";
