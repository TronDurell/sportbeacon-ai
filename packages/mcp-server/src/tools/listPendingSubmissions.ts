/**
 * List Pending Submissions Tool
 * Lists pending stat submissions for a team
 */

import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ToolResult, ListPendingSubmissionsParams, AuthContext, Submission } from '../types.js';
import { hasResourceAccess } from '../auth.js';

const db = getFirestore();

// Validation schema
const ListPendingSubmissionsSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  range: z.object({
    from: z.string().datetime('Invalid from date'),
    to: z.string().datetime('Invalid to date')
  }).optional()
});

/**
 * List pending stat submissions for a team
 */
export async function listPendingSubmissions(
  params: any,
  auth: AuthContext
): Promise<ToolResult<{ submissions: Submission[] }>> {
  try {
    // Validate input parameters
    const validatedParams = ListPendingSubmissionsSchema.parse(params);
    const { teamId, range } = validatedParams;

    // Check authorization
    if (!hasResourceAccess(auth, 'team', teamId)) {
      return {
        ok: false,
        error: 'Insufficient permissions to access team data'
      };
    }

    // Build query
    let query = db
      .collection('stats_submissions')
      .where('teamId', '==', teamId)
      .where('status', '==', 'pending')
      .orderBy('submittedAt', 'desc');

    // Apply date range filter if provided
    if (range) {
      const fromDate = new Date(range.from);
      const toDate = new Date(range.to);

      // Validate date range
      if (fromDate >= toDate) {
        return {
          ok: false,
          error: 'Invalid date range: from date must be before to date'
        };
      }

      query = query
        .where('submittedAt', '>=', fromDate)
        .where('submittedAt', '<=', toDate);
    }

    // Execute query
    const submissionsSnapshot = await query.limit(100).get(); // Limit to 100 results

    // Convert Firestore documents to Submission objects
    const submissions: Submission[] = submissionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        playerId: data.playerId,
        teamId: data.teamId,
        stats: data.stats || [],
        status: data.status || 'pending',
        submittedAt: data.submittedAt.toDate().toISOString(),
        verifiedAt: data.verifiedAt?.toDate().toISOString(),
        verifiedBy: data.verifiedBy,
        notes: data.notes
      };
    });

    // Apply additional filtering based on user role
    let filteredSubmissions = submissions;

    if (auth.role === 'athlete') {
      // Athletes can only see their own submissions
      filteredSubmissions = submissions.filter(sub => sub.playerId === auth.uid);
    }

    if (auth.role === 'coach') {
      // Coaches can see all submissions for their team
      // Additional team membership validation would be implemented here
    }

    return {
      ok: true,
      data: {
        submissions: filteredSubmissions
      }
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    console.error('Error in listPendingSubmissions:', error);
    return {
      ok: false,
      error: 'Failed to retrieve pending submissions'
    };
  }
}
