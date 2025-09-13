import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { db } from '../lib/firebase';
import { captureAPIError, captureDBError, withAsyncErrorMonitoring } from '../lib/errorMonitoring';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: any;
  total: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Base API Service Class
class RealApiService {
  private auth = getAuth();
  private currentUser: FirebaseUser | null = null;

  constructor() {
    this.setupAuthListener();
  }

  private setupAuthListener() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
    });
  }

  private getCurrentUserId(): string {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    return this.currentUser.uid;
  }

  private async getCurrentUserRole(): Promise<string> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data().role || 'user';
      }
      return 'user';
    } catch (error) {
      captureDBError(error as Error, { context: 'get_user_role' });
      return 'user';
    }
  }

  // Generic CRUD operations
  async create<T>(collectionName: string, data: T): Promise<ApiResponse<T>> {
    const wrappedFn = withAsyncErrorMonitoring(async () => {
      try {
        const docRef = await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: this.getCurrentUserId(),
        });

        const doc = await getDoc(docRef);
        return {
          success: true,
          data: { id: docRef.id, ...doc.data() } as T,
        };
      } catch (error) {
        captureDBError(error as Error, { context: 'create' });
        throw error;
      }
    });
    return wrappedFn();
  }

  async getById<T>(collectionName: string, id: string): Promise<ApiResponse<T>> {
    const wrappedFn = withAsyncErrorMonitoring(async () => {
      try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          return {
            success: false,
            error: 'Document not found',
          };
        }

        return {
          success: true,
          data: { id: docSnap.id, ...docSnap.data() } as T,
        };
      } catch (error) {
        captureDBError(error as Error, { context: 'get_by_id', collectionName, id });
        throw error;
      }
    });
    return wrappedFn();
  }

  async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    const wrappedFn = withAsyncErrorMonitoring(async () => {
      try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp(),
          updatedBy: this.getCurrentUserId(),
        });

        const updatedDoc = await getDoc(docRef);
        return {
          success: true,
          data: { id: updatedDoc.id, ...updatedDoc.data() } as T,
        };
      } catch (error) {
        captureDBError(error as Error, { context: 'update', collectionName, id });
        throw error;
      }
    });
    return wrappedFn();
  }

  async delete(collectionName: string, id: string): Promise<ApiResponse<void>> {
    const wrappedFn = withAsyncErrorMonitoring(async () => {
      try {
        await deleteDoc(doc(db, collectionName, id));
        return {
          success: true,
          message: 'Document deleted successfully',
        };
      } catch (error) {
        captureDBError(error as Error, { context: 'delete', collectionName, id });
        throw error;
      }
    });
    return wrappedFn();
  }

  async query<T>(
    collectionName: string, 
    params: QueryParams = {}
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    const wrappedFn = withAsyncErrorMonitoring(async () => {
      try {
        const { page = 1, limit: limitCount = 20, sortBy, sortOrder = 'desc', filters = {} } = params;
        
        let q: any = collection(db, collectionName);
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            q = query(q, where(key, '==', value));
          }
        });

        // Apply sorting
        if (sortBy) {
          q = query(q, orderBy(sortBy, sortOrder));
        }

        // Apply pagination
        const offset = (page - 1) * limitCount;
        if (offset > 0) {
          // For pagination, you'd need to implement cursor-based pagination
          // This is a simplified version
        }
        
        q = query(q, limit(limitCount));

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as T[];

        return {
          success: true,
          data: {
            data,
            hasMore: querySnapshot.docs.length === limitCount,
            total: data.length, // Note: This is not the total count, just the current page
          },
        };
      } catch (error) {
        captureDBError(error as Error, { context: 'query', collectionName });
        throw error;
      }
    });
    return wrappedFn();
  }

  // Real-time listeners
  subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    filters: Record<string, any> = {}
  ): () => void {
    try {
        let q: any = collection(db, collectionName);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          q = query(q, where(key, '==', value));
        }
      });

      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const data = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as T[];
        callback(data);
      }, (error: any) => {
        captureDBError(error as Error, { context: 'subscribe', collectionName });
      });

      return unsubscribe;
    } catch (error) {
      captureDBError(error as Error, { context: 'subscribe_setup', collectionName });
      return () => {};
    }
  }

  subscribeToDocument<T>(
    collectionName: string,
    documentId: string,
    callback: (data: T | null) => void
  ): () => void {
    try {
      const docRef = doc(db, collectionName, documentId);
      
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as T;
          callback(data);
        } else {
          callback(null);
        }
      }, (error: any) => {
        captureDBError(error as Error, { context: 'subscribe_doc', collectionName, documentId });
      });

      return unsubscribe;
    } catch (error) {
      captureDBError(error as Error, { context: 'subscribe_doc_setup', collectionName, documentId });
      return () => {};
    }
  }

  // Batch operations
  async batchCreate<T>(collectionName: string, items: T[]): Promise<ApiResponse<string[]>> {
    const wrappedFn = withAsyncErrorMonitoring(async () => {
      try {
        const batch = writeBatch(db);
        const ids: string[] = [];

        items.forEach((item) => {
          const docRef = doc(collection(db, collectionName));
          batch.set(docRef, {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: this.getCurrentUserId(),
          });
          ids.push(docRef.id);
        });

        await batch.commit();
        return {
          success: true,
          data: ids,
        };
      } catch (error) {
        captureDBError(error as Error, { context: 'batch_create', collectionName });
        throw error;
      }
    });
    return wrappedFn();
  }

  async batchUpdate<T>(collectionName: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<ApiResponse<void>> {
    const wrappedFn = withAsyncErrorMonitoring(async () => {
      try {
        const batch = writeBatch(db);

        updates.forEach(({ id, data }) => {
          const docRef = doc(db, collectionName, id);
          batch.update(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
            updatedBy: this.getCurrentUserId(),
          });
        });

        await batch.commit();
        return {
          success: true,
          message: 'Batch update completed successfully',
        };
      } catch (error) {
        captureDBError(error as Error, { context: 'batch_update', collectionName });
        throw error;
      }
    });
    return wrappedFn();
  }

  async batchDelete(collectionName: string, ids: string[]): Promise<ApiResponse<void>> {
    const wrappedFn = withAsyncErrorMonitoring(async () => {
      try {
        const batch = writeBatch(db);

        ids.forEach((id) => {
          const docRef = doc(db, collectionName, id);
          batch.delete(docRef);
        });

        await batch.commit();
        return {
          success: true,
          message: 'Batch delete completed successfully',
        };
      } catch (error) {
        captureDBError(error as Error, { context: 'batch_delete', collectionName });
        throw error;
      }
    });
    return wrappedFn();
  }
}

// Town-Rec specific API methods
class TownRecApiService extends RealApiService {
  // Player Registration
  async getPlayerRegistrations(params: QueryParams = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.query('playerRegistrations', {
      ...params,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async approvePlayerRegistration(id: string, approvedBy: string): Promise<ApiResponse<any>> {
    return this.update('playerRegistrations', id, {
      status: 'approved',
      approvedBy,
      approvedAt: serverTimestamp(),
    });
  }

  async rejectPlayerRegistration(id: string, reason: string, rejectedBy: string): Promise<ApiResponse<any>> {
    return this.update('playerRegistrations', id, {
      status: 'rejected',
      rejectionReason: reason,
      rejectedBy,
      rejectedAt: serverTimestamp(),
    });
  }

  // Waitlist Management
  async getWaitlist(params: QueryParams = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.query('waitlist', {
      ...params,
      filters: { status: 'waiting' },
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });
  }

  async assignPlayerFromWaitlist(waitlistId: string, teamId: string, assignedBy: string): Promise<ApiResponse<any>> {
    const batch = writeBatch(db);
    
    // Update waitlist entry
    const waitlistRef = doc(db, 'waitlist', waitlistId);
    batch.update(waitlistRef, {
      status: 'assigned',
      assignedTo: teamId,
      assignedBy,
      assignedAt: serverTimestamp(),
    });

    // Add player to team
    const teamPlayerRef = doc(collection(db, 'teamPlayers'));
    batch.set(teamPlayerRef, {
      teamId,
      playerId: waitlistId, // Assuming waitlist entry has player info
      assignedAt: serverTimestamp(),
      assignedBy,
    });

    await batch.commit();
    
    return {
      success: true,
      message: 'Player assigned successfully',
    };
  }

  // Sibling Team Placement
  async getSiblingGroups(): Promise<ApiResponse<any[]>> {
    const result = await this.query('siblingGroups', {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    return {
      success: result.success,
      data: result.data?.data || [],
      message: result.message
    };
  }

  async createSiblingGroup(siblings: string[], requestedBy: string): Promise<ApiResponse<any>> {
    return this.create('siblingGroups', {
      siblings,
      requestedBy,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }

  async assignSiblingsToTeam(groupId: string, teamId: string, assignedBy: string): Promise<ApiResponse<any>> {
    return this.update('siblingGroups', groupId, {
      status: 'assigned',
      assignedTo: teamId,
      assignedBy,
      assignedAt: serverTimestamp(),
    });
  }

  // Age Exception Requests
  async getAgeExceptionRequests(params: QueryParams = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.query('ageExceptionRequests', {
      ...params,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async approveAgeException(id: string, approvedBy: string, notes?: string): Promise<ApiResponse<any>> {
    return this.update('ageExceptionRequests', id, {
      status: 'approved',
      approvedBy,
      approvedAt: serverTimestamp(),
      notes,
    });
  }

  async rejectAgeException(id: string, reason: string, rejectedBy: string): Promise<ApiResponse<any>> {
    return this.update('ageExceptionRequests', id, {
      status: 'rejected',
      rejectionReason: reason,
      rejectedBy,
      rejectedAt: serverTimestamp(),
    });
  }

  // Incident & Score Reports
  async getIncidentReports(params: QueryParams = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.query('incidentReports', {
      ...params,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async resolveIncident(id: string, resolution: string, resolvedBy: string): Promise<ApiResponse<any>> {
    return this.update('incidentReports', id, {
      status: 'resolved',
      resolution,
      resolvedBy,
      resolvedAt: serverTimestamp(),
    });
  }

  async getScoreReports(params: QueryParams = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.query('scoreReports', {
      ...params,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async resolveScoreDispute(id: string, finalScore: string, resolvedBy: string): Promise<ApiResponse<any>> {
    return this.update('scoreReports', id, {
      status: 'resolved',
      finalScore,
      resolvedBy,
      resolvedAt: serverTimestamp(),
    });
  }

  // Referee Scheduling
  async getRefereeSchedules(params: QueryParams = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.query('refereeSchedules', {
      ...params,
      sortBy: 'gameDate',
      sortOrder: 'asc',
    });
  }

  async assignReferee(scheduleId: string, refereeId: string, assignedBy: string): Promise<ApiResponse<any>> {
    return this.update('refereeSchedules', scheduleId, {
      refereeId,
      assignedBy,
      assignedAt: serverTimestamp(),
      status: 'assigned',
    });
  }

  // League Overview
  async getLeagueOverview(leagueId: string): Promise<ApiResponse<any>> {
    return this.getById('leagues', leagueId);
  }

  async getTeamRosters(leagueId: string): Promise<ApiResponse<any[]>> {
    const result = await this.query('teamPlayers', {
      filters: { leagueId },
      sortBy: 'teamName',
    });
    return {
      success: result.success,
      data: result.data?.data || [],
      message: result.message
    };
  }

  async getGameSchedules(leagueId: string): Promise<ApiResponse<any[]>> {
    const result = await this.query('gameSchedules', {
      filters: { leagueId },
      sortBy: 'gameDate',
      sortOrder: 'asc',
    });
    return {
      success: result.success,
      data: result.data?.data || [],
      message: result.message
    };
  }

  // Payments & Refunds
  async getPaymentHistory(params: QueryParams = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.query('payments', {
      ...params,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async processRefund(paymentId: string, amount: number, reason: string, processedBy: string): Promise<ApiResponse<any>> {
    return this.update('payments', paymentId, {
      refundAmount: amount,
      refundReason: reason,
      refundedBy: processedBy,
      refundedAt: serverTimestamp(),
      status: 'refunded',
    });
  }

  // Real-time subscriptions for admin dashboard
  subscribeToPlayerRegistrations(callback: (data: any[]) => void): () => void {
    return this.subscribeToCollection('playerRegistrations', callback, {
      status: 'pending',
    });
  }

  subscribeToWaitlist(callback: (data: any[]) => void): () => void {
    return this.subscribeToCollection('waitlist', callback, {
      status: 'waiting',
    });
  }

  subscribeToIncidentReports(callback: (data: any[]) => void): () => void {
    return this.subscribeToCollection('incidentReports', callback, {
      status: 'pending',
    });
  }

  subscribeToAgeExceptions(callback: (data: any[]) => void): () => void {
    return this.subscribeToCollection('ageExceptionRequests', callback, {
      status: 'pending',
    });
  }
}

// Export singleton instance
export const realApiService = new TownRecApiService();

// Export types for use in components
// Types are already exported above 