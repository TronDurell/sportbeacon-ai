import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';

const firebaseConfig = {
  // TODO: Replace with your Firebase config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "your-measurement-id"
};

// Initialize Firebase with error handling
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error('Firebase initialization failed:', error);
  throw new Error('Firebase configuration is invalid. Please check your environment variables.');
}

export const db = getFirestore(app);

// Initialize Firebase Messaging for push notifications (iOS/Android only)
let messaging;
if (typeof window !== 'undefined' && Platform.OS !== 'web') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging initialization failed:', error);
  }
}

// Push notification setup
export const initializePushNotifications = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      return token;
    }
  } catch (error) {
    console.error('Failed to get push notification token:', error);
  }
  return null;
};

// Listen for foreground messages
export const onMessageListener = () => {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    // Handle foreground message
  });
};

// Generic typed Firestore helpers with error handling
export const getDocument = async <T>(ref: DocumentReference<T>) => {
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as T) : null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

export const setDocument = async <T>(ref: DocumentReference<T>, data: T) => {
  try {
    await setDoc(ref, data);
  } catch (error) {
    console.error('Error setting document:', error);
    throw error;
  }
};

export const updateDocument = async <T>(ref: DocumentReference<T>, data: Partial<T>) => {
  try {
    await updateDoc(ref, data);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (ref: DocumentReference) => {
  try {
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const getCollection = async <T>(q: Query<T>) => {
  try {
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as T);
  } catch (error) {
    console.error('Error getting collection:', error);
    throw error;
  }
};

export { collection, doc, query, where, orderBy, addDoc, serverTimestamp, Timestamp }; 