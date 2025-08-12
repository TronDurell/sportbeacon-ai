import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Image,
  Video,
  File,
  Music,
  Archive,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import type { MediaCategory, FilePreview } from '../../types/media';

/**
 * Comprehensive Media Upload Component
 * Features drag-drop, progress tracking, file preview, and upload management
 */
const MediaUpload: React.FC<{
  category: MediaCategory;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  onUploadComplete?: (mediaIds: string[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}> = ({
  category,
  multiple = true,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx',
  onUploadComplete,
  onUploadError,
  className = ''
}) => {
  const {
    uploadState,
    previews,
    isProcessing,
    uploadFiles,
    retryUpload,
    cancelUpload,
    pauseUpload,
    resumeUpload,
    clearCompleted,
    formatFileSize,
    getUploadSpeed,
    getTimeRemaining
  } = useMediaUpload();

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Check file size
      if (file.size > maxSize) {
        onUploadError?.(`File ${file.name} is too large (${formatFileSize(file.size)})`);
        return false;
      }

      // Check file count
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        onUploadError?.(`Maximum ${maxFiles} files allowed`);
        return false;
      }

      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, [maxSize, maxFiles, selectedFiles.length, onUploadError, formatFileSize]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  }, [handleFileSelect]);

  // Start upload
  const startUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      const uploadTasks = await uploadFiles(selectedFiles, category);
      const completedIds = uploadTasks
        .filter(task => task.status === 'completed')
        .map(task => task.metadata.id)
        .filter(Boolean) as string[];

      if (completedIds.length > 0) {
        onUploadComplete?.(completedIds);
      }

      setSelectedFiles([]);
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [selectedFiles, category, uploadFiles, onUploadComplete, onUploadError]);

  // Remove selected file
  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (file.type.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (file.type.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (file.type === 'application/pdf') return <File className="w-6 h-6" />;
    if (file.type.includes('document')) return <File className="w-6 h-6" />;
    return <Archive className="w-6 h-6" />;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <Upload className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Upload className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'uploading':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to browse
        </h3>
        <p className="text-gray-600 mb-4">
          Support for images, videos, audio, and documents up to {formatFileSize(maxSize)}
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Choose Files
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Files ({selectedFiles.length})
            </h3>
            <button
              onClick={startUpload}
              disabled={isProcessing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Uploading...' : 'Start Upload'}
            </button>
          </div>

          <div className="space-y-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadState.uploads.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Upload Progress ({uploadState.completedCount}/{uploadState.uploads.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={clearCompleted}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Clear Completed
              </button>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">{uploadState.totalProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.totalProgress}%` }}
              />
            </div>
          </div>

          {/* Individual Uploads */}
          <div className="space-y-4">
            {uploadState.uploads.map((upload) => (
              <div key={upload.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(upload.file)}
                    <div>
                      <p className="font-medium text-gray-900">{upload.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(upload.progress.bytesTransferred)} / {formatFileSize(upload.progress.totalBytes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(upload.status)}
                    <span className={`text-sm font-medium ${getStatusColor(upload.status)}`}>
                      {upload.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{upload.progress.percentage.toFixed(1)}%</span>
                    {upload.status === 'uploading' && (
                      <span className="text-xs text-gray-500">
                        {formatFileSize(getUploadSpeed(upload.id))}/s
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        upload.status === 'completed' ? 'bg-green-500' :
                        upload.status === 'failed' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${upload.progress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {upload.status === 'uploading' && (
                    <>
                      <button
                        onClick={() => pauseUpload(upload.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => cancelUpload(upload.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {upload.progress.status === 'paused' && (
                    <button
                      onClick={() => resumeUpload(upload.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}

                  {upload.status === 'failed' && (
                    <button
                      onClick={() => retryUpload(upload.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  {upload.status === 'completed' && (
                    <button
                      onClick={() => window.open(upload.metadata.downloadUrl, '_blank')}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  {upload.error && (
                    <span className="text-xs text-red-600">{upload.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">File Previews</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {preview.type === 'image' ? (
                    <img
                      src={preview.preview}
                      alt={preview.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : preview.type === 'video' ? (
                    <video
                      src={preview.preview}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {preview.preview}
                    </div>
                  )}
                </div>
                
                {preview.error && (
                  <div className="absolute inset-0 bg-red-100 bg-opacity-90 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => removeSelectedFile(index)}
                    className="text-white hover:text-red-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(preview.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload; 