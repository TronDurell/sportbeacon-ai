import type { Timestamp } from 'firebase/firestore';
import type { UploadTask, UploadTaskSnapshot } from 'firebase/storage';

// Media Types
export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'archive';

// Media Categories
export type MediaCategory = 
  | 'profile'
  | 'avatar'
  | 'cover'
  | 'gallery'
  | 'document'
  | 'verification'
  | 'content'
  | 'thumbnail'
  | 'preview';

// Media Status
export type MediaStatus = 
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'deleted'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

// File Validation Types
export interface FileValidation {
  maxSize: number; // bytes
  allowedTypes: string[];
  maxFiles: number;
  minWidth?: number; // for images
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

// Upload Progress Types
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error';
}

// Media Metadata Types
export interface MediaMetadata {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  mediaType: MediaType;
  category: MediaCategory;
  status: MediaStatus;
  
  // Image/Video specific
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for video/audio
  thumbnailUrl?: string;
  
  // Processing info
  processingInfo?: {
    isProcessed: boolean;
    processingTime: number;
    optimizationLevel: 'low' | 'medium' | 'high';
    compressionRatio: number;
  };
  
  // Access control
  isPublic: boolean;
  accessLevel: 'public' | 'private' | 'shared';
  allowedRoles: string[];
  
  // Organization
  tags: string[];
  description?: string;
  altText?: string;
  
  // Storage info
  storagePath: string;
  downloadUrl: string;
  signedUrl?: string;
  expiresAt?: Timestamp;
  
  // User info
  uploadedBy: string;
  uploadedAt: Timestamp;
  updatedAt: Timestamp;
  
  // Custom metadata
  customMetadata: Record<string, string>;
}

// Upload Task Types
export interface MediaUploadTask {
  id: string;
  file: File;
  metadata: Partial<MediaMetadata>;
  uploadTask: UploadTask;
  progress: UploadProgress;
  status: MediaStatus;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Media Collection Types
export interface MediaCollection {
  id: string;
  name: string;
  description?: string;
  mediaIds: string[];
  category: MediaCategory;
  isPublic: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Image Processing Types
export interface ImageProcessingOptions {
  quality: number; // 0-100
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio: boolean;
  generateThumbnail: boolean;
  thumbnailSize: {
    width: number;
    height: number;
  };
}

// Video Processing Types
export interface VideoProcessingOptions {
  quality: 'low' | 'medium' | 'high';
  maxResolution: {
    width: number;
    height: number;
  };
  generateThumbnail: boolean;
  thumbnailTime: number; // seconds from start
  thumbnailSize: {
    width: number;
    height: number;
  };
  format: 'mp4' | 'webm' | 'mov';
}

// Upload Configuration Types
export interface UploadConfig {
  validation: FileValidation;
  imageProcessing?: ImageProcessingOptions;
  videoProcessing?: VideoProcessingOptions;
  autoOptimize: boolean;
  generateThumbnails: boolean;
  maxConcurrentUploads: number;
  retryAttempts: number;
  chunkSize: number; // bytes
}

// Media Service Types
export interface MediaServiceConfig {
  storageBucket: string;
  uploadConfig: UploadConfig;
  securityRules: {
    allowPublicRead: boolean;
    requireAuth: boolean;
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
}

// Upload Hook Types
export interface UploadState {
  uploads: MediaUploadTask[];
  isUploading: boolean;
  totalProgress: number;
  completedCount: number;
  failedCount: number;
  error: string | null;
}

// Media Gallery Types
export interface MediaGallery {
  id: string;
  name: string;
  description?: string;
  media: MediaMetadata[];
  layout: 'grid' | 'list' | 'carousel';
  sortBy: 'date' | 'name' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  filters: {
    mediaTypes: MediaType[];
    categories: MediaCategory[];
    dateRange?: {
      start: Timestamp;
      end: Timestamp;
    };
  };
}

// Media Search Types
export interface MediaSearchFilters {
  query?: string;
  mediaTypes?: MediaType[];
  categories?: MediaCategory[];
  status?: MediaStatus[];
  uploadedBy?: string;
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  tags?: string[];
  isPublic?: boolean;
  minSize?: number;
  maxSize?: number;
}

// Media Analytics Types
export interface MediaAnalytics {
  totalFiles: number;
  totalSize: number;
  averageFileSize: number;
  uploadsByType: Record<MediaType, number>;
  uploadsByCategory: Record<MediaCategory, number>;
  uploadsByStatus: Record<MediaStatus, number>;
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  uploadTrends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

// Drag & Drop Types
export interface DropZoneProps {
  onDrop: (files: File[]) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// File Preview Types
export interface FilePreview {
  file: File;
  preview: string;
  type: MediaType;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  error?: string;
}

// Upload Error Types
export interface UploadError {
  code: string;
  message: string;
  file?: File;
  retryable: boolean;
  timestamp: Timestamp;
}

// Media Processing Queue Types
export interface ProcessingQueueItem {
  id: string;
  mediaId: string;
  type: 'image' | 'video' | 'thumbnail';
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options: ImageProcessingOptions | VideoProcessingOptions;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  error?: string;
}

// Media Access Control Types
export interface MediaAccessControl {
  mediaId: string;
  userId: string;
  permissions: ('read' | 'write' | 'delete' | 'share')[];
  grantedAt: Timestamp;
  grantedBy: string;
  expiresAt?: Timestamp;
}

// Media Sharing Types
export interface MediaShare {
  id: string;
  mediaId: string;
  sharedBy: string;
  sharedWith: string[];
  permissions: ('view' | 'download' | 'edit')[];
  isPublic: boolean;
  shareUrl?: string;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
}

// Export all types
export type {
  MediaType,
  MediaCategory,
  MediaStatus,
  FileValidation,
  UploadProgress,
  MediaMetadata,
  MediaUploadTask,
  MediaCollection,
  ImageProcessingOptions,
  VideoProcessingOptions,
  UploadConfig,
  MediaServiceConfig,
  UploadState,
  MediaGallery,
  MediaSearchFilters,
  MediaAnalytics,
  DropZoneProps,
  FilePreview,
  UploadError,
  ProcessingQueueItem,
  MediaAccessControl,
  MediaShare
}; 