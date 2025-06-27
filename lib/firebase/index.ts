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

const firebaseConfig = {
  // TODO: Fill with your Firebase config
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Generic typed Firestore helpers
export const getDocument = async <T>(ref: DocumentReference<T>) => {
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as T) : null;
};

export const setDocument = async <T>(ref: DocumentReference<T>, data: T) => {
  await setDoc(ref, data);
};

export const updateDocument = async <T>(ref: DocumentReference<T>, data: Partial<T>) => {
  await updateDoc(ref, data);
};

export const deleteDocument = async (ref: DocumentReference) => {
  await deleteDoc(ref);
};

export const getCollection = async <T>(q: Query<T>) => {
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as T);
};

export { collection, doc, query, where, orderBy, addDoc, serverTimestamp, Timestamp }; 