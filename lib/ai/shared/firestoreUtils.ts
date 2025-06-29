import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  serverTimestamp, 
  writeBatch,
  DocumentData,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface FirestoreWriteOptions {
  merge?: boolean;
  batch?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

export interface AnalyticsEvent {
  eventName: string;
  userId: string;
  module: string;
  action: string;
  data: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
}

export class FirestoreUtils {
  private static instance: FirestoreUtils;
  private batchOperations: Map<string, any[]> = new Map();
  private analyticsEvents: AnalyticsEvent[] = [];

  static getInstance(): FirestoreUtils {
    if (!FirestoreUtils.instance) {
      FirestoreUtils.instance = new FirestoreUtils();
    }
    return FirestoreUtils.instance;
  }

  async writeDocument<T extends DocumentData>(
    collectionPath: string,
    data: T,
    documentId?: string,
    options: FirestoreWriteOptions = {}
  ): Promise<string> {
    const { merge = true, retryAttempts = 3, timeout = 10000 } = options;

    try {
      let docRef: DocumentReference;

      if (documentId) {
        docRef = doc(db, collectionPath, documentId);
        await setDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge });
      } else {
        const colRef = collection(db, collectionPath);
        docRef = await addDoc(colRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Log analytics event
      this.logAnalyticsEvent({
        eventName: 'firestore_write',
        userId: data.userId || 'system',
        module: 'firestore_utils',
        action: documentId ? 'update' : 'create',
        data: { collectionPath, documentId: docRef.id },
        timestamp: new Date()
      });

      return docRef.id;
    } catch (error) {
      console.error('FirestoreUtils: Write failed:', error);
      
      if (retryAttempts > 0) {
        await this.delay(1000);
        return this.writeDocument(collectionPath, data, documentId, {
          ...options,
          retryAttempts: retryAttempts - 1
        });
      }
      
      throw error;
    }
  }

  async writeBatch(operations: Array<{
    type: 'set' | 'update' | 'delete';
    collectionPath: string;
    documentId?: string;
    data?: DocumentData;
  }>): Promise<void> {
    const batch = writeBatch(db);

    operations.forEach(op => {
      const docRef = doc(db, op.collectionPath, op.documentId || 'temp');
      
      switch (op.type) {
        case 'set':
          if (op.data) {
            batch.set(docRef, {
              ...op.data,
              updatedAt: serverTimestamp()
            });
          }
          break;
        case 'update':
          if (op.data) {
            batch.update(docRef, {
              ...op.data,
              updatedAt: serverTimestamp()
            });
          }
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });

    await batch.commit();

    // Log batch analytics
    this.logAnalyticsEvent({
      eventName: 'firestore_batch_write',
      userId: 'system',
      module: 'firestore_utils',
      action: 'batch_write',
      data: { operationCount: operations.length },
      timestamp: new Date()
    });
  }

  async saveScoutAnalysis(analysis: any): Promise<string> {
    const analysisData = {
      ...analysis,
      createdAt: serverTimestamp(),
      status: 'completed',
      version: '1.0'
    };

    return this.writeDocument('scoutAnalyses', analysisData);
  }

  async saveCoachRecommendation(recommendation: any): Promise<string> {
    const recommendationData = {
      ...recommendation,
      createdAt: serverTimestamp(),
      status: 'active',
      version: '1.0'
    };

    return this.writeDocument('coachRecommendations', recommendationData);
  }

  async saveAthleteProfile(userId: string, profile: any): Promise<string> {
    const profileData = {
      ...profile,
      userId,
      updatedAt: serverTimestamp(),
      version: '1.0'
    };

    return this.writeDocument('athleteProfiles', profileData, userId);
  }

  async saveEventAnalysis(eventAnalysis: any): Promise<string> {
    const analysisData = {
      ...eventAnalysis,
      createdAt: serverTimestamp(),
      status: 'completed',
      version: '1.0'
    };

    return this.writeDocument('eventAnalyses', analysisData);
  }

  async savePerformanceReport(report: any): Promise<string> {
    const reportData = {
      ...report,
      createdAt: serverTimestamp(),
      status: 'generated',
      version: '1.0'
    };

    return this.writeDocument('performanceReports', reportData);
  }

  async savePDFReport(userId: string, reportData: any): Promise<string> {
    const pdfData = {
      ...reportData,
      userId,
      type: 'scout_report',
      createdAt: serverTimestamp(),
      status: 'uploaded',
      version: '1.0'
    };

    return this.writeDocument('pdfReports', pdfData);
  }

  async updateAthleteScoutReports(userId: string, reportId: string): Promise<void> {
    const athleteRef = doc(db, 'athletes', userId);
    
    await updateDoc(athleteRef, {
      scoutReports: serverTimestamp(),
      lastScoutReport: reportId,
      updatedAt: serverTimestamp()
    });

    // Log analytics
    this.logAnalyticsEvent({
      eventName: 'scout_report_updated',
      userId,
      module: 'firestore_utils',
      action: 'update_scout_reports',
      data: { reportId },
      timestamp: new Date()
    });
  }

  async saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.writeDocument('analytics', {
        ...event,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('FirestoreUtils: Failed to save analytics event:', error);
      // Don't throw - analytics failures shouldn't break main functionality
    }
  }

  logAnalyticsEvent(event: AnalyticsEvent): void {
    this.analyticsEvents.push(event);
    
    // Batch save analytics events every 10 events
    if (this.analyticsEvents.length >= 10) {
      this.flushAnalyticsEvents();
    }
  }

  private async flushAnalyticsEvents(): Promise<void> {
    if (this.analyticsEvents.length === 0) return;

    const eventsToSave = [...this.analyticsEvents];
    this.analyticsEvents = [];

    try {
      const batch = writeBatch(db);
      
      eventsToSave.forEach(event => {
        const docRef = doc(collection(db, 'analytics'));
        batch.set(docRef, {
          ...event,
          timestamp: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('FirestoreUtils: Failed to flush analytics events:', error);
      // Re-add events to queue for retry
      this.analyticsEvents.unshift(...eventsToSave);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    await this.flushAnalyticsEvents();
    this.batchOperations.clear();
  }
}

// Export singleton instance
export const firestoreUtils = FirestoreUtils.getInstance(); 