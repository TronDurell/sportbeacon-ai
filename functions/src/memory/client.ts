import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../lib/db';

type MemoryEvent = {
  tenantId: string;
  userId: string;
  kind: 'stat_verified' | 'stat_submitted' | 'feedback' | string;
  payload: Record<string, unknown>;
  createdAt?: Date;
};

export async function writeEvent(evt: MemoryEvent) {
  const ref = db
    .collection('memory_events')
    .doc();
  await ref.set({
    ...evt,
    createdAt: evt.createdAt ?? new Date(),
    createdAtTS: FieldValue.serverTimestamp(),
    v: 1
  });
  return ref.id;
}

// Additional methods for compatibility
export async function writeSnapshot(userId: string, data: any) {
  const ref = db.collection('memory_snapshots').doc();
  await ref.set({
    userId,
    data,
    createdAt: new Date(),
    createdAtTS: FieldValue.serverTimestamp()
  });
  return ref.id;
}

export async function captureFunctionResult(data: any, context?: any, kind?: string) {
  return writeEvent({
    tenantId: context?.tenantId || 'system',
    userId: context?.userId || 'system',
    kind: kind || 'function_result',
    payload: data
  });
}

export async function captureFunctionError(error: Error, context?: any, kind?: string) {
  return writeEvent({
    tenantId: context?.tenantId || 'system',
    userId: context?.userId || 'system',
    kind: kind || 'function_error',
    payload: { error: error.message, stack: error.stack }
  });
}

// Export adminMemoryClient as a function for compatibility with existing imports
export const adminMemoryClient = () => ({ 
  writeEvent,
  writeSnapshot,
  captureFunctionResult,
  captureFunctionError
});
export { db };