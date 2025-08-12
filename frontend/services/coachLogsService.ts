import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/init';
import type { CoachLogDocument, FirebaseError } from '../firebase/types';

// Collection references
const COACH_LOGS_COLLECTION = 'coachLogs';

/**
 * Coach Logs Service
 * Handles all CRUD operations for coach logs and AI feedback in Firestore
 */
export class CoachLogsService {
  /**
   * Get the subcollection reference for a user's coach logs
   */
  private getUserLogsRef(userId: string) {
    return collection(db, COACH_LOGS_COLLECTION, userId, 'logs');
  }

  /**
   * Create a new coach log
   */
  async createLog(userId: string, logData: Omit<CoachLogDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<string> {
    try {
      const logsRef = this.getUserLogsRef(userId);
      const docRef = await addDoc(logsRef, {
        ...logData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId
      });
      
      return docRef.id;
    } catch (error) {
      throw this.handleError(error, 'createLog');
    }
  }

  /**
   * Get a coach log by ID
   */
  async getLogById(userId: string, logId: string): Promise<CoachLogDocument | null> {
    try {
      const logRef = doc(db, COACH_LOGS_COLLECTION, userId, 'logs', logId);
      const logSnap = await getDoc(logRef);
      
      if (logSnap.exists()) {
        return {
          id: logSnap.id,
          ...logSnap.data()
        } as CoachLogDocument;
      }
      
      return null;
    } catch (error) {
      throw this.handleError(error, 'getLogById');
    }
  }

  /**
   * Update a coach log
   */
  async updateLog(userId: string, logId: string, updates: Partial<Omit<CoachLogDocument, 'id' | 'createdAt' | 'createdBy'>>): Promise<void> {
    try {
      const logRef = doc(db, COACH_LOGS_COLLECTION, userId, 'logs', logId);
      await updateDoc(logRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
    } catch (error) {
      throw this.handleError(error, 'updateLog');
    }
  }

  /**
   * Delete a coach log
   */
  async deleteLog(userId: string, logId: string): Promise<void> {
    try {
      const logRef = doc(db, COACH_LOGS_COLLECTION, userId, 'logs', logId);
      await deleteDoc(logRef);
    } catch (error) {
      throw this.handleError(error, 'deleteLog');
    }
  }

  /**
   * Get all coach logs for a user (with optional filtering)
   */
  async getUserLogs(userId: string, filters?: {
    playerId?: string;
    drillId?: string;
    status?: 'completed' | 'in_progress' | 'cancelled';
    limit?: number;
  }): Promise<CoachLogDocument[]> {
    try {
      let q = query(this.getUserLogsRef(userId));
      
      // Apply filters
      if (filters?.playerId) {
        q = query(q, where('playerId', '==', filters.playerId));
      }
      
      if (filters?.drillId) {
        q = query(q, where('drillId', '==', filters.drillId));
      }
      
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      // Apply ordering and limit
      q = query(q, orderBy('date', 'desc'));
      
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CoachLogDocument[];
    } catch (error) {
      throw this.handleError(error, 'getUserLogs');
    }
  }

  /**
   * Get logs for a specific player
   */
  async getPlayerLogs(userId: string, playerId: string, limit?: number): Promise<CoachLogDocument[]> {
    try {
      let q = query(
        this.getUserLogsRef(userId),
        where('playerId', '==', playerId),
        orderBy('date', 'desc')
      );
      
      if (limit) {
        q = query(q, limit(limit));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CoachLogDocument[];
    } catch (error) {
      throw this.handleError(error, 'getPlayerLogs');
    }
  }

  /**
   * Subscribe to real-time updates for user's coach logs
   */
  subscribeToUserLogs(userId: string, filters: {
    playerId?: string;
    drillId?: string;
    status?: 'completed' | 'in_progress' | 'cancelled';
    limit?: number;
  }, callback: (logs: CoachLogDocument[]) => void): () => void {
    let q = query(this.getUserLogsRef(userId));
    
    // Apply filters
    if (filters.playerId) {
      q = query(q, where('playerId', '==', filters.playerId));
    }
    
    if (filters.drillId) {
      q = query(q, where('drillId', '==', filters.drillId));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    // Apply ordering and limit
    q = query(q, orderBy('date', 'desc'));
    
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CoachLogDocument[];
      callback(logs);
    }, (error) => {
      console.error('Error subscribing to user logs:', error);
      callback([]);
    });
    
    return unsubscribe;
  }

  /**
   * Subscribe to real-time updates for a single log
   */
  subscribeToLog(userId: string, logId: string, callback: (log: CoachLogDocument | null) => void): () => void {
    const logRef = doc(db, COACH_LOGS_COLLECTION, userId, 'logs', logId);
    
    const unsubscribe = onSnapshot(logRef, (doc) => {
      if (doc.exists()) {
        const log = {
          id: doc.id,
          ...doc.data()
        } as CoachLogDocument;
        callback(log);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to log:', error);
      callback(null);
    });
    
    return unsubscribe;
  }

  /**
   * Create a drill assignment with AI feedback
   */
  async createDrillAssignment(userId: string, assignmentData: {
    playerId: string;
    drillId: string;
    drillName: string;
    duration: number;
    notes?: string;
  }): Promise<string> {
    try {
      const batch = writeBatch(db);
      
      // Create the coach log
      const logsRef = this.getUserLogsRef(userId);
      const logRef = doc(logsRef);
      
      const logData: Omit<CoachLogDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
        playerId: assignmentData.playerId,
        drillId: assignmentData.drillId,
        drillName: assignmentData.drillName,
        performance: 0, // Will be updated when drill is completed
        feedback: '',
        notes: assignmentData.notes,
        duration: assignmentData.duration,
        date: serverTimestamp(),
        status: 'in_progress',
        aiFeedback: {
          suggestions: [],
          improvements: [],
          nextSteps: []
        }
      };
      
      batch.set(logRef, {
        ...logData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId
      });
      
      await batch.commit();
      return logRef.id;
    } catch (error) {
      throw this.handleError(error, 'createDrillAssignment');
    }
  }

  /**
   * Complete a drill and generate AI feedback
   */
  async completeDrill(userId: string, logId: string, completionData: {
    performance: number;
    feedback: string;
    aiFeedback?: {
      suggestions: string[];
      improvements: string[];
      nextSteps: string[];
    };
  }): Promise<void> {
    try {
      const logRef = doc(db, COACH_LOGS_COLLECTION, userId, 'logs', logId);
      
      const updates: Partial<Omit<CoachLogDocument, 'id' | 'createdAt' | 'createdBy'>> = {
        performance: completionData.performance,
        feedback: completionData.feedback,
        status: 'completed',
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };
      
      if (completionData.aiFeedback) {
        updates.aiFeedback = completionData.aiFeedback;
      }
      
      await updateDoc(logRef, updates);
    } catch (error) {
      throw this.handleError(error, 'completeDrill');
    }
  }

  /**
   * Update AI feedback for a log
   */
  async updateAIFeedback(userId: string, logId: string, aiFeedback: {
    suggestions: string[];
    improvements: string[];
    nextSteps: string[];
  }): Promise<void> {
    try {
      const logRef = doc(db, COACH_LOGS_COLLECTION, userId, 'logs', logId);
      await updateDoc(logRef, {
        aiFeedback,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
    } catch (error) {
      throw this.handleError(error, 'updateAIFeedback');
    }
  }

  /**
   * Get drill history for a player
   */
  async getDrillHistory(userId: string, playerId: string, limit?: number): Promise<CoachLogDocument[]> {
    try {
      let q = query(
        this.getUserLogsRef(userId),
        where('playerId', '==', playerId),
        where('status', '==', 'completed'),
        orderBy('date', 'desc')
      );
      
      if (limit) {
        q = query(q, limit(limit));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CoachLogDocument[];
    } catch (error) {
      throw this.handleError(error, 'getDrillHistory');
    }
  }

  /**
   * Get performance analytics for a player
   */
  async getPlayerAnalytics(userId: string, playerId: string): Promise<{
    totalDrills: number;
    averagePerformance: number;
    totalDuration: number;
    recentTrend: 'improving' | 'declining' | 'stable';
    topDrills: Array<{ drillName: string; performance: number; }>;
  }> {
    try {
      const logs = await this.getPlayerLogs(userId, playerId, 50); // Get last 50 logs
      const completedLogs = logs.filter(log => log.status === 'completed');
      
      if (completedLogs.length === 0) {
        return {
          totalDrills: 0,
          averagePerformance: 0,
          totalDuration: 0,
          recentTrend: 'stable',
          topDrills: []
        };
      }
      
      const totalDrills = completedLogs.length;
      const averagePerformance = completedLogs.reduce((sum, log) => sum + log.performance, 0) / totalDrills;
      const totalDuration = completedLogs.reduce((sum, log) => sum + log.duration, 0);
      
      // Calculate recent trend (last 10 vs previous 10)
      const recentLogs = completedLogs.slice(0, 10);
      const previousLogs = completedLogs.slice(10, 20);
      
      let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (recentLogs.length > 0 && previousLogs.length > 0) {
        const recentAvg = recentLogs.reduce((sum, log) => sum + log.performance, 0) / recentLogs.length;
        const previousAvg = previousLogs.reduce((sum, log) => sum + log.performance, 0) / previousLogs.length;
        
        if (recentAvg > previousAvg + 5) {
          recentTrend = 'improving';
        } else if (recentAvg < previousAvg - 5) {
          recentTrend = 'declining';
        }
      }
      
      // Get top performing drills
      const drillPerformance = new Map<string, number[]>();
      completedLogs.forEach(log => {
        if (!drillPerformance.has(log.drillName)) {
          drillPerformance.set(log.drillName, []);
        }
        drillPerformance.get(log.drillName)!.push(log.performance);
      });
      
      const topDrills = Array.from(drillPerformance.entries())
        .map(([drillName, performances]) => ({
          drillName,
          performance: performances.reduce((sum, perf) => sum + perf, 0) / performances.length
        }))
        .sort((a, b) => b.performance - a.performance)
        .slice(0, 5);
      
      return {
        totalDrills,
        averagePerformance,
        totalDuration,
        recentTrend,
        topDrills
      };
    } catch (error) {
      throw this.handleError(error, 'getPlayerAnalytics');
    }
  }

  /**
   * Handle Firestore errors
   */
  private handleError(error: any, operation: string): FirebaseError {
    console.error(`CoachLogsService ${operation} error:`, error);
    
    return {
      name: 'FirebaseError',
      code: error.code || 'unknown',
      message: error.message || `Failed to ${operation}`,
      details: error
    };
  }
}

// Export singleton instance
export const coachLogsService = new CoachLogsService();

// Export types for use in components
export type { CoachLogDocument }; 