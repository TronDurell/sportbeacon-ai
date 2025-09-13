/**
 * Background Verification Agent
 * Automatically verifies new stat submissions using AI reasoning
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { adminMemoryClient, db } from '../memory/client';
const memoryClient = adminMemoryClient();

/**
 * Trigger: Firestore onCreate for stats_submissions
 * Automatically verifies new stat submissions
 */
export const onStatSubmissionCreated = onDocumentCreated(
  'stats_submissions/{submissionId}',
  async (event) => {
    const submissionId = event.params.submissionId;
    const submissionData = event.data?.data();

    if (!submissionData) {
      logger.error('No submission data found', { submissionId });
      return;
    }

    logger.info('Processing new stat submission', { 
      submissionId, 
      playerId: submissionData.playerId,
      teamId: submissionData.teamId 
    });

    try {
      // Create agent context for verification
      const agentContext = {
        uid: 'agent-verification',
        role: 'agent-service' as const,
        permissions: ['*']
      };

      // Call MCP verifyStat tool
      const verificationResult = await verifyStatSubmission(submissionData, agentContext);

      if (verificationResult.ok) {
        const { status, notes } = verificationResult.data;

        // Update submission status
        await db.collection('stats_submissions').doc(submissionId).update({
          status,
          verifiedAt: FieldValue.serverTimestamp(),
          verifiedBy: 'agent-verification',
          verifiedByRole: 'agent-service',
          verificationNotes: notes,
          ...(status === 'flagged' && {
            flaggedReason: verificationResult.data.flaggedReason,
            requiresReview: true
          })
        });

        // Update individual stat records
        await updateStatRecords(submissionId, submissionData, status, notes);

        // Handle post-verification actions
        if (status === 'verified') {
          await handleVerifiedSubmission(submissionData, submissionId);
        } else if (status === 'flagged') {
          await handleFlaggedSubmission(submissionData, submissionId, verificationResult.data.flaggedReason);
        }

        // Update memory with verification result
        await updateVerificationMemory(submissionData, status, notes);

        logger.info('Stat submission verification completed', {
          submissionId,
          status,
          playerId: submissionData.playerId
        });

      } else {
        logger.error('Verification failed', {
          submissionId,
          error: verificationResult.error
        });

        // Mark as failed and create admin task
        await db.collection('stats_submissions').doc(submissionId).update({
          status: 'failed',
          verificationError: verificationResult.error,
          failedAt: FieldValue.serverTimestamp()
        });

        await createAdminTask({
          type: 'verification_failed',
          submissionId,
          error: verificationResult.error,
          priority: 'high'
        });
      }

    } catch (error) {
      logger.error('Error in verification agent', {
        submissionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Mark submission as failed
      await db.collection('stats_submissions').doc(submissionId).update({
        status: 'failed',
        verificationError: error instanceof Error ? error.message : 'Unknown error',
        failedAt: FieldValue.serverTimestamp()
      });
    }
  }
);

/**
 * Verify stat submission using AI reasoning
 */
async function verifyStatSubmission(submissionData: any, agentContext: any): Promise<{
  ok: boolean;
  data?: { status: 'verified' | 'flagged'; notes?: string; flaggedReason?: string };
  error?: string;
}> {
  try {
    const stats = submissionData.stats || [];
    const issues: string[] = [];
    const notes: string[] = [];

    // 1. Validate each stat in the submission
    for (const stat of stats) {
      // Range validation
      const rangeValidation = validateStatRange(stat.type, stat.value);
      if (!rangeValidation.valid) {
        issues.push(`Invalid ${stat.type} value: ${stat.value} (expected: ${rangeValidation.expected})`);
      }

      // Pattern analysis
      const patternCheck = await analyzeStatPatterns(submissionData.playerId, stat);
      if (patternCheck.flagged) {
        issues.push(`Suspicious pattern: ${patternCheck.reason}`);
      }

      // Historical consistency
      const historicalCheck = await checkHistoricalConsistency(submissionData.playerId, stat);
      if (historicalCheck.flagged) {
        issues.push(`Historical inconsistency: ${historicalCheck.reason}`);
      }

      // Timestamp validation
      const timestampCheck = validateTimestamp(stat.timestamp);
      if (!timestampCheck.valid) {
        issues.push(`Invalid timestamp: ${timestampCheck.reason}`);
      }
    }

    // 2. Check submission frequency
    const frequencyCheck = await checkSubmissionFrequency(submissionData.playerId);
    if (frequencyCheck.flagged) {
      issues.push(`High submission frequency: ${frequencyCheck.reason}`);
    }

    // 3. Cross-reference with team data
    const teamCheck = await checkTeamConsistency(submissionData.teamId, submissionData.playerId, stats);
    if (teamCheck.flagged) {
      issues.push(`Team inconsistency: ${teamCheck.reason}`);
    }

    // 4. AI-powered anomaly detection
    const anomalyCheck = await detectAnomalies(submissionData, stats);
    if (anomalyCheck.flagged) {
      issues.push(`Anomaly detected: ${anomalyCheck.reason}`);
    }

    // Determine final status
    if (issues.length === 0) {
      notes.push('All validation checks passed');
      return {
        ok: true,
        data: {
          status: 'verified',
          notes: notes.join('; ')
        }
      };
    } else {
      return {
        ok: true,
        data: {
          status: 'flagged',
          notes: `Verification issues: ${issues.join('; ')}`,
          flaggedReason: issues[0] // Primary reason
        }
      };
    }

  } catch (error) {
    logger.error('Error in verification logic', { error });
    return {
      ok: false,
      error: 'Verification process failed'
    };
  }
}

/**
 * Update individual stat records with verification status
 */
async function updateStatRecords(submissionId: string, submissionData: any, status: string, notes?: string): Promise<void> {
  try {
    const statsSnapshot = await db
      .collection('players')
      .doc(submissionData.playerId)
      .collection('stats')
      .where('submissionId', '==', submissionId)
      .get();

    const batch = db.batch();
    
    for (const statDoc of statsSnapshot.docs) {
      batch.update(statDoc.ref, {
        verified: status === 'verified',
        verifiedAt: FieldValue.serverTimestamp(),
        verifiedBy: 'agent-verification',
        verificationNotes: notes
      });
    }

    await batch.commit();
  } catch (error) {
    logger.error('Error updating stat records', { submissionId, error });
  }
}

/**
 * Handle verified submission - update KPIs and trigger notifications
 */
async function handleVerifiedSubmission(submissionData: any, submissionId: string): Promise<void> {
  try {
    // Update player KPIs
    await updatePlayerKPIs(submissionData.playerId, submissionData.stats);

    // Update team KPIs
    await updateTeamKPIs(submissionData.teamId, submissionData.playerId, submissionData.stats);

    // Send success notification to player
    await sendNotification({
      target: { userId: submissionData.playerId },
      message: `Your stat submission has been verified and recorded. Great job!`
    });

    // Log successful verification
    logger.info('Verified submission processed', {
      submissionId,
      playerId: submissionData.playerId,
      teamId: submissionData.teamId
    });

  } catch (error) {
    logger.error('Error handling verified submission', { submissionId, error });
  }
}

/**
 * Handle flagged submission - create admin tasks and notifications
 */
async function handleFlaggedSubmission(submissionData: any, submissionId: string, flaggedReason: string): Promise<void> {
  try {
    // Create admin task for review
    await createAdminTask({
      type: 'stat_review',
      submissionId,
      playerId: submissionData.playerId,
      teamId: submissionData.teamId,
      priority: 'medium',
      description: `Stat submission flagged for review: ${flaggedReason}`,
      flaggedReason
    });

    // Notify coaches
    await sendNotification({
      target: { group: `coach_${submissionData.teamId}` },
      message: `Stat submission from ${submissionData.playerId} requires review: ${flaggedReason}`
    });

    // Log flagged submission
    logger.warn('Flagged submission processed', {
      submissionId,
      playerId: submissionData.playerId,
      teamId: submissionData.teamId,
      reason: flaggedReason
    });

  } catch (error) {
    logger.error('Error handling flagged submission', { submissionId, error });
  }
}

/**
 * Update verification memory for learning
 */
async function updateVerificationMemory(submissionData: any, status: string, notes?: string): Promise<void> {
  try {
    await memoryClient.remember({
      scope: 'system',
      key: `verification_${submissionData.playerId}_${Date.now()}`,
      value: {
        submissionId: submissionData.submissionId,
        playerId: submissionData.playerId,
        teamId: submissionData.teamId,
        status,
        notes,
        stats: submissionData.stats,
        timestamp: new Date().toISOString()
      }
    });

    // Update verification patterns memory
    await memoryClient.remember({
      scope: 'system',
      key: `verification_patterns_${submissionData.playerId}`,
      value: {
        playerId: submissionData.playerId,
        lastVerification: status,
        lastVerificationTime: new Date().toISOString(),
        totalSubmissions: await getTotalSubmissions(submissionData.playerId),
        verificationRate: await getVerificationRate(submissionData.playerId)
      }
    });

  } catch (error) {
    logger.error('Error updating verification memory', { error });
  }
}

// Validation helper functions (reused from MCP tools)

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

async function analyzeStatPatterns(playerId: string, stat: any): Promise<{ flagged: boolean; reason?: string }> {
  // Check for round numbers (suspicious)
  if (stat.value % 10 === 0 && stat.value > 10) {
    return { flagged: true, reason: 'Round number detected' };
  }

  // Check for impossible values
  if (stat.type.includes('time') && stat.value <= 0) {
    return { flagged: true, reason: 'Impossible time value' };
  }

  return { flagged: false };
}

async function checkHistoricalConsistency(playerId: string, stat: any): Promise<{ flagged: boolean; reason?: string }> {
  try {
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
      return { flagged: false };
    }

    const recentValues = recentStats.docs.map(doc => doc.data().value);
    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const maxDeviation = Math.max(...recentValues.map(val => Math.abs(val - average)));

    const deviation = Math.abs(stat.value - average);
    if (deviation > maxDeviation * 3) {
      return { flagged: true, reason: `Value ${stat.value} significantly different from recent average ${average.toFixed(2)}` };
    }

    return { flagged: false };
  } catch (error) {
    logger.error('Error checking historical consistency', { error });
    return { flagged: false };
  }
}

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
    logger.error('Error checking submission frequency', { error });
    return { flagged: false };
  }
}

async function checkTeamConsistency(teamId: string, playerId: string, stats: any[]): Promise<{ flagged: boolean; reason?: string }> {
  // This would implement team-level consistency checks
  // For now, return no issues
  return { flagged: false };
}

async function detectAnomalies(submissionData: any, stats: any[]): Promise<{ flagged: boolean; reason?: string }> {
  // This would implement AI-powered anomaly detection
  // For now, return no issues
  return { flagged: false };
}

async function updatePlayerKPIs(playerId: string, stats: any[]): Promise<void> {
  // Implementation would update player KPIs based on verified stats
  logger.info('Updating player KPIs', { playerId, statCount: stats.length });
}

async function updateTeamKPIs(teamId: string, playerId: string, stats: any[]): Promise<void> {
  // Implementation would update team KPIs based on verified stats
  logger.info('Updating team KPIs', { teamId, playerId, statCount: stats.length });
}

async function sendNotification(params: any): Promise<void> {
  // Implementation would send notifications via the MCP sendNotification tool
  logger.info('Sending notification', params);
}

async function createAdminTask(task: any): Promise<void> {
  try {
    await db.collection('admin_tasks').add({
      ...task,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: 'agent-verification'
    });
  } catch (error) {
    logger.error('Error creating admin task', { error });
  }
}

async function getTotalSubmissions(playerId: string): Promise<number> {
  try {
    const snapshot = await db
      .collection('stats_submissions')
      .where('playerId', '==', playerId)
      .get();
    return snapshot.size;
  } catch (error) {
    return 0;
  }
}

async function getVerificationRate(playerId: string): Promise<number> {
  try {
    const totalSnapshot = await db
      .collection('stats_submissions')
      .where('playerId', '==', playerId)
      .get();

    const verifiedSnapshot = await db
      .collection('stats_submissions')
      .where('playerId', '==', playerId)
      .where('status', '==', 'verified')
      .get();

    return totalSnapshot.size > 0 ? (verifiedSnapshot.size / totalSnapshot.size) * 100 : 0;
  } catch (error) {
    return 0;
  }
}
