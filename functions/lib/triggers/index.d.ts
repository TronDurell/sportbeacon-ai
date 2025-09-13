/**
 * Trigger: Waitlist Entry Created
 * Handles new waitlist entries and initiates processing workflow
 */
export declare const onWaitlistEntryCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    entryId: string;
}>>;
/**
 * Trigger: Age Override Request Created
 * Handles new age override requests and initiates approval workflow
 */
export declare const onAgeOverrideCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    overrideId: string;
}>>;
/**
 * Trigger: Sibling Pairing Request Created
 * Handles new sibling pairing requests and initiates processing
 */
export declare const onSiblingPairingCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    pairingId: string;
}>>;
/**
 * Trigger: Registration Updated
 * Handles registration updates and triggers notifications
 */
export declare const onRegistrationUpdated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot>, {
    registrationId: string;
}>>;
/**
 * Trigger: Town Staff Session Created
 * Handles new staff sessions and logs activity
 */
export declare const onTownStaffSessionCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    sessionId: string;
}>>;
/**
 * Trigger: Notification Created
 * Handles new notifications and sends them to appropriate recipients
 */
export declare const onNotificationCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    notificationId: string;
}>>;
/**
 * Trigger: Audit Log Created
 * Handles new audit log entries and ensures data integrity
 */
export declare const onAuditLogCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    logId: string;
}>>;
/**
 * Trigger: Sibling Request Created
 * Handles new sibling pairing requests in Town Rec module
 */
export { onSiblingRequestCreated } from "./onSiblingRequestCreated";
//# sourceMappingURL=index.d.ts.map