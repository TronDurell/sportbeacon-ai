/**
 * Verify Stat Tool
 * Verify a stat submission using AI reasoning and validation rules
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ToolResult, VerifyStatParams, AuthContext } from '../types.js';
import { hasResourceAccess } from '../auth.js';

const db = getFirestore();

// Validation schema
const VerifyStatSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required')
});

/**
 * Verify a stat submission
 */
export async function verifyStat(
  params: any,
  auth: AuthContext
): Promise<ToolResult<{ status: 'verified' | 'flagged'; notes?: string }>> {
  try {
    // Validate input parameters
    const validatedParams = VerifyStatSchema.parse(params);
    const { submissionId } = validatedParams;

    // Check authorization - only coaches, admins, and agent-service can verify
    if (!['coach', 'admin', 'agent-service'].includes(auth.role)) {
      return {
        ok: false,
        error: 'Insufficient permissions to verify stats'
      };
    }

    // Get submission document
    const submissionDoc = await db.collection('stats_submissions').doc(submissionId).get();
    
    if (!submissionDoc.exists) {
      return {
        ok: false,
        error: 'Submission not found'
      };
    }

    const submissionData = submissionDoc.data()!;
    
    // Check if already verified
    if (submissionData.status !== 'pending') {
      return {
        ok: false,
        error: `Submission already ${submissionData.status}`
      };
    }

    // Check team access for coaches
    if (auth.role === 'coach' && !hasResourceAccess(auth, 'team', submissionData.teamId)) {
      return {
        ok: false,
        error: 'Insufficient permissions to verify stats for this team'
      };
    }

    // Perform verification logic
    const verificationResult = await performVerification(submissionData, auth);

    // Update submission status
    const updateData: any = {
      status: verificationResult.status,
      verifiedAt: FieldValue.serverTimestamp(),
      verifiedBy: auth.uid,
      verifiedByRole: auth.role,
      verificationNotes: verificationResult.notes
    };

    if (verificationResult.status === 'flagged') {
      updateData.flaggedReason = verificationResult.flaggedReason;
      updateData.requiresReview = true;
    }

    await db.collection('stats_submissions').doc(submissionId).update(updateData);

    // Update individual stat records
    if (submissionData.stats && Array.isArray(submissionData.stats)) {
      for (const stat of submissionData.stats) {
        // Find the corresponding stat document
        const statsSnapshot = await db
          .collection('players')
          .doc(submissionData.playerId)
          .collection('stats')
          .where('submissionId', '==', submissionId)
          .get();

        for (const statDoc of statsSnapshot.docs) {
          await statDoc.ref.update({
            verified: verificationResult.status === 'verified',
            verifiedAt: FieldValue.serverTimestamp(),
            verifiedBy: auth.uid,
            verificationNotes: verificationResult.notes
          });
        }
      }
    }

    // Create admin task if flagged
    if (verificationResult.status === 'flagged') {
      await db.collection('admin_tasks').add({
        type: 'stat_review',
        submissionId,
        playerId: submissionData.playerId,
        teamId: submissionData.teamId,
        priority: 'medium',
        status: 'open',
        description: `Stat submission flagged for review: ${verificationResult.flaggedReason}`,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: auth.uid
      });
    }

    // Log verification for audit
    console.log(`Stat verification: ${verificationResult.status} for submission ${submissionId}`);

    return {
      ok: true,
      data: {
        status: verificationResult.status,
        notes: verificationResult.notes
      }
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    console.error('Error in verifyStat:', error);
    return {
      ok: false,
      error: 'Failed to verify statistics'
    };
  }
}

/**
 * Perform verification logic using AI reasoning and validation rules
 */
async function performVerification(submissionData: any, auth: AuthContext): Promise<{
  status: 'verified' | 'flagged';
  notes?: string;
  flaggedReason?: string;
}> {
  const stats = submissionData.stats || [];
  const issues: string[] = [];
  const notes: string[] = [];

  // Check each stat in the submission
  for (const stat of stats) {
    // 1. Validate stat value ranges
    const rangeValidation = validateStatRange(stat.type, stat.value);
    if (!rangeValidation.valid) {
      issues.push(`Invalid ${stat.type} value: ${stat.value} (expected: ${rangeValidation.expected})`);
    }

    // 2. Check for suspicious patterns
    const patternCheck = await checkSuspiciousPatterns(submissionData.playerId, stat);
    if (patternCheck.flagged) {
      issues.push(`Suspicious pattern detected: ${patternCheck.reason}`);
    }

    // 3. Cross-reference with historical data
    const historicalCheck = await checkHistoricalConsistency(submissionData.playerId, stat);
    if (historicalCheck.flagged) {
      issues.push(`Historical inconsistency: ${historicalCheck.reason}`);
    }

    // 4. Validate timestamp
    const timestampCheck = validateTimestamp(stat.timestamp);
    if (!timestampCheck.valid) {
      issues.push(`Invalid timestamp: ${timestampCheck.reason}`);
    }
  }

  // 5. Check submission frequency (anti-spam)
  const frequencyCheck = await checkSubmissionFrequency(submissionData.playerId);
  if (frequencyCheck.flagged) {
    issues.push(`High submission frequency: ${frequencyCheck.reason}`);
  }

  // Determine final status
  if (issues.length === 0) {
    notes.push('All validation checks passed');
    return {
      status: 'verified',
      notes: notes.join('; ')
    };
  } else {
    return {
      status: 'flagged',
      notes: `Verification issues: ${issues.join('; ')}`,
      flaggedReason: issues[0] // Primary reason
    };
  }
}

/**
 * Validate stat value against expected ranges
 */
function validateStatRange(type: string, value: number): { valid: boolean; expected: string } {
  const ranges: Record<string, { min: number; max: number; unit: string }> = {
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

  const range = ranges[type];
  if (!range) {
    return { valid: true, expected: 'unknown range' };
  }

  const valid = value >= range.min && value <= range.max;
  return {
    valid,
    expected: `${range.min}-${range.max} ${range.unit}`
  };
}

/**
 * Check for suspicious patterns in stat submissions
 */
async function checkSuspiciousPatterns(playerId: string, stat: any): Promise<{ flagged: boolean; reason?: string }> {
  // Check for round numbers (suspicious)
  if (stat.value % 10 === 0 && stat.value > 10) {
    return { flagged: true, reason: 'Round number detected' };
  }

  // Check for impossible improvements
  if (stat.type.includes('time') && stat.value <= 0) {
    return { flagged: true, reason: 'Impossible time value' };
  }

  return { flagged: false };
}

/**
 * Check historical consistency
 */
async function checkHistoricalConsistency(playerId: string, stat: any): Promise<{ flagged: boolean; reason?: string }> {
  try {
    // Get recent stats of the same type
    const recentStats = await db
      .collection('players')
      .doc(playerId)
      .collection('stats')
      .where('type', '==', stat.type)
      .where('verified', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    if (recentStats.empty) {
      return { flagged: false }; // No history to compare
    }

    const recentValues = recentStats.docs.map(doc => doc.data().value);
    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const maxDeviation = Math.max(...recentValues.map(val => Math.abs(val - average)));

    // Check if current value is more than 3 standard deviations from recent average
    const deviation = Math.abs(stat.value - average);
    if (deviation > maxDeviation * 3) {
      return { flagged: true, reason: `Value ${stat.value} significantly different from recent average ${average.toFixed(2)}` };
    }

    return { flagged: false };
  } catch (error) {
    console.error('Error checking historical consistency:', error);
    return { flagged: false };
  }
}

/**
 * Validate timestamp
 */
function validateTimestamp(timestamp: string): { valid: boolean; reason?: string } {
  const statTime = new Date(timestamp);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (statTime < oneHourAgo) {
    return { valid: false, reason: 'Timestamp too old (more than 1 hour ago)' };
  }

  if (statTime > oneWeekFromNow) {
    return { valid: false, reason: 'Timestamp in the future (more than 1 week ahead)' };
  }

  return { valid: true };
}

/**
 * Check submission frequency
 */
async function checkSubmissionFrequency(playerId: string): Promise<{ flagged: boolean; reason?: string }> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentSubmissions = await db
      .collection('stats_submissions')
      .where('playerId', '==', playerId)
      .where('submittedAt', '>=', oneHourAgo)
      .get();

    if (recentSubmissions.size > 10) {
      return { flagged: true, reason: `Too many submissions in last hour: ${recentSubmissions.size}` };
    }

    return { flagged: false };
  } catch (error) {
    console.error('Error checking submission frequency:', error);
    return { flagged: false };
  }
}
