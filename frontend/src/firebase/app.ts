import { initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let emulatorConnected = false;

function requiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value || !String(value).trim()) {
    throw new Error("Firebase is not configured");
  }
  return String(value).trim();
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp({
      apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
      authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
      projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
      appId: requiredEnv("VITE_FIREBASE_APP_ID"),
      messagingSenderId: requiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    });
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" && !emulatorConnected) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      emulatorConnected = true;
    }
  }
  return auth;
}
