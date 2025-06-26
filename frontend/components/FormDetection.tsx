import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoConsentModal } from './gun-coach/VideoConsentModal';
import { sentryService } from '@/services/sentryService';
import { useAuth } from '@/hooks/useAuth';

interface PoseCorrection {
  keypoint: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

interface ShootingForm {
  stance: 'good' | 'needs_improvement' | 'poor';
  grip: 'good' | 'needs_improvement' | 'poor';
  sightAlignment: 'good' | 'needs_improvement' | 'poor';
  triggerControl: 'good' | 'needs_improvement' | 'poor';
  breathing?: 'good' | 'needs_improvement' | 'poor';
  mounting?: 'good' | 'needs_improvement' | 'poor';
  swing?: 'good' | 'needs_improvement' | 'poor';
  draw?: 'good' | 'needs_improvement' | 'poor';
  reload?: 'good' | 'needs_improvement' | 'poor';
  movement?: 'good' | 'needs_improvement' | 'poor';
  targetTransitions?: 'good' | 'needs_improvement' | 'poor';
  stagePlanning?: 'good' | 'needs_improvement' | 'poor';
}

interface FormAnalysis {
  hasPose: boolean;
  corrections: PoseCorrection[];
  confidence: number;
  shootingForm?: ShootingForm;
  sport: 'precision_shooting' | 'trap_skeet' | 'practical_pistol';
  timestamp: number;
}

interface FormDetectionProps {
  mode: 'live' | 'upload' | 'tutorial';
  sport: string;
  onSessionEnd?: () => void;
}

export const FormDetection: React.FC<FormDetectionProps> = ({ mode, sport, onSessionEnd }) => {
  const { user } = useAuth();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentData, setConsentData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [poseError, setPoseError] = useState<string | null>(null);
  const [poseSuccess, setPoseSuccess] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FormAnalysis>({
    hasPose: false,
    corrections: [],
    confidence: 0,
    sport,
    timestamp: Date.now()
  });
  const [poseDetector, setPoseDetector] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize MediaPipe pose detection
  useEffect(() => {
    const initializePoseDetection = async () => {
      try {
        // This would be replaced with actual MediaPipe initialization
        // For now, we'll simulate the pose detector
        console.log('Initializing pose detection for', sport);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize pose detection:', error);
      }
    };

    initializePoseDetection();
  }, [sport]);

  // Analyze shooting form based on sport type
  const analyzeShootingForm = useCallback((poseData: any): ShootingForm => {
    const form: ShootingForm = {
      stance: 'good',
      grip: 'good',
      sightAlignment: 'good',
      triggerControl: 'good'
    };

    // Sport-specific analysis
    switch (sport) {
      case 'precision_shooting':
        form.breathing = 'good';
        // Analyze stance stability, grip consistency, sight alignment, trigger control
        if (poseData?.shoulderAlignment < 0.8) {
          form.stance = 'needs_improvement';
        }
        if (poseData?.handPosition < 0.7) {
          form.grip = 'needs_improvement';
        }
        if (poseData?.sightAlignment < 0.8) {
          form.sightAlignment = 'needs_improvement';
        }
        if (poseData?.triggerControl < 0.7) {
          form.triggerControl = 'needs_improvement';
        }
        break;

      case 'trap_skeet':
        form.mounting = 'good';
        form.swing = 'good';
        // Analyze mounting consistency, swing smoothness, lead calculation
        if (poseData?.mountingSpeed < 0.8) {
          form.mounting = 'needs_improvement';
        }
        if (poseData?.swingSmoothness < 0.7) {
          form.swing = 'needs_improvement';
        }
        break;

      case 'practical_pistol':
        form.draw = 'good';
        form.reload = 'good';
        form.movement = 'good';
        form.targetTransitions = 'good';
        form.stagePlanning = 'good';
        // Analyze draw speed, reload efficiency, movement, target transitions
        if (poseData?.drawSpeed < 0.8) {
          form.draw = 'needs_improvement';
        }
        if (poseData?.reloadEfficiency < 0.7) {
          form.reload = 'needs_improvement';
        }
        if (poseData?.movementEfficiency < 0.7) {
          form.movement = 'needs_improvement';
        }
        if (poseData?.targetTransitions < 0.8) {
          form.targetTransitions = 'needs_improvement';
        }
        break;
    }

    return form;
  }, [sport]);

  // Generate corrections based on form analysis
  const generateCorrections = useCallback((form: ShootingForm): PoseCorrection[] => {
    const corrections: PoseCorrection[] = [];

    // Sport-specific corrections
    switch (sport) {
      case 'precision_shooting':
        if (form.stance === 'needs_improvement') {
          corrections.push({
            keypoint: 'stance',
            message: 'Maintain a stable, balanced stance with feet shoulder-width apart',
            severity: 'medium',
            confidence: 0.8
          });
        }
        if (form.grip === 'needs_improvement') {
          corrections.push({
            keypoint: 'grip',
            message: 'Apply consistent grip pressure and maintain proper hand position',
            severity: 'medium',
            confidence: 0.8
          });
        }
        if (form.sightAlignment === 'needs_improvement') {
          corrections.push({
            keypoint: 'sight_alignment',
            message: 'Focus on front sight and maintain proper sight picture',
            severity: 'high',
            confidence: 0.9
          });
        }
        if (form.triggerControl === 'needs_improvement') {
          corrections.push({
            keypoint: 'trigger_control',
            message: 'Practice smooth trigger press without disturbing sight alignment',
            severity: 'high',
            confidence: 0.9
          });
        }
        if (form.breathing === 'needs_improvement') {
          corrections.push({
            keypoint: 'breathing',
            message: 'Maintain natural breathing rhythm and pause at natural respiratory pause',
            severity: 'medium',
            confidence: 0.7
          });
        }
        break;

      case 'trap_skeet':
        if (form.mounting === 'needs_improvement') {
          corrections.push({
            keypoint: 'mounting',
            message: 'Practice consistent mounting technique and check weld position',
            severity: 'medium',
            confidence: 0.8
          });
        }
        if (form.swing === 'needs_improvement') {
          corrections.push({
            keypoint: 'swing',
            message: 'Maintain smooth, fluid swing motion and complete follow-through',
            severity: 'high',
            confidence: 0.9
          });
        }
        break;

      case 'practical_pistol':
        if (form.draw === 'needs_improvement') {
          corrections.push({
            keypoint: 'draw',
            message: 'Practice smooth, efficient draw with consistent grip acquisition',
            severity: 'high',
            confidence: 0.9
          });
        }
        if (form.reload === 'needs_improvement') {
          corrections.push({
            keypoint: 'reload',
            message: 'Work on efficient magazine changes and minimize movement',
            severity: 'medium',
            confidence: 0.8
          });
        }
        if (form.movement === 'needs_improvement') {
          corrections.push({
            keypoint: 'movement',
            message: 'Stay balanced while moving and maintain efficient footwork',
            severity: 'medium',
            confidence: 0.8
          });
        }
        if (form.targetTransitions === 'needs_improvement') {
          corrections.push({
            keypoint: 'target_transitions',
            message: 'Practice quick, accurate target transitions while maintaining sight alignment',
            severity: 'high',
            confidence: 0.9
          });
        }
        break;
    }

    return corrections;
  }, [sport]);

  // Analyze frame using pose detection
  const analyzeFrame = useCallback(async () => {
    if (!isInitialized || !videoRef.current) return;

    try {
      // Simulate pose detection analysis
      const mockPoseData = {
        shoulderAlignment: Math.random() * 0.3 + 0.7, // 0.7-1.0
        handPosition: Math.random() * 0.3 + 0.7,
        sightAlignment: Math.random() * 0.3 + 0.7,
        triggerControl: Math.random() * 0.3 + 0.7,
        mountingSpeed: Math.random() * 0.3 + 0.7,
        swingSmoothness: Math.random() * 0.3 + 0.7,
        drawSpeed: Math.random() * 0.3 + 0.7,
        reloadEfficiency: Math.random() * 0.3 + 0.7,
        movementEfficiency: Math.random() * 0.3 + 0.7,
        targetTransitions: Math.random() * 0.3 + 0.7
      };

      const shootingForm = analyzeShootingForm(mockPoseData);
      const corrections = generateCorrections(shootingForm);
      const confidence = Math.random() * 0.2 + 0.8; // 0.8-1.0

      const newAnalysis: FormAnalysis = {
        hasPose: true,
        corrections,
        confidence,
        shootingForm,
        sport,
        timestamp: Date.now()
      };

      setAnalysis(newAnalysis);

      // Draw pose overlay on canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          // Draw pose keypoints and connections
          drawPoseOverlay(ctx, mockPoseData);
        }
      }

    } catch (error) {
      console.error('Error analyzing frame:', error);
    }
  }, [isInitialized, sport, analyzeShootingForm, generateCorrections]);

  // Draw pose overlay on canvas
  const drawPoseOverlay = useCallback((ctx: CanvasRenderingContext2D, poseData: any) => {
    // This would draw actual pose keypoints and connections
    // For now, we'll draw a simple overlay
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(200, 150);
    ctx.stroke();
  }, []);

  // Auto-analyze frames
  useEffect(() => {
    if (!isAnalyzing) return;

    const interval = setInterval(() => {
      analyzeFrame();
    }, 1000); // Analyze every second

    return () => clearInterval(interval);
  }, [isAnalyzing, analyzeFrame]);

  const toggleAnalysis = useCallback(() => {
    setIsAnalyzing(!isAnalyzing);
    if (!isAnalyzing) {
      analyzeFrame();
    }
  }, [isAnalyzing, analyzeFrame]);

  const getFormQualityColor = (quality: string) => {
    switch (quality) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs_improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSportSpecificForm = () => {
    if (!analysis.shootingForm) return null;

    const form = analysis.shootingForm;
    
    switch (sport) {
      case 'precision_shooting':
        return (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium">Stance:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.stance)}`}>
                {form.stance.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Grip:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.grip)}`}>
                {form.grip.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Sight Alignment:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.sightAlignment)}`}>
                {form.sightAlignment.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Trigger Control:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.triggerControl)}`}>
                {form.triggerControl.replace('_', ' ')}
              </span>
            </div>
            {form.breathing && (
              <div>
                <span className="text-sm font-medium">Breathing:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.breathing)}`}>
                  {form.breathing.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        );

      case 'trap_skeet':
        return (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium">Mounting:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.mounting || 'good')}`}>
                {(form.mounting || 'good').replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Swing:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.swing || 'good')}`}>
                {(form.swing || 'good').replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Stance:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.stance)}`}>
                {form.stance.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Grip:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.grip)}`}>
                {form.grip.replace('_', ' ')}
              </span>
            </div>
          </div>
        );

      case 'practical_pistol':
        return (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium">Draw:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.draw || 'good')}`}>
                {(form.draw || 'good').replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Reload:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.reload || 'good')}`}>
                {(form.reload || 'good').replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Movement:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.movement || 'good')}`}>
                {(form.movement || 'good').replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Target Transitions:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.targetTransitions || 'good')}`}>
                {(form.targetTransitions || 'good').replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Stage Planning:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getFormQualityColor(form.stagePlanning || 'good')}`}>
                {(form.stagePlanning || 'good').replace('_', ' ')}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show consent modal before upload/record
  const handleStartUpload = (file: File) => {
    setVideoFile(file);
    setShowConsentModal(true);
  };

  // Called when user gives consent
  const handleConsent = (consent: any) => {
    setConsentData(consent);
    const newSessionId = `guncoach_${Date.now()}`;
    setSessionId(newSessionId);
    sentryService.logSessionEvent(user?.uid || '', newSessionId, 'start', sport, mode);
    sentryService.logConsent(user?.uid || '', newSessionId, 'video_upload', true);
    // Proceed with video analysis
    analyzeVideo(videoFile, newSessionId);
  };

  // Called if user declines consent
  const handleConsentClose = () => {
    setShowConsentModal(false);
    setVideoFile(null);
    setConsentData(null);
    if (onSessionEnd) onSessionEnd();
  };

  // Example video analysis function
  const analyzeVideo = async (file: File | null, sessionId: string) => {
    if (!file) return;
    try {
      // ... pose detection logic ...
      // Simulate pose detection result
      const poseDetected = true; // Replace with actual detection
      if (poseDetected) {
        setPoseSuccess(true);
        sentryService.logPoseDetection(user?.uid || '', sessionId, true);
      } else {
        setPoseSuccess(false);
        setPoseError('No valid shooting form detected');
        sentryService.logPoseDetection(user?.uid || '', sessionId, false, 'No valid shooting form detected');
      }
    } catch (err) {
      setPoseSuccess(false);
      setPoseError('Pose detection failed');
      sentryService.logPoseDetection(user?.uid || '', sessionId, false, 'Pose detection failed');
    }
  };

  // UI for upload button (example)
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleStartUpload(e.target.files[0]);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <video
          ref={videoRef}
          src={videoFile ? URL.createObjectURL(videoFile) : undefined}
          autoPlay={mode === 'live'}
          muted
          playsInline
          className="w-full h-auto rounded-lg"
        />
        {mode === 'live' && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
          />
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleAnalysis}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isAnalyzing
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
          </button>

          <div className="text-sm text-gray-600">
            {isAnalyzing ? 'Analyzing...' : 'Ready'}
          </div>
        </div>

        {analysis.hasPose && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Form Analysis - {sport.replace('_', ' ').toUpperCase()}</h3>
            
            {getSportSpecificForm()}

            {analysis.corrections.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-md mb-2">Corrections Needed:</h4>
                <div className="space-y-2">
                  {analysis.corrections.map((correction, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md border-l-4 ${
                        correction.severity === 'high'
                          ? 'bg-red-50 border-red-400 text-red-800'
                          : correction.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                          : 'bg-blue-50 border-blue-400 text-blue-800'
                      }`}
                    >
                      <div className="font-medium">{correction.keypoint.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm mt-1">{correction.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              Confidence: {(analysis.confidence * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {/* Consent Modal for uploads */}
        <VideoConsentModal
          isOpen={showConsentModal}
          onClose={handleConsentClose}
          onConsent={handleConsent}
          videoFile={videoFile || undefined}
          sessionId={sessionId || ''}
          sport={sport}
        />

        {/* Example upload UI */}
        {mode === 'upload' && !consentData && (
          <div className="mb-4">
            <input type="file" accept="video/*" onChange={handleFileInput} />
          </div>
        )}

        {/* Show pose detection result */}
        {poseSuccess && <div className="text-green-600">Pose detected successfully!</div>}
        {poseError && <div className="text-red-600">{poseError}</div>}
      </div>
    </div>
  );
}; 