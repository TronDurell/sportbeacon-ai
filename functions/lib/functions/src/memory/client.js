"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMemoryClient = exports.db = void 0;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const app = (() => {
    try {
        return (0, app_1.getApp)();
    }
    catch {
        return (0, app_1.initializeApp)({ credential: (0, app_1.applicationDefault)() });
    }
})();
exports.db = (0, firestore_1.getFirestore)(app);
// Memory client for agent functions
const adminMemoryClient = () => {
    return {
        remember: async (key, value) => {
            await exports.db.collection('memory').doc(key).set({
                value,
                timestamp: new Date(),
                type: 'agent_memory'
            });
        },
        recall: async (key) => {
            const doc = await exports.db.collection('memory').doc(key).get();
            return doc.exists ? doc.data()?.value : null;
        },
        forget: async (key) => {
            await exports.db.collection('memory').doc(key).delete();
        },
        captureFunctionResult: async (functionName, result, duration) => {
            await exports.db.collection('memory_logs').add({
                functionName,
                result,
                duration,
                timestamp: new Date(),
                type: 'function_result'
            });
        },
        captureFunctionError: async (functionName, error) => {
            await exports.db.collection('memory_logs').add({
                functionName,
                error: String(error),
                timestamp: new Date(),
                type: 'function_error'
            });
        },
        writeSnapshot: async (uid, data) => {
            await exports.db.collection('memory').doc(`snapshot_${uid}`).set({
                data,
                timestamp: new Date(),
                type: 'snapshot'
            });
        },
        writeEvent: async (kind, data) => {
            await exports.db.collection('memory_logs').add({
                kind,
                data,
                timestamp: new Date(),
                type: 'event'
            });
        }
    };
};
exports.adminMemoryClient = adminMemoryClient;
//# sourceMappingURL=client.js.map