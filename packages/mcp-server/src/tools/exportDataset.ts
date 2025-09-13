/**
 * Export Dataset Tool
 * Export dataset in specified format (CSV or JSON)
 */

import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ToolResult, ExportDatasetParams, AuthContext } from '../types.js';
import { hasResourceAccess } from '../auth.js';

const db = getFirestore();

// Validation schema
const ExportDatasetSchema = z.object({
  filter: z.object({
    teamId: z.string().optional(),
    range: z.object({
      from: z.string().datetime('Invalid from date'),
      to: z.string().datetime('Invalid to date')
    })
  }),
  format: z.enum(['csv', 'json'], { errorMap: () => ({ message: 'Format must be csv or json' }) })
});

/**
 * Export dataset in specified format
 */
export async function exportDataset(
  params: any,
  auth: AuthContext
): Promise<ToolResult<{ jobId: string; statusUrl: string }>> {
  try {
    // Validate input parameters
    const validatedParams = ExportDatasetSchema.parse(params);
    const { filter, format } = validatedParams;

    // Convert date strings to Firestore timestamps
    const fromDate = new Date(filter.range.from);
    const toDate = new Date(filter.range.to);

    // Validate date range
    if (fromDate >= toDate) {
      return {
        ok: false,
        error: 'Invalid date range: from date must be before to date'
      };
    }

    // Check authorization
    if (filter.teamId && !hasResourceAccess(auth, 'team', filter.teamId)) {
      return {
        ok: false,
        error: 'Insufficient permissions to export team data'
      };
    }

    // Create export job
    const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const jobData = {
      id: jobId,
      status: 'pending',
      format,
      filter,
      requestedBy: auth.uid,
      requestedByRole: auth.role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    // Store job in Firestore
    await db.collection('export_jobs').doc(jobId).set(jobData);

    // Start export process asynchronously
    processExportJob(jobId, filter, format, auth).catch(error => {
      console.error(`Export job ${jobId} failed:`, error);
      // Update job status to failed
      db.collection('export_jobs').doc(jobId).update({
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      });
    });

    return {
      ok: true,
      data: {
        jobId,
        statusUrl: `/export/status/${jobId}`
      }
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    console.error('Error in exportDataset:', error);
    return {
      ok: false,
      error: 'Failed to start export job'
    };
  }
}

/**
 * Process export job asynchronously
 */
async function processExportJob(jobId: string, filter: any, format: string, auth: AuthContext): Promise<void> {
  try {
    // Update job status to processing
    await db.collection('export_jobs').doc(jobId).update({
      status: 'processing',
      startedAt: new Date()
    });

    // Collect data based on filter
    const data = await collectExportData(filter, auth);

    // Generate export file
    const exportResult = await generateExportFile(data, format, jobId);

    // Update job with results
    await db.collection('export_jobs').doc(jobId).update({
      status: 'completed',
      completedAt: new Date(),
      downloadUrl: exportResult.downloadUrl,
      fileSize: exportResult.fileSize,
      recordCount: data.length
    });

    console.log(`Export job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Export job ${jobId} failed:`, error);
    throw error;
  }
}

/**
 * Collect data for export based on filter
 */
async function collectExportData(filter: any, auth: AuthContext): Promise<any[]> {
  const fromDate = new Date(filter.range.from);
  const toDate = new Date(filter.range.to);
  const data: any[] = [];

  if (filter.teamId) {
    // Export team data
    const teamData = await collectTeamData(filter.teamId, fromDate, toDate, auth);
    data.push(...teamData);
  } else {
    // Export all accessible data for user
    const userData = await collectUserData(auth, fromDate, toDate);
    data.push(...userData);
  }

  return data;
}

/**
 * Collect team data for export
 */
async function collectTeamData(teamId: string, fromDate: Date, toDate: Date, auth: AuthContext): Promise<any[]> {
  const data: any[] = [];

  try {
    // Get team information
    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) {
      throw new Error('Team not found');
    }

    const teamData = teamDoc.data()!;

    // Get all players in team
    const playersSnapshot = await db
      .collection('players')
      .where('teamId', '==', teamId)
      .get();

    // Get stats for each player
    for (const playerDoc of playersSnapshot.docs) {
      const playerData = playerDoc.data();
      
      const statsSnapshot = await db
        .collection('players')
        .doc(playerDoc.id)
        .collection('stats')
        .where('verified', '==', true)
        .where('timestamp', '>=', fromDate)
        .where('timestamp', '<=', toDate)
        .get();

      for (const statDoc of statsSnapshot.docs) {
        const statData = statDoc.data();
        data.push({
          teamId,
          teamName: teamData.name,
          playerId: playerDoc.id,
          playerName: `${playerData.firstName} ${playerData.lastName}`,
          statType: statData.type,
          statValue: statData.value,
          statUnit: statData.unit,
          timestamp: statData.timestamp.toDate().toISOString(),
          verified: statData.verified,
          verifiedAt: statData.verifiedAt?.toDate().toISOString(),
          verifiedBy: statData.verifiedBy
        });
      }
    }

    // Get team submissions
    const submissionsSnapshot = await db
      .collection('stats_submissions')
      .where('teamId', '==', teamId)
      .where('submittedAt', '>=', fromDate)
      .where('submittedAt', '<=', toDate)
      .get();

    for (const submissionDoc of submissionsSnapshot.docs) {
      const submissionData = submissionDoc.data();
      data.push({
        teamId,
        teamName: teamData.name,
        submissionId: submissionDoc.id,
        playerId: submissionData.playerId,
        status: submissionData.status,
        submittedAt: submissionData.submittedAt.toDate().toISOString(),
        submittedBy: submissionData.submittedBy,
        verifiedAt: submissionData.verifiedAt?.toDate().toISOString(),
        verifiedBy: submissionData.verifiedBy,
        verificationNotes: submissionData.verificationNotes
      });
    }

  } catch (error) {
    console.error('Error collecting team data:', error);
    throw error;
  }

  return data;
}

/**
 * Collect user-accessible data for export
 */
async function collectUserData(auth: AuthContext, fromDate: Date, toDate: Date): Promise<any[]> {
  const data: any[] = [];

  try {
    if (auth.role === 'athlete') {
      // Athletes can only export their own data
      const statsSnapshot = await db
        .collection('players')
        .doc(auth.uid)
        .collection('stats')
        .where('verified', '==', true)
        .where('timestamp', '>=', fromDate)
        .where('timestamp', '<=', toDate)
        .get();

      for (const statDoc of statsSnapshot.docs) {
        const statData = statDoc.data();
        data.push({
          playerId: auth.uid,
          statType: statData.type,
          statValue: statData.value,
          statUnit: statData.unit,
          timestamp: statData.timestamp.toDate().toISOString(),
          verified: statData.verified
        });
      }
    } else if (auth.role === 'coach' && auth.teamId) {
      // Coaches can export their team data
      const teamData = await collectTeamData(auth.teamId, fromDate, toDate, auth);
      data.push(...teamData);
    } else if (auth.role === 'admin') {
      // Admins can export all data (be careful with large datasets)
      const allTeamsSnapshot = await db.collection('teams').limit(10).get(); // Limit for safety
      
      for (const teamDoc of allTeamsSnapshot.docs) {
        const teamData = await collectTeamData(teamDoc.id, fromDate, toDate, auth);
        data.push(...teamData);
      }
    }

  } catch (error) {
    console.error('Error collecting user data:', error);
    throw error;
  }

  return data;
}

/**
 * Generate export file in specified format
 */
async function generateExportFile(data: any[], format: string, jobId: string): Promise<{ downloadUrl: string; fileSize: number }> {
  let fileContent: string;
  let fileName: string;
  let mimeType: string;

  if (format === 'csv') {
    fileContent = generateCSV(data);
    fileName = `export_${jobId}.csv`;
    mimeType = 'text/csv';
  } else {
    fileContent = JSON.stringify(data, null, 2);
    fileName = `export_${jobId}.json`;
    mimeType = 'application/json';
  }

  // In a real implementation, you would upload to Google Cloud Storage
  // For now, we'll simulate with a placeholder URL
  const downloadUrl = `https://storage.googleapis.com/sportbeacon-exports/${fileName}`;
  const fileSize = Buffer.byteLength(fileContent, 'utf8');

  // Store file content in Firestore (in production, use GCS)
  await db.collection('export_files').doc(jobId).set({
    content: fileContent,
    fileName,
    mimeType,
    size: fileSize,
    createdAt: new Date()
  });

  return { downloadUrl, fileSize };
}

/**
 * Generate CSV content from data
 */
function generateCSV(data: any[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  
  // Create CSV header
  const csvRows = [headers.join(',')];

  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      // Escape CSV values
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}
