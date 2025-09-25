"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onSiblingRequestCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = (0, firestore_2.getFirestore)();
/**
 * Trigger: Sibling Request Created
 * Firestore Path: towns/{townId}/siblingRequests/{requestId}
 *
 * Purpose: Automatically validate and link siblings into the same team or age group
 * when a new sibling pairing request is created.
 *
 * Expected Side Effects:
 * - Validates sibling relationship and eligibility
 * - Checks league availability and age group compatibility
 * - Links siblings to same team if criteria met
 * - Creates audit log entries for tracking
 * - Sends notifications to parents about pairing status
 * - Updates registration status for both siblings
 *
 * Important Edge Cases to Track:
 * - One sibling doesn't qualify for requested league/age group
 * - League mismatch between siblings' preferred sports
 * - Duplicate sibling requests for same family
 * - Team capacity limits preventing pairing
 * - Age group restrictions preventing same-team placement
 * - Special needs accommodations affecting pairing
 * - Geographic constraints (different practice locations)
 * - Schedule conflicts between siblings
 * - Parent preferences for separate team placement
 * - Waitlist position differences affecting pairing
 */
exports.onSiblingRequestCreated = (0, firestore_1.onDocumentCreated)("towns/{townId}/siblingRequests/{requestId}", async (event) => {
    try {
        const townId = event.params.townId;
        const requestId = event.params.requestId;
        const data = event.data?.data();
        logger.info("Sibling request created", { townId, requestId, data });
        // TODO: Implement sibling pairing logic
        // - Validate sibling relationship (check family ID, parent email)
        // - Verify both siblings meet age/league requirements
        // - Check team capacity and availability
        // - Handle league mismatch scenarios
        // - Process special needs accommodations
        // - Link siblings to same team if criteria met
        // - Update registration status for both siblings
        // - Send notifications to parents
        // - Create comprehensive audit trail
        // Create audit log entry
        await db.collection("townStaffAuditLogs").add({
            action: "sibling_request_created",
            townId,
            requestId,
            timestamp: new Date(),
            data: data,
            status: "pending_validation",
            processingStage: "initial_validation",
        });
        logger.info("Sibling request processing initiated", { townId, requestId });
    }
    catch (error) {
        logger.error("Sibling request creation trigger failed", {
            townId: event.params.townId,
            requestId: event.params.requestId,
            error,
        });
    }
});
