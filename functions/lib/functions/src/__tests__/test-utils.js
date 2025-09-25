"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockData = exports.waitForAsync = exports.verifyAuditLogEntry = exports.countDocuments = exports.getDocumentData = exports.verifyDocumentExists = exports.seedTestData = exports.createMockScheduledEvent = exports.createMockDocumentUpdatedEvent = exports.createMockDocumentCreatedEvent = exports.clearFirestoreData = void 0;
const firestore_1 = require("firebase-admin/firestore");
var setup_1 = require("./setup");
Object.defineProperty(exports, "clearFirestoreData", { enumerable: true, get: function () { return setup_1.clearFirestoreData; } });
/**
 * Creates a mock Firestore document creation event
 */
const createMockDocumentCreatedEvent = (collectionPath, documentId, data) => {
    const params = {};
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
exports.createMockDocumentCreatedEvent = createMockDocumentCreatedEvent;
/**
 * Creates a mock Firestore document update event
 */
const createMockDocumentUpdatedEvent = (collectionPath, documentId, beforeData, afterData) => {
    const params = {};
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
exports.createMockDocumentUpdatedEvent = createMockDocumentUpdatedEvent;
/**
 * Creates a mock scheduled event
 */
const createMockScheduledEvent = (scheduleTime, timeZone = "America/New_York") => {
    return {
        scheduleTime: scheduleTime || new Date().toISOString(),
        timeZone,
    };
};
exports.createMockScheduledEvent = createMockScheduledEvent;
/**
 * Helper to seed test data in Firestore
 */
const seedTestData = async (collection, documents) => {
    const db = (0, firestore_1.getFirestore)();
    const batch = db.batch();
    for (const [id, data] of Object.entries(documents)) {
        const docRef = db.collection(collection).doc(id);
        batch.set(docRef, data);
    }
    await batch.commit();
};
exports.seedTestData = seedTestData;
/**
 * Helper to verify document exists in Firestore
 */
const verifyDocumentExists = async (collection, documentId) => {
    const db = (0, firestore_1.getFirestore)();
    const doc = await db.collection(collection).doc(documentId).get();
    return doc.exists;
};
exports.verifyDocumentExists = verifyDocumentExists;
/**
 * Helper to get document data from Firestore
 */
const getDocumentData = async (collection, documentId) => {
    const db = (0, firestore_1.getFirestore)();
    const doc = await db.collection(collection).doc(documentId).get();
    return doc.exists ? doc.data() : null;
};
exports.getDocumentData = getDocumentData;
/**
 * Helper to count documents in a collection
 */
const countDocuments = async (collection) => {
    const db = (0, firestore_1.getFirestore)();
    const snapshot = await db.collection(collection).get();
    return snapshot.size;
};
exports.countDocuments = countDocuments;
/**
 * Helper to verify audit log entry was created
 */
const verifyAuditLogEntry = async (action, targetId, expectedData) => {
    const db = (0, firestore_1.getFirestore)();
    const snapshot = await db.collection("townStaffAuditLogs")
        .where("action", "==", action)
        .where("entryId", "==", targetId)
        .limit(1)
        .get();
    if (snapshot.empty)
        return false;
    const auditLog = snapshot.docs[0].data();
    if (expectedData) {
        for (const [key, value] of Object.entries(expectedData)) {
            if (auditLog[key] !== value)
                return false;
        }
    }
    return true;
};
exports.verifyAuditLogEntry = verifyAuditLogEntry;
/**
 * Helper to wait for async operations to complete
 */
const waitForAsync = (ms = 100) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.waitForAsync = waitForAsync;
/**
 * Mock data generators for common test scenarios
 */
exports.mockData = {
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
            { name: "Child 1", age: 8, league: "Youth Basketball" },
            { name: "Child 2", age: 6, league: "Youth Basketball" },
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
//# sourceMappingURL=test-utils.js.map