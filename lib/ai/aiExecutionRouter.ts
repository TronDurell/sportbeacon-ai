import { firestore } from '../firebase';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { analytics } from './shared/analytics';

export interface DeviceCapability {
  isOnline: boolean;
  batteryLevel: number;
  memoryAvailable: number;
  processingPower: 'low' | 'medium' | 'high';
  networkSpeed: 'slow' | 'medium' | 'fast';
  hasGPU: boolean;
  modelType: 'tensorflow_lite' | 'server_side' | 'hybrid';
}

export interface PoseData {
  timestamp: Date;
  keypoints: Keypoint[];
  confidence: number;
  deviceId: string;
  sessionId: string;
}

export interface Keypoint {
  x: number;
  y: number;
  confidence: number;
  name: string;
}

export interface AIAnalysis {
  poseScore: number;
  stabilityScore: number;
  alignmentScore: number;
  recommendations: string[];
  confidence: number;
  processingTime: number;
  modelUsed: string;
}

export interface ExecutionDecision {
  useLocalModel: boolean;
  useServerModel: boolean;
  fallbackModel: string;
  reason: string;
  estimatedLatency: number;
  batteryImpact: 'low' | 'medium' | 'high';
}

export class AIExecutionRouter {
  private static instance: AIExecutionRouter;
  private deviceCapability: DeviceCapability | null = null;
  private isInitialized = false;

  static getInstance(): AIExecutionRouter {
    if (!AIExecutionRouter.instance) {
      AIExecutionRouter.instance = new AIExecutionRouter();
    }
    return AIExecutionRouter.instance;
  }

  /**
   * Initialize the router with device capabilities
   */
  async initialize(): Promise<void> {
    try {
      this.deviceCapability = await this.detectDeviceCapability();
      this.isInitialized = true;

      // Track device capability
      await analytics.track('ai_execution_router_initialized', {
        deviceCapability: this.deviceCapability,
        timestamp: new Date().toISOString()
      });

      console.log('AI Execution Router initialized:', this.deviceCapability);
    } catch (error) {
      console.error('Failed to initialize AI Execution Router:', error);
      throw error;
    }
  }

  /**
   * Detect device capabilities
   */
  private async detectDeviceCapability(): Promise<DeviceCapability> {
    try {
      // Check online status
      const isOnline = navigator.onLine;
      
      // Check battery level (if available)
      let batteryLevel = 1.0;
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        batteryLevel = battery.level;
      }

      // Check memory availability
      const memoryAvailable = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryLimit = (performance as any).memory?.jsHeapSizeLimit || 2147483648; // 2GB default
      const memoryUsage = memoryAvailable / memoryLimit;

      // Determine processing power based on device characteristics
      const processingPower = this.determineProcessingPower();
      
      // Check network speed
      const networkSpeed = await this.checkNetworkSpeed();
      
      // Check for GPU support
      const hasGPU = this.checkGPUSupport();

      // Determine model type based on capabilities
      const modelType = this.determineModelType({
        isOnline,
        batteryLevel,
        memoryUsage,
        processingPower,
        networkSpeed,
        hasGPU
      });

      return {
        isOnline,
        batteryLevel,
        memoryAvailable: memoryUsage,
        processingPower,
        networkSpeed,
        hasGPU,
        modelType
      };
    } catch (error) {
      console.error('Failed to detect device capability:', error);
      return this.getDefaultCapability();
    }
  }

  /**
   * Determine processing power based on device characteristics
   */
  private determineProcessingPower(): 'low' | 'medium' | 'high' {
    const cores = navigator.hardwareConcurrency || 1;
    const memory = (performance as any).memory?.jsHeapSizeLimit || 2147483648;
    
    if (cores >= 8 && memory >= 4294967296) return 'high'; // 8+ cores, 4GB+ RAM
    if (cores >= 4 && memory >= 2147483648) return 'medium'; // 4+ cores, 2GB+ RAM
    return 'low';
  }

  /**
   * Check network speed
   */
  private async checkNetworkSpeed(): Promise<'slow' | 'medium' | 'fast'> {
    try {
      const startTime = performance.now();
      const response = await fetch('/api/ping', { method: 'HEAD' });
      const endTime = performance.now();
      
      const latency = endTime - startTime;
      
      if (latency < 100) return 'fast';
      if (latency < 500) return 'medium';
      return 'slow';
    } catch (error) {
      return 'slow';
    }
  }

  /**
   * Check for GPU support
   */
  private checkGPUSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (error) {
      return false;
    }
  }

  /**
   * Determine optimal model type
   */
  private determineModelType(capability: Partial<DeviceCapability>): 'tensorflow_lite' | 'server_side' | 'hybrid' {
    // High-end device with good connection
    if (capability.processingPower === 'high' && 
        capability.networkSpeed === 'fast' && 
        capability.batteryLevel > 0.3) {
      return 'server_side';
    }
    
    // Medium device with decent connection
    if (capability.processingPower === 'medium' && 
        capability.networkSpeed === 'medium' && 
        capability.batteryLevel > 0.2) {
      return 'hybrid';
    }
    
    // Low-end device or poor connection
    return 'tensorflow_lite';
  }

  /**
   * Get default capability for fallback
   */
  private getDefaultCapability(): DeviceCapability {
    return {
      isOnline: false,
      batteryLevel: 0.5,
      memoryAvailable: 0.5,
      processingPower: 'medium',
      networkSpeed: 'slow',
      hasGPU: false,
      modelType: 'tensorflow_lite'
    };
  }

  /**
   * Make execution decision for pose analysis
   */
  async makeExecutionDecision(sessionId: string): Promise<ExecutionDecision> {
    if (!this.isInitialized || !this.deviceCapability) {
      await this.initialize();
    }

    const capability = this.deviceCapability!;
    
    // Decision logic based on device capability
    let useLocalModel = false;
    let useServerModel = false;
    let fallbackModel = 'tensorflow_lite';
    let reason = '';
    let estimatedLatency = 0;
    let batteryImpact: 'low' | 'medium' | 'high' = 'low';

    // Battery threshold for local processing
    const batteryThreshold = 0.3;
    
    // Network threshold for server processing
    const networkThreshold = capability.networkSpeed === 'fast' ? 200 : 1000;

    if (capability.modelType === 'tensorflow_lite') {
      useLocalModel = true;
      reason = 'Using local TensorFlow Lite model for offline/low-power processing';
      estimatedLatency = 150; // ms
      batteryImpact = capability.batteryLevel < 0.5 ? 'high' : 'medium';
    } else if (capability.modelType === 'server_side') {
      useServerModel = true;
      reason = 'Using server-side model for high-accuracy analysis';
      estimatedLatency = 300; // ms
      batteryImpact = 'low';
    } else if (capability.modelType === 'hybrid') {
      // Hybrid approach: try server first, fallback to local
      useServerModel = true;
      useLocalModel = true;
      reason = 'Using hybrid approach: server with local fallback';
      estimatedLatency = 250; // ms
      batteryImpact = 'medium';
    }

    // Override based on battery level
    if (capability.batteryLevel < batteryThreshold) {
      useServerModel = false;
      useLocalModel = true;
      reason = 'Low battery - using local model only';
      batteryImpact = 'high';
    }

    // Override based on network conditions
    if (!capability.isOnline) {
      useServerModel = false;
      useLocalModel = true;
      reason = 'Offline - using local model only';
    }

    const decision: ExecutionDecision = {
      useLocalModel,
      useServerModel,
      fallbackModel,
      reason,
      estimatedLatency,
      batteryImpact
    };

    // Log decision
    await this.logExecutionDecision(sessionId, decision);

    return decision;
  }

  /**
   * Process pose data based on execution decision
   */
  async processPoseData(poseData: PoseData, decision: ExecutionDecision): Promise<AIAnalysis> {
    const startTime = performance.now();
    let analysis: AIAnalysis;

    try {
      if (decision.useServerModel && decision.useLocalModel) {
        // Hybrid approach
        analysis = await this.processHybrid(poseData);
      } else if (decision.useServerModel) {
        // Server-side processing
        analysis = await this.processServerSide(poseData);
      } else {
        // Local processing
        analysis = await this.processLocal(poseData);
      }
    } catch (error) {
      console.error('Primary processing failed, using fallback:', error);
      analysis = await this.processFallback(poseData, decision.fallbackModel);
    }

    const processingTime = performance.now() - startTime;
    analysis.processingTime = Math.round(processingTime);

    // Track analytics
    await analytics.track('pose_analysis_completed', {
      sessionId: poseData.sessionId,
      modelUsed: analysis.modelUsed,
      processingTime: analysis.processingTime,
      confidence: analysis.confidence,
      timestamp: new Date().toISOString()
    });

    return analysis;
  }

  /**
   * Process pose data using server-side model
   */
  private async processServerSide(poseData: PoseData): Promise<AIAnalysis> {
    try {
      // Send pose data to server
      const response = await fetch('/api/pose-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(poseData)
      });

      if (!response.ok) {
        throw new Error('Server analysis failed');
      }

      const result = await response.json();
      
      return {
        poseScore: result.poseScore,
        stabilityScore: result.stabilityScore,
        alignmentScore: result.alignmentScore,
        recommendations: result.recommendations,
        confidence: result.confidence,
        processingTime: 0, // Will be set by caller
        modelUsed: 'server_side'
      };
    } catch (error) {
      console.error('Server-side processing failed:', error);
      throw error;
    }
  }

  /**
   * Process pose data using local TensorFlow Lite model
   */
  private async processLocal(poseData: PoseData): Promise<AIAnalysis> {
    try {
      // This would use TensorFlow Lite for local processing
      // For now, simulate local processing
      
      const keypoints = poseData.keypoints;
      const poseScore = this.calculatePoseScore(keypoints);
      const stabilityScore = this.calculateStabilityScore(keypoints);
      const alignmentScore = this.calculateAlignmentScore(keypoints);
      
      const recommendations = this.generateRecommendations(poseScore, stabilityScore, alignmentScore);
      const confidence = Math.min(0.95, (poseScore + stabilityScore + alignmentScore) / 3);

      return {
        poseScore,
        stabilityScore,
        alignmentScore,
        recommendations,
        confidence,
        processingTime: 0, // Will be set by caller
        modelUsed: 'tensorflow_lite'
      };
    } catch (error) {
      console.error('Local processing failed:', error);
      throw error;
    }
  }

  /**
   * Process pose data using hybrid approach
   */
  private async processHybrid(poseData: PoseData): Promise<AIAnalysis> {
    try {
      // Try server first, fallback to local
      try {
        return await this.processServerSide(poseData);
      } catch (error) {
        console.log('Server processing failed, falling back to local:', error);
        return await this.processLocal(poseData);
      }
    } catch (error) {
      console.error('Hybrid processing failed:', error);
      throw error;
    }
  }

  /**
   * Process pose data using fallback model
   */
  private async processFallback(poseData: PoseData, fallbackModel: string): Promise<AIAnalysis> {
    console.log(`Using fallback model: ${fallbackModel}`);
    
    // Simple fallback analysis
    const keypoints = poseData.keypoints;
    const poseScore = Math.min(85, this.calculatePoseScore(keypoints));
    const stabilityScore = Math.min(80, this.calculateStabilityScore(keypoints));
    const alignmentScore = Math.min(75, this.calculateAlignmentScore(keypoints));
    
    return {
      poseScore,
      stabilityScore,
      alignmentScore,
      recommendations: ['Continue practicing', 'Focus on fundamentals'],
      confidence: 0.7,
      processingTime: 0,
      modelUsed: fallbackModel
    };
  }

  /**
   * Calculate pose score from keypoints
   */
  private calculatePoseScore(keypoints: Keypoint[]): number {
    if (keypoints.length === 0) return 0;
    
    const confidenceSum = keypoints.reduce((sum, kp) => sum + kp.confidence, 0);
    const avgConfidence = confidenceSum / keypoints.length;
    
    return Math.round(avgConfidence * 100);
  }

  /**
   * Calculate stability score
   */
  private calculateStabilityScore(keypoints: Keypoint[]): number {
    if (keypoints.length < 2) return 0;
    
    // Calculate variance in positions
    const variances = keypoints.map(kp => {
      // This would use historical data for variance calculation
      return Math.random() * 0.1; // Placeholder
    });
    
    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
    const stabilityScore = Math.max(0, 100 - (avgVariance * 1000));
    
    return Math.round(stabilityScore);
  }

  /**
   * Calculate alignment score
   */
  private calculateAlignmentScore(keypoints: Keypoint[]): number {
    if (keypoints.length < 3) return 0;
    
    // This would calculate alignment based on keypoint positions
    // For now, return a placeholder score
    return Math.round(75 + Math.random() * 20);
  }

  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(poseScore: number, stabilityScore: number, alignmentScore: number): string[] {
    const recommendations: string[] = [];
    
    if (poseScore < 80) {
      recommendations.push('Focus on proper stance and grip');
    }
    
    if (stabilityScore < 75) {
      recommendations.push('Work on reducing movement during trigger press');
    }
    
    if (alignmentScore < 70) {
      recommendations.push('Improve sight alignment and target focus');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great form! Keep practicing');
    }
    
    return recommendations;
  }

  /**
   * Log execution decision for analytics
   */
  private async logExecutionDecision(sessionId: string, decision: ExecutionDecision): Promise<void> {
    try {
      const logRef = collection(firestore, 'ai_execution_logs');
      await addDoc(logRef, {
        sessionId,
        decision,
        deviceCapability: this.deviceCapability,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log execution decision:', error);
    }
  }

  /**
   * Update device capability (for dynamic changes)
   */
  async updateDeviceCapability(): Promise<void> {
    this.deviceCapability = await this.detectDeviceCapability();
    
    await analytics.track('device_capability_updated', {
      deviceCapability: this.deviceCapability,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get current device capability
   */
  getDeviceCapability(): DeviceCapability | null {
    return this.deviceCapability;
  }

  /**
   * Check if router is initialized
   */
  isRouterInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const aiExecutionRouter = AIExecutionRouter.getInstance(); 