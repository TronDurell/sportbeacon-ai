/**
 * Background Verification Agent
 * Automatically verifies new stat submissions using AI reasoning
 */
/**
 * Trigger: Firestore onCreate for stats_submissions
 * Automatically verifies new stat submissions
 */
export declare const onStatSubmissionCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    submissionId: string;
}>>;
//# sourceMappingURL=verificationAgent.d.ts.map