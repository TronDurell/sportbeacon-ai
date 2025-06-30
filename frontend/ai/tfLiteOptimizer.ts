import { Platform } from 'react-native';
import * as ExpoGL from 'expo-gl';
import { analytics } from '../../lib/ai/shared/analytics';

export interface DeviceCapabilities {
  os: 'ios' | 'android' | 'web';
  osVersion: string;
  hasWebGL: boolean;
  hasTensorFlowLite: boolean;
  hasMediaPipe: boolean;
  memoryGB: number;
  cpuCores: number;
  gpuType?: string;
  recommendedModel: 'tflite' | 'cloud' | 'mediapipe';
  performanceScore: number; // 0-100
}

export interface ModelConfig {
  modelType: 'tflite' | 'cloud' | 'mediapipe';
  modelPath: string;
  inputShape: number[];
  outputShape: number[];
  quantization: boolean;
  optimizationLevel: 'basic' | 'standard' | 'high';
}

export class TensorFlowLiteOptimizer {
  private static instance: TensorFlowLiteOptimizer;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private modelConfigs: Map<string, ModelConfig> = new Map();

  static getInstance(): TensorFlowLiteOptimizer {
    if (!TensorFlowLiteOptimizer.instance) {
      TensorFlowLiteOptimizer.instance = new TensorFlowLiteOptimizer();
    }
    return TensorFlowLiteOptimizer.instance;
  }

  /**
   * Detect device capabilities and determine optimal model strategy
   */
  async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    if (this.deviceCapabilities) {
      return this.deviceCapabilities;
    }

    try {
      const os = Platform.OS as 'ios' | 'android' | 'web';
      const osVersion = Platform.Version.toString();
      
      // Check WebGL support
      const hasWebGL = await this.checkWebGLSupport();
      
      // Check TensorFlow Lite support
      const hasTensorFlowLite = await this.checkTensorFlowLiteSupport();
      
      // Check MediaPipe support
      const hasMediaPipe = await this.checkMediaPipeSupport();
      
      // Get device specs
      const deviceSpecs = await this.getDeviceSpecs();
      
      // Calculate performance score
      const performanceScore = this.calculatePerformanceScore({
        os,
        osVersion,
        hasWebGL,
        hasTensorFlowLite,
        hasMediaPipe,
        ...deviceSpecs
      });
      
      // Determine recommended model
      const recommendedModel = this.determineRecommendedModel({
        os,
        osVersion,
        hasWebGL,
        hasTensorFlowLite,
        hasMediaPipe,
        ...deviceSpecs,
        performanceScore
      });

      this.deviceCapabilities = {
        os,
        osVersion,
        hasWebGL,
        hasTensorFlowLite,
        hasMediaPipe,
        ...deviceSpecs,
        recommendedModel,
        performanceScore
      };

      // Track analytics
      await analytics.track('device_capabilities_detected', {
        os,
        osVersion,
        hasWebGL,
        hasTensorFlowLite,
        hasMediaPipe,
        memoryGB: deviceSpecs.memoryGB,
        cpuCores: deviceSpecs.cpuCores,
        recommendedModel,
        performanceScore,
        timestamp: new Date().toISOString()
      });

      return this.deviceCapabilities;

    } catch (error) {
      console.error('Failed to detect device capabilities:', error);
      
      // Return fallback capabilities
      return {
        os: Platform.OS as 'ios' | 'android' | 'web',
        osVersion: Platform.Version.toString(),
        hasWebGL: false,
        hasTensorFlowLite: false,
        hasMediaPipe: false,
        memoryGB: 2,
        cpuCores: 2,
        recommendedModel: 'cloud',
        performanceScore: 30
      };
    }
  }

  /**
   * Check WebGL support
   */
  private async checkWebGLSupport(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      } else {
        // For mobile, check if ExpoGL is available
        return await ExpoGL.isAvailableAsync();
      }
    } catch (error) {
      console.error('WebGL check failed:', error);
      return false;
    }
  }

  /**
   * Check TensorFlow Lite support
   */
  private async checkTensorFlowLiteSupport(): Promise<boolean> {
    try {
      // Check if TensorFlow Lite is available
      // This would require the actual TensorFlow Lite library
      // For now, we'll check based on platform and version
      
      if (Platform.OS === 'ios') {
        // iOS 12+ supports TensorFlow Lite
        const iosVersion = parseInt(Platform.Version.toString());
        return iosVersion >= 12;
      } else if (Platform.OS === 'android') {
        // Android 5+ supports TensorFlow Lite
        const androidVersion = parseInt(Platform.Version.toString());
        return androidVersion >= 21;
      }
      
      return false;
    } catch (error) {
      console.error('TensorFlow Lite check failed:', error);
      return false;
    }
  }

  /**
   * Check MediaPipe support
   */
  private async checkMediaPipeSupport(): Promise<boolean> {
    try {
      // Check if MediaPipe is available
      // This would require the actual MediaPipe library
      
      if (Platform.OS === 'ios') {
        // iOS 13+ supports MediaPipe
        const iosVersion = parseInt(Platform.Version.toString());
        return iosVersion >= 13;
      } else if (Platform.OS === 'android') {
        // Android 6+ supports MediaPipe
        const androidVersion = parseInt(Platform.Version.toString());
        return androidVersion >= 23;
      }
      
      return false;
    } catch (error) {
      console.error('MediaPipe check failed:', error);
      return false;
    }
  }

  /**
   * Get device specifications
   */
  private async getDeviceSpecs(): Promise<{ memoryGB: number; cpuCores: number; gpuType?: string }> {
    try {
      // This is a simplified version - in a real app, you'd use device info libraries
      let memoryGB = 2;
      let cpuCores = 2;
      let gpuType: string | undefined;

      if (Platform.OS === 'ios') {
        // iOS device specs (simplified)
        const iosVersion = parseInt(Platform.Version.toString());
        if (iosVersion >= 15) {
          memoryGB = 4;
          cpuCores = 6;
        } else if (iosVersion >= 12) {
          memoryGB = 3;
          cpuCores = 4;
        }
      } else if (Platform.OS === 'android') {
        // Android device specs (simplified)
        const androidVersion = parseInt(Platform.Version.toString());
        if (androidVersion >= 30) {
          memoryGB = 6;
          cpuCores = 8;
        } else if (androidVersion >= 26) {
          memoryGB = 4;
          cpuCores = 6;
        } else if (androidVersion >= 23) {
          memoryGB = 3;
          cpuCores = 4;
        }
      }

      return { memoryGB, cpuCores, gpuType };
    } catch (error) {
      console.error('Failed to get device specs:', error);
      return { memoryGB: 2, cpuCores: 2 };
    }
  }

  /**
   * Calculate performance score based on device capabilities
   */
  private calculatePerformanceScore(capabilities: Partial<DeviceCapabilities>): number {
    let score = 0;

    // Base score from OS and version
    if (capabilities.os === 'ios') {
      const iosVersion = parseInt(capabilities.osVersion || '0');
      if (iosVersion >= 15) score += 30;
      else if (iosVersion >= 12) score += 20;
      else score += 10;
    } else if (capabilities.os === 'android') {
      const androidVersion = parseInt(capabilities.osVersion || '0');
      if (androidVersion >= 30) score += 25;
      else if (androidVersion >= 26) score += 20;
      else if (androidVersion >= 23) score += 15;
      else score += 10;
    }

    // Add points for capabilities
    if (capabilities.hasWebGL) score += 15;
    if (capabilities.hasTensorFlowLite) score += 20;
    if (capabilities.hasMediaPipe) score += 15;

    // Add points for hardware
    if (capabilities.memoryGB && capabilities.memoryGB >= 6) score += 10;
    else if (capabilities.memoryGB && capabilities.memoryGB >= 4) score += 8;
    else if (capabilities.memoryGB && capabilities.memoryGB >= 3) score += 5;

    if (capabilities.cpuCores && capabilities.cpuCores >= 8) score += 10;
    else if (capabilities.cpuCores && capabilities.cpuCores >= 6) score += 8;
    else if (capabilities.cpuCores && capabilities.cpuCores >= 4) score += 5;

    return Math.min(100, score);
  }

  /**
   * Determine recommended model based on capabilities
   */
  private determineRecommendedModel(capabilities: DeviceCapabilities): 'tflite' | 'cloud' | 'mediapipe' {
    // High performance devices with TensorFlow Lite support
    if (capabilities.performanceScore >= 70 && capabilities.hasTensorFlowLite) {
      return 'tflite';
    }
    
    // Devices with MediaPipe support
    if (capabilities.hasMediaPipe && capabilities.performanceScore >= 50) {
      return 'mediapipe';
    }
    
    // Fallback to cloud inference
    return 'cloud';
  }

  /**
   * Get optimal model configuration for pose estimation
   */
  async getPoseEstimationConfig(): Promise<ModelConfig> {
    const capabilities = await this.detectDeviceCapabilities();
    
    switch (capabilities.recommendedModel) {
      case 'tflite':
        return {
          modelType: 'tflite',
          modelPath: 'pose_estimation_quantized.tflite',
          inputShape: [1, 256, 256, 3],
          outputShape: [1, 17, 3], // 17 keypoints, 3 coordinates each
          quantization: true,
          optimizationLevel: capabilities.performanceScore >= 80 ? 'high' : 'standard'
        };
        
      case 'mediapipe':
        return {
          modelType: 'mediapipe',
          modelPath: 'pose_landmarker.task',
          inputShape: [1, 256, 256, 3],
          outputShape: [1, 33, 4], // 33 landmarks, 4 values each
          quantization: false,
          optimizationLevel: 'standard'
        };
        
      case 'cloud':
      default:
        return {
          modelType: 'cloud',
          modelPath: 'https://api.sportbeacon.ai/models/pose_estimation',
          inputShape: [1, 256, 256, 3],
          outputShape: [1, 17, 3],
          quantization: false,
          optimizationLevel: 'high'
        };
    }
  }

  /**
   * Load and initialize the recommended model
   */
  async loadModel(modelType: 'tflite' | 'cloud' | 'mediapipe'): Promise<boolean> {
    try {
      const config = await this.getPoseEstimationConfig();
      
      switch (modelType) {
        case 'tflite':
          return await this.loadTensorFlowLiteModel(config);
          
        case 'mediapipe':
          return await this.loadMediaPipeModel(config);
          
        case 'cloud':
          return await this.initializeCloudModel(config);
          
        default:
          throw new Error(`Unsupported model type: ${modelType}`);
      }
    } catch (error) {
      console.error('Failed to load model:', error);
      return false;
    }
  }

  /**
   * Load TensorFlow Lite model
   */
  private async loadTensorFlowLiteModel(config: ModelConfig): Promise<boolean> {
    try {
      // This would contain the actual TensorFlow Lite loading logic
      // For now, we'll simulate the loading process
      
      console.log('Loading TensorFlow Lite model:', config.modelPath);
      
      // Simulate loading time based on model size and device performance
      const capabilities = await this.detectDeviceCapabilities();
      const loadingTime = Math.max(1000, 3000 - (capabilities.performanceScore * 20));
      
      await new Promise(resolve => setTimeout(resolve, loadingTime));
      
      // Store model config
      this.modelConfigs.set('pose_estimation', config);
      
      // Track analytics
      await analytics.track('model_loaded', {
        modelType: 'tflite',
        modelPath: config.modelPath,
        optimizationLevel: config.optimizationLevel,
        quantization: config.quantization,
        loadingTime,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to load TensorFlow Lite model:', error);
      return false;
    }
  }

  /**
   * Load MediaPipe model
   */
  private async loadMediaPipeModel(config: ModelConfig): Promise<boolean> {
    try {
      console.log('Loading MediaPipe model:', config.modelPath);
      
      // Simulate loading time
      const capabilities = await this.detectDeviceCapabilities();
      const loadingTime = Math.max(800, 2000 - (capabilities.performanceScore * 15));
      
      await new Promise(resolve => setTimeout(resolve, loadingTime));
      
      // Store model config
      this.modelConfigs.set('pose_estimation', config);
      
      // Track analytics
      await analytics.track('model_loaded', {
        modelType: 'mediapipe',
        modelPath: config.modelPath,
        optimizationLevel: config.optimizationLevel,
        quantization: config.quantization,
        loadingTime,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to load MediaPipe model:', error);
      return false;
    }
  }

  /**
   * Initialize cloud model connection
   */
  private async initializeCloudModel(config: ModelConfig): Promise<boolean> {
    try {
      console.log('Initializing cloud model connection:', config.modelPath);
      
      // Test cloud connection
      const response = await fetch(config.modelPath + '/health');
      if (!response.ok) {
        throw new Error('Cloud model service unavailable');
      }
      
      // Store model config
      this.modelConfigs.set('pose_estimation', config);
      
      // Track analytics
      await analytics.track('model_loaded', {
        modelType: 'cloud',
        modelPath: config.modelPath,
        optimizationLevel: config.optimizationLevel,
        quantization: config.quantization,
        loadingTime: 0,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize cloud model:', error);
      return false;
    }
  }

  /**
   * Get current model configuration
   */
  getCurrentModelConfig(): ModelConfig | null {
    return this.modelConfigs.get('pose_estimation') || null;
  }

  /**
   * Switch to a different model type
   */
  async switchModel(modelType: 'tflite' | 'cloud' | 'mediapipe'): Promise<boolean> {
    try {
      console.log(`Switching to ${modelType} model`);
      
      // Clear current model
      this.modelConfigs.clear();
      
      // Load new model
      const success = await this.loadModel(modelType);
      
      if (success) {
        // Track model switch
        await analytics.track('model_switched', {
          newModelType: modelType,
          timestamp: new Date().toISOString()
        });
      }
      
      return success;
    } catch (error) {
      console.error('Failed to switch model:', error);
      return false;
    }
  }

  /**
   * Get performance recommendations
   */
  async getPerformanceRecommendations(): Promise<string[]> {
    const capabilities = await this.detectDeviceCapabilities();
    const recommendations: string[] = [];

    if (capabilities.performanceScore < 50) {
      recommendations.push('Consider using cloud inference for better performance');
    }

    if (capabilities.memoryGB < 3) {
      recommendations.push('Close other apps to free up memory');
    }

    if (!capabilities.hasWebGL) {
      recommendations.push('WebGL not supported - using CPU inference');
    }

    if (capabilities.recommendedModel === 'cloud') {
      recommendations.push('Using cloud inference for optimal performance');
    }

    return recommendations;
  }
}

// Export singleton instance
export const tfLiteOptimizer = TensorFlowLiteOptimizer.getInstance(); 