import {getFirestore, DocumentData} from "firebase-admin/firestore";

export {clearFirestoreData} from "./setup";

export interface MockFirestoreEvent {
  params: Record<string, string>;
  data: () => DocumentData | undefined;
  id: string;
}

export interface MockScheduledEvent {
  scheduleTime: string;
  timeZone: string;
}

/**
 * Creates a mock Firestore document creation event
 */
export const createMockDocumentCreatedEvent = (
  collectionPath: string,
  documentId: string,
  data: DocumentData
): MockFirestoreEvent => {
  const params: Record<string, string> = {};

  // Extract path parameters from collection path
  const pathParts = collectionPath.split("/");
  for (let i = 0; i < pathParts.length; i += 2) {
    if (pathParts[i + 1]?.startsWith("{") && pathParts[i + 1]?.endsWith("}")) {
      const paramName = pathParts[i + 1].slice(1, -1);
      params[paramName] = documentId;
    }
  }

  return {
    params,
    data: () => data,
    id: documentId,
  };
};

/**
 * Creates a mock Firestore document update event
 */
export const createMockDocumentUpdatedEvent = (
  collectionPath: string,
  documentId: string,
  beforeData: DocumentData,
  afterData: DocumentData
): MockFirestoreEvent => {
  const params: Record<string, string> = {};

  // Extract path parameters from collection path
  const pathParts = collectionPath.split("/");
  for (let i = 0; i < pathParts.length; i += 2) {
    if (pathParts[i + 1]?.startsWith("{") && pathParts[i + 1]?.endsWith("}")) {
      const paramName = pathParts[i + 1].slice(1, -1);
      params[paramName] = documentId;
    }
  }

  return {
    params,
    data: () => afterData,
    id: documentId,
  };
};

/**
 * Creates a mock scheduled event
 */
export const createMockScheduledEvent = (
  scheduleTime?: string,
  timeZone = "America/New_York"
): MockScheduledEvent => {
  return {
    scheduleTime: scheduleTime || new Date().toISOString(),
    timeZone,
  };
};

/**
 * Helper to seed test data in Firestore
 */
export const seedTestData = async (collection: string, documents: Record<string, DocumentData>) => {
  const db = getFirestore();
  const batch = db.batch();

  for (const [id, data] of Object.entries(documents)) {
    const docRef = db.collection(collection).doc(id);
    batch.set(docRef, data);
  }

  await batch.commit();
};

/**
 * Helper to verify document exists in Firestore
 */
export const verifyDocumentExists = async (collection: string, documentId: string): Promise<boolean> => {
  const db = getFirestore();
  const doc = await db.collection(collection).doc(documentId).get();
  return doc.exists;
};

/**
 * Helper to get document data from Firestore
 */
export const getDocumentData = async (collection: string, documentId: string): Promise<DocumentData | null> => {
  const db = getFirestore();
  const doc = await db.collection(collection).doc(documentId).get();
  return doc.exists ? doc.data() : null;
};

/**
 * Helper to count documents in a collection
 */
export const countDocuments = async (collection: string): Promise<number> => {
  const db = getFirestore();
  const snapshot = await db.collection(collection).get();
  return snapshot.size;
};

/**
 * Helper to verify audit log entry was created
 */
export const verifyAuditLogEntry = async (
  action: string,
  targetId: string,
  expectedData?: Partial<DocumentData>
): Promise<boolean> => {
  const db = getFirestore();
  const snapshot = await db.collection("townStaffAuditLogs")
    .where("action", "==", action)
    .where("entryId", "==", targetId)
    .limit(1)
    .get();

  if (snapshot.empty) return false;

  const auditLog = snapshot.docs[0].data();

  if (expectedData) {
    for (const [key, value] of Object.entries(expectedData)) {
      if (auditLog[key] !== value) return false;
    }
  }

  return true;
};

/**
 * Helper to wait for async operations to complete
 */
export const waitForAsync = (ms = 100): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mock data generators for common test scenarios
 */
export const mockData = {
  waitlistEntry: {
    childName: "Test Child",
    parentEmail: "test@example.com",
    league: "Youth Basketball",
    waitlistPosition: 1,
    priority: "high",
    status: "waiting",
    createdAt: new Date(),
  },

  ageOverride: {
    childName: "Test Child",
    parentEmail: "test@example.com",
    requestedLeague: "Youth Basketball",
    currentAge: 7,
    ageRequirement: 8,
    reason: "Advanced skills",
    status: "pending",
    requestedBy: "parent123",
    createdAt: new Date(),
  },

  siblingPairing: {
    familyId: "family123",
    parentEmail: "test@example.com",
    children: [
      {name: "Child 1", age: 8, league: "Youth Basketball"},
      {name: "Child 2", age: 6, league: "Youth Basketball"},
    ],
    status: "pending",
    createdAt: new Date(),
  },

  registration: {
    playerId: "player123",
    leagueId: "league123",
    teamId: "team123",
    status: "active",
    registrationDate: new Date(),
    updatedAt: new Date(),
  },

  staffSession: {
    staffId: "staff123",
    sessionType: "admin",
    startTime: new Date(),
    endTime: null,
    activities: [],
  },

  notification: {
    recipient: "user123",
    type: "email",
    title: "Test Notification",
    message: "This is a test notification",
    status: "pending",
    createdAt: new Date(),
  },
};
