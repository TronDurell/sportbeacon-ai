import { DocumentData } from "firebase-admin/firestore";
export { clearFirestoreData } from "./setup";
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
export declare const createMockDocumentCreatedEvent: (collectionPath: string, documentId: string, data: DocumentData) => MockFirestoreEvent;
/**
 * Creates a mock Firestore document update event
 */
export declare const createMockDocumentUpdatedEvent: (collectionPath: string, documentId: string, beforeData: DocumentData, afterData: DocumentData) => MockFirestoreEvent;
/**
 * Creates a mock scheduled event
 */
export declare const createMockScheduledEvent: (scheduleTime?: string, timeZone?: string) => MockScheduledEvent;
/**
 * Helper to seed test data in Firestore
 */
export declare const seedTestData: (collection: string, documents: Record<string, DocumentData>) => Promise<void>;
/**
 * Helper to verify document exists in Firestore
 */
export declare const verifyDocumentExists: (collection: string, documentId: string) => Promise<boolean>;
/**
 * Helper to get document data from Firestore
 */
export declare const getDocumentData: (collection: string, documentId: string) => Promise<DocumentData | null>;
/**
 * Helper to count documents in a collection
 */
export declare const countDocuments: (collection: string) => Promise<number>;
/**
 * Helper to verify audit log entry was created
 */
export declare const verifyAuditLogEntry: (action: string, targetId: string, expectedData?: Partial<DocumentData>) => Promise<boolean>;
/**
 * Helper to wait for async operations to complete
 */
export declare const waitForAsync: (ms?: number) => Promise<void>;
/**
 * Mock data generators for common test scenarios
 */
export declare const mockData: {
    waitlistEntry: {
        childName: string;
        parentEmail: string;
        league: string;
        waitlistPosition: number;
        priority: string;
        status: string;
        createdAt: Date;
    };
    ageOverride: {
        childName: string;
        parentEmail: string;
        requestedLeague: string;
        currentAge: number;
        ageRequirement: number;
        reason: string;
        status: string;
        requestedBy: string;
        createdAt: Date;
    };
    siblingPairing: {
        familyId: string;
        parentEmail: string;
        children: {
            name: string;
            age: number;
            league: string;
        }[];
        status: string;
        createdAt: Date;
    };
    registration: {
        playerId: string;
        leagueId: string;
        teamId: string;
        status: string;
        registrationDate: Date;
        updatedAt: Date;
    };
    staffSession: {
        staffId: string;
        sessionType: string;
        startTime: Date;
        endTime: null;
        activities: never[];
    };
    notification: {
        recipient: string;
        type: string;
        title: string;
        message: string;
        status: string;
        createdAt: Date;
    };
};
//# sourceMappingURL=test-utils.d.ts.map