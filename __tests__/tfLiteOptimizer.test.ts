import { tfLiteOptimizer } from '../frontend/ai/tfLiteOptimizer';
import { analytics } from '../lib/ai/shared/analytics';

// Mock React Native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '15.0'
  }
}));

// Mock Expo GL
jest.mock('expo-gl', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true)
}));

// Mock analytics
jest.mock('../lib/ai/shared/analytics', () => ({
  analytics: {
    track: jest.fn()
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('TensorFlowLiteOptimizer', () => {
  const mockAnalyticsTrack = analytics.track as jest.Mock;
  const mockFetch = fetch as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'healthy' })
    });
  });

  describe('detectDeviceCapabilities', () => {
    it('should detect iOS device capabilities correctly', async () => {
      const capabilities = await tfLiteOptimizer.detectDeviceCapabilities();

      expect(capabilities.os).toBe('ios');
      expect(capabilities.osVersion).toBe('15.0');
      expect(capabilities.hasWebGL).toBe(true);
      expect(capabilities.hasTensorFlowLite).toBe(true);
      expect(capabilities.hasMediaPipe).toBe(true);
      expect(capabilities.recommendedModel).toBeDefined();
      expect(capabilities.performanceScore).toBeGreaterThan(0);
    });

    it('should cache device capabilities', async () => {
      const capabilities1 = await tfLiteOptimizer.detectDeviceCapabilities();
      const capabilities2 = await tfLiteOptimizer.detectDeviceCapabilities();

      expect(capabilities1).toBe(capabilities2);
    });

    it('should track analytics when detecting capabilities', async () => {
      await tfLiteOptimizer.detectDeviceCapabilities();

      expect(mockAnalyticsTrack).toHaveBeenCalledWith(
        'device_capabilities_detected',
        expect.objectContaining({
          os: 'ios',
          osVersion: '15.0',
          hasWebGL: true,
          hasTensorFlowLite: true,
          hasMediaPipe: true
        })
      );
    });
  });

  describe('getPoseEstimationConfig', () => {
    it('should return TensorFlow Lite config for high performance devices', async () => {
      // Mock high performance device
      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '15.0',
        hasWebGL: true,
        hasTensorFlowLite: true,
        hasMediaPipe: true,
        memoryGB: 6,
        cpuCores: 8,
        recommendedModel: 'tflite',
        performanceScore: 85
      });

      const config = await tfLiteOptimizer.getPoseEstimationConfig();

      expect(config.modelType).toBe('tflite');
      expect(config.modelPath).toBe('pose_estimation_quantized.tflite');
      expect(config.quantization).toBe(true);
      expect(config.optimizationLevel).toBe('high');
    });

    it('should return MediaPipe config for medium performance devices', async () => {
      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '15.0',
        hasWebGL: true,
        hasTensorFlowLite: false,
        hasMediaPipe: true,
        memoryGB: 4,
        cpuCores: 6,
        recommendedModel: 'mediapipe',
        performanceScore: 65
      });

      const config = await tfLiteOptimizer.getPoseEstimationConfig();

      expect(config.modelType).toBe('mediapipe');
      expect(config.modelPath).toBe('pose_landmarker.task');
      expect(config.quantization).toBe(false);
    });

    it('should return cloud config for low performance devices', async () => {
      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '12.0',
        hasWebGL: false,
        hasTensorFlowLite: false,
        hasMediaPipe: false,
        memoryGB: 2,
        cpuCores: 2,
        recommendedModel: 'cloud',
        performanceScore: 30
      });

      const config = await tfLiteOptimizer.getPoseEstimationConfig();

      expect(config.modelType).toBe('cloud');
      expect(config.modelPath).toContain('api.sportbeacon.ai');
      expect(config.optimizationLevel).toBe('high');
    });
  });

  describe('loadModel', () => {
    it('should load TensorFlow Lite model successfully', async () => {
      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '15.0',
        hasWebGL: true,
        hasTensorFlowLite: true,
        hasMediaPipe: true,
        memoryGB: 6,
        cpuCores: 8,
        recommendedModel: 'tflite',
        performanceScore: 85
      });

      const success = await tfLiteOptimizer.loadModel('tflite');

      expect(success).toBe(true);
      expect(mockAnalyticsTrack).toHaveBeenCalledWith(
        'model_loaded',
        expect.objectContaining({
          modelType: 'tflite',
          quantization: true,
          optimizationLevel: 'high'
        })
      );
    });

    it('should load MediaPipe model successfully', async () => {
      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '15.0',
        hasWebGL: true,
        hasTensorFlowLite: false,
        hasMediaPipe: true,
        memoryGB: 4,
        cpuCores: 6,
        recommendedModel: 'mediapipe',
        performanceScore: 65
      });

      const success = await tfLiteOptimizer.loadModel('mediapipe');

      expect(success).toBe(true);
      expect(mockAnalyticsTrack).toHaveBeenCalledWith(
        'model_loaded',
        expect.objectContaining({
          modelType: 'mediapipe',
          quantization: false
        })
      );
    });

    it('should initialize cloud model successfully', async () => {
      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '12.0',
        hasWebGL: false,
        hasTensorFlowLite: false,
        hasMediaPipe: false,
        memoryGB: 2,
        cpuCores: 2,
        recommendedModel: 'cloud',
        performanceScore: 30
      });

      const success = await tfLiteOptimizer.loadModel('cloud');

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      );
    });

    it('should handle cloud model service unavailable', async () => {
      mockFetch.mockResolvedValue({
        ok: false
      });

      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '12.0',
        hasWebGL: false,
        hasTensorFlowLite: false,
        hasMediaPipe: false,
        memoryGB: 2,
        cpuCores: 2,
        recommendedModel: 'cloud',
        performanceScore: 30
      });

      const success = await tfLiteOptimizer.loadModel('cloud');

      expect(success).toBe(false);
    });

    it('should handle unsupported model type', async () => {
      await expect(tfLiteOptimizer.loadModel('unsupported' as any))
        .rejects.toThrow('Unsupported model type: unsupported');
    });
  });

  describe('switchModel', () => {
    it('should switch model successfully', async () => {
      jest.spyOn(tfLiteOptimizer, 'loadModel').mockResolvedValue(true);

      const success = await tfLiteOptimizer.switchModel('mediapipe');

      expect(success).toBe(true);
      expect(mockAnalyticsTrack).toHaveBeenCalledWith(
        'model_switched',
        expect.objectContaining({
          newModelType: 'mediapipe'
        })
      );
    });

    it('should handle model switch failure', async () => {
      jest.spyOn(tfLiteOptimizer, 'loadModel').mockResolvedValue(false);

      const success = await tfLiteOptimizer.switchModel('tflite');

      expect(success).toBe(false);
    });
  });

  describe('getCurrentModelConfig', () => {
    it('should return current model configuration', async () => {
      // Load a model first
      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '15.0',
        hasWebGL: true,
        hasTensorFlowLite: true,
        hasMediaPipe: true,
        memoryGB: 6,
        cpuCores: 8,
        recommendedModel: 'tflite',
        performanceScore: 85
      });

      await tfLiteOptimizer.loadModel('tflite');

      const config = tfLiteOptimizer.getCurrentModelConfig();

      expect(config).toBeDefined();
      expect(config?.modelType).toBe('tflite');
      expect(config?.modelPath).toBe('pose_estimation_quantized.tflite');
    });

    it('should return null when no model is loaded', () => {
      const config = tfLiteOptimizer.getCurrentModelConfig();

      expect(config).toBeNull();
    });
  });

  describe('getPerformanceRecommendations', () => {
    it('should return recommendations for low performance devices', async () => {
      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '12.0',
        hasWebGL: false,
        hasTensorFlowLite: false,
        hasMediaPipe: false,
        memoryGB: 2,
        cpuCores: 2,
        recommendedModel: 'cloud',
        performanceScore: 30
      });

      const recommendations = await tfLiteOptimizer.getPerformanceRecommendations();

      expect(recommendations).toContain('Consider using cloud inference for better performance');
      expect(recommendations).toContain('Close other apps to free up memory');
      expect(recommendations).toContain('WebGL not supported - using CPU inference');
    });

    it('should return recommendations for high performance devices', async () => {
      jest.spyOn(tfLiteOptimizer, 'detectDeviceCapabilities').mockResolvedValue({
        os: 'ios',
        osVersion: '15.0',
        hasWebGL: true,
        hasTensorFlowLite: true,
        hasMediaPipe: true,
        memoryGB: 6,
        cpuCores: 8,
        recommendedModel: 'tflite',
        performanceScore: 85
      });

      const recommendations = await tfLiteOptimizer.getPerformanceRecommendations();

      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Android device detection', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'android',
          Version: '30'
        }
      }));
    });

    it('should detect Android device capabilities correctly', async () => {
      // Re-import to get fresh instance with Android Platform
      const { tfLiteOptimizer: androidOptimizer } = require('../frontend/ai/tfLiteOptimizer');
      
      const capabilities = await androidOptimizer.detectDeviceCapabilities();

      expect(capabilities.os).toBe('android');
      expect(capabilities.osVersion).toBe('30');
      expect(capabilities.hasTensorFlowLite).toBe(true);
      expect(capabilities.hasMediaPipe).toBe(true);
    });
  });

  describe('Web platform detection', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'web',
          Version: '1.0'
        }
      }));
    });

    it('should detect Web platform capabilities correctly', async () => {
      // Mock document for web environment
      global.document = {
        createElement: jest.fn(() => ({
          getContext: jest.fn(() => ({}))
        }))
      } as any;

      const { tfLiteOptimizer: webOptimizer } = require('../frontend/ai/tfLiteOptimizer');
      
      const capabilities = await webOptimizer.detectDeviceCapabilities();

      expect(capabilities.os).toBe('web');
      expect(capabilities.osVersion).toBe('1.0');
      expect(capabilities.hasWebGL).toBe(true);
    });
  });
}); 