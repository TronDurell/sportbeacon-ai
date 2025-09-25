"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.adminMemoryClient = exports.captureFunctionError = exports.captureFunctionResult = exports.writeSnapshot = exports.writeEvent = void 0;
const firestore_1 = require("firebase-admin/firestore");
const db_1 = require("../lib/db");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return db_1.db; } });
async function writeEvent(evt) {
    const ref = db_1.db
        .collection('memory_events')
        .doc();
    await ref.set({
        ...evt,
        createdAt: evt.createdAt ?? new Date(),
        createdAtTS: firestore_1.FieldValue.serverTimestamp(),
        v: 1
    });
    return ref.id;
}
exports.writeEvent = writeEvent;
// Additional methods for compatibility
async function writeSnapshot(userId, data) {
    const ref = db_1.db.collection('memory_snapshots').doc();
    await ref.set({
        userId,
        data,
        createdAt: new Date(),
        createdAtTS: firestore_1.FieldValue.serverTimestamp()
    });
    return ref.id;
}
exports.writeSnapshot = writeSnapshot;
async function captureFunctionResult(userId, functionName, result, executionTime, trace) {
    return writeEvent({
        tenantId: 'system',
        userId: userId,
        kind: 'function_result',
        payload: { functionName, result, executionTime, trace }
    });
}
exports.captureFunctionResult = captureFunctionResult;
async function captureFunctionError(userId, functionName, error, executionTime, trace) {
    return writeEvent({
        tenantId: 'system',
        userId: userId,
        kind: 'function_error',
        payload: { functionName, error: error.message, stack: error.stack, executionTime, trace }
    });
}
exports.captureFunctionError = captureFunctionError;
// Export adminMemoryClient as a function for compatibility with existing imports
const adminMemoryClient = () => ({
    writeEvent,
    writeSnapshot,
    captureFunctionResult,
    captureFunctionError
});
exports.adminMemoryClient = adminMemoryClient;
