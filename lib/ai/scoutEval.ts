import { Platform } from 'react-native';
import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface VideoAnalysis {
  id: string;
  userId: string;
  videoUrl: string;
  sportType: string;
  analysisType: 'skill' | 'performance' | 'technique' | 'fitness' | 'footwork' | 'form' | 'stance';
  status: 'uploading' | 'processing' | 'analyzed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  results: AnalysisResults;
  metadata: VideoMetadata;
  notifications: NotificationConfig;
  classification: VideoClassification;
  mediaPipeData: MediaPipeAnalysis;
  openAISummary: OpenAISummary;
  athleteProfile: AthleteProfileUpdate;
}

export interface VideoClassification {
  sportType: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  trainingType: 'individual' | 'team' | 'competition' | 'practice';
  environment: 'indoor' | 'outdoor' | 'gym' | 'field' | 'court';
  equipment: string[];
  participants: number;
  duration: number;
  quality: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface MediaPipeAnalysis {
  footwork: FootworkAnalysis;
  form: FormAnalysis;
  stance: StanceAnalysis;
  movement: MovementAnalysis;
  keypoints: KeypointData[];
  confidence: number;
  processingTime: number;
}

export interface FootworkAnalysis {
  agility: number; // 0-100
  speed: number; // 0-100
  balance: number; // 0-100
  coordination: number; // 0-100
  footSpeed: number; // steps per second
  directionChanges: number;
  acceleration: number; // m/s²
  deceleration: number; // m/s²
  observations: string[];
  improvements: string[];
}

export interface FormAnalysis {
  posture: number; // 0-100
  alignment: number; // 0-100
  technique: number; // 0-100
  efficiency: number; // 0-100
  biomechanics: string[];
  corrections: string[];
  riskFactors: string[];
  formScore: number; // 0-100
}

export interface StanceAnalysis {
  stability: number; // 0-100
  balance: number; // 0-100
  positioning: number; // 0-100
  readiness: number; // 0-100
  stanceType: 'athletic' | 'defensive' | 'offensive' | 'neutral';
  observations: string[];
  recommendations: string[];
}

export interface MovementAnalysis {
  totalDistance: number; // meters
  averageSpeed: number; // m/s
  maxSpeed: number; // m/s
  movementEfficiency: number; // 0-1
  reactionTime: number; // milliseconds
  coordination: number; // 0-100
  patterns: MovementPattern[];
}

export interface MovementPattern {
  type: 'linear' | 'lateral' | 'rotational' | 'combination';
  frequency: number;
  efficiency: number; // 0-1
  description: string;
}

export interface KeypointData {
  frameNumber: number;
  timestamp: number;
  keypoints: Keypoint[];
  confidence: number;
}

export interface Keypoint {
  x: number;
  y: number;
  confidence: number;
  name: string;
}

export interface OpenAISummary {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallAssessment: string;
  technicalFeedback: string;
  mentalAspects: string;
  nextSteps: string[];
  confidence: number;
  wordCount: number;
}

export interface AthleteProfileUpdate {
  scoutScore: number; // 0-100
  skillBreakdown: {
    footwork: number;
    form: number;
    stance: number;
    overall: number;
  };
  improvementAreas: string[];
  strengths: string[];
  recommendations: string[];
  lastUpdated: Date;
  analysisCount: number;
}

export interface AnalysisResults {
  overallScore: number; // 0-100
  skillBreakdown: SkillBreakdown;
  performanceMetrics: PerformanceMetrics;
  techniqueAnalysis: TechniqueAnalysis;
  recommendations: string[];
  improvementAreas: string[];
  strengths: string[];
  aiInsights: string[];
  confidence: number; // 0-1
}

export interface SkillBreakdown {
  shooting?: SkillMetric;
  passing?: SkillMetric;
  dribbling?: SkillMetric;
  defense?: SkillMetric;
  speed?: SkillMetric;
  agility?: SkillMetric;
  strength?: SkillMetric;
  endurance?: SkillMetric;
  coordination?: SkillMetric;
  gameSense?: SkillMetric;
  footwork?: SkillMetric;
  form?: SkillMetric;
  stance?: SkillMetric;
}

export interface SkillMetric {
  score: number; // 0-100
  confidence: number; // 0-1
  observations: string[];
  improvements: string[];
  drills: string[];
}

export interface PerformanceMetrics {
  movementEfficiency: number; // 0-1
  reactionTime: number; // milliseconds
  accuracy: number; // 0-1
  consistency: number; // 0-1
  intensity: number; // 0-1
  endurance: number; // 0-1
}

export interface TechniqueAnalysis {
  form: string; // 'excellent' | 'good' | 'fair' | 'needs_improvement'
  biomechanics: string[];
  efficiency: number; // 0-1
  riskFactors: string[];
  corrections: string[];
}

export interface VideoMetadata {
  duration: number; // seconds
  frameRate: number;
  resolution: string;
  fileSize: number; // bytes
  format: string;
  uploadTime: Date;
  processingTime: number; // seconds
  bitrate: number;
  codec: string;
}

export interface NotificationConfig {
  notifyParents: boolean;
  notifyCoaches: boolean;
  notifyLeagues: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  customMessage?: string;
  autoShare: boolean;
}

export interface AnalysisRequest {
  userId: string;
  videoUrl: string;
  sportType: string;
  analysisType: 'skill' | 'performance' | 'technique' | 'fitness' | 'footwork' | 'form' | 'stance';
  notifications: NotificationConfig;
  customInstructions?: string;
  autoShare?: boolean;
}

export interface AnalysisProgress {
  requestId: string;
  status: 'uploading' | 'processing' | 'classifying' | 'mediapipe' | 'openai' | 'generating_report' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining: number; // seconds
  error?: string;
}

export class ScoutEval {
  private static instance: ScoutEval;
  private analysisQueue: Map<string, AnalysisRequest> = new Map();
  private activeAnalyses: Map<string, AnalysisProgress> = new Map();
  private completedAnalyses: Map<string, VideoAnalysis> = new Map();
  private processingWorkers: number = 0;
  private maxConcurrentAnalyses: number = 3;
  private openAIConfig: {
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };

  static getInstance(): ScoutEval {
    if (!ScoutEval.instance) {
      ScoutEval.instance = new ScoutEval();
    }
    return ScoutEval.instance;
  }

  constructor() {
    this.initialize();
    this.initializeOpenAI();
  }

  // Initialize the ScoutEval system
  async initialize(): Promise<void> {
    try {
      console.log('Initializing ScoutEval AI analysis system...');
      
      // Load pending analyses
      await this.loadPendingAnalyses();
      
      // Start processing queue
      this.startProcessingQueue();
      
      // Initialize MediaPipe (if available)
      await this.initializeMediaPipe();
      
      console.log('ScoutEval initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ScoutEval:', error);
    }
  }

  // Initialize OpenAI configuration
  private initializeOpenAI(): void {
    this.openAIConfig = {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.3,
    };
  }

  // Initialize MediaPipe Pose detection
  private async initializeMediaPipe(): Promise<void> {
    try {
      // This would initialize MediaPipe Pose for pose detection
      // For now, we'll use a mock implementation
      console.log('MediaPipe Pose initialized (mock)');
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
    }
  }

  // Submit video for analysis
  async submitAnalysis(request: AnalysisRequest): Promise<string> {
    try {
      console.log(`Submitting analysis request for user ${request.userId}`);

      const requestId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to queue
      this.analysisQueue.set(requestId, request);
      
      // Initialize progress tracking
      this.activeAnalyses.set(requestId, {
        requestId,
        status: 'uploading',
        progress: 0,
        currentStep: 'Uploading video...',
        estimatedTimeRemaining: 300, // 5 minutes
      });

      // Save to Firestore
      await this.saveAnalysisRequest(requestId, request);
      
      console.log(`Analysis request submitted with ID: ${requestId}`);
      return requestId;
    } catch (error) {
      console.error('Failed to submit analysis:', error);
      throw error;
    }
  }

  // Start processing the analysis queue
  private startProcessingQueue(): void {
    setInterval(() => {
      if (this.processingWorkers < this.maxConcurrentAnalyses) {
        this.processNextAnalysis();
      }
    }, 1000);
  }

  // Process next analysis in queue
  private async processNextAnalysis(): Promise<void> {
    const [requestId, request] = this.analysisQueue.entries().next().value;
    if (!requestId || !request) return;

    this.processingWorkers++;
    this.analysisQueue.delete(requestId);

    try {
      await this.processAnalysis(requestId, request);
    } catch (error) {
      console.error(`Failed to process analysis ${requestId}:`, error);
      this.updateProgress(requestId, 'failed', 0, 'Processing failed', error.message);
    } finally {
      this.processingWorkers--;
    }
  }

  // Process analysis with enhanced pipeline
  private async processAnalysis(requestId: string, request: AnalysisRequest): Promise<void> {
    try {
      // Step 1: Classify video
      this.updateProgress(requestId, 'classifying', 10, 'Classifying video content...');
      const classification = await this.classifyVideo(request.videoUrl, request.sportType);
      
      // Step 2: Download and process video
      this.updateProgress(requestId, 'processing', 20, 'Processing video frames...');
      const videoBuffer = await this.downloadVideo(request.videoUrl);
      const frames = await this.extractFrames(videoBuffer);
      
      // Step 3: MediaPipe analysis
      this.updateProgress(requestId, 'mediapipe', 40, 'Analyzing movement with MediaPipe...');
      const mediaPipeData = await this.analyzeWithMediaPipe(frames, request.sportType);
      
      // Step 4: OpenAI analysis
      this.updateProgress(requestId, 'openai', 70, 'Generating AI insights...');
      const openAISummary = await this.generateOpenAISummary(mediaPipeData, request);
      
      // Step 5: Compile results
      this.updateProgress(requestId, 'generating_report', 90, 'Compiling analysis report...');
      const results = this.compileResults(mediaPipeData, openAISummary, request);
      
      // Step 6: Update athlete profile
      const athleteProfile = await this.updateAthleteProfile(request.userId, results, mediaPipeData);
      
      // Step 7: Create final analysis
      const analysis: VideoAnalysis = {
        id: requestId,
        userId: request.userId,
        videoUrl: request.videoUrl,
        sportType: request.sportType,
        analysisType: request.analysisType,
        status: 'analyzed',
        createdAt: new Date(),
        completedAt: new Date(),
        results,
        metadata: {
          duration: this.calculateVideoDuration(videoBuffer),
          frameRate: 30,
          resolution: '1920x1080',
          fileSize: videoBuffer.byteLength,
          format: 'mp4',
          uploadTime: new Date(),
          processingTime: Date.now() - new Date().getTime(),
          bitrate: 5000000,
          codec: 'h264',
        },
        notifications: request.notifications,
        classification,
        mediaPipeData,
        openAISummary,
        athleteProfile,
      };

      // Save results
      this.completedAnalyses.set(requestId, analysis);
      await this.saveAnalysisResults(analysis);
      
      // Send notifications if auto-share is enabled
      if (request.notifications.autoShare) {
        await this.sendNotifications(analysis);
      }
      
      // Update progress
      this.updateProgress(requestId, 'completed', 100, 'Analysis completed successfully');
      
      console.log(`Analysis completed for ${requestId}`);
    } catch (error) {
      console.error(`Analysis failed for ${requestId}:`, error);
      this.updateProgress(requestId, 'failed', 0, 'Analysis failed', error.message);
    }
  }

  // Classify uploaded training videos
  private async classifyVideo(videoUrl: string, sportType: string): Promise<VideoClassification> {
    try {
      // Mock video classification - in reality would use computer vision
      const classification: VideoClassification = {
        sportType,
        skillLevel: this.determineSkillLevel(sportType),
        trainingType: this.determineTrainingType(videoUrl),
        environment: this.determineEnvironment(videoUrl),
        equipment: this.determineEquipment(sportType),
        participants: Math.floor(Math.random() * 10) + 1,
        duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
        quality: 'high',
        confidence: 0.85,
      };
      
      return classification;
    } catch (error) {
      console.error('Failed to classify video:', error);
      throw error;
    }
  }

  // Use MediaPipe (mocked) to detect footwork, form, and stance
  private async analyzeWithMediaPipe(frames: ImageData[], sportType: string): Promise<MediaPipeAnalysis> {
    try {
      const poseData = await this.analyzePoses(frames);
      
      const footwork = this.analyzeFootwork(poseData, sportType);
      const form = this.analyzeForm(poseData, sportType);
      const stance = this.analyzeStance(poseData, sportType);
      const movement = this.analyzeMovement(poseData, sportType);
      
      return {
        footwork,
        form,
        stance,
        movement,
        keypoints: poseData,
        confidence: 0.9,
        processingTime: Date.now() - new Date().getTime(),
      };
    } catch (error) {
      console.error('Failed to analyze with MediaPipe:', error);
      throw error;
    }
  }

  // Use OpenAI to summarize strengths and feedback
  private async generateOpenAISummary(mediaPipeData: MediaPipeAnalysis, request: AnalysisRequest): Promise<OpenAISummary> {
    try {
      const prompt = this.buildOpenAIPrompt(mediaPipeData, request);
      
      // Mock OpenAI response - in reality would call OpenAI API
      const summary: OpenAISummary = {
        strengths: [
          'Excellent footwork and agility',
          'Good balance and coordination',
          'Strong technical fundamentals',
          'Consistent movement patterns',
        ],
        weaknesses: [
          'Could improve reaction time',
          'Needs work on lateral movement',
          'Form could be more consistent',
        ],
        recommendations: [
          'Focus on lateral movement drills',
          'Practice reaction time exercises',
          'Work on form consistency',
          'Add plyometric training',
        ],
        overallAssessment: 'Strong athlete with good fundamentals. Shows potential for improvement in specific areas.',
        technicalFeedback: 'Good technical execution with room for refinement in movement efficiency.',
        mentalAspects: 'Shows good focus and determination during training.',
        nextSteps: [
          'Implement recommended drills',
          'Schedule follow-up analysis',
          'Track progress over time',
        ],
        confidence: 0.85,
        wordCount: 150,
      };
      
      return summary;
    } catch (error) {
      console.error('Failed to generate OpenAI summary:', error);
      throw error;
    }
  }

  // Save video metadata to Firestore
  private async saveVideoMetadata(analysis: VideoAnalysis): Promise<void> {
    try {
      await addDoc(collection(db, 'video_metadata'), {
        analysisId: analysis.id,
        userId: analysis.userId,
        metadata: analysis.metadata,
        classification: analysis.classification,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to save video metadata:', error);
    }
  }

  // Update athlete profiles with AI scout scores
  private async updateAthleteProfile(userId: string, results: AnalysisResults, mediaPipeData: MediaPipeAnalysis): Promise<AthleteProfileUpdate> {
    try {
      const scoutScore = this.calculateScoutScore(results, mediaPipeData);
      
      const profileUpdate: AthleteProfileUpdate = {
        scoutScore,
        skillBreakdown: {
          footwork: mediaPipeData.footwork.agility,
          form: mediaPipeData.form.formScore,
          stance: mediaPipeData.stance.stability,
          overall: scoutScore,
        },
        improvementAreas: results.improvementAreas,
        strengths: results.strengths,
        recommendations: results.recommendations,
        lastUpdated: new Date(),
        analysisCount: 1, // Would increment from current count
      };

      // Update athlete profile in Firestore
      await updateDoc(doc(db, 'athletes', userId), {
        scoutScore,
        lastAnalysis: serverTimestamp(),
        analysisCount: profileUpdate.analysisCount,
        skillBreakdown: profileUpdate.skillBreakdown,
      });

      return profileUpdate;
    } catch (error) {
      console.error('Failed to update athlete profile:', error);
      throw error;
    }
  }

  // Add a toggle to auto-share reports to parents/coaches
  async toggleAutoShare(userId: string, enabled: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        'notifications.autoShare': enabled,
        updatedAt: serverTimestamp(),
      });
      
      console.log(`Auto-share ${enabled ? 'enabled' : 'disabled'} for user ${userId}`);
    } catch (error) {
      console.error('Failed to toggle auto-share:', error);
      throw error;
    }
  }

  // Helper methods
  private determineSkillLevel(sportType: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    return levels[Math.floor(Math.random() * levels.length)] as any;
  }

  private determineTrainingType(videoUrl: string): 'individual' | 'team' | 'competition' | 'practice' {
    const types = ['individual', 'team', 'competition', 'practice'];
    return types[Math.floor(Math.random() * types.length)] as any;
  }

  private determineEnvironment(videoUrl: string): 'indoor' | 'outdoor' | 'gym' | 'field' | 'court' {
    const environments = ['indoor', 'outdoor', 'gym', 'field', 'court'];
    return environments[Math.floor(Math.random() * environments.length)] as any;
  }

  private determineEquipment(sportType: string): string[] {
    const equipmentMap: Record<string, string[]> = {
      basketball: ['basketball', 'hoop'],
      soccer: ['soccer ball', 'goal'],
      tennis: ['tennis racket', 'tennis ball'],
      baseball: ['baseball', 'bat', 'glove'],
    };
    return equipmentMap[sportType] || [];
  }

  private analyzeFootwork(poseData: PoseData[], sportType: string): FootworkAnalysis {
    return {
      agility: Math.floor(Math.random() * 40) + 60, // 60-100
      speed: Math.floor(Math.random() * 40) + 60,
      balance: Math.floor(Math.random() * 40) + 60,
      coordination: Math.floor(Math.random() * 40) + 60,
      footSpeed: Math.random() * 5 + 2, // 2-7 steps per second
      directionChanges: Math.floor(Math.random() * 10) + 5,
      acceleration: Math.random() * 5 + 2, // 2-7 m/s²
      deceleration: Math.random() * 5 + 2,
      observations: ['Good lateral movement', 'Quick direction changes'],
      improvements: ['Work on backward movement', 'Improve acceleration'],
    };
  }

  private analyzeForm(poseData: PoseData[], sportType: string): FormAnalysis {
    return {
      posture: Math.floor(Math.random() * 40) + 60,
      alignment: Math.floor(Math.random() * 40) + 60,
      technique: Math.floor(Math.random() * 40) + 60,
      efficiency: Math.floor(Math.random() * 40) + 60,
      biomechanics: ['Good knee alignment', 'Proper hip positioning'],
      corrections: ['Keep chest up', 'Bend knees more'],
      riskFactors: ['Slight forward lean'],
      formScore: Math.floor(Math.random() * 40) + 60,
    };
  }

  private analyzeStance(poseData: PoseData[], sportType: string): StanceAnalysis {
    return {
      stability: Math.floor(Math.random() * 40) + 60,
      balance: Math.floor(Math.random() * 40) + 60,
      positioning: Math.floor(Math.random() * 40) + 60,
      readiness: Math.floor(Math.random() * 40) + 60,
      stanceType: 'athletic',
      observations: ['Good base width', 'Proper weight distribution'],
      recommendations: ['Stay on balls of feet', 'Keep knees bent'],
    };
  }

  private analyzeMovement(poseData: PoseData[], sportType: string): MovementAnalysis {
    return {
      totalDistance: Math.random() * 100 + 50, // 50-150 meters
      averageSpeed: Math.random() * 3 + 2, // 2-5 m/s
      maxSpeed: Math.random() * 5 + 5, // 5-10 m/s
      movementEfficiency: Math.random() * 0.4 + 0.6, // 0.6-1.0
      reactionTime: Math.random() * 200 + 100, // 100-300ms
      coordination: Math.floor(Math.random() * 40) + 60,
      patterns: [
        {
          type: 'linear',
          frequency: Math.floor(Math.random() * 10) + 5,
          efficiency: Math.random() * 0.4 + 0.6,
          description: 'Forward movement patterns',
        },
      ],
    };
  }

  private buildOpenAIPrompt(mediaPipeData: MediaPipeAnalysis, request: AnalysisRequest): string {
    return `
      Analyze the following athlete performance data:
      
      Sport: ${request.sportType}
      Analysis Type: ${request.analysisType}
      
      Footwork Analysis:
      - Agility: ${mediaPipeData.footwork.agility}/100
      - Speed: ${mediaPipeData.footwork.speed}/100
      - Balance: ${mediaPipeData.footwork.balance}/100
      - Coordination: ${mediaPipeData.footwork.coordination}/100
      
      Form Analysis:
      - Posture: ${mediaPipeData.form.posture}/100
      - Alignment: ${mediaPipeData.form.alignment}/100
      - Technique: ${mediaPipeData.form.technique}/100
      - Efficiency: ${mediaPipeData.form.efficiency}/100
      
      Stance Analysis:
      - Stability: ${mediaPipeData.stance.stability}/100
      - Balance: ${mediaPipeData.stance.balance}/100
      - Positioning: ${mediaPipeData.stance.positioning}/100
      - Readiness: ${mediaPipeData.stance.readiness}/100
      
      Provide a comprehensive analysis including:
      1. Key strengths
      2. Areas for improvement
      3. Specific recommendations
      4. Overall assessment
      5. Technical feedback
      6. Mental aspects
      7. Next steps
    `;
  }

  private calculateScoutScore(results: AnalysisResults, mediaPipeData: MediaPipeAnalysis): number {
    const footworkScore = mediaPipeData.footwork.agility * 0.3;
    const formScore = mediaPipeData.form.formScore * 0.3;
    const stanceScore = mediaPipeData.stance.stability * 0.2;
    const overallScore = results.overallScore * 0.2;
    
    return Math.round(footworkScore + formScore + stanceScore + overallScore);
  }

  // Existing methods (keeping for compatibility)
  private async downloadVideo(videoUrl: string): Promise<ArrayBuffer> {
    // Mock video download
    return new ArrayBuffer(1024 * 1024); // 1MB mock
  }

  private async extractFrames(videoBuffer: ArrayBuffer): Promise<ImageData[]> {
    // Mock frame extraction
    return Array.from({ length: 30 }, () => new ImageData(1920, 1080));
  }

  private async analyzePoses(frames: ImageData[]): Promise<PoseData[]> {
    // Mock pose analysis
    return frames.map((frame, index) => ({
      frameNumber: index,
      timestamp: index * 33.33, // 30fps
      keypoints: this.generateMockKeypoints(),
      confidence: 0.9,
    }));
  }

  private generateMockKeypoints(): Keypoint[] {
    const keypointNames = ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear', 'left_shoulder', 'right_shoulder'];
    return keypointNames.map(name => ({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      confidence: Math.random() * 0.3 + 0.7,
      name,
    }));
  }

  private compileResults(movementAnalysis: any, aiInsights: string[], request: AnalysisRequest): AnalysisResults {
    return {
      overallScore: Math.floor(Math.random() * 40) + 60,
      skillBreakdown: this.generateSkillBreakdown(movementAnalysis),
      performanceMetrics: this.calculatePerformanceIndicators(movementAnalysis),
      techniqueAnalysis: this.generateTechniqueAnalysis(movementAnalysis),
      recommendations: aiInsights,
      improvementAreas: ['Reaction time', 'Lateral movement'],
      strengths: ['Footwork', 'Balance', 'Coordination'],
      aiInsights,
      confidence: 0.85,
    };
  }

  private generateSkillBreakdown(movementAnalysis: any): SkillBreakdown {
    return {
      footwork: {
        score: Math.floor(Math.random() * 40) + 60,
        confidence: 0.9,
        observations: ['Good lateral movement'],
        improvements: ['Work on backward movement'],
        drills: ['Lateral shuffle drills'],
      },
      form: {
        score: Math.floor(Math.random() * 40) + 60,
        confidence: 0.85,
        observations: ['Good posture'],
        improvements: ['Keep chest up'],
        drills: ['Posture exercises'],
      },
      stance: {
        score: Math.floor(Math.random() * 40) + 60,
        confidence: 0.9,
        observations: ['Stable base'],
        improvements: ['Stay on balls of feet'],
        drills: ['Balance exercises'],
      },
    };
  }

  private calculatePerformanceIndicators(poseData: any): PerformanceMetrics {
    return {
      movementEfficiency: Math.random() * 0.4 + 0.6,
      reactionTime: Math.random() * 200 + 100,
      accuracy: Math.random() * 0.4 + 0.6,
      consistency: Math.random() * 0.4 + 0.6,
      intensity: Math.random() * 0.4 + 0.6,
      endurance: Math.random() * 0.4 + 0.6,
    };
  }

  private generateTechniqueAnalysis(movementAnalysis: any): TechniqueAnalysis {
    return {
      form: 'good',
      biomechanics: ['Good knee alignment'],
      efficiency: Math.random() * 0.4 + 0.6,
      riskFactors: ['Slight forward lean'],
      corrections: ['Keep chest up'],
    };
  }

  private updateProgress(requestId: string, status: string, progress: number, currentStep: string, error?: string): void {
    const progressObj = this.activeAnalyses.get(requestId);
    if (progressObj) {
      progressObj.status = status as any;
      progressObj.progress = progress;
      progressObj.currentStep = currentStep;
      if (error) {
        progressObj.error = error;
      }
    }
  }

  private async saveAnalysisRequest(requestId: string, request: AnalysisRequest): Promise<void> {
    try {
      await addDoc(collection(db, 'video_analysis_requests'), {
        requestId,
        ...request,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to save analysis request:', error);
    }
  }

  private async saveAnalysisResults(analysis: VideoAnalysis): Promise<void> {
    try {
      await addDoc(collection(db, 'video_analysis_results'), {
        ...analysis,
        timestamp: serverTimestamp(),
      });
      
      // Also save video metadata
      await this.saveVideoMetadata(analysis);
    } catch (error) {
      console.error('Failed to save analysis results:', error);
    }
  }

  private async sendNotifications(analysis: VideoAnalysis): Promise<void> {
    try {
      const { notifications } = analysis;
      
      if (notifications.notifyParents) {
        await this.sendParentNotification(analysis);
      }
      
      if (notifications.notifyCoaches) {
        await this.sendCoachNotification(analysis);
      }
      
      if (notifications.notifyLeagues) {
        await this.sendLeagueNotification(analysis);
      }
      
      console.log('Notifications sent for analysis:', analysis.id);
    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  }

  private async sendParentNotification(analysis: VideoAnalysis): Promise<void> {
    try {
      console.log(`Sending parent notification for analysis ${analysis.id}`);
      // FCM integration would go here
    } catch (error) {
      console.error('Failed to send parent notification:', error);
    }
  }

  private async sendCoachNotification(analysis: VideoAnalysis): Promise<void> {
    try {
      console.log(`Sending coach notification for analysis ${analysis.id}`);
      // FCM integration would go here
    } catch (error) {
      console.error('Failed to send coach notification:', error);
    }
  }

  private async sendLeagueNotification(analysis: VideoAnalysis): Promise<void> {
    try {
      console.log(`Sending league notification for analysis ${analysis.id}`);
      // FCM integration would go here
    } catch (error) {
      console.error('Failed to send league notification:', error);
    }
  }

  private async loadPendingAnalyses(): Promise<void> {
    try {
      const requestsQuery = query(
        collection(db, 'video_analysis_requests'),
        where('status', '==', 'pending'),
        limit(10)
      );
      
      const snapshot = await getDocs(requestsQuery);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        this.analysisQueue.set(data.requestId, data);
      });
      
      console.log(`Loaded ${snapshot.docs.length} pending analyses`);
    } catch (error) {
      console.error('Failed to load pending analyses:', error);
    }
  }

  private calculateVideoDuration(videoBuffer: ArrayBuffer): number {
    return 10; // Mock 10 seconds
  }

  // Public API methods
  getAnalysisProgress(requestId: string): AnalysisProgress | undefined {
    return this.activeAnalyses.get(requestId);
  }

  getAnalysis(requestId: string): VideoAnalysis | undefined {
    return this.completedAnalyses.get(requestId);
  }

  async getUserAnalyses(userId: string): Promise<VideoAnalysis[]> {
    try {
      const analysesQuery = query(
        collection(db, 'video_analysis_results'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(analysesQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoAnalysis));
    } catch (error) {
      console.error('Failed to get user analyses:', error);
      return [];
    }
  }

  cleanup(): void {
    console.log('Cleaning up ScoutEval...');
    this.analysisQueue.clear();
    this.activeAnalyses.clear();
    this.completedAnalyses.clear();
  }
}

// Export singleton instance
export const scoutEval = ScoutEval.getInstance(); 