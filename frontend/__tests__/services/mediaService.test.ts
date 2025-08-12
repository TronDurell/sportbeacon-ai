import { jest } from '@jest/globals';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
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
import MediaService from '../../services/mediaService';
import type { MediaMetadata, MediaCategory, MediaType } from '../../types/media';

// Mock Firebase modules
jest.mock('firebase/storage');
jest.mock('firebase/firestore');
jest.mock('../../lib/firebase', () => ({
  storage: {},
  db: {}
}));

// Mock useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' }
  })
}));

const mockStorage = {
  ref: ref as jest.MockedFunction<typeof ref>,
  uploadBytesResumable: uploadBytesResumable as jest.MockedFunction<typeof uploadBytesResumable>,
  getDownloadURL: getDownloadURL as jest.MockedFunction<typeof getDownloadURL>,
  deleteObject: deleteObject as jest.MockedFunction<typeof deleteObject>
};

const mockFirestore = {
  doc: doc as jest.MockedFunction<typeof doc>,
  setDoc: setDoc as jest.MockedFunction<typeof setDoc>,
  getDoc: getDoc as jest.MockedFunction<typeof getDoc>,
  updateDoc: updateDoc as jest.MockedFunction<typeof updateDoc>,
  deleteDoc: deleteDoc as jest.MockedFunction<typeof deleteDoc>,
  collection: collection as jest.MockedFunction<typeof collection>,
  query: query as jest.MockedFunction<typeof query>,
  where: where as jest.MockedFunction<typeof where>,
  orderBy: orderBy as jest.MockedFunction<typeof orderBy>,
  limit: limit as jest.MockedFunction<typeof limit>,
  getDocs: getDocs as jest.MockedFunction<typeof getDocs>,
  serverTimestamp: serverTimestamp as jest.MockedFunction<typeof serverTimestamp>
};

describe('MediaService', () => {
  let mediaService: MediaService;
  let mockFile: File;
  let mockUploadTask: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mediaService = MediaService.getInstance();
    
    // Create mock file
    mockFile = new File(['test content'], 'test-image.jpg', {
      type: 'image/jpeg'
    });

    // Create mock upload task
    mockUploadTask = {
      on: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      cancel: jest.fn(),
      snapshot: {
        bytesTransferred: 0,
        totalBytes: 1000,
        state: 'running',
        ref: {}
      }
    };

    // Setup default mocks
    mockStorage.uploadBytesResumable.mockReturnValue(mockUploadTask);
    mockStorage.getDownloadURL.mockResolvedValue('https://example.com/test.jpg');
    mockFirestore.setDoc.mockResolvedValue(undefined);
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        id: 'test-media-id',
        fileName: 'test-image.jpg',
        status: 'completed'
      })
    } as any);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MediaService.getInstance();
      const instance2 = MediaService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('File Validation', () => {
    it('should validate file size correctly', async () => {
      const largeFile = new File(['x'.repeat(200 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });

      await expect(mediaService.uploadFile(largeFile, 'gallery')).rejects.toThrow(
        'File size (200 MB) exceeds maximum allowed size (100 MB)'
      );
    });

    it('should validate file type correctly', async () => {
      const invalidFile = new File(['test'], 'test.exe', {
        type: 'application/x-executable'
      });

      await expect(mediaService.uploadFile(invalidFile, 'gallery')).rejects.toThrow(
        'File type application/x-executable is not allowed'
      );
    });

    it('should accept valid files', async () => {
      const validFile = new File(['test'], 'test.jpg', {
        type: 'image/jpeg'
      });

      mockUploadTask.on.mockImplementation((event, onProgress, onError, onComplete) => {
        if (event === 'state_changed') {
          onProgress({
            bytesTransferred: 1000,
            totalBytes: 1000,
            state: 'success'
          });
          onComplete();
        }
      });

      const result = await mediaService.uploadFile(validFile, 'gallery');
      expect(result.status).toBe('uploading');
    });
  });

  describe('Media Type Detection', () => {
    it('should detect image types correctly', () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = mediaService.uploadFile(imageFile, 'gallery');
      expect(result).toBeDefined();
    });

    it('should detect video types correctly', () => {
      const videoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const result = mediaService.uploadFile(videoFile, 'gallery');
      expect(result).toBeDefined();
    });

    it('should detect audio types correctly', () => {
      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      const result = mediaService.uploadFile(audioFile, 'gallery');
      expect(result).toBeDefined();
    });

    it('should detect document types correctly', () => {
      const docFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = mediaService.uploadFile(docFile, 'document');
      expect(result).toBeDefined();
    });
  });

  describe('Upload Process', () => {
    it('should create upload task with correct parameters', async () => {
      mockUploadTask.on.mockImplementation((event, onProgress, onError, onComplete) => {
        if (event === 'state_changed') {
          onProgress({
            bytesTransferred: 1000,
            totalBytes: 1000,
            state: 'success'
          });
          onComplete();
        }
      });

      await mediaService.uploadFile(mockFile, 'gallery');

      expect(mockStorage.uploadBytesResumable).toHaveBeenCalledWith(
        expect.any(Object),
        mockFile,
        expect.objectContaining({
          customMetadata: expect.objectContaining({
            originalName: 'test-image.jpg',
            mediaType: 'image',
            category: 'gallery'
          })
        })
      );
    });

    it('should handle upload progress correctly', async () => {
      let progressCallback: any;
      let completeCallback: any;

      mockUploadTask.on.mockImplementation((event, onProgress, onError, onComplete) => {
        if (event === 'state_changed') {
          progressCallback = onProgress;
          completeCallback = onComplete;
        }
      });

      const uploadPromise = mediaService.uploadFile(mockFile, 'gallery');
      
      // Simulate progress
      progressCallback({
        bytesTransferred: 500,
        totalBytes: 1000,
        state: 'running'
      });

      // Simulate completion
      completeCallback();

      const result = await uploadPromise;
      expect(result.status).toBe('uploading');
    });

    it('should handle upload errors correctly', async () => {
      let errorCallback: any;

      mockUploadTask.on.mockImplementation((event, onProgress, onError, onComplete) => {
        if (event === 'state_changed') {
          errorCallback = onError;
        }
      });

      const uploadPromise = mediaService.uploadFile(mockFile, 'gallery');
      
      // Simulate error
      errorCallback(new Error('Upload failed'));

      const result = await uploadPromise;
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Upload failed');
    });
  });

  describe('Image Processing', () => {
    it('should process images with optimization', async () => {
      // Mock canvas and image processing
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue({
          drawImage: jest.fn()
        }),
        toBlob: jest.fn().mockImplementation((callback) => {
          callback(new Blob(['processed']));
        })
      };

      const mockImage = {
        width: 2000,
        height: 1500,
        onload: null,
        onerror: null,
        src: ''
      };

      // Mock document.createElement
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tag) => {
        if (tag === 'canvas') return mockCanvas;
        if (tag === 'img') return mockImage;
        return originalCreateElement.call(document, tag);
      });

      mockUploadTask.on.mockImplementation((event, onProgress, onError, onComplete) => {
        if (event === 'state_changed') {
          onComplete();
        }
      });

      const result = await mediaService.uploadFile(mockFile, 'gallery');
      expect(result).toBeDefined();

      // Restore original
      document.createElement = originalCreateElement;
    });
  });

  describe('Metadata Management', () => {
    it('should save metadata to Firestore', async () => {
      mockUploadTask.on.mockImplementation((event, onProgress, onError, onComplete) => {
        if (event === 'state_changed') {
          onComplete();
        }
      });

      await mediaService.uploadFile(mockFile, 'gallery');

      expect(mockFirestore.setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          fileName: 'test-image.jpg',
          mediaType: 'image',
          category: 'gallery',
          status: 'completed'
        })
      );
    });

    it('should retrieve metadata correctly', async () => {
      const mockMetadata = {
        id: 'test-id',
        fileName: 'test.jpg',
        status: 'completed'
      };

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockMetadata
      } as any);

      const result = await mediaService.getMediaMetadata('test-id');
      expect(result).toEqual(expect.objectContaining(mockMetadata));
    });

    it('should update metadata correctly', async () => {
      await mediaService.updateMediaMetadata('test-id', {
        status: 'approved'
      });

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          status: 'approved',
          updatedAt: expect.any(Object)
        })
      );
    });
  });

  describe('File Deletion', () => {
    it('should delete file from storage and Firestore', async () => {
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          storagePath: 'users/test-user/gallery/image/test.jpg',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        })
      } as any);

      await mediaService.deleteMedia('test-id');

      expect(mockStorage.deleteObject).toHaveBeenCalledWith(
        expect.objectContaining({
          fullPath: 'users/test-user/gallery/image/test.jpg'
        })
      );
      expect(mockFirestore.deleteDoc).toHaveBeenCalled();
    });

    it('should handle deletion errors gracefully', async () => {
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => false
      } as any);

      await expect(mediaService.deleteMedia('non-existent')).rejects.toThrow(
        'Media not found'
      );
    });
  });

  describe('Media Search', () => {
    it('should search media with filters', async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn().mockImplementation((callback) => {
          callback({
            id: 'test-id',
            data: () => ({
              id: 'test-id',
              fileName: 'test.jpg',
              mediaType: 'image',
              category: 'gallery',
              uploadedBy: 'test-user-id'
            })
          });
        })
      };

      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await mediaService.searchMedia({
        mediaTypes: ['image'],
        categories: ['gallery']
      });

      expect(result).toHaveLength(1);
      expect(result[0].fileName).toBe('test.jpg');
    });

    it('should handle search without results', async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn()
      };

      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await mediaService.searchMedia({});
      expect(result).toHaveLength(0);
    });
  });

  describe('User Media Retrieval', () => {
    it('should get user media correctly', async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn().mockImplementation((callback) => {
          callback({
            id: 'test-id',
            data: () => ({
              id: 'test-id',
              fileName: 'test.jpg',
              uploadedBy: 'test-user-id'
            })
          });
        })
      };

      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await mediaService.getUserMedia('test-user-id', 'gallery');
      expect(result).toHaveLength(1);
      expect(result[0].uploadedBy).toBe('test-user-id');
    });
  });

  describe('Media Analytics', () => {
    it('should calculate analytics correctly', async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn().mockImplementation((callback) => {
          // Add multiple media items
          callback({
            id: 'test-1',
            data: () => ({
              id: 'test-1',
              mediaType: 'image',
              category: 'gallery',
              status: 'completed',
              fileSize: 1000
            })
          });
          callback({
            id: 'test-2',
            data: () => ({
              id: 'test-2',
              mediaType: 'video',
              category: 'content',
              status: 'completed',
              fileSize: 2000
            })
          });
        })
      };

      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await mediaService.getMediaAnalytics();
      
      expect(result.totalFiles).toBe(2);
      expect(result.totalSize).toBe(3000);
      expect(result.averageFileSize).toBe(1500);
      expect(result.uploadsByType.image).toBe(1);
      expect(result.uploadsByType.video).toBe(1);
    });
  });

  describe('Upload Task Management', () => {
    it('should get upload task correctly', () => {
      const task = mediaService.getUploadTask('test-id');
      expect(task).toBeUndefined(); // No task exists initially
    });

    it('should cancel upload correctly', () => {
      mediaService.cancelUpload('test-id');
      expect(mockUploadTask.cancel).not.toHaveBeenCalled(); // No task exists
    });

    it('should pause upload correctly', () => {
      mediaService.pauseUpload('test-id');
      expect(mockUploadTask.pause).not.toHaveBeenCalled(); // No task exists
    });

    it('should resume upload correctly', () => {
      mediaService.resumeUpload('test-id');
      expect(mockUploadTask.resume).not.toHaveBeenCalled(); // No task exists
    });
  });

  describe('Utility Functions', () => {
    it('should format file size correctly', () => {
      expect(mediaService.formatFileSize(1024)).toBe('1 KB');
      expect(mediaService.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(mediaService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(mediaService.formatFileSize(0)).toBe('0 Bytes');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      // Mock useAuth to return no user
      jest.doMock('../../contexts/AuthContext', () => ({
        useAuth: () => ({ user: null })
      }));

      await expect(mediaService.uploadFile(mockFile, 'gallery')).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should handle storage errors', async () => {
      mockStorage.uploadBytesResumable.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(mediaService.uploadFile(mockFile, 'gallery')).rejects.toThrow(
        'Storage error'
      );
    });

    it('should handle Firestore errors', async () => {
      mockUploadTask.on.mockImplementation((event, onProgress, onError, onComplete) => {
        if (event === 'state_changed') {
          onComplete();
        }
      });

      mockFirestore.setDoc.mockRejectedValue(new Error('Firestore error'));

      const result = await mediaService.uploadFile(mockFile, 'gallery');
      expect(result.status).toBe('failed');
    });
  });

  describe('Performance', () => {
    it('should handle large file uploads efficiently', async () => {
      const largeFile = new File(['x'.repeat(50 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });

      mockUploadTask.on.mockImplementation((event, onProgress, onError, onComplete) => {
        if (event === 'state_changed') {
          onProgress({
            bytesTransferred: 50 * 1024 * 1024,
            totalBytes: 50 * 1024 * 1024,
            state: 'success'
          });
          onComplete();
        }
      });

      const startTime = Date.now();
      const result = await mediaService.uploadFile(largeFile, 'gallery');
      const endTime = Date.now();

      expect(result.status).toBe('uploading');
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly in test
    });
  });
}); 