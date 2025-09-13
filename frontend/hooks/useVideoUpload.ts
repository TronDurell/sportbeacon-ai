import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import VideoService from '../services/videoService';
import type { VideoUploadProgress, VideoMetadata } from '../src/types/monetization';

interface UseVideoUploadReturn {
  // State
  isUploading: boolean;
  uploadProgress: VideoUploadProgress | null;
  uploadedVideos: VideoMetadata[];
  error: string | null;
  
  // Actions
  uploadVideo: (file: File, options?: UploadOptions) => Promise<VideoMetadata | null>;
  retryUpload: (file: File, options?: UploadOptions) => Promise<VideoMetadata | null>;
  cancelUpload: () => void;
  clearError: () => void;
  clearUploadedVideos: () => void;
  
  // Utilities
  validateFile: (file: File) => { isValid: boolean; error?: string };
  compressVideo: (file: File, quality?: number) => Promise<File>;
}

interface UploadOptions {
  compress?: boolean;
  quality?: number;
  onProgress?: (progress: VideoUploadProgress) => void;
  onSuccess?: (metadata: VideoMetadata) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for video upload with progress tracking and error handling
 */
export const useVideoUpload = (): UseVideoUploadReturn => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<VideoUploadProgress | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<VideoMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const currentUploadTask = useRef<any>(null);

  /**
   * Validate video file before upload
   */
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (!user?.uid) {
      return { isValid: false, error: 'User not authenticated' };
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: `File type ${file.type} is not supported` };
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 100MB limit' };
    }

    return { isValid: true };
  }, [user?.uid]);

  /**
   * Compress video file
   */
  const compressVideo = useCallback(async (file: File, quality: number = 0.8): Promise<File> => {
    try {
      return await VideoService.compressVideo(file, quality);
    } catch (error) {
      console.error('Video compression failed:', error);
      throw new Error('Failed to compress video');
    }
  }, []);

  /**
   * Upload video file
   */
  const uploadVideo = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<VideoMetadata | null> => {
    const { compress = false, quality = 0.8, onProgress, onSuccess, onError } = options;

    try {
      // Clear previous error
      setError(null);

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        const errorMessage = validation.error || 'File validation failed';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
        return null;
      }

      // Compress video if requested
      let videoFile = file;
      if (compress) {
        try {
          videoFile = await compressVideo(file, quality);
        } catch (compressionError) {
          console.warn('Video compression failed, using original file:', compressionError);
          // Continue with original file if compression fails
        }
      }

      setIsUploading(true);
      setUploadProgress({
        bytesTransferred: 0,
        totalBytes: videoFile.size,
        progress: 0,
        state: 'running',
        videoId: ''
      });

      // Upload video with progress tracking
      const result = await VideoService.uploadVideo(
        videoFile,
        user!.uid,
        (progress) => {
          setUploadProgress(progress);
          onProgress?.(progress);
        },
        (uploadError) => {
          setError(uploadError.message);
          onError?.(uploadError);
        }
      );

      // Upload successful
      const { metadata } = result;
      
      // Add to uploaded videos list
      setUploadedVideos(prev => [metadata, ...prev]);
      
      // Clear progress
      setUploadProgress(null);
      setIsUploading(false);
      
      // Call success callback
      onSuccess?.(metadata);
      
      return metadata;
    } catch (error) {
      console.error('Video upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      setUploadProgress(null);
      setIsUploading(false);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    }
  }, [user?.uid, validateFile, compressVideo]);

  /**
   * Retry upload with same file
   */
  const retryUpload = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<VideoMetadata | null> => {
    // Clear previous error and progress
    setError(null);
    setUploadProgress(null);
    
    return uploadVideo(file, options);
  }, [uploadVideo]);

  /**
   * Cancel current upload
   */
  const cancelUpload = useCallback(() => {
    if (currentUploadTask.current) {
      try {
        currentUploadTask.current.cancel();
        console.log('Upload cancelled');
      } catch (error) {
        console.error('Error cancelling upload:', error);
      }
    }
    
    setIsUploading(false);
    setUploadProgress(null);
    setError('Upload cancelled');
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear uploaded videos list
   */
  const clearUploadedVideos = useCallback(() => {
    setUploadedVideos([]);
  }, []);

  return {
    // State
    isUploading,
    uploadProgress,
    uploadedVideos,
    error,
    
    // Actions
    uploadVideo,
    retryUpload,
    cancelUpload,
    clearError,
    clearUploadedVideos,
    
    // Utilities
    validateFile,
    compressVideo
  };
};

export default useVideoUpload; 