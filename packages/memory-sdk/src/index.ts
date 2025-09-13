// Minimal Memory SDK for SportBeaconAI
// Works in web (Firebase v10 modular) and Cloud Functions.
// Captures append-only events and creates periodic learned snapshots.

import {
  initializeApp, getApps, getApp, FirebaseApp
} from 'firebase/app';
import {
  getFirestore, collection, addDoc, serverTimestamp, doc, setDoc
} from 'firebase/firestore';
import type { User } from '../../frontend/firebase/types'; // adjust to your path

export type MemoryEventKind = 'note' | 'feedback' | 'observation' | 'tool' | 'result';

export interface MemoryEvent {
  t?: any;                 // serverTimestamp injected
  kind: MemoryEventKind;   // taxonomy keeps it queryable
  scope: 'web' | 'mobile' | 'functions';
  trace?: string;          // request/trace id for observability
  tags?: string[];         // lightweight faceting
  data: unknown;           // payload (validated by callers)
}

export interface MemorySnapshot {
  t?: any;
  version: number;
  summary: string;   // human-readable learned state
  vector?: number[]; // optional embedding for retrieval
}

export interface MemoryClientOpts {
  app?: FirebaseApp;    // if not provided, we lazy-init
  projectId?: string;   // only needed in SSR/CF envs
}

function ensureApp(opts?: MemoryClientOpts): FirebaseApp {
  if (opts?.app) return opts.app;
  if (getApps().length) return getApp();
  // In web: assume firebase is already initialized elsewhere.
  // In CF/SSR: pass app via opts or use environment-based init.
  throw new Error('MemorySDK: Firebase app not initialized. Pass {app} in SSR/CF.');
}

export function memoryClient(opts?: MemoryClientOpts) {
  const app = ensureApp(opts);
  const db = getFirestore(app);

  async function writeEvent(uid: string, event: Omit<MemoryEvent, 't'>) {
    const col = collection(db, 'memories', uid, 'events');
    const docRef = await addDoc(col, {
      ...event,
      t: serverTimestamp(),
    });
    return docRef.id;
  }

  async function writeSnapshot(uid: string, snap: Omit<MemorySnapshot, 't'>, snapshotId?: string) {
    const id = snapshotId ?? crypto.randomUUID();
    const ref = doc(db, 'user_memory', uid, 'snapshots', id);
    await setDoc(ref, { ...snap, t: serverTimestamp() }, { merge: false });
    return id;
  }

  // Convenience: capture UI feedback tied to a component or action
  async function feedback(uid: string, message: string, tags?: string[], trace?: string) {
    return writeEvent(uid, {
      kind: 'feedback',
      scope: 'web',
      tags,
      trace,
      data: { message }
    });
  }

  return { writeEvent, writeSnapshot, feedback };
}

export type MemoryClient = ReturnType<typeof memoryClient>;