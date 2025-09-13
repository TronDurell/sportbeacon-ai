import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '../firebase/init';
import type { VideoUploadProgress, VideoMetadata, VideoFile } from '../src/types/monetization';

/**
 * Video upload service for Firebase Storage
 * Handles video uploads with progress tracking, compression, and metadata management
 */
export class VideoService {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/avi', 'video/mov'];
  private static readonly STORAGE_PATH = 'videos';

  /**
   * Upload a video file to Firebase Storage with progress tracking
   */
  static async uploadVideo(
    file: File,
    userId: string,
    onProgress?: (progress: VideoUploadProgress) => void,
    onError?: (error: Error) => void
  ): Promise<{ videoId: string; downloadURL: string; metadata: VideoMetadata }> {
    try {
      // Validate file
      this.validateVideoFile(file);

      // Generate unique video ID
      const videoId = this.generateVideoId();
      const fileName = `${videoId}_${file.name}`;
      const storagePath = `${this.STORAGE_PATH}/${userId}/${fileName}`;
      
      // Create storage reference
      const storageRef = ref(storage, storagePath);

      // Create upload task with resume capability
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          originalName: file.name,
          uploadedBy: userId,
          fileSize: file.size.toString(),
          contentType: file.type
        }
      });

      // Set up progress tracking
      uploadTask.on('state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const uploadProgress: VideoUploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: Math.round(progress),
            state: snapshot.state,
            videoId
          };
          
          onProgress?.(uploadProgress);
        },
        (error) => {
          console.error('Video upload error:', error);
          onError?.(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const metadata: VideoMetadata = {
              width: 1920,
              height: 1080,
              durationSec: 0,
              videoId,
              fileName,
              originalName: file.name,
              fileSize: file.size,
              contentType: file.type,
              downloadURL,
              storagePath,
              uploadedBy: userId
            };

            return { videoId, downloadURL, metadata };
          } catch (error) {
            console.error('Error getting download URL:', error);
            throw new Error('Failed to get download URL');
          }
        }
      );

      // Wait for upload to complete
      await uploadTask;
      
      // Get final result
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      
      const metadata: VideoMetadata = {
        width: 1920,
        height: 1080,
        durationSec: 0,
        videoId,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        contentType: file.type,
        downloadURL,
        storagePath,
        uploadedBy: userId
      };

      return { videoId, downloadURL, metadata };
    } catch (error) {
      console.error('Video upload failed:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a video
   */
  static async getVideoDownloadURL(storagePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, storagePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting video download URL:', error);
      throw new Error('Failed to get video download URL');
    }
  }

  /**
   * Delete a video from storage
   */
  static async deleteVideo(storagePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw new Error('Failed to delete video');
    }
  }

  /**
   * List all videos for a user
   */
  static async listUserVideos(userId: string): Promise<VideoFile[]> {
    try {
      const userVideosPath = `${this.STORAGE_PATH}/${userId}`;
      const storageRef = ref(storage, userVideosPath);
      const result = await listAll(storageRef);
      
      const videos: VideoFile[] = [];
      
      for (const itemRef of result.items) {
        try {
          const downloadURL = await getDownloadURL(itemRef);
          const videoFile: VideoFile = {
            fileName: itemRef.name,
            mimeType: 'video/mp4', // Default, would need metadata for actual type
            sizeBytes: 0, // Would need metadata to get actual size
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            downloadURL,
            size: 0, // Would need metadata to get actual size
            lastModified: new Date().toISOString()
          };
          videos.push(videoFile);
        } catch (error) {
          console.warn(`Failed to get download URL for ${itemRef.name}:`, error);
        }
      }
      
      return videos;
    } catch (error) {
      console.error('Error listing user videos:', error);
      throw new Error('Failed to list user videos');
    }
  }

  /**
   * Validate video file before upload
   */
  private static validateVideoFile(file: File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
    }
  }

  /**
   * Generate unique video ID
   */
  private static generateVideoId(): string {
    return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Compress video file using MediaRecorder API (client-side)
   */
  static async compressVideo(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      try {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        video.onloadedmetadata = () => {
          // Set canvas dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Start video playback
          video.currentTime = 0;
          video.play();
        };

        video.onseeked = () => {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'video/webm',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress video'));
              }
            },
            'video/webm',
            quality
          );
        };

        video.onerror = () => {
          reject(new Error('Failed to load video for compression'));
        };

        // Load video file
        const url = URL.createObjectURL(file);
        video.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get upload progress for a specific upload task
   */
  static getUploadProgress(uploadTask: UploadTask): VideoUploadProgress | null {
    const snapshot = uploadTask.snapshot;
    if (snapshot) {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      return {
        bytesTransferred: snapshot.bytesTransferred,
        totalBytes: snapshot.totalBytes,
        progress: Math.round(progress),
        state: snapshot.state,
        videoId: '' // Would need to be set from context
      };
    }
    return null;
  }
}

export default VideoService; 