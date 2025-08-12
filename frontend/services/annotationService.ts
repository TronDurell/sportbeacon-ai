import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  type DocumentReference,
  type QuerySnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/init';
import type {
  VideoAnnotationDocument,
  AnnotationPoint,
  AnnotationData,
  AnnotationMetadata
} from '../firebase/types';

/**
 * Annotation service for Firestore operations
 * Handles CRUD operations for video annotations and metadata
 */
export class AnnotationService {
  private static readonly COLLECTION_NAME = 'annotations';

  /**
   * Create a new annotation for a video
   */
  static async createAnnotation(
    videoId: string,
    annotationData: Omit<VideoAnnotationDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    userId: string
  ): Promise<string> {
    try {
      const annotationId = this.generateAnnotationId();
      const annotationRef = doc(db, this.COLLECTION_NAME, annotationId);
      
      const annotation: VideoAnnotationDocument = {
        id: annotationId,
        videoId,
        ...annotationData,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        createdBy: userId,
        updatedBy: userId
      };

      await setDoc(annotationRef, annotation);
      return annotationId;
    } catch (error) {
      console.error('Error creating annotation:', error);
      throw new Error('Failed to create annotation');
    }
  }

  /**
   * Get a specific annotation by ID
   */
  static async getAnnotation(annotationId: string): Promise<VideoAnnotationDocument | null> {
    try {
      const annotationRef = doc(db, this.COLLECTION_NAME, annotationId);
      const annotationDoc = await getDoc(annotationRef);
      
      if (annotationDoc.exists()) {
        return annotationDoc.data() as VideoAnnotationDocument;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting annotation:', error);
      throw new Error('Failed to get annotation');
    }
  }

  /**
   * Get all annotations for a specific video
   */
  static async getVideoAnnotations(videoId: string): Promise<VideoAnnotationDocument[]> {
    try {
      const annotationsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('videoId', '==', videoId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(annotationsQuery);
      const annotations: VideoAnnotationDocument[] = [];
      
      querySnapshot.forEach((doc) => {
        annotations.push(doc.data() as VideoAnnotationDocument);
      });
      
      return annotations;
    } catch (error) {
      console.error('Error getting video annotations:', error);
      throw new Error('Failed to get video annotations');
    }
  }

  /**
   * Get annotations by user
   */
  static async getUserAnnotations(userId: string, limitCount: number = 50): Promise<VideoAnnotationDocument[]> {
    try {
      const annotationsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(annotationsQuery);
      const annotations: VideoAnnotationDocument[] = [];
      
      querySnapshot.forEach((doc) => {
        annotations.push(doc.data() as VideoAnnotationDocument);
      });
      
      return annotations;
    } catch (error) {
      console.error('Error getting user annotations:', error);
      throw new Error('Failed to get user annotations');
    }
  }

  /**
   * Update an existing annotation
   */
  static async updateAnnotation(
    annotationId: string,
    updates: Partial<Omit<VideoAnnotationDocument, 'id' | 'createdAt' | 'createdBy'>>,
    userId: string
  ): Promise<void> {
    try {
      const annotationRef = doc(db, this.COLLECTION_NAME, annotationId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };

      await updateDoc(annotationRef, updateData);
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw new Error('Failed to update annotation');
    }
  }

  /**
   * Delete an annotation
   */
  static async deleteAnnotation(annotationId: string): Promise<void> {
    try {
      const annotationRef = doc(db, this.COLLECTION_NAME, annotationId);
      await deleteDoc(annotationRef);
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw new Error('Failed to delete annotation');
    }
  }

  /**
   * Delete all annotations for a video
   */
  static async deleteVideoAnnotations(videoId: string): Promise<void> {
    try {
      const annotations = await this.getVideoAnnotations(videoId);
      const batch = writeBatch(db);
      
      annotations.forEach((annotation) => {
        const annotationRef = doc(db, this.COLLECTION_NAME, annotation.id);
        batch.delete(annotationRef);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting video annotations:', error);
      throw new Error('Failed to delete video annotations');
    }
  }

  /**
   * Listen to real-time updates for video annotations
   */
  static subscribeToVideoAnnotations(
    videoId: string,
    callback: (annotations: VideoAnnotationDocument[]) => void
  ): Unsubscribe {
    try {
      const annotationsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('videoId', '==', videoId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(annotationsQuery, (querySnapshot: QuerySnapshot) => {
        const annotations: VideoAnnotationDocument[] = [];
        
        querySnapshot.forEach((doc) => {
          annotations.push(doc.data() as VideoAnnotationDocument);
        });
        
        callback(annotations);
      }, (error) => {
        console.error('Error listening to video annotations:', error);
      });
    } catch (error) {
      console.error('Error setting up annotation listener:', error);
      throw new Error('Failed to set up annotation listener');
    }
  }

  /**
   * Create multiple annotations in a batch
   */
  static async createBatchAnnotations(
    videoId: string,
    annotationsData: Array<Omit<VideoAnnotationDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>,
    userId: string
  ): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const annotationIds: string[] = [];
      
      annotationsData.forEach((annotationData) => {
        const annotationId = this.generateAnnotationId();
        const annotationRef = doc(db, this.COLLECTION_NAME, annotationId);
        
        const annotation: VideoAnnotationDocument = {
          id: annotationId,
          videoId,
          ...annotationData,
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
          createdBy: userId,
          updatedBy: userId
        };
        
        batch.set(annotationRef, annotation);
        annotationIds.push(annotationId);
      });
      
      await batch.commit();
      return annotationIds;
    } catch (error) {
      console.error('Error creating batch annotations:', error);
      throw new Error('Failed to create batch annotations');
    }
  }

  /**
   * Search annotations by text content
   */
  static async searchAnnotations(
    searchTerm: string,
    userId?: string,
    limitCount: number = 20
  ): Promise<VideoAnnotationDocument[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation - consider using Algolia or similar for production
      const annotationsQuery = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(annotationsQuery);
      const annotations: VideoAnnotationDocument[] = [];
      
      querySnapshot.forEach((doc) => {
        const annotation = doc.data() as VideoAnnotationDocument;
        
        // Filter by user if specified
        if (userId && annotation.createdBy !== userId) {
          return;
        }
        
        // Simple text search in annotation content
        const searchLower = searchTerm.toLowerCase();
        const contentLower = annotation.data.content?.toLowerCase() || '';
        const titleLower = annotation.data.title?.toLowerCase() || '';
        
        if (contentLower.includes(searchLower) || titleLower.includes(searchLower)) {
          annotations.push(annotation);
        }
      });
      
      return annotations;
    } catch (error) {
      console.error('Error searching annotations:', error);
      throw new Error('Failed to search annotations');
    }
  }

  /**
   * Get annotation statistics for a video
   */
  static async getVideoAnnotationStats(videoId: string): Promise<{
    totalAnnotations: number;
    totalDuration: number;
    averageAnnotationDuration: number;
    annotationTypes: Record<string, number>;
  }> {
    try {
      const annotations = await this.getVideoAnnotations(videoId);
      
      const stats = {
        totalAnnotations: annotations.length,
        totalDuration: 0,
        averageAnnotationDuration: 0,
        annotationTypes: {} as Record<string, number>
      };
      
      annotations.forEach((annotation) => {
        // Calculate duration if start and end times are available
        if (annotation.data.startTime && annotation.data.endTime) {
          const duration = annotation.data.endTime - annotation.data.startTime;
          stats.totalDuration += duration;
        }
        
        // Count annotation types
        const type = annotation.data.type || 'unknown';
        stats.annotationTypes[type] = (stats.annotationTypes[type] || 0) + 1;
      });
      
      stats.averageAnnotationDuration = stats.totalAnnotations > 0 
        ? stats.totalDuration / stats.totalAnnotations 
        : 0;
      
      return stats;
    } catch (error) {
      console.error('Error getting annotation stats:', error);
      throw new Error('Failed to get annotation statistics');
    }
  }

  /**
   * Generate unique annotation ID
   */
  private static generateAnnotationId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate annotation data before saving
   */
  static validateAnnotationData(data: AnnotationData): boolean {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Annotation title is required');
    }
    
    if (data.startTime !== undefined && data.endTime !== undefined) {
      if (data.startTime < 0 || data.endTime < 0) {
        throw new Error('Start and end times must be positive');
      }
      
      if (data.startTime >= data.endTime) {
        throw new Error('Start time must be before end time');
      }
    }
    
    if (data.points && data.points.length > 0) {
      data.points.forEach((point: AnnotationPoint, index: number) => {
        if (typeof point.x !== 'number' || typeof point.y !== 'number') {
          throw new Error(`Invalid point data at index ${index}`);
        }
      });
    }
    
    return true;
  }
}

export default AnnotationService; 