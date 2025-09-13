/* SportBeaconAI - Admin Integration Tests
   Integration tests for admin verification and dispute resolution
*/

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { 
  Athlete, 
  BasketballStatLine, 
  FeedbackEvent,
  AdminQueueItem 
} from '../../../domain/types';

// ============================================================================
// TEST SETUP
// ============================================================================

let testEnv: RulesTestEnvironment;

describe('Admin Integration Tests', () => {
  beforeEach(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'sportbeacon-test',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /athletes/{athleteId} {
                allow read, write: if true; // Simplified for testing
              }
              match /athletes/{athleteId}/statLines/{statId} {
                allow read, write: if true; // Simplified for testing
              }
              match /athletes/{athleteId}/feedback/{feedbackId} {
                allow read, write: if true; // Simplified for testing
              }
              match /adminQueues/{queueType}/items/{itemId} {
                allow read, write: if true; // Simplified for testing
              }
              match /adminLogs/{logId} {
                allow read, write: if true; // Simplified for testing
              }
            }
          }
        `
      }
    });
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  // ============================================================================
  // STAT VERIFICATION TESTS
  // ============================================================================

  describe('Stat Verification', () => {
    it('should verify a pending stat line', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Create test athlete
      const athlete: Athlete = {
        id: 'athlete_123',
        firstName: 'John',
        lastName: 'Doe',
        sports: ['basketball'],
        primarySport: 'basketball',
        graduationYear: 2024,
        currentSchool: 'Lincoln High School',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: 'system',
        verificationStatus: 'unverified',
        qualityScore: 0.5,
        tags: [],
        metadata: {}
      };

      await setDoc(doc(db, 'athletes', athlete.id), athlete);

      // Create test stat line
      const statLine: BasketballStatLine = {
        id: 'stat_123',
        athleteId: athlete.id,
        seasonId: 'season_123',
        gameId: 'game_123',
        points: 25,
        rebounds: 10,
        assists: 5,
        steals: 2,
        blocks: 1,
        turnovers: 3,
        personalFouls: 2,
        fieldGoalsMade: 10,
        fieldGoalsAttempted: 18,
        threePointersMade: 3,
        threePointersAttempted: 6,
        freeThrowsMade: 2,
        freeThrowsAttempted: 3,
        fieldGoalPercentage: 0.556,
        threePointPercentage: 0.5,
        freeThrowPercentage: 0.667,
        plusMinus: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'coach_456',
        lastModifiedBy: 'coach_456',
        isVerified: false,
        metadata: {}
      };

      await setDoc(doc(db, `athletes/${athlete.id}/statLines`, statLine.id), statLine);

      // Create admin queue item
      const queueItem: AdminQueueItem = {
        id: 'queue_123',
        queueType: 'verification',
        priority: 'medium',
        status: 'pending',
        targetType: 'statLine',
        targetId: statLine.id,
        athleteId: athlete.id,
        title: 'Basketball Stats Verification',
        description: 'Coach submitted basketball stats for John Doe vs Lincoln High',
        submittedBy: 'coach_456',
        submittedAt: new Date(),
        tags: ['basketball', 'stats', 'verification'],
        metadata: {
          sport: 'basketball',
          statType: 'game_stats',
          submittedBy: 'coach_456'
        }
      };

      await setDoc(doc(db, 'adminQueues/verification/items', queueItem.id), queueItem);

      // Verify the stat line
      const updatedStatLine = {
        ...statLine,
        isVerified: true,
        verifiedBy: 'admin_789',
        verifiedAt: new Date(),
        verificationStatus: 'verified',
        updatedAt: new Date(),
        lastModifiedBy: 'admin_789'
      };

      await updateDoc(doc(db, `athletes/${athlete.id}/statLines`, statLine.id), updatedStatLine);

      // Update admin queue item
      const updatedQueueItem = {
        ...queueItem,
        status: 'resolved',
        resolvedBy: 'admin_789',
        resolvedAt: new Date(),
        resolution: 'approved'
      };

      await updateDoc(doc(db, 'adminQueues/verification/items', queueItem.id), updatedQueueItem);

      // Create verification log
      const verificationLog = {
        id: 'verification_123',
        statId: statLine.id,
        athleteId: athlete.id,
        action: 'approve',
        verifiedBy: 'admin_789',
        verifiedAt: new Date(),
        previousStatus: 'unverified',
        newStatus: 'verified',
        metadata: {
          adminId: 'admin_789',
          timestamp: new Date().toISOString()
        }
      };

      await setDoc(doc(db, 'adminLogs', verificationLog.id), verificationLog);

      // Verify the stat line was updated
      const updatedStatDoc = await getDoc(doc(db, `athletes/${athlete.id}/statLines`, statLine.id));
      const updatedStatData = updatedStatDoc.data();
      
      expect(updatedStatData?.isVerified).toBe(true);
      expect(updatedStatData?.verifiedBy).toBe('admin_789');
      expect(updatedStatData?.verificationStatus).toBe('verified');

      // Verify the queue item was updated
      const updatedQueueDoc = await getDoc(doc(db, 'adminQueues/verification/items', queueItem.id));
      const updatedQueueData = updatedQueueDoc.data();
      
      expect(updatedQueueData?.status).toBe('resolved');
      expect(updatedQueueData?.resolvedBy).toBe('admin_789');
      expect(updatedQueueData?.resolution).toBe('approved');

      // Verify the log was created
      const logDoc = await getDoc(doc(db, 'adminLogs', verificationLog.id));
      const logData = logDoc.data();
      
      expect(logData?.action).toBe('approve');
      expect(logData?.verifiedBy).toBe('admin_789');
    });

    it('should reject a stat line with reason', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Create test data (similar to above)
      const athlete: Athlete = {
        id: 'athlete_456',
        firstName: 'Jane',
        lastName: 'Smith',
        sports: ['basketball'],
        primarySport: 'basketball',
        graduationYear: 2024,
        currentSchool: 'Washington High School',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: 'system',
        verificationStatus: 'unverified',
        qualityScore: 0.5,
        tags: [],
        metadata: {}
      };

      await setDoc(doc(db, 'athletes', athlete.id), athlete);

      const statLine: BasketballStatLine = {
        id: 'stat_456',
        athleteId: athlete.id,
        seasonId: 'season_456',
        gameId: 'game_456',
        points: 50, // Suspiciously high
        rebounds: 20,
        assists: 15,
        steals: 10,
        blocks: 8,
        turnovers: 1,
        personalFouls: 0,
        fieldGoalsMade: 20,
        fieldGoalsAttempted: 25,
        threePointersMade: 10,
        threePointersAttempted: 12,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        fieldGoalPercentage: 0.8,
        threePointPercentage: 0.833,
        freeThrowPercentage: 0,
        plusMinus: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'coach_789',
        lastModifiedBy: 'coach_789',
        isVerified: false,
        metadata: {}
      };

      await setDoc(doc(db, `athletes/${athlete.id}/statLines`, statLine.id), statLine);

      // Reject the stat line
      const rejectionReason = 'Stats appear inflated and unrealistic';
      const updatedStatLine = {
        ...statLine,
        isVerified: false,
        verificationStatus: 'rejected',
        rejectionReason: rejectionReason,
        rejectedBy: 'admin_789',
        rejectedAt: new Date(),
        updatedAt: new Date(),
        lastModifiedBy: 'admin_789'
      };

      await updateDoc(doc(db, `athletes/${athlete.id}/statLines`, statLine.id), updatedStatLine);

      // Verify the stat line was rejected
      const updatedStatDoc = await getDoc(doc(db, `athletes/${athlete.id}/statLines`, statLine.id));
      const updatedStatData = updatedStatDoc.data();
      
      expect(updatedStatData?.isVerified).toBe(false);
      expect(updatedStatData?.verificationStatus).toBe('rejected');
      expect(updatedStatData?.rejectionReason).toBe(rejectionReason);
      expect(updatedStatData?.rejectedBy).toBe('admin_789');
    });
  });

  // ============================================================================
  // DISPUTE RESOLUTION TESTS
  // ============================================================================

  describe('Dispute Resolution', () => {
    it('should resolve a dispute successfully', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Create test athlete
      const athlete: Athlete = {
        id: 'athlete_789',
        firstName: 'Mike',
        lastName: 'Johnson',
        sports: ['basketball'],
        primarySport: 'basketball',
        graduationYear: 2024,
        currentSchool: 'Roosevelt High School',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: 'system',
        verificationStatus: 'unverified',
        qualityScore: 0.5,
        tags: [],
        metadata: {}
      };

      await setDoc(doc(db, 'athletes', athlete.id), athlete);

      // Create test dispute
      const dispute: FeedbackEvent = {
        id: 'dispute_123',
        athleteId: athlete.id,
        type: 'DISPUTE',
        submittedBy: 'parent_456',
        submittedAt: new Date(),
        targetType: 'statLine',
        targetId: 'stat_789',
        description: 'The points recorded for my child are incorrect',
        priority: 'high',
        status: 'pending',
        metadata: {
          disputedValue: 25,
          recordedValue: 20,
          disputeType: 'stat_accuracy'
        }
      };

      await setDoc(doc(db, `athletes/${athlete.id}/feedback`, dispute.id), dispute);

      // Create admin queue item
      const queueItem: AdminQueueItem = {
        id: 'queue_789',
        queueType: 'dispute',
        priority: 'high',
        status: 'pending',
        targetType: 'statLine',
        targetId: 'stat_789',
        athleteId: athlete.id,
        title: 'Points Dispute',
        description: 'Parent disputes the points recorded for their child',
        submittedBy: 'parent_456',
        submittedAt: new Date(),
        tags: ['basketball', 'dispute', 'points'],
        metadata: {
          sport: 'basketball',
          disputeType: 'stat_accuracy',
          disputedValue: 25,
          recordedValue: 20
        }
      };

      await setDoc(doc(db, 'adminQueues/dispute/items', queueItem.id), queueItem);

      // Resolve the dispute
      const resolution = 'Points corrected from 20 to 25 after reviewing game footage';
      const resolutionReason = 'Game footage confirms the disputed points';
      
      const updatedDispute = {
        ...dispute,
        status: 'resolved',
        resolvedBy: 'admin_789',
        resolvedAt: new Date(),
        resolution: resolution,
        resolutionReason: resolutionReason
      };

      await updateDoc(doc(db, `athletes/${athlete.id}/feedback`, dispute.id), updatedDispute);

      // Update admin queue item
      const updatedQueueItem = {
        ...queueItem,
        status: 'resolved',
        resolvedBy: 'admin_789',
        resolvedAt: new Date(),
        resolution: 'resolved',
        resolutionReason: resolutionReason
      };

      await updateDoc(doc(db, 'adminQueues/dispute/items', queueItem.id), updatedQueueItem);

      // Create resolution log
      const resolutionLog = {
        id: 'resolution_123',
        disputeId: dispute.id,
        athleteId: athlete.id,
        action: 'resolve',
        resolution: resolution,
        resolutionReason: resolutionReason,
        resolvedBy: 'admin_789',
        resolvedAt: new Date(),
        previousStatus: 'pending',
        newStatus: 'resolved',
        targetType: 'statLine',
        targetId: 'stat_789',
        metadata: {
          adminId: 'admin_789',
          timestamp: new Date().toISOString()
        }
      };

      await setDoc(doc(db, 'adminLogs', resolutionLog.id), resolutionLog);

      // Verify the dispute was resolved
      const updatedDisputeDoc = await getDoc(doc(db, `athletes/${athlete.id}/feedback`, dispute.id));
      const updatedDisputeData = updatedDisputeDoc.data();
      
      expect(updatedDisputeData?.status).toBe('resolved');
      expect(updatedDisputeData?.resolvedBy).toBe('admin_789');
      expect(updatedDisputeData?.resolution).toBe(resolution);

      // Verify the queue item was updated
      const updatedQueueDoc = await getDoc(doc(db, 'adminQueues/dispute/items', queueItem.id));
      const updatedQueueData = updatedQueueDoc.data();
      
      expect(updatedQueueData?.status).toBe('resolved');
      expect(updatedQueueData?.resolvedBy).toBe('admin_789');

      // Verify the log was created
      const logDoc = await getDoc(doc(db, 'adminLogs', resolutionLog.id));
      const logData = logDoc.data();
      
      expect(logData?.action).toBe('resolve');
      expect(logData?.resolvedBy).toBe('admin_789');
    });

    it('should reject a dispute with reason', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Create test dispute
      const dispute: FeedbackEvent = {
        id: 'dispute_456',
        athleteId: 'athlete_789',
        type: 'DISPUTE',
        submittedBy: 'parent_789',
        submittedAt: new Date(),
        targetType: 'statLine',
        targetId: 'stat_456',
        description: 'The rebounds recorded are wrong',
        priority: 'medium',
        status: 'pending',
        metadata: {
          disputeType: 'stat_accuracy'
        }
      };

      await setDoc(doc(db, `athletes/athlete_789/feedback`, dispute.id), dispute);

      // Reject the dispute
      const rejectionReason = 'Stats verified against official scorebook';
      const updatedDispute = {
        ...dispute,
        status: 'rejected',
        resolvedBy: 'admin_789',
        resolvedAt: new Date(),
        resolution: 'rejected',
        resolutionReason: rejectionReason
      };

      await updateDoc(doc(db, `athletes/athlete_789/feedback`, dispute.id), updatedDispute);

      // Verify the dispute was rejected
      const updatedDisputeDoc = await getDoc(doc(db, `athletes/athlete_789/feedback`, dispute.id));
      const updatedDisputeData = updatedDisputeDoc.data();
      
      expect(updatedDisputeData?.status).toBe('rejected');
      expect(updatedDisputeData?.resolvedBy).toBe('admin_789');
      expect(updatedDisputeData?.resolutionReason).toBe(rejectionReason);
    });
  });

  // ============================================================================
  // QUEUE MANAGEMENT TESTS
  // ============================================================================

  describe('Queue Management', () => {
    it('should query pending verification items', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Create multiple queue items
      const queueItems = [
        {
          id: 'queue_1',
          queueType: 'verification',
          priority: 'high',
          status: 'pending',
          targetType: 'statLine',
          targetId: 'stat_1',
          athleteId: 'athlete_1',
          title: 'High Priority Verification',
          description: 'Urgent stat verification needed',
          submittedBy: 'coach_1',
          submittedAt: new Date(),
          tags: ['urgent'],
          metadata: {}
        },
        {
          id: 'queue_2',
          queueType: 'verification',
          priority: 'medium',
          status: 'pending',
          targetType: 'statLine',
          targetId: 'stat_2',
          athleteId: 'athlete_2',
          title: 'Medium Priority Verification',
          description: 'Standard stat verification',
          submittedBy: 'coach_2',
          submittedAt: new Date(),
          tags: ['standard'],
          metadata: {}
        },
        {
          id: 'queue_3',
          queueType: 'verification',
          priority: 'low',
          status: 'resolved',
          targetType: 'statLine',
          targetId: 'stat_3',
          athleteId: 'athlete_3',
          title: 'Resolved Verification',
          description: 'Already resolved',
          submittedBy: 'coach_3',
          submittedAt: new Date(),
          resolvedBy: 'admin_1',
          resolvedAt: new Date(),
          resolution: 'approved',
          tags: ['resolved'],
          metadata: {}
        }
      ];

      for (const item of queueItems) {
        await setDoc(doc(db, 'adminQueues/verification/items', item.id), item);
      }

      // Query pending items
      const pendingQuery = query(
        collection(db, 'adminQueues/verification/items'),
        where('status', '==', 'pending')
      );

      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingItems = pendingSnapshot.docs.map(doc => doc.data());

      expect(pendingItems).toHaveLength(2);
      expect(pendingItems.every(item => item.status === 'pending')).toBe(true);

      // Query high priority items
      const highPriorityQuery = query(
        collection(db, 'adminQueues/verification/items'),
        where('priority', '==', 'high')
      );

      const highPrioritySnapshot = await getDocs(highPriorityQuery);
      const highPriorityItems = highPrioritySnapshot.docs.map(doc => doc.data());

      expect(highPriorityItems).toHaveLength(1);
      expect(highPriorityItems[0].priority).toBe('high');
    });

    it('should query pending dispute items', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Create dispute queue items
      const disputeItems = [
        {
          id: 'dispute_queue_1',
          queueType: 'dispute',
          priority: 'critical',
          status: 'pending',
          targetType: 'statLine',
          targetId: 'stat_1',
          athleteId: 'athlete_1',
          title: 'Critical Dispute',
          description: 'Urgent dispute resolution needed',
          submittedBy: 'parent_1',
          submittedAt: new Date(),
          tags: ['critical'],
          metadata: {}
        },
        {
          id: 'dispute_queue_2',
          queueType: 'dispute',
          priority: 'medium',
          status: 'pending',
          targetType: 'highlight',
          targetId: 'highlight_1',
          athleteId: 'athlete_2',
          title: 'Highlight Dispute',
          description: 'Dispute over highlight content',
          submittedBy: 'parent_2',
          submittedAt: new Date(),
          tags: ['highlight'],
          metadata: {}
        }
      ];

      for (const item of disputeItems) {
        await setDoc(doc(db, 'adminQueues/dispute/items', item.id), item);
      }

      // Query pending disputes
      const pendingDisputesQuery = query(
        collection(db, 'adminQueues/dispute/items'),
        where('status', '==', 'pending')
      );

      const pendingDisputesSnapshot = await getDocs(pendingDisputesQuery);
      const pendingDisputes = pendingDisputesSnapshot.docs.map(doc => doc.data());

      expect(pendingDisputes).toHaveLength(2);
      expect(pendingDisputes.every(item => item.status === 'pending')).toBe(true);
    });
  });

  // ============================================================================
  // AUDIT TRAIL TESTS
  // ============================================================================

  describe('Audit Trail', () => {
    it('should create comprehensive audit logs', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Create audit log for stat verification
      const verificationLog = {
        id: 'audit_123',
        type: 'stat_verification',
        action: 'approve',
        targetId: 'stat_123',
        targetType: 'statLine',
        athleteId: 'athlete_123',
        performedBy: 'admin_789',
        performedAt: new Date(),
        details: {
          previousStatus: 'unverified',
          newStatus: 'verified',
          verificationTime: 3600000 // 1 hour
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date().toISOString()
        }
      };

      await setDoc(doc(db, 'adminLogs', verificationLog.id), verificationLog);

      // Verify the audit log was created
      const logDoc = await getDoc(doc(db, 'adminLogs', verificationLog.id));
      const logData = logDoc.data();
      
      expect(logData?.type).toBe('stat_verification');
      expect(logData?.action).toBe('approve');
      expect(logData?.performedBy).toBe('admin_789');
      expect(logData?.details.previousStatus).toBe('unverified');
      expect(logData?.details.newStatus).toBe('verified');
    });

    it('should create audit logs for dispute resolution', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Create audit log for dispute resolution
      const resolutionLog = {
        id: 'audit_456',
        type: 'dispute_resolution',
        action: 'resolve',
        targetId: 'dispute_123',
        targetType: 'dispute',
        athleteId: 'athlete_456',
        performedBy: 'admin_789',
        performedAt: new Date(),
        details: {
          previousStatus: 'pending',
          newStatus: 'resolved',
          resolutionReason: 'Data corrected after review',
          disputeResolutionTime: 7200000 // 2 hours
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date().toISOString()
        }
      };

      await setDoc(doc(db, 'adminLogs', resolutionLog.id), resolutionLog);

      // Verify the audit log was created
      const logDoc = await getDoc(doc(db, 'adminLogs', resolutionLog.id));
      const logData = logDoc.data();
      
      expect(logData?.type).toBe('dispute_resolution');
      expect(logData?.action).toBe('resolve');
      expect(logData?.performedBy).toBe('admin_789');
      expect(logData?.details.disputeResolutionTime).toBe(7200000);
    });
  });
});
