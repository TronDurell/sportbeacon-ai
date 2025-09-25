"use strict";
/* SportBeaconAI - Mock Memory SDK for Functions
   Provides mock implementation when @sportbeacon/memory-sdk is not available
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMemoryClient = exports.memoryClient = void 0;
function memoryClient(opts) {
    return {
        async writeEvent(userId, event) {
            console.log(`[MOCK] Memory event for ${userId}:`, event);
        },
        async feedback(userId, message, tags, trace) {
            console.log(`[MOCK] Memory feedback for ${userId}:`, { message, tags, trace });
        },
        async captureFunctionResult(uid, functionName, result, executionTime, trace) {
            console.log(`[MOCK] Function result for ${uid}/${functionName}:`, { result, executionTime, trace });
        },
        async captureFunctionError(uid, functionName, error, context, trace) {
            console.log(`[MOCK] Function error for ${uid}/${functionName}:`, { error: error.message, context, trace });
        },
        async captureFunctionObservation(uid, observation, data, trace) {
            console.log(`[MOCK] Function observation for ${uid}:`, { observation, data, trace });
        },
        async writeSnapshot(uid, data) {
            console.log(`[MOCK] Snapshot for ${uid}:`, data);
        }
    };
}
exports.memoryClient = memoryClient;
exports.adminMemoryClient = memoryClient;
