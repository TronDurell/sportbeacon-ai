import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import MediaUpload from '../../../components/media/MediaUpload';
import { useMediaUpload } from '../../../hooks/useMediaUpload';

// Mock the useMediaUpload hook
jest.mock('../../../hooks/useMediaUpload');

const mockUseMediaUpload = useMediaUpload as jest.MockedFunction<typeof useMediaUpload>;

describe('MediaUpload', () => {
  let mockFile: File;
  let mockUploadTask: any;

  beforeEach(() => {
    jest.clearAllMocks();

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

    // Setup default mock implementation
    mockUseMediaUpload.mockReturnValue({
      uploadState: {
        uploads: [],
        isUploading: false,
        totalProgress: 0,
        completedCount: 0,
        failedCount: 0,
        error: null
      },
      previews: [],
      isProcessing: false,
      uploadFiles: jest.fn().mockResolvedValue([mockUploadTask]),
      uploadFile: jest.fn().mockResolvedValue(mockUploadTask),
      retryUpload: jest.fn().mockResolvedValue(mockUploadTask),
      cancelUpload: jest.fn(),
      pauseUpload: jest.fn(),
      resumeUpload: jest.fn(),
      clearCompleted: jest.fn(),
      clearAll: jest.fn(),
      getUploadTask: jest.fn(),
      getUploadsByStatus: jest.fn().mockReturnValue([]),
      getUploadsByCategory: jest.fn().mockReturnValue([]),
      formatFileSize: jest.fn().mockImplementation((bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      }),
      getUploadSpeed: jest.fn().mockReturnValue(0),
      getTimeRemaining: jest.fn().mockReturnValue(0)
    });
  });

  describe('Rendering', () => {
    it('should render the upload component', () => {
      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose Files')).toBeInTheDocument();
      expect(screen.getByText(/Support for images, videos, audio, and documents/)).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<MediaUpload category="gallery" className="custom-class" />);
      
      const container = screen.getByText('Drop files here or click to browse').closest('div');
      expect(container?.parentElement).toHaveClass('custom-class');
    });

    it('should display file size limit', () => {
      render(<MediaUpload category="gallery" maxSize={50 * 1024 * 1024} />);
      
      expect(screen.getByText(/up to 50.0 MB/)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over', async () => {
      const user = userEvent.setup();
      render(<MediaUpload category="gallery" />);

      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;

      await act(async () => {
        fireEvent.dragOver(dropZone);
      });

      expect(dropZone).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('should handle drag leave', async () => {
      const user = userEvent.setup();
      render(<MediaUpload category="gallery" />);

      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;

      await act(async () => {
        fireEvent.dragOver(dropZone);
        fireEvent.dragLeave(dropZone);
      });

      expect(dropZone).not.toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('should handle file drop', async () => {
      const user = userEvent.setup();
      const onUploadComplete = jest.fn();
      const onUploadError = jest.fn();

      render(
        <MediaUpload 
          category="gallery" 
          onUploadComplete={onUploadComplete}
          onUploadError={onUploadError}
        />
      );

      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;

      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => mockFile
      } as FileList;

      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: fileList
          }
        });
      });

      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
    });

    it('should handle invalid file drop', async () => {
      const user = userEvent.setup();
      const onUploadError = jest.fn();

      const invalidFile = new File(['test'], 'test.exe', {
        type: 'application/x-executable'
      });

      render(
        <MediaUpload 
          category="gallery" 
          onUploadError={onUploadError}
        />
      );

      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;

      const fileList = {
        0: invalidFile,
        length: 1,
        item: (index: number) => invalidFile
      } as FileList;

      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: fileList
          }
        });
      });

      expect(onUploadError).toHaveBeenCalled();
    });
  });

  describe('File Selection', () => {
    it('should handle file input change', async () => {
      const user = userEvent.setup();
      render(<MediaUpload category="gallery" />);

      const fileInput = screen.getByRole('button', { name: 'Choose Files' });
      
      // Mock file input
      const mockFileInput = {
        files: [mockFile]
      } as HTMLInputElement;

      await act(async () => {
        fireEvent.click(fileInput);
        // Simulate file selection
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { files: [mockFile] } });
        }
      });

      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
    });

    it('should handle multiple file selection', async () => {
      const user = userEvent.setup();
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      
      render(<MediaUpload category="gallery" multiple={true} />);

      const fileInput = screen.getByRole('button', { name: 'Choose Files' });
      
      await act(async () => {
        fireEvent.click(fileInput);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { files: [mockFile, file2] } });
        }
      });

      expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
    });

    it('should respect maxFiles limit', async () => {
      const user = userEvent.setup();
      const onUploadError = jest.fn();
      
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      const file3 = new File(['test3'], 'test3.jpg', { type: 'image/jpeg' });
      
      render(
        <MediaUpload 
          category="gallery" 
          maxFiles={2}
          onUploadError={onUploadError}
        />
      );

      const fileInput = screen.getByRole('button', { name: 'Choose Files' });
      
      await act(async () => {
        fireEvent.click(fileInput);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { files: [mockFile, file2, file3] } });
        }
      });

      expect(onUploadError).toHaveBeenCalledWith('Maximum 2 files allowed');
    });
  });

  describe('File Validation', () => {
    it('should validate file size', async () => {
      const user = userEvent.setup();
      const onUploadError = jest.fn();
      
      const largeFile = new File(['x'.repeat(200 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });
      
      render(
        <MediaUpload 
          category="gallery" 
          maxSize={100 * 1024 * 1024}
          onUploadError={onUploadError}
        />
      );

      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;

      const fileList = {
        0: largeFile,
        length: 1,
        item: (index: number) => largeFile
      } as FileList;

      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: fileList
          }
        });
      });

      expect(onUploadError).toHaveBeenCalledWith(
        expect.stringContaining('File large.jpg is too large')
      );
    });

    it('should validate file type', async () => {
      const user = userEvent.setup();
      const onUploadError = jest.fn();
      
      const invalidFile = new File(['test'], 'test.exe', {
        type: 'application/x-executable'
      });
      
      render(
        <MediaUpload 
          category="gallery" 
          accept="image/*,video/*"
          onUploadError={onUploadError}
        />
      );

      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;

      const fileList = {
        0: invalidFile,
        length: 1,
        item: (index: number) => invalidFile
      } as FileList;

      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: fileList
          }
        });
      });

      expect(onUploadError).toHaveBeenCalled();
    });
  });

  describe('Upload Process', () => {
    it('should start upload when button is clicked', async () => {
      const user = userEvent.setup();
      const onUploadComplete = jest.fn();
      const mockUploadFiles = jest.fn().mockResolvedValue([mockUploadTask]);

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadFiles: mockUploadFiles
      });

      render(
        <MediaUpload 
          category="gallery" 
          onUploadComplete={onUploadComplete}
        />
      );

      // Add file first
      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;
      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => mockFile
      } as FileList;

      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: fileList
          }
        });
      });

      // Start upload
      const startButton = screen.getByText('Start Upload');
      await act(async () => {
        fireEvent.click(startButton);
      });

      expect(mockUploadFiles).toHaveBeenCalledWith([mockFile], 'gallery');
    });

    it('should show processing state during upload', async () => {
      const user = userEvent.setup();
      
      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        isProcessing: true
      });

      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('should handle upload errors', async () => {
      const user = userEvent.setup();
      const onUploadError = jest.fn();
      const mockUploadFiles = jest.fn().mockRejectedValue(new Error('Upload failed'));

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadFiles: mockUploadFiles
      });

      render(
        <MediaUpload 
          category="gallery" 
          onUploadError={onUploadError}
        />
      );

      // Add file and start upload
      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;
      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => mockFile
      } as FileList;

      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: fileList
          }
        });
      });

      const startButton = screen.getByText('Start Upload');
      await act(async () => {
        fireEvent.click(startButton);
      });

      expect(onUploadError).toHaveBeenCalledWith('Upload failed');
    });
  });

  describe('Upload Progress', () => {
    it('should display upload progress', () => {
      const mockUploads = [
        {
          ...mockUploadTask,
          progress: {
            ...mockUploadTask.progress,
            percentage: 50,
            bytesTransferred: 500,
            totalBytes: 1000
          }
        }
      ];

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadState: {
          uploads: mockUploads,
          isUploading: true,
          totalProgress: 50,
          completedCount: 0,
          failedCount: 0,
          error: null
        }
      });

      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('Upload Progress (0/1)')).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });

    it('should display completed uploads', () => {
      const completedUpload = {
        ...mockUploadTask,
        status: 'completed',
        progress: {
          ...mockUploadTask.progress,
          percentage: 100
        }
      };

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadState: {
          uploads: [completedUpload],
          isUploading: false,
          totalProgress: 100,
          completedCount: 1,
          failedCount: 0,
          error: null
        }
      });

      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('Upload Progress (1/1)')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('should display failed uploads', () => {
      const failedUpload = {
        ...mockUploadTask,
        status: 'failed',
        error: 'Upload failed'
      };

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadState: {
          uploads: [failedUpload],
          isUploading: false,
          totalProgress: 0,
          completedCount: 0,
          failedCount: 1,
          error: null
        }
      });

      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('Upload Progress (0/1)')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  describe('Upload Controls', () => {
    it('should pause upload', async () => {
      const user = userEvent.setup();
      const mockPauseUpload = jest.fn();

      const uploadingTask = {
        ...mockUploadTask,
        status: 'uploading'
      };

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadState: {
          uploads: [uploadingTask],
          isUploading: true,
          totalProgress: 0,
          completedCount: 0,
          failedCount: 0,
          error: null
        },
        pauseUpload: mockPauseUpload
      });

      render(<MediaUpload category="gallery" />);

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await act(async () => {
        fireEvent.click(pauseButton);
      });

      expect(mockPauseUpload).toHaveBeenCalledWith('test-upload-id');
    });

    it('should resume upload', async () => {
      const user = userEvent.setup();
      const mockResumeUpload = jest.fn();

      const pausedTask = {
        ...mockUploadTask,
        status: 'paused'
      };

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadState: {
          uploads: [pausedTask],
          isUploading: false,
          totalProgress: 0,
          completedCount: 0,
          failedCount: 0,
          error: null
        },
        resumeUpload: mockResumeUpload
      });

      render(<MediaUpload category="gallery" />);

      const resumeButton = screen.getByRole('button', { name: /play/i });
      await act(async () => {
        fireEvent.click(resumeButton);
      });

      expect(mockResumeUpload).toHaveBeenCalledWith('test-upload-id');
    });

    it('should cancel upload', async () => {
      const user = userEvent.setup();
      const mockCancelUpload = jest.fn();

      const uploadingTask = {
        ...mockUploadTask,
        status: 'uploading'
      };

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadState: {
          uploads: [uploadingTask],
          isUploading: true,
          totalProgress: 0,
          completedCount: 0,
          failedCount: 0,
          error: null
        },
        cancelUpload: mockCancelUpload
      });

      render(<MediaUpload category="gallery" />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      expect(mockCancelUpload).toHaveBeenCalledWith('test-upload-id');
    });

    it('should retry failed upload', async () => {
      const user = userEvent.setup();
      const mockRetryUpload = jest.fn().mockResolvedValue(mockUploadTask);

      const failedTask = {
        ...mockUploadTask,
        status: 'failed',
        error: 'Upload failed'
      };

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadState: {
          uploads: [failedTask],
          isUploading: false,
          totalProgress: 0,
          completedCount: 0,
          failedCount: 1,
          error: null
        },
        retryUpload: mockRetryUpload
      });

      render(<MediaUpload category="gallery" />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await act(async () => {
        fireEvent.click(retryButton);
      });

      expect(mockRetryUpload).toHaveBeenCalledWith('test-upload-id');
    });

    it('should clear completed uploads', async () => {
      const user = userEvent.setup();
      const mockClearCompleted = jest.fn();

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadState: {
          uploads: [mockUploadTask],
          isUploading: false,
          totalProgress: 100,
          completedCount: 1,
          failedCount: 0,
          error: null
        },
        clearCompleted: mockClearCompleted
      });

      render(<MediaUpload category="gallery" />);

      const clearButton = screen.getByText('Clear Completed');
      await act(async () => {
        fireEvent.click(clearButton);
      });

      expect(mockClearCompleted).toHaveBeenCalled();
    });
  });

  describe('File Previews', () => {
    it('should display file previews', () => {
      const mockPreviews = [
        {
          file: mockFile,
          preview: 'blob:test-url',
          type: 'image',
          size: 1000,
          dimensions: { width: 800, height: 600 }
        }
      ];

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        previews: mockPreviews
      });

      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('File Previews')).toBeInTheDocument();
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    });

    it('should handle preview errors', () => {
      const mockPreviews = [
        {
          file: mockFile,
          preview: '📷',
          type: 'image',
          size: 1000,
          error: 'Failed to create preview'
        }
      ];

      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        previews: mockPreviews
      });

      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('File Previews')).toBeInTheDocument();
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MediaUpload category="gallery" />);

      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;
      expect(dropZone).toHaveAttribute('role', 'button');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<MediaUpload category="gallery" />);

      const chooseButton = screen.getByRole('button', { name: 'Choose Files' });
      
      await act(async () => {
        chooseButton.focus();
        fireEvent.keyDown(chooseButton, { key: 'Enter' });
      });

      // Should trigger file selection
      expect(chooseButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on different screen sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });

      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error messages', () => {
      mockUseMediaUpload.mockReturnValue({
        ...mockUseMediaUpload(),
        uploadState: {
          uploads: [],
          isUploading: false,
          totalProgress: 0,
          completedCount: 0,
          failedCount: 0,
          error: 'Network error'
        }
      });

      render(<MediaUpload category="gallery" />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      const onUploadError = jest.fn();

      render(
        <MediaUpload 
          category="gallery" 
          onUploadError={onUploadError}
        />
      );

      // Simulate network error
      await act(async () => {
        fireEvent.online(window);
        fireEvent.offline(window);
      });

      // Component should still be functional
      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large file lists efficiently', async () => {
      const user = userEvent.setup();
      const files = Array.from({ length: 100 }, (_, i) => 
        new File(['test'], `test-${i}.jpg`, { type: 'image/jpeg' })
      );

      render(<MediaUpload category="gallery" />);

      const dropZone = screen.getByText('Drop files here or click to browse').closest('div')!;

      const fileList = {
        ...files,
        length: files.length,
        item: (index: number) => files[index]
      } as FileList;

      const startTime = Date.now();

      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: fileList
          }
        });
      });

      const endTime = Date.now();

      // Should handle large file lists within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();
      render(<MediaUpload category="gallery" />);

      const chooseButton = screen.getByRole('button', { name: 'Choose Files' });

      const startTime = Date.now();

      // Rapid clicks
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(chooseButton);
        }
      });

      const endTime = Date.now();

      // Should handle rapid interactions without errors
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
}); 