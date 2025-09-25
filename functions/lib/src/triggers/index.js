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
exports.onSiblingRequestCreated = exports.onAuditLogCreated = exports.onNotificationCreated = exports.onTownStaffSessionCreated = exports.onRegistrationUpdated = exports.onSiblingPairingCreated = exports.onAgeOverrideCreated = exports.onWaitlistEntryCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = (0, firestore_2.getFirestore)();
/**
 * Trigger: Waitlist Entry Created
 * Handles new waitlist entries and initiates processing workflow
 */
exports.onWaitlistEntryCreated = (0, firestore_1.onDocumentCreated)("waitlists/{entryId}", async (event) => {
    try {
        const entryId = event.params.entryId;
        const data = event.data?.data();
        logger.info("Waitlist entry created", { entryId, data });
        // TODO: Implement waitlist entry processing
        // - Validate entry data
        // - Check for duplicate entries
        // - Update league capacity counters
        // - Send confirmation email to parent
        // - Log audit trail
        // Create audit log entry
        await db.collection("townStaffAuditLogs").add({
            action: "waitlist_entry_created",
            entryId,
            timestamp: new Date(),
            data: data,
            processed: false,
        });
        logger.info("Waitlist entry processing initiated", { entryId });
    }
    catch (error) {
        logger.error("Waitlist entry creation trigger failed", { entryId: event.params.entryId, error });
    }
});
/**
 * Trigger: Age Override Request Created
 * Handles new age override requests and initiates approval workflow
 */
exports.onAgeOverrideCreated = (0, firestore_1.onDocumentCreated)("ageOverrides/{overrideId}", async (event) => {
    try {
        const overrideId = event.params.overrideId;
        const data = event.data?.data();
        logger.info("Age override request created", { overrideId, data });
        // TODO: Implement age override processing
        // - Validate override request
        // - Check age difference and policy compliance
        // - Assign to appropriate staff member for review
        // - Send notification to parent
        // - Create approval workflow
        // Create audit log entry
        await db.collection("townStaffAuditLogs").add({
            action: "age_override_created",
            overrideId,
            timestamp: new Date(),
            data: data,
            status: "pending_review",
        });
        logger.info("Age override processing initiated", { overrideId });
    }
    catch (error) {
        logger.error("Age override creation trigger failed", { overrideId: event.params.overrideId, error });
    }
});
/**
 * Trigger: Sibling Pairing Request Created
 * Handles new sibling pairing requests and initiates processing
 */
exports.onSiblingPairingCreated = (0, firestore_1.onDocumentCreated)("siblingPairings/{pairingId}", async (event) => {
    try {
        const pairingId = event.params.pairingId;
        const data = event.data?.data();
        logger.info("Sibling pairing request created", { pairingId, data });
        // TODO: Implement sibling pairing processing
        // - Validate sibling relationship
        // - Check league availability for both siblings
        // - Process automatic approval if criteria met
        // - Send notification to parent
        // - Update registration status
        // Create audit log entry
        await db.collection("townStaffAuditLogs").add({
            action: "sibling_pairing_created",
            pairingId,
            timestamp: new Date(),
            data: data,
            status: "processing",
        });
        logger.info("Sibling pairing processing initiated", { pairingId });
    }
    catch (error) {
        logger.error("Sibling pairing creation trigger failed", { pairingId: event.params.pairingId, error });
    }
});
/**
 * Trigger: Registration Updated
 * Handles registration updates and triggers notifications
 */
exports.onRegistrationUpdated = (0, firestore_1.onDocumentUpdated)("registrations/{registrationId}", async (event) => {
    try {
        const registrationId = event.params.registrationId;
        const beforeData = event.data?.before.data();
        const afterData = event.data?.after.data();
        logger.info("Registration updated", { registrationId, beforeData, afterData });
        // TODO: Implement registration update processing
        // - Check for status changes
        // - Send notifications to parent
        // - Update league capacity
        // - Process waitlist if space opened
        // - Log all changes
        // Create audit log entry
        await db.collection("townStaffAuditLogs").add({
            action: "registration_updated",
            registrationId,
            timestamp: new Date(),
            beforeData,
            afterData,
            changes: {
                status: beforeData?.status !== afterData?.status ? { from: beforeData?.status, to: afterData?.status } : null,
            },
        });
        logger.info("Registration update processed", { registrationId });
    }
    catch (error) {
        logger.error("Registration update trigger failed", { registrationId: event.params.registrationId, error });
    }
});
/**
 * Trigger: Town Staff Session Created
 * Handles new staff sessions and logs activity
 */
exports.onTownStaffSessionCreated = (0, firestore_1.onDocumentCreated)("townStaffSessions/{sessionId}", async (event) => {
    try {
        const sessionId = event.params.sessionId;
        const data = event.data?.data();
        logger.info("Town staff session created", { sessionId, data });
        // TODO: Implement session processing
        // - Validate staff permissions
        // - Log session start time
        // - Track session activities
        // - Update staff activity metrics
        // Create audit log entry
        await db.collection("townStaffAuditLogs").add({
            action: "staff_session_created",
            sessionId,
            timestamp: new Date(),
            data: data,
            staffId: data?.staffId,
        });
        logger.info("Staff session processing completed", { sessionId });
    }
    catch (error) {
        logger.error("Town staff session creation trigger failed", { sessionId: event.params.sessionId, error });
    }
});
/**
 * Trigger: Notification Created
 * Handles new notifications and sends them to appropriate recipients
 */
exports.onNotificationCreated = (0, firestore_1.onDocumentCreated)("notifications/{notificationId}", async (event) => {
    try {
        const notificationId = event.params.notificationId;
        const data = event.data?.data();
        logger.info("Notification created", { notificationId, data });
        // TODO: Implement notification processing
        // - Validate recipient
        // - Send email/SMS notification
        // - Update notification status
        // - Track delivery success/failure
        // - Handle retry logic for failed deliveries
        // Update notification status
        await db.collection("notifications").doc(notificationId).update({
            status: "sent",
            sentAt: new Date(),
        });
        logger.info("Notification sent successfully", { notificationId });
    }
    catch (error) {
        logger.error("Notification creation trigger failed", { notificationId: event.params.notificationId, error });
    }
});
/**
 * Trigger: Audit Log Created
 * Handles new audit log entries and ensures data integrity
 */
exports.onAuditLogCreated = (0, firestore_1.onDocumentCreated)("townStaffAuditLogs/{logId}", async (event) => {
    try {
        const logId = event.params.logId;
        const data = event.data?.data();
        logger.info("Audit log created", { logId, data });
        // TODO: Implement audit log processing
        // - Validate log entry format
        // - Ensure required fields are present
        // - Archive old logs if needed
        // - Trigger alerts for suspicious activities
        // - Update analytics counters
        // No additional processing needed - audit logs are read-only
        logger.info("Audit log entry validated", { logId });
    }
    catch (error) {
        logger.error("Audit log creation trigger failed", { logId: event.params.logId, error });
    }
});
/**
 * Trigger: Sibling Request Created
 * Handles new sibling pairing requests in Town Rec module
 */
var onSiblingRequestCreated_1 = require("./onSiblingRequestCreated");
Object.defineProperty(exports, "onSiblingRequestCreated", { enumerable: true, get: function () { return onSiblingRequestCreated_1.onSiblingRequestCreated; } });
