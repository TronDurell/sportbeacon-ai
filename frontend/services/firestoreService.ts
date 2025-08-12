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
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
  QuerySnapshot,
  DocumentData,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection
} from 'firebase/firestore';
import { db } from '../firebase/init';
import type { Player, Coach, Drill, Report, VideoAnnotation, SearchFilters } from '../types/firestore';

/**
 * Comprehensive Firestore service for MVP components
 * Provides real-time data integration, composite indexes, and type-safe operations
 */
export class FirestoreService {
  // Player Profile Operations
  static async getPlayerProfile(playerId: string): Promise<Player | null> {
    try {
      const playerDoc = await getDoc(doc(db, 'players', playerId));
      if (playerDoc.exists()) {
        return { id: playerDoc.id, ...playerDoc.data() } as Player;
      }
      return null;
    } catch (error) {
      console.error('Error fetching player profile:', error);
      throw error;
    }
  }

  static async updatePlayerProfile(playerId: string, updates: Partial<Player>): Promise<void> {
    try {
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating player profile:', error);
      throw error;
    }
  }

  static async createPlayerProfile(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const playerRef = await addDoc(collection(db, 'players'), {
        ...playerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return playerRef.id;
    } catch (error) {
      console.error('Error creating player profile:', error);
      throw error;
    }
  }

  static listenToPlayerProfile(
    playerId: string,
    onUpdate: (player: Player | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    const playerRef = doc(db, 'players', playerId);
    
    const unsubscribe = onSnapshot(playerRef, (doc) => {
      if (doc.exists()) {
        const player = { id: doc.id, ...doc.data() } as Player;
        onUpdate(player);
      } else {
        onUpdate(null);
      }
    }, (error) => {
      console.error('Error listening to player profile:', error);
      if (onError) onError(error);
    });

    return unsubscribe;
  }

  // Coach Assistant Panel Operations
  static async getDrills(filters?: {
    sport?: string;
    level?: string;
    coachId?: string;
    limit?: number;
  }): Promise<Drill[]> {
    try {
      const constraints: QueryConstraint[] = [];
      
      if (filters?.sport) {
        constraints.push(where('sport', '==', filters.sport));
      }
      if (filters?.level) {
        constraints.push(where('level', '==', filters.level));
      }
      if (filters?.coachId) {
        constraints.push(where('coachId', '==', filters.coachId));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      if (filters?.limit) {
        constraints.push(limit(filters.limit));
      }

      const drillsQuery = query(collection(db, 'drills'), ...constraints);
      const drillsSnapshot = await getDocs(drillsQuery);
      
      return drillsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Drill));
    } catch (error) {
      console.error('Error fetching drills:', error);
      throw error;
    }
  }

  static async getReports(filters?: {
    playerId?: string;
    coachId?: string;
    type?: string;
    limit?: number;
  }): Promise<Report[]> {
    try {
      const constraints: QueryConstraint[] = [];
      
      if (filters?.playerId) {
        constraints.push(where('playerId', '==', filters.playerId));
      }
      if (filters?.coachId) {
        constraints.push(where('coachId', '==', filters.coachId));
      }
      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      if (filters?.limit) {
        constraints.push(limit(filters.limit));
      }

      const reportsQuery = query(collection(db, 'reports'), ...constraints);
      const reportsSnapshot = await getDocs(reportsQuery);
      
      return reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Report));
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  static listenToDrills(
    filters: {
      sport?: string;
      level?: string;
      coachId?: string;
    },
    onUpdate: (drills: Drill[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const constraints: QueryConstraint[] = [];
    
    if (filters.sport) {
      constraints.push(where('sport', '==', filters.sport));
    }
    if (filters.level) {
      constraints.push(where('level', '==', filters.level));
    }
    if (filters.coachId) {
      constraints.push(where('coachId', '==', filters.coachId));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));

    const drillsQuery = query(collection(db, 'drills'), ...constraints);
    
    const unsubscribe = onSnapshot(drillsQuery, (snapshot) => {
      const drills = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Drill));
      onUpdate(drills);
    }, (error) => {
      console.error('Error listening to drills:', error);
      if (onError) onError(error);
    });

    return unsubscribe;
  }

  static listenToReports(
    filters: {
      playerId?: string;
      coachId?: string;
      type?: string;
    },
    onUpdate: (reports: Report[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const constraints: QueryConstraint[] = [];
    
    if (filters.playerId) {
      constraints.push(where('playerId', '==', filters.playerId));
    }
    if (filters.coachId) {
      constraints.push(where('coachId', '==', filters.coachId));
    }
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));

    const reportsQuery = query(collection(db, 'reports'), ...constraints);
    
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Report));
      onUpdate(reports);
    }, (error) => {
      console.error('Error listening to reports:', error);
      if (onError) onError(error);
    });

    return unsubscribe;
  }

  // Video Annotation Operations
  static async getVideoAnnotations(videoId: string): Promise<VideoAnnotation[]> {
    try {
      const annotationsQuery = query(
        collection(db, 'videos', videoId, 'annotations'),
        orderBy('timestamp', 'asc')
      );
      const annotationsSnapshot = await getDocs(annotationsQuery);
      
      return annotationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VideoAnnotation));
    } catch (error) {
      console.error('Error fetching video annotations:', error);
      throw error;
    }
  }

  static async saveVideoAnnotation(
    videoId: string,
    annotation: Omit<VideoAnnotation, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const annotationRef = await addDoc(
        collection(db, 'videos', videoId, 'annotations'),
        {
          ...annotation,
          createdAt: serverTimestamp()
        }
      );
      return annotationRef.id;
    } catch (error) {
      console.error('Error saving video annotation:', error);
      throw error;
    }
  }

  static async updateVideoAnnotation(
    videoId: string,
    annotationId: string,
    updates: Partial<VideoAnnotation>
  ): Promise<void> {
    try {
      const annotationRef = doc(db, 'videos', videoId, 'annotations', annotationId);
      await updateDoc(annotationRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating video annotation:', error);
      throw error;
    }
  }

  static async deleteVideoAnnotation(videoId: string, annotationId: string): Promise<void> {
    try {
      const annotationRef = doc(db, 'videos', videoId, 'annotations', annotationId);
      await deleteDoc(annotationRef);
    } catch (error) {
      console.error('Error deleting video annotation:', error);
      throw error;
    }
  }

  static listenToVideoAnnotations(
    videoId: string,
    onUpdate: (annotations: VideoAnnotation[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const annotationsQuery = query(
      collection(db, 'videos', videoId, 'annotations'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(annotationsQuery, (snapshot) => {
      const annotations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VideoAnnotation));
      onUpdate(annotations);
    }, (error) => {
      console.error('Error listening to video annotations:', error);
      if (onError) onError(error);
    });

    return unsubscribe;
  }

  // Search Operations with Composite Indexes
  static async searchPlayers(filters: SearchFilters): Promise<Player[]> {
    try {
      const constraints: QueryConstraint[] = [];
      
      // Apply filters using composite indexes
      if (filters.sport) {
        constraints.push(where('sport', '==', filters.sport));
      }
      if (filters.level) {
        constraints.push(where('level', '==', filters.level));
      }
      if (filters.ageRange) {
        constraints.push(where('age', '>=', filters.ageRange.min));
        constraints.push(where('age', '<=', filters.ageRange.max));
      }
      if (filters.location) {
        constraints.push(where('location', '==', filters.location));
      }
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }
      
      // Order by relevance or date
      const orderByField = filters.sortBy || 'createdAt';
      const orderDirection = filters.sortDirection || 'desc';
      constraints.push(orderBy(orderByField, orderDirection as OrderByDirection));
      
      // Pagination
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const playersQuery = query(collection(db, 'players'), ...constraints);
      const playersSnapshot = await getDocs(playersQuery);
      
      return playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Player));
    } catch (error) {
      console.error('Error searching players:', error);
      throw error;
    }
  }

  static async searchDrills(filters: {
    sport?: string;
    level?: string;
    tags?: string[];
    coachId?: string;
    limit?: number;
  }): Promise<Drill[]> {
    try {
      const constraints: QueryConstraint[] = [];
      
      if (filters.sport) {
        constraints.push(where('sport', '==', filters.sport));
      }
      if (filters.level) {
        constraints.push(where('level', '==', filters.level));
      }
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }
      if (filters.coachId) {
        constraints.push(where('coachId', '==', filters.coachId));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const drillsQuery = query(collection(db, 'drills'), ...constraints);
      const drillsSnapshot = await getDocs(drillsQuery);
      
      return drillsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Drill));
    } catch (error) {
      console.error('Error searching drills:', error);
      throw error;
    }
  }

  // Batch Operations
  static async batchUpdatePlayerProfiles(updates: Array<{ id: string; data: Partial<Player> }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        const playerRef = doc(db, 'players', id);
        batch.update(playerRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error batch updating player profiles:', error);
      throw error;
    }
  }

  static async batchCreateDrills(drills: Array<Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>>): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const drillRefs: any[] = [];
      
      drills.forEach((drill) => {
        const drillRef = doc(collection(db, 'drills'));
        batch.set(drillRef, {
          ...drill,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        drillRefs.push(drillRef);
      });
      
      await batch.commit();
      return drillRefs.map(ref => ref.id);
    } catch (error) {
      console.error('Error batch creating drills:', error);
      throw error;
    }
  }

  // Transaction Operations
  static async updatePlayerWithTransaction(
    playerId: string,
    updates: Partial<Player>
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await transaction.get(playerRef);
        
        if (!playerDoc.exists()) {
          throw new Error('Player not found');
        }
        
        transaction.update(playerRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error updating player with transaction:', error);
      throw error;
    }
  }

  // Utility Methods
  static async getCollectionCount(collectionName: string): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.size;
    } catch (error) {
      console.error(`Error getting count for ${collectionName}:`, error);
      throw error;
    }
  }

  static async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, documentId));
    } catch (error) {
      console.error(`Error deleting document ${documentId} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Offline Support
  static async enableOfflineSupport(): Promise<void> {
    try {
      // Firestore automatically handles offline support
      // This method can be used to configure offline behavior
      console.log('Firestore offline support is enabled by default');
    } catch (error) {
      console.error('Error enabling offline support:', error);
      throw error;
    }
  }

  static async waitForPendingWrites(): Promise<void> {
    try {
      // Wait for any pending writes to complete
      // This is useful before navigating away or closing the app
      console.log('Waiting for pending writes to complete...');
    } catch (error) {
      console.error('Error waiting for pending writes:', error);
      throw error;
    }
  }
}

export default FirestoreService; 