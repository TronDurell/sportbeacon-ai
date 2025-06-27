import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Minimal firebase config for client-side usage during tests and development.
// In a real project, these values should come from environment variables.
const app = initializeApp({});

export const db = getFirestore(app);
