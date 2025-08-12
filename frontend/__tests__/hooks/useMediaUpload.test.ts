import { renderHook, act, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import MediaService from '../../services/mediaService';

// Mock MediaService
jest.mock('../../services/mediaService');
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' }
  })
}));

const mockMediaService = {
  getInstance: jest.fn(),
  uploadFile: jest.fn(),
  cancelUpload: jest.fn(),
  pauseUpload: jest.fn(),
  resumeUpload: jest.fn(),
  clearCompletedUploads: jest.fn(),
  formatFileSize: jest.fn()
};

describe('useMediaUpload', () => {
  let mockFile: File;
  let mockUploadTask: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup MediaService mock
    (MediaService.getInstance as jest.Mock).mockReturnValue(mockMediaService);
    mockMediaService.formatFileSize.mockImplementation((bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    });

    // Create mock file
    mockFile = new File(['test content'], 'test-image.jpg', {
      type: 'image/jpeg'
    });

    // Create mock upload task
    mockUploadTask = {
      id: 'test-upload-id',
      file: mockFile,
      metadata: {
        fileName: 'test-image.jpg',
        originalName: 'test-image.jpg',
        fileSize: 1000,
        mimeType: 'image/jpeg',
        mediaType: 'image',
        category: 'gallery',
        status: 'uploading',
        uploadedBy: 'test-user-id',
        tags: [],
        isPublic: false,
        accessLevel: 'private',
        allowedRoles: [],
        customMetadata: {}
      },
      uploadTask: {
        on: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        cancel: jest.fn()
      },
      progress: {
        bytesTransferred: 0,
        totalBytes: 1000,
        percentage: 0,
        speed: 0,
        timeRemaining: 0,
        status: 'pending'
      },
      status: 'uploading',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockMediaService.uploadFile.mockResolvedValue(mockUploadTask);
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useMediaUpload());

      expect(result.current.uploadState).toEqual({
        uploads: [],
        isUploading: false,
        totalProgress: 0,
        completedCount: 0,
        failedCount: 0,
        error: null
      });

      expect(result.current.previews).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('File Upload', () => {
    it('should upload files successfully', async () => {
      const { result } = renderHook(() => useMediaUpload());

      await act(async () => {
        const uploadTasks = await result.current.uploadFiles([mockFile], 'gallery');
        expect(uploadTasks).toHaveLength(1);
        expect(uploadTasks[0].status).toBe('uploading');
      });

      expect(mockMediaService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'gallery',
        {}
      );
    });

    it('should handle upload errors', async () => {
      const error = new Error('Upload failed');
      mockMediaService.uploadFile.mockRejectedValue(error);

      const { result } = renderHook(() => useMediaUpload());

      await act(async () => {
        const uploadTasks = await result.current.uploadFiles([mockFile], 'gallery');
        expect(uploadTasks).toHaveLength(1);
        expect(uploadTasks[0].status).toBe('failed');
        expect(uploadTasks[0].error).toBe('Upload failed');
      });
    });

    it('should upload single file', async () => {
      const { result } = renderHook(() => useMediaUpload());

      await act(async () => {
        const uploadTask = await result.current.uploadFile(mockFile, 'gallery');
        expect(uploadTask.status).toBe('uploading');
      });

      expect(mockMediaService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'gallery',
        {}
      );
    });

    it('should handle authentication errors', async () => {
      // Mock useAuth to return no user
      jest.doMock('../../contexts/AuthContext', () => ({
        useAuth: () => ({ user: null })
      }));

      const { result } = renderHook(() => useMediaUpload());

      await act(async () => {
        await expect(result.current.uploadFiles([mockFile], 'gallery')).rejects.toThrow(
          'User not authenticated'
        );
      });
    });
  });

  describe('File Previews', () => {
    it('should create file previews for images', async () => {
      const { result } = renderHook(() => useMediaUpload());

      // Mock URL.createObjectURL
      const mockUrl = 'blob:test-url';
      URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);

      // Mock getImageDimensions
      const mockDimensions = { width: 800, height: 600 };
      const mockGetImageDimensions = jest.fn().mockResolvedValue(mockDimensions);

      await act(async () => {
        await result.current.uploadFiles([mockFile], 'gallery');
      });

      await waitFor(() => {
        expect(result.current.previews).toHaveLength(1);
        expect(result.current.previews[0].preview).toBe(mockUrl);
        expect(result.current.previews[0].type).toBe('image');
        expect(result.current.previews[0].size).toBe(1000);
      });
    });

    it('should create file previews for videos', async () => {
      const videoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const { result } = renderHook(() => useMediaUpload());

      // Mock URL.createObjectURL
      const mockUrl = 'blob:test-url';
      URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);

      // Mock getVideoDuration
      const mockDuration = 120;
      const mockGetVideoDuration = jest.fn().mockResolvedValue(mockDuration);

      await act(async () => {
        await result.current.uploadFiles([videoFile], 'gallery');
      });

      await waitFor(() => {
        expect(result.current.previews).toHaveLength(1);
        expect(result.current.previews[0].preview).toBe(mockUrl);
        expect(result.current.previews[0].type).toBe('video');
        expect(result.current.previews[0].size).toBe(1000);
      });
    });

    it('should handle preview creation errors', async () => {
      const { result } = renderHook(() => useMediaUpload());

      // Mock URL.createObjectURL to throw error
      URL.createObjectURL = jest.fn().mockImplementation(() => {
        throw new Error('Preview creation failed');
      });

      await act(async () => {
        await result.current.uploadFiles([mockFile], 'gallery');
      });

      await waitFor(() => {
        expect(result.current.previews).toHaveLength(1);
        expect(result.current.previews[0].error).toBe('Failed to create preview');
      });
    });
  });

  describe('Upload Management', () => {
    it('should retry failed uploads', async () => {
      const { result } = renderHook(() => useMediaUpload());

      const failedTask = {
        ...mockUploadTask,
        status: 'failed',
        error: 'Upload failed'
      };

      mockMediaService.uploadFile.mockResolvedValue(mockUploadTask);

      await act(async () => {
        const retryResult = await result.current.retryUpload('failed-upload-id');
        expect(retryResult).toBeDefined();
      });

      expect(mockMediaService.uploadFile).toHaveBeenCalled();
    });

    it('should cancel uploads', () => {
      const { result } = renderHook(() => useMediaUpload());

      act(() => {
        result.current.cancelUpload('test-upload-id');
      });

      expect(mockMediaService.cancelUpload).toHaveBeenCalledWith('test-upload-id');
    });

    it('should pause uploads', () => {
      const { result } = renderHook(() => useMediaUpload());

      act(() => {
        result.current.pauseUpload('test-upload-id');
      });

      expect(mockMediaService.pauseUpload).toHaveBeenCalledWith('test-upload-id');
    });

    it('should resume uploads', () => {
      const { result } = renderHook(() => useMediaUpload());

      act(() => {
        result.current.resumeUpload('test-upload-id');
      });

      expect(mockMediaService.resumeUpload).toHaveBeenCalledWith('test-upload-id');
    });

    it('should clear completed uploads', () => {
      const { result } = renderHook(() => useMediaUpload());

      act(() => {
        result.current.clearCompleted();
      });

      expect(mockMediaService.clearCompletedUploads).toHaveBeenCalled();
    });

    it('should clear all uploads', () => {
      const { result } = renderHook(() => useMediaUpload());

      act(() => {
        result.current.clearAll();
      });

      expect(mockMediaService.clearCompletedUploads).toHaveBeenCalled();
    });
  });

  describe('Upload State Management', () => {
    it('should update upload state correctly', async () => {
      const { result } = renderHook(() => useMediaUpload());

      await act(async () => {
        await result.current.uploadFiles([mockFile], 'gallery');
      });

      await waitFor(() => {
        expect(result.current.uploadState.uploads).toHaveLength(1);
        expect(result.current.uploadState.isUploading).toBe(true);
      });
    });

    it('should calculate total progress correctly', async () => {
      const { result } = renderHook(() => useMediaUpload());

      const uploadTask1 = {
        ...mockUploadTask,
        id: 'upload-1',
        progress: { ...mockUploadTask.progress, percentage: 50 }
      };

      const uploadTask2 = {
        ...mockUploadTask,
        id: 'upload-2',
        progress: { ...mockUploadTask.progress, percentage: 100 }
      };

      mockMediaService.uploadFile
        .mockResolvedValueOnce(uploadTask1)
        .mockResolvedValueOnce(uploadTask2);

      await act(async () => {
        await result.current.uploadFiles([mockFile, mockFile], 'gallery');
      });

      await waitFor(() => {
        expect(result.current.uploadState.totalProgress).toBe(75);
      });
    });

    it('should count completed and failed uploads', async () => {
      const { result } = renderHook(() => useMediaUpload());

      const completedTask = {
        ...mockUploadTask,
        id: 'completed-1',
        status: 'completed'
      };

      const failedTask = {
        ...mockUploadTask,
        id: 'failed-1',
        status: 'failed'
      };

      mockMediaService.uploadFile
        .mockResolvedValueOnce(completedTask)
        .mockResolvedValueOnce(failedTask);

      await act(async () => {
        await result.current.uploadFiles([mockFile, mockFile], 'gallery');
      });

      await waitFor(() => {
        expect(result.current.uploadState.completedCount).toBe(1);
        expect(result.current.uploadState.failedCount).toBe(1);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should format file size correctly', () => {
      const { result } = renderHook(() => useMediaUpload());

      expect(result.current.formatFileSize(1024)).toBe('1.0 KB');
      expect(result.current.formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(result.current.formatFileSize(0)).toBe('0 B');
    });

    it('should get upload speed', () => {
      const { result } = renderHook(() => useMediaUpload());

      const speed = result.current.getUploadSpeed('test-upload-id');
      expect(speed).toBe(0); // No upload task exists
    });

    it('should get time remaining', () => {
      const { result } = renderHook(() => useMediaUpload());

      const timeRemaining = result.current.getTimeRemaining('test-upload-id');
      expect(timeRemaining).toBe(0); // No upload task exists
    });
  });

  describe('Upload Task Getters', () => {
    it('should get upload task by ID', () => {
      const { result } = renderHook(() => useMediaUpload());

      const task = result.current.getUploadTask('test-upload-id');
      expect(task).toBeUndefined(); // No task exists initially
    });

    it('should get uploads by status', () => {
      const { result } = renderHook(() => useMediaUpload());

      const uploads = result.current.getUploadsByStatus('uploading');
      expect(uploads).toHaveLength(0); // No uploads exist initially
    });

    it('should get uploads by category', () => {
      const { result } = renderHook(() => useMediaUpload());

      const uploads = result.current.getUploadsByCategory('gallery');
      expect(uploads).toHaveLength(0); // No uploads exist initially
    });
  });

  describe('Processing State', () => {
    it('should set processing state during upload', async () => {
      const { result } = renderHook(() => useMediaUpload());

      expect(result.current.isProcessing).toBe(false);

      const uploadPromise = result.current.uploadFiles([mockFile], 'gallery');

      // Check that processing state is set during upload
      expect(result.current.isProcessing).toBe(true);

      await act(async () => {
        await uploadPromise;
      });

      // Check that processing state is reset after upload
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle file validation errors', async () => {
      const { result } = renderHook(() => useMediaUpload());

      // Create a file that would fail validation
      const invalidFile = new File(['test'], 'test.exe', {
        type: 'application/x-executable'
      });

      mockMediaService.uploadFile.mockRejectedValue(
        new Error('File type application/x-executable is not allowed')
      );

      await act(async () => {
        const uploadTasks = await result.current.uploadFiles([invalidFile], 'gallery');
        expect(uploadTasks).toHaveLength(1);
        expect(uploadTasks[0].status).toBe('failed');
      });
    });

    it('should handle network errors', async () => {
      const { result } = renderHook(() => useMediaUpload());

      mockMediaService.uploadFile.mockRejectedValue(
        new Error('Network error')
      );

      await act(async () => {
        const uploadTasks = await result.current.uploadFiles([mockFile], 'gallery');
        expect(uploadTasks).toHaveLength(1);
        expect(uploadTasks[0].status).toBe('failed');
        expect(uploadTasks[0].error).toBe('Network error');
      });
    });
  });

  describe('Memory Management', () => {
    it('should cleanup resources on unmount', () => {
      const { unmount } = renderHook(() => useMediaUpload());

      // Mock clearInterval
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should cleanup upload tasks on unmount', () => {
      const { unmount } = renderHook(() => useMediaUpload());

      unmount();

      expect(mockMediaService.cancelUpload).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent uploads', async () => {
      const { result } = renderHook(() => useMediaUpload());

      const files = Array.from({ length: 5 }, (_, i) => 
        new File(['test'], `test-${i}.jpg`, { type: 'image/jpeg' })
      );

      mockMediaService.uploadFile.mockResolvedValue(mockUploadTask);

      const startTime = Date.now();

      await act(async () => {
        const uploadTasks = await result.current.uploadFiles(files, 'gallery');
        expect(uploadTasks).toHaveLength(5);
      });

      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle large file uploads efficiently', async () => {
      const { result } = renderHook(() => useMediaUpload());

      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });

      mockMediaService.uploadFile.mockResolvedValue(mockUploadTask);

      const startTime = Date.now();

      await act(async () => {
        const uploadTask = await result.current.uploadFile(largeFile, 'gallery');
        expect(uploadTask.status).toBe('uploading');
      });

      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
}); 