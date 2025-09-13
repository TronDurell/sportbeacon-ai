/**
 * Submit Stat Tool
 * Submit new player statistics
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ToolResult, SubmitStatParams, AuthContext, StatInput } from '../types.js';
import { hasResourceAccess } from '../auth.js';

const db = getFirestore();

// Validation schema
const SubmitStatSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  payload: z.object({
    type: z.string().min(1, 'Stat type is required'),
    value: z.number().finite('Stat value must be a valid number'),
    unit: z.string().min(1, 'Unit is required'),
    timestamp: z.string().datetime('Invalid timestamp'),
    metadata: z.record(z.any()).optional()
  })
});

/**
 * Submit new player statistics
 */
export async function submitStat(
  params: any,
  auth: AuthContext
): Promise<ToolResult<{ submissionId: string }>> {
  try {
    // Validate input parameters
    const validatedParams = SubmitStatSchema.parse(params);
    const { playerId, payload } = validatedParams;

    // Check authorization
    if (!hasResourceAccess(auth, 'player', playerId)) {
      return {
        ok: false,
        error: 'Insufficient permissions to submit stats for this player'
      };
    }

    // Additional role-based checks
    if (auth.role === 'athlete' && auth.uid !== playerId) {
      return {
        ok: false,
        error: 'Athletes can only submit stats for themselves'
      };
    }

    // Validate stat value ranges based on type
    const validationResult = validateStatValue(payload.type, payload.value);
    if (!validationResult.valid) {
      return {
        ok: false,
        error: validationResult.error || 'Validation failed'
      };
    }

    // Get player and team information
    const playerDoc = await db.collection('players').doc(playerId).get();
    if (!playerDoc.exists) {
      return {
        ok: false,
        error: 'Player not found'
      };
    }

    const playerData = playerDoc.data()!;
    const teamId = playerData.teamId;

    if (!teamId) {
      return {
        ok: false,
        error: 'Player is not assigned to a team'
      };
    }

    // Create submission document
    const submissionData = {
      playerId,
      teamId,
      stats: [payload],
      status: 'pending',
      submittedAt: FieldValue.serverTimestamp(),
      submittedBy: auth.uid,
      submittedByRole: auth.role,
      // Add validation metadata
      validation: {
        timestamp: new Date(payload.timestamp),
        isValidTimestamp: true,
        statType: payload.type,
        valueRange: validationResult.range
      }
    };

    // Store submission in Firestore
    const submissionRef = await db.collection('stats_submissions').add(submissionData);

    // Also store individual stat in player's stats collection for quick access
    const statData = {
      ...payload,
      timestamp: new Date(payload.timestamp),
      verified: false,
      submittedAt: FieldValue.serverTimestamp(),
      submissionId: submissionRef.id
    };

    await db
      .collection('players')
      .doc(playerId)
      .collection('stats')
      .add(statData);

    // Update player's last activity
    await db.collection('players').doc(playerId).update({
      lastStatSubmission: FieldValue.serverTimestamp(),
      lastActivity: FieldValue.serverTimestamp()
    });

    // Log the submission for audit purposes
    console.log(`Stat submitted: ${payload.type} = ${payload.value} ${payload.unit} for player ${playerId}`);

    return {
      ok: true,
      data: {
        submissionId: submissionRef.id
      }
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    console.error('Error in submitStat:', error);
    return {
      ok: false,
      error: 'Failed to submit statistics'
    };
  }
}

/**
 * Validate stat value based on type
 */
function validateStatValue(type: string, value: number): { valid: boolean; error?: string; range?: string } {
  const validations: Record<string, { min: number; max: number; unit: string }> = {
    'time_40yd': { min: 3.0, max: 8.0, unit: 'seconds' },
    'time_100m': { min: 8.0, max: 20.0, unit: 'seconds' },
    'height': { min: 48, max: 96, unit: 'inches' },
    'weight': { min: 80, max: 400, unit: 'pounds' },
    'bench_press': { min: 0, max: 1000, unit: 'pounds' },
    'squat': { min: 0, max: 1500, unit: 'pounds' },
    'deadlift': { min: 0, max: 1500, unit: 'pounds' },
    'vertical_jump': { min: 0, max: 60, unit: 'inches' },
    'broad_jump': { min: 0, max: 150, unit: 'inches' },
    'shuttle_run': { min: 8.0, max: 20.0, unit: 'seconds' },
    'mile_time': { min: 240, max: 1200, unit: 'seconds' },
    'push_ups': { min: 0, max: 200, unit: 'reps' },
    'pull_ups': { min: 0, max: 50, unit: 'reps' },
    'sit_ups': { min: 0, max: 200, unit: 'reps' }
  };

  const validation = validations[type];
  if (!validation) {
    return {
      valid: true, // Allow unknown stat types
      range: 'unknown'
    };
  }

  if (value < validation.min || value > validation.max) {
    return {
      valid: false,
      error: `${type} value must be between ${validation.min} and ${validation.max} ${validation.unit}`,
      range: `${validation.min}-${validation.max} ${validation.unit}`
    };
  }

  return {
    valid: true,
    range: `${validation.min}-${validation.max} ${validation.unit}`
  };
}
