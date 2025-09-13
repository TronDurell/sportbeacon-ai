import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  StorageReference
} from 'firebase/storage';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { useAuth } from '../src/contexts/AdminAuthContext';
import type {
  MediaMetadata,
  MediaUploadTask,
  UploadProgress,
  MediaType,
  MediaCategory,
  MediaStatus,
  FileValidation,
  ImageProcessingOptions,
  VideoProcessingOptions,
  UploadConfig,
  MediaSearchFilters,
  MediaAnalytics,
  UploadError,
  FilePreview
} from '../types/media';

/**
 * Comprehensive Firebase Storage Media Service
 * Handles upload, download, processing, and management of media files
 */
export class MediaService {
  private static instance: MediaService;
  private uploadTasks: Map<string, MediaUploadTask> = new Map();
  private uploadConfig: UploadConfig;

  private constructor() {
    this.uploadConfig = {
      validation: {
        maxSize: 100 * 1024 * 1024, // 100MB
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'video/mp4',
          'video/webm',
          'video/mov',
          'audio/mp3',
          'audio/wav',
          'audio/m4a',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        maxFiles: 10,
        minWidth: 100,
        maxWidth: 4096,
        minHeight: 100,
        maxHeight: 4096
      },
      imageProcessing: {
        quality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp',
        maintainAspectRatio: true,
        generateThumbnail: true,
        thumbnailSize: { width: 300, height: 300 }
      },
      videoProcessing: {
        quality: 'medium',
        maxResolution: { width: 1920, height: 1080 },
        generateThumbnail: true,
        thumbnailTime: 5,
        thumbnailSize: { width: 400, height: 225 },
        format: 'mp4'
      },
      autoOptimize: true,
      generateThumbnails: true,
      maxConcurrentUploads: 3,
      retryAttempts: 3,
      chunkSize: 1024 * 1024 // 1MB chunks
    };
  }

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  // File Validation
  private validateFile(file: File): { isValid: boolean; error?: string } {
    const { validation } = this.uploadConfig;

    // Check file size
    if (file.size > validation.maxSize) {
      return {
        isValid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(validation.maxSize)})`
      };
    }

    // Check file type
    if (!validation.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    return { isValid: true };
  }

  // Get Media Type from File
  private getMediaType(file: File): MediaType {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf' || file.type.includes('document')) return 'document';
    return 'archive';
  }

  // Generate Storage Path
  private generateStoragePath(file: File, category: MediaCategory, userId: string): string {
    const timestamp = Date.now();
    const mediaType = this.getMediaType(file);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${extension}`;
    
    return `users/${userId}/${category}/${mediaType}/${fileName}`;
  }

  // Image Processing
  private async processImage(file: File, options: ImageProcessingOptions): Promise<{ processedFile: File; thumbnail?: File }> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const { maxWidth, maxHeight, maintainAspectRatio } = options;

        if (width > maxWidth || height > maxHeight) {
          if (maintainAspectRatio) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          } else {
            width = maxWidth;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: `image/${options.format}`,
                lastModified: Date.now()
              });

              // Generate thumbnail if requested
              if (options.generateThumbnail) {
                const thumbCanvas = document.createElement('canvas');
                const thumbCtx = thumbCanvas.getContext('2d');
                thumbCanvas.width = options.thumbnailSize.width;
                thumbCanvas.height = options.thumbnailSize.height;

                thumbCtx?.drawImage(img, 0, 0, options.thumbnailSize.width, options.thumbnailSize.height);

                thumbCanvas.toBlob(
                  (thumbBlob) => {
                    if (thumbBlob) {
                      const thumbnail = new File([thumbBlob], `thumb_${file.name}`, {
                        type: `image/${options.format}`,
                        lastModified: Date.now()
                      });
                      resolve({ processedFile, thumbnail });
                    } else {
                      resolve({ processedFile });
                    }
                  },
                  `image/${options.format}`,
                  options.quality / 100
                );
              } else {
                resolve({ processedFile });
              }
            } else {
              reject(new Error('Failed to process image'));
            }
          },
          `image/${options.format}`,
          options.quality / 100
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Video Thumbnail Generation
  private async generateVideoThumbnail(file: File, time: number = 5): Promise<File> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(time, video.duration);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const thumbnail = new File([blob], `thumb_${file.name}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(thumbnail);
            } else {
              reject(new Error('Failed to generate video thumbnail'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
    });
  }

  // Upload File
  async uploadFile(
    file: File,
    category: MediaCategory,
    userId: string,
    metadata: Partial<MediaMetadata> = {}
  ): Promise<MediaUploadTask> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // User ID should be passed as parameter to avoid React hooks in class methods
    if (!userId) {
      throw new Error('User ID is required');
    }
    const mediaType = this.getMediaType(file);
    const uploadId = `${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Process file if needed
    let processedFile = file;
    let thumbnail: File | undefined;

    if (this.uploadConfig.autoOptimize && mediaType === 'image' && this.uploadConfig.imageProcessing) {
      try {
        const result = await this.processImage(file, this.uploadConfig.imageProcessing);
        processedFile = result.processedFile;
        thumbnail = result.thumbnail;
      } catch (error) {
        console.warn('Image processing failed, using original file:', error);
      }
    }

    if (this.uploadConfig.generateThumbnails && mediaType === 'video' && this.uploadConfig.videoProcessing) {
      try {
        thumbnail = await this.generateVideoThumbnail(file, this.uploadConfig.videoProcessing.thumbnailTime);
      } catch (error) {
        console.warn('Video thumbnail generation failed:', error);
      }
    }

    // Generate storage paths
    const storagePath = this.generateStoragePath(processedFile, category, userId);
    const storageRef = ref(storage, storagePath);

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, processedFile, {
      customMetadata: {
        originalName: file.name,
        mediaType,
        category,
        uploadedBy: userId,
        ...metadata.customMetadata
      }
    });

    // Create upload task object
    const mediaUploadTask: MediaUploadTask = {
      id: uploadId,
      file: processedFile,
      metadata: {
        fileName: processedFile.name,
        originalName: file.name,
        fileSize: processedFile.size,
        mimeType: processedFile.type,
        mediaType,
        category,
        status: 'uploading',
        uploadedBy: userId,
        storagePath,
        tags: [],
        isPublic: false,
        accessLevel: 'private',
        allowedRoles: [],
        customMetadata: {},
        ...metadata
      },
      uploadTask,
      progress: {
        bytesTransferred: 0,
        totalBytes: processedFile.size,
        percentage: 0,
        speed: 0,
        timeRemaining: 0,
        status: 'pending'
      },
      status: 'uploading',
      retryCount: 0,
      maxRetries: this.uploadConfig.retryAttempts,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    // Store upload task
    this.uploadTasks.set(uploadId, mediaUploadTask);

    // Set up progress tracking
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = this.calculateProgress(snapshot);
        mediaUploadTask.progress = progress;
        mediaUploadTask.status = progress.status as MediaStatus;
        mediaUploadTask.updatedAt = serverTimestamp() as any;

        // Emit progress event
        this.emitProgressEvent(uploadId, progress);
      },
      (error) => {
        mediaUploadTask.status = 'failed';
        mediaUploadTask.error = error.message;
        mediaUploadTask.updatedAt = serverTimestamp() as any;

        // Emit error event
        this.emitErrorEvent(uploadId, error);
      },
      async () => {
        try {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to Firestore
          const mediaId = await this.saveMediaMetadata({
            id: mediaUploadTask.id,
            fileName: mediaUploadTask.metadata.fileName || 'unknown',
            originalName: mediaUploadTask.metadata.originalName || 'unknown',
            fileSize: mediaUploadTask.metadata.fileSize || 0,
            mimeType: mediaUploadTask.metadata.mimeType || 'application/octet-stream',
            mediaType: mediaUploadTask.metadata.mediaType || 'image',
            category: mediaUploadTask.metadata.category || 'content',
            status: 'completed',
            downloadUrl: downloadURL,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            tags: mediaUploadTask.metadata.tags || [],
            description: mediaUploadTask.metadata.description || '',
            isPublic: mediaUploadTask.metadata.isPublic || false,
            shareCount: 0,
            downloadCount: 0,
            customMetadata: mediaUploadTask.metadata.customMetadata || {}
          });

          // Upload thumbnail if exists
          if (thumbnail) {
            const thumbPath = storagePath.replace(/\.[^/.]+$/, '_thumb.jpg');
            const thumbRef = ref(storage, thumbPath);
            await uploadBytesResumable(thumbRef, thumbnail);
            const thumbURL = await getDownloadURL(thumbRef);
            
            await this.updateMediaMetadata(mediaId, {
              thumbnailUrl: thumbURL
            });
          }

          mediaUploadTask.status = 'completed';
          mediaUploadTask.metadata.id = mediaId;
          mediaUploadTask.updatedAt = serverTimestamp() as any;

          // Emit completion event
          this.emitCompletionEvent(uploadId, mediaId);

        } catch (error) {
          mediaUploadTask.status = 'failed';
          mediaUploadTask.error = error instanceof Error ? error.message : 'Upload failed';
          mediaUploadTask.updatedAt = serverTimestamp() as any;

          this.emitErrorEvent(uploadId, error);
        }
      }
    );

    return mediaUploadTask;
  }

  // Calculate Upload Progress
  private calculateProgress(snapshot: any): UploadProgress {
    const bytesTransferred = snapshot.bytesTransferred;
    const totalBytes = snapshot.totalBytes;
    const percentage = (bytesTransferred / totalBytes) * 100;
    
    // Calculate speed and time remaining
    const now = Date.now();
    const timeElapsed = (now - snapshot.startTime) / 1000; // seconds
    const speed = timeElapsed > 0 ? bytesTransferred / timeElapsed : 0;
    const timeRemaining = speed > 0 ? (totalBytes - bytesTransferred) / speed : 0;

    return {
      bytesTransferred,
      totalBytes,
      percentage,
      speed,
      timeRemaining,
      status: snapshot.state
    };
  }

  // Save Media Metadata to Firestore
  private async saveMediaMetadata(metadata: MediaMetadata): Promise<string> {
    const mediaRef = doc(collection(db, 'media'));
    const mediaData = {
      ...metadata,
      id: mediaRef.id,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(mediaRef, mediaData);
    return mediaRef.id;
  }

  // Update Media Metadata
  async updateMediaMetadata(mediaId: string, updates: Partial<MediaMetadata>): Promise<void> {
    const mediaRef = doc(db, 'media', mediaId);
    await updateDoc(mediaRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Get Media Metadata
  async getMediaMetadata(mediaId: string): Promise<MediaMetadata | null> {
    const mediaRef = doc(db, 'media', mediaId);
    const mediaDoc = await getDoc(mediaRef);
    
    if (mediaDoc.exists()) {
      return { id: mediaDoc.id, ...mediaDoc.data() } as MediaMetadata;
    }
    
    return null;
  }

  // Delete Media
  async deleteMedia(mediaId: string): Promise<void> {
    const metadata = await this.getMediaMetadata(mediaId);
    if (!metadata) {
      throw new Error('Media not found');
    }

    // Delete from Storage
    const storageRef = ref(storage, metadata.storagePath);
    await deleteObject(storageRef);

    // Delete thumbnail if exists
    if (metadata.thumbnailUrl) {
      const thumbPath = metadata.storagePath.replace(/\.[^/.]+$/, '_thumb.jpg');
      const thumbRef = ref(storage, thumbPath);
      try {
        await deleteObject(thumbRef);
      } catch (error) {
        console.warn('Failed to delete thumbnail:', error);
      }
    }

    // Delete from Firestore
    const mediaRef = doc(db, 'media', mediaId);
    await deleteDoc(mediaRef);
  }

  // Search Media
  async searchMedia(filters: MediaSearchFilters, userId: string, limitCount: number = 20): Promise<MediaMetadata[]> {

    let q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'), limit(limitCount));

    // Apply filters
    if (filters.uploadedBy) {
      q = query(q, where('uploadedBy', '==', filters.uploadedBy));
    }

    if (filters.mediaTypes && filters.mediaTypes.length > 0) {
      q = query(q, where('mediaType', 'in', filters.mediaTypes));
    }

    if (filters.categories && filters.categories.length > 0) {
      q = query(q, where('category', 'in', filters.categories));
    }

    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }

    if (filters.isPublic !== undefined) {
      q = query(q, where('isPublic', '==', filters.isPublic));
    }

    const querySnapshot = await getDocs(q);
    const media: MediaMetadata[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as MediaMetadata;
      
      // Apply additional filters that can't be done in Firestore
      if (filters.query) {
        const searchTerm = filters.query.toLowerCase();
        const matchesQuery = 
          data.fileName.toLowerCase().includes(searchTerm) ||
          data.description?.toLowerCase().includes(searchTerm) ||
          data.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        if (!matchesQuery) return;
      }

      if (filters.minSize && data.fileSize < filters.minSize) return;
      if (filters.maxSize && data.fileSize > filters.maxSize) return;

      if (filters.dateRange) {
        const uploadDate = new Date(data.uploadedAt);
        if (uploadDate < filters.dateRange.start.toDate() || uploadDate > filters.dateRange.end.toDate()) {
          return;
        }
      }

      media.push({ ...data, id: doc.id });
    });

    return media;
  }

  // Get User Media
  async getUserMedia(userId: string, category?: MediaCategory): Promise<MediaMetadata[]> {
    const filters: MediaSearchFilters = { uploadedBy: userId };
    if (category) {
      filters.categories = [category];
    }
    return this.searchMedia(filters, userId);
  }

  // Get Media Analytics
  async getMediaAnalytics(userId: string): Promise<MediaAnalytics> {
    const userMedia = await this.getUserMedia(userId);
    
    const totalFiles = userMedia.length;
    const totalSize = userMedia.reduce((sum, media) => sum + media.fileSize, 0);
    const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

    const uploadsByType: Record<MediaType, number> = {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      archive: 0
    };

    const uploadsByCategory: Record<MediaCategory, number> = {
      profile: 0,
      avatar: 0,
      cover: 0,
      gallery: 0,
      document: 0,
      verification: 0,
      content: 0,
      thumbnail: 0,
      preview: 0
    };

    const uploadsByStatus: Record<MediaStatus, number> = {
      uploading: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      deleted: 0,
      pending_approval: 0,
      approved: 0,
      rejected: 0
    };

    userMedia.forEach(media => {
      uploadsByType[media.mediaType]++;
      uploadsByCategory[media.category]++;
      uploadsByStatus[media.status]++;
    });

    return {
      totalFiles,
      totalSize,
      averageFileSize,
      uploadsByType,
      uploadsByCategory,
      uploadsByStatus,
      storageUsage: {
        used: totalSize,
        available: 10 * 1024 * 1024 * 1024, // 10GB
        percentage: (totalSize / (10 * 1024 * 1024 * 1024)) * 100
      },
      uploadTrends: {
        daily: [],
        weekly: [],
        monthly: []
      }
    };
  }

  // Utility Methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Event Emitters (to be implemented with proper event system)
  private emitProgressEvent(uploadId: string, progress: UploadProgress): void {
    // Implement event emission for progress updates
    console.log(`Upload ${uploadId} progress: ${progress.percentage}%`);
  }

  private emitErrorEvent(uploadId: string, error: any): void {
    // Implement event emission for error updates
    console.error(`Upload ${uploadId} error:`, error);
  }

  private emitCompletionEvent(uploadId: string, mediaId: string): void {
    // Implement event emission for completion updates
    console.log(`Upload ${uploadId} completed with media ID: ${mediaId}`);
  }

  // Get Upload Task
  getUploadTask(uploadId: string): MediaUploadTask | undefined {
    return this.uploadTasks.get(uploadId);
  }

  // Cancel Upload
  cancelUpload(uploadId: string): void {
    const uploadTask = this.uploadTasks.get(uploadId);
    if (uploadTask) {
      uploadTask.uploadTask.cancel();
      uploadTask.status = 'failed';
      uploadTask.error = 'Upload cancelled';
      this.uploadTasks.delete(uploadId);
    }
  }

  // Pause Upload
  pauseUpload(uploadId: string): void {
    const uploadTask = this.uploadTasks.get(uploadId);
    if (uploadTask) {
      uploadTask.uploadTask.pause();
    }
  }

  // Resume Upload
  resumeUpload(uploadId: string): void {
    const uploadTask = this.uploadTasks.get(uploadId);
    if (uploadTask) {
      uploadTask.uploadTask.resume();
    }
  }

  // Clear completed uploads
  clearCompletedUploads(): void {
    for (const [uploadId, uploadTask] of Array.from(this.uploadTasks.entries())) {
      if (uploadTask.status === 'completed' || uploadTask.status === 'failed') {
        this.uploadTasks.delete(uploadId);
      }
    }
  }
}

export default MediaService; 