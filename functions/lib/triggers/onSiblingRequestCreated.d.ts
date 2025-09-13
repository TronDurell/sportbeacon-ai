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
export declare const onSiblingRequestCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    townId: string;
    requestId: string;
}>>;
//# sourceMappingURL=onSiblingRequestCreated.d.ts.map