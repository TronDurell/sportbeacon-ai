import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import MediaService from '../services/mediaService';
import type {
  MediaUploadTask,
  UploadProgress,
  MediaMetadata,
  MediaCategory,
  UploadState,
  FilePreview,
  UploadError
} from '../types/media';

/**
 * Custom hook for media upload management
 * Provides comprehensive upload functionality with progress tracking and error handling
 */
export const useMediaUpload = () => {
  const { user } = useAuth();
  const mediaService = MediaService.getInstance();
  
  // State
  const [uploadState, setUploadState] = useState<UploadState>({
    uploads: [],
    isUploading: false,
    totalProgress: 0,
    completedCount: 0,
    failedCount: 0,
    error: null
  });

  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for cleanup
  const uploadTasks = useRef<Map<string, MediaUploadTask>>(new Map());
  const progressIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all progress intervals
      progressIntervals.current.forEach(interval => clearInterval(interval));
      progressIntervals.current.clear();
      
      // Cancel any ongoing uploads
      uploadTasks.current.forEach((task, id) => {
        if (task.status === 'uploading') {
          mediaService.cancelUpload(id);
        }
      });
    };
  }, [mediaService]);

  // Update upload state
  const updateUploadState = useCallback(() => {
    const uploads = Array.from(uploadTasks.current.values());
    const isUploading = uploads.some(upload => upload.status === 'uploading');
    const completedCount = uploads.filter(upload => upload.status === 'completed').length;
    const failedCount = uploads.filter(upload => upload.status === 'failed').length;
    
    // Calculate total progress
    const totalProgress = uploads.length > 0 
      ? uploads.reduce((sum, upload) => sum + upload.progress.percentage, 0) / uploads.length
      : 0;

    setUploadState({
      uploads,
      isUploading,
      totalProgress,
      completedCount,
      failedCount,
      error: null
    });
  }, []);

  // Create file previews
  const createFilePreviews = useCallback(async (files: File[]): Promise<FilePreview[]> => {
    const previews: FilePreview[] = [];

    for (const file of files) {
      try {
        const preview: FilePreview = {
          file,
          preview: '',
          type: getMediaType(file),
          size: file.size,
          error: undefined
        };

        // Generate preview for images and videos
        if (file.type.startsWith('image/')) {
          preview.preview = URL.createObjectURL(file);
          
          // Get dimensions for images
          const dimensions = await getImageDimensions(file);
          preview.dimensions = dimensions;
        } else if (file.type.startsWith('video/')) {
          preview.preview = URL.createObjectURL(file);
          
          // Get duration for videos
          const duration = await getVideoDuration(file);
          preview.duration = duration;
        } else {
          // For other file types, use a default icon
          preview.preview = getFileIcon(file.type);
        }

        previews.push(preview);
      } catch (error) {
        previews.push({
          file,
          preview: getFileIcon(file.type),
          type: getMediaType(file),
          size: file.size,
          error: error instanceof Error ? error.message : 'Failed to create preview'
        });
      }
    }

    return previews;
  }, []);

  // Upload files
  const uploadFiles = useCallback(async (
    files: File[],
    category: MediaCategory,
    metadata: Partial<MediaMetadata> = {}
  ): Promise<MediaUploadTask[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsProcessing(true);
    const uploadTasksArray: MediaUploadTask[] = [];

    try {
      // Create previews first
      const filePreviews = await createFilePreviews(files);
      setPreviews(filePreviews);

      // Upload each file
      for (const file of files) {
        try {
          const uploadTask = await mediaService.uploadFile(file, category, user.uid, metadata);
          
          // Store upload task
          uploadTasks.current.set(uploadTask.id, uploadTask);
          uploadTasksArray.push(uploadTask);

          // Set up progress tracking
          const progressInterval = setInterval(() => {
            const currentTask = uploadTasks.current.get(uploadTask.id);
            if (currentTask) {
              updateUploadState();
            } else {
              clearInterval(progressInterval);
              progressIntervals.current.delete(uploadTask.id);
            }
          }, 100);

          progressIntervals.current.set(uploadTask.id, progressInterval);

        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          
          // Add failed upload to state
          const failedTask: MediaUploadTask = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
            file,
            metadata: {
              fileName: file.name,
              originalName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              mediaType: getMediaType(file),
              category,
              status: 'failed',
              uploadedBy: user.uid,
              tags: [],
              isPublic: false,
              accessLevel: 'private',
              allowedRoles: [],
              customMetadata: {},
              ...metadata
            },
            uploadTask: null as any,
            progress: {
              bytesTransferred: 0,
              totalBytes: file.size,
              percentage: 0,
              speed: 0,
              timeRemaining: 0,
              status: 'error'
            },
            status: 'failed',
            error: error instanceof Error ? error.message : 'Upload failed',
            retryCount: 0,
            maxRetries: 3,
            createdAt: new Date() as any,
            updatedAt: new Date() as any
          };

          uploadTasks.current.set(failedTask.id, failedTask);
          uploadTasksArray.push(failedTask);
        }
      }

      updateUploadState();
      return uploadTasksArray;

    } finally {
      setIsProcessing(false);
    }
  }, [user, mediaService, createFilePreviews, updateUploadState]);

  // Upload single file
  const uploadFile = useCallback(async (
    file: File,
    category: MediaCategory,
    metadata: Partial<MediaMetadata> = {}
  ): Promise<MediaUploadTask> => {
    const uploadTasks = await uploadFiles([file], category, metadata);
    return uploadTasks[0];
  }, [uploadFiles]);

  // Retry failed upload
  const retryUpload = useCallback(async (uploadId: string): Promise<MediaUploadTask | null> => {
    const failedTask = uploadTasks.current.get(uploadId);
    if (!failedTask || failedTask.status !== 'failed') {
      return null;
    }

    // Remove failed task
    uploadTasks.current.delete(uploadId);
    updateUploadState();

    // Retry upload
    try {
      const newTask = await mediaService.uploadFile(
        failedTask.file,
        failedTask.metadata.category as MediaCategory,
        user?.uid || '',
        failedTask.metadata
      );

      uploadTasks.current.set(newTask.id, newTask);
      updateUploadState();

      return newTask;
    } catch (error) {
      console.error('Retry failed:', error);
      return null;
    }
  }, [mediaService, updateUploadState]);

  // Cancel upload
  const cancelUpload = useCallback((uploadId: string): void => {
    mediaService.cancelUpload(uploadId);
    uploadTasks.current.delete(uploadId);
    
    // Clear progress interval
    const interval = progressIntervals.current.get(uploadId);
    if (interval) {
      clearInterval(interval);
      progressIntervals.current.delete(uploadId);
    }
    
    updateUploadState();
  }, [mediaService, updateUploadState]);

  // Pause upload
  const pauseUpload = useCallback((uploadId: string): void => {
    mediaService.pauseUpload(uploadId);
  }, [mediaService]);

  // Resume upload
  const resumeUpload = useCallback((uploadId: string): void => {
    mediaService.resumeUpload(uploadId);
  }, [mediaService]);

  // Clear completed uploads
  const clearCompleted = useCallback((): void => {
    mediaService.clearCompletedUploads();
    
    // Clear from local state
    for (const [uploadId, task] of Array.from(uploadTasks.current.entries())) {
      if (task.status === 'completed' || task.status === 'failed') {
        uploadTasks.current.delete(uploadId);
        
        // Clear progress interval
        const interval = progressIntervals.current.get(uploadId);
        if (interval) {
          clearInterval(interval);
          progressIntervals.current.delete(uploadId);
        }
      }
    }
    
    updateUploadState();
  }, [mediaService, updateUploadState]);

  // Clear all uploads
  const clearAll = useCallback((): void => {
    // Cancel all uploads
    uploadTasks.current.forEach((task, id) => {
      if (task.status === 'uploading') {
        mediaService.cancelUpload(id);
      }
    });

    // Clear all tasks
    uploadTasks.current.clear();
    
    // Clear all intervals
    progressIntervals.current.forEach(interval => clearInterval(interval));
    progressIntervals.current.clear();
    
    // Clear previews
    setPreviews([]);
    
    updateUploadState();
  }, [mediaService, updateUploadState]);

  // Get upload task
  const getUploadTask = useCallback((uploadId: string): MediaUploadTask | undefined => {
    return uploadTasks.current.get(uploadId);
  }, []);

  // Get uploads by status
  const getUploadsByStatus = useCallback((status: string): MediaUploadTask[] => {
    return Array.from(uploadTasks.current.values()).filter(upload => upload.status === status);
  }, []);

  // Get uploads by category
  const getUploadsByCategory = useCallback((category: MediaCategory): MediaUploadTask[] => {
    return Array.from(uploadTasks.current.values()).filter(upload => upload.metadata.category === category);
  }, []);

  // Utility functions
  const formatFileSize = useCallback((bytes: number): string => {
    return mediaService.formatFileSize(bytes);
  }, [mediaService]);

  const getUploadSpeed = useCallback((uploadId: string): number => {
    const task = uploadTasks.current.get(uploadId);
    return task ? task.progress.speed : 0;
  }, []);

  const getTimeRemaining = useCallback((uploadId: string): number => {
    const task = uploadTasks.current.get(uploadId);
    return task ? task.progress.timeRemaining : 0;
  }, []);

  return {
    // State
    uploadState,
    previews,
    isProcessing,
    
    // Actions
    uploadFiles,
    uploadFile,
    retryUpload,
    cancelUpload,
    pauseUpload,
    resumeUpload,
    clearCompleted,
    clearAll,
    
    // Getters
    getUploadTask,
    getUploadsByStatus,
    getUploadsByCategory,
    
    // Utilities
    formatFileSize,
    getUploadSpeed,
    getTimeRemaining
  };
};

// Utility functions
function getMediaType(file: File): 'image' | 'video' | 'audio' | 'document' | 'archive' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf' || file.type.includes('document')) return 'document';
  return 'archive';
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '📷';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('document')) return '📝';
  return '📁';
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    video.src = URL.createObjectURL(file);
  });
}

export default useMediaUpload; 