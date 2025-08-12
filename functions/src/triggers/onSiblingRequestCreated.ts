import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

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
export const onSiblingRequestCreated = onDocumentCreated("towns/{townId}/siblingRequests/{requestId}", async (event) => {
  try {
    const townId = event.params.townId;
    const requestId = event.params.requestId;
    const data = event.data?.data();

    logger.info("Sibling request created", {townId, requestId, data});

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

    logger.info("Sibling request processing initiated", {townId, requestId});
  } catch (error) {
    logger.error("Sibling request creation trigger failed", {
      townId: event.params.townId,
      requestId: event.params.requestId,
      error,
    });
  }
});
