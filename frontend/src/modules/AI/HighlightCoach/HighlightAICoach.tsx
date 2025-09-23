import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Share, 
  Star,
  TrendingUp,
  Target,
  Zap,
  Eye,
  BarChart3,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Camera,
  Video,
  FileText,
  Settings,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle
} from "lucide-react";

interface VideoAnalysis {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  analysisStatus: "uploading" | "processing" | "completed" | "failed";
  analysisProgress: number;
  motionData: MotionAnalysis;
  feedback: CoachFeedback;
  comparison: ComparisonData;
  createdAt: Date;
  updatedAt: Date;
}

interface MotionAnalysis {
  poseEstimation: PoseData[];
  movementQuality: number; // 0-100
  techniqueScore: number; // 0-100
  efficiencyScore: number; // 0-100
  keyMoments: KeyMoment[];
  recommendations: string[];
  biomechanics: BiomechanicsData;
}

interface PoseData {
  timestamp: number;
  keypoints: Keypoint[];
  confidence: number;
}

interface Keypoint {
  x: number;
  y: number;
  confidence: number;
  name: string;
}

interface KeyMoment {
  timestamp: number;
  description: string;
  importance: "low" | "medium" | "high";
  category: "technique" | "positioning" | "timing" | "power";
}

interface BiomechanicsData {
  jointAngles: Record<string, number[]>;
  velocity: Record<string, number[]>;
  acceleration: Record<string, number[]>;
  balanceMetrics: {
    centerOfMass: { x: number; y: number }[];
    stabilityScore: number;
  };
}

interface CoachFeedback {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  specificFeedback: FeedbackItem[];
  drills: RecommendedDrill[];
  nextSteps: string[];
}

interface FeedbackItem {
  timestamp: number;
  category: string;
  message: string;
  severity: "low" | "medium" | "high";
  visualMarker?: { x: number; y: number };
}

interface RecommendedDrill {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  focus: string[];
  videoUrl?: string;
}

interface ComparisonData {
  playerStats: PlayerStats;
  peerComparison: PeerComparison;
  historicalProgress: ProgressData[];
  benchmarks: BenchmarkData;
}

interface PlayerStats {
  techniqueScore: number;
  consistencyScore: number;
  improvementRate: number;
  totalSessions: number;
  averageSessionTime: number;
  bestScore: number;
  recentTrend: "improving" | "stable" | "declining";
}

interface PeerComparison {
  percentile: number;
  rank: number;
  totalPlayers: number;
  similarPlayers: SimilarPlayer[];
}

interface SimilarPlayer {
  id: string;
  name: string;
  similarity: number;
  techniqueScore: number;
  strengths: string[];
}

interface ProgressData {
  date: Date;
  techniqueScore: number;
  sessionDuration: number;
  drillsCompleted: number;
}

interface BenchmarkData {
  professional: number;
  collegiate: number;
  highSchool: number;
  recreational: number;
}

const HighlightAICoach: React.FC = () => {
  const [currentVideo, setCurrentVideo] = useState<VideoAnalysis | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<VideoAnalysis[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedTab, setSelectedTab] = useState<"upload" | "analysis" | "feedback" | "comparison">("upload");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPoseOverlay, setShowPoseOverlay] = useState(true);
  const [showFeedbackMarkers, setShowFeedbackMarkers] = useState(true);
  const [selectedMoment, setSelectedMoment] = useState<KeyMoment | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data for development
  useEffect(() => {
    const mockVideos: VideoAnalysis[] = [
      {
        id: "1",
        videoUrl: "/mock-videos/soccer-highlight.mp4",
        thumbnailUrl: "/mock-thumbnails/soccer-thumb.jpg",
        duration: 120,
        analysisStatus: "completed",
        analysisProgress: 100,
        motionData: {
          poseEstimation: [],
          movementQuality: 85,
          techniqueScore: 78,
          efficiencyScore: 82,
          keyMoments: [
            {
              timestamp: 15,
              description: "Excellent ball control and first touch",
              importance: "high",
              category: "technique"
            },
            {
              timestamp: 45,
              description: "Good positioning for the shot",
              importance: "medium",
              category: "positioning"
            },
            {
              timestamp: 67,
              description: "Perfect timing on the strike",
              importance: "high",
              category: "timing"
            }
          ],
          recommendations: [
            "Work on maintaining balance during acceleration",
            "Improve left foot control for better versatility",
            "Focus on consistent follow-through"
          ],
          biomechanics: {
            jointAngles: {},
            velocity: {},
            acceleration: {},
            balanceMetrics: {
              centerOfMass: [],
              stabilityScore: 76
            }
          }
        },
        feedback: {
          overallScore: 80,
          strengths: [
            "Excellent ball control",
            "Good spatial awareness",
            "Strong finishing ability"
          ],
          areasForImprovement: [
            "Balance during acceleration",
            "Left foot control",
            "Consistency in follow-through"
          ],
          specificFeedback: [
            {
              timestamp: 15,
              category: "Technique",
              message: "Great first touch, but could improve balance",
              severity: "medium"
            },
            {
              timestamp: 45,
              category: "Positioning",
              message: "Perfect positioning for the shot",
              severity: "low"
            }
          ],
          drills: [
            {
              id: "drill-1",
              name: "Balance Training",
              description: "Improve balance during acceleration",
              difficulty: "intermediate",
              duration: 20,
              focus: ["balance", "acceleration"]
            },
            {
              id: "drill-2",
              name: "Left Foot Control",
              description: "Enhance left foot ball control",
              difficulty: "beginner",
              duration: 15,
              focus: ["ball control", "weak foot"]
            }
          ],
          nextSteps: [
            "Practice balance exercises 3x per week",
            "Focus on left foot drills",
            "Record follow-up video in 2 weeks"
          ]
        },
        comparison: {
          playerStats: {
            techniqueScore: 78,
            consistencyScore: 75,
            improvementRate: 12,
            totalSessions: 8,
            averageSessionTime: 45,
            bestScore: 82,
            recentTrend: "improving"
          },
          peerComparison: {
            percentile: 85,
            rank: 15,
            totalPlayers: 100,
            similarPlayers: [
              {
                id: "player-1",
                name: "Alex Johnson",
                similarity: 92,
                techniqueScore: 80,
                strengths: ["ball control", "finishing"]
              }
            ]
          },
          historicalProgress: [
            { date: new Date("2024-01-01"), techniqueScore: 65, sessionDuration: 30, drillsCompleted: 5 },
            { date: new Date("2024-01-15"), techniqueScore: 70, sessionDuration: 40, drillsCompleted: 6 },
            { date: new Date("2024-02-01"), techniqueScore: 75, sessionDuration: 45, drillsCompleted: 7 },
            { date: new Date("2024-02-15"), techniqueScore: 78, sessionDuration: 45, drillsCompleted: 8 }
          ],
          benchmarks: {
            professional: 95,
            collegiate: 85,
            highSchool: 75,
            recreational: 60
          }
        },
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-15")
      }
    ];

    setUploadedVideos(mockVideos);
    if (mockVideos.length > 0) {
      setCurrentVideo(mockVideos[0] || null);
    }
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress with proper cleanup
    uploadIntervalRef.current = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          if (uploadIntervalRef.current) {
            clearInterval(uploadIntervalRef.current);
            uploadIntervalRef.current = null;
          }
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate video processing
    setTimeout(() => {
      const newVideo: VideoAnalysis = {
        id: Date.now().toString(),
        videoUrl: URL.createObjectURL(file),
        thumbnailUrl: "/mock-thumbnails/new-thumb.jpg",
        duration: 90,
        analysisStatus: "processing",
        analysisProgress: 0,
        motionData: {
          poseEstimation: [],
          movementQuality: 0,
          techniqueScore: 0,
          efficiencyScore: 0,
          keyMoments: [],
          recommendations: [],
          biomechanics: {
            jointAngles: {},
            velocity: {},
            acceleration: {},
            balanceMetrics: {
              centerOfMass: [],
              stabilityScore: 0
            }
          }
        },
        feedback: {
          overallScore: 0,
          strengths: [],
          areasForImprovement: [],
          specificFeedback: [],
          drills: [],
          nextSteps: []
        },
        comparison: {
          playerStats: {
            techniqueScore: 0,
            consistencyScore: 0,
            improvementRate: 0,
            totalSessions: 0,
            averageSessionTime: 0,
            bestScore: 0,
            recentTrend: "stable"
          },
          peerComparison: {
            percentile: 0,
            rank: 0,
            totalPlayers: 0,
            similarPlayers: []
          },
          historicalProgress: [],
          benchmarks: {
            professional: 0,
            collegiate: 0,
            highSchool: 0,
            recreational: 0
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setUploadedVideos(prev => [newVideo, ...prev]);
      setCurrentVideo(newVideo);
      startAnalysis(newVideo.id);
    }, 2000);
  };

  const startAnalysis = async (videoId: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate AI analysis progress with proper cleanup
    analysisIntervalRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          if (analysisIntervalRef.current) {
            clearInterval(analysisIntervalRef.current);
            analysisIntervalRef.current = null;
          }
          setIsAnalyzing(false);
          completeAnalysis(videoId);
          return 100;
        }
        return prev + 5;
      });
    }, 300);
  };

  const completeAnalysis = (videoId: string) => {
    setUploadedVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, analysisStatus: "completed", analysisProgress: 100 }
        : video
    ));
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoPause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const tabs = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "analysis", label: "Analysis", icon: BarChart3 },
    { id: "feedback", label: "Feedback", icon: Star },
    { id: "comparison", label: "Comparison", icon: Users }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HighlightAI Coach</h1>
            <p className="text-gray-600 mt-1">AI-powered video analysis and coaching feedback</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              Upload Video
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Uploading video...</span>
            <span className="text-sm text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </motion.div>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Analyzing video with AI...</span>
            <span className="text-sm text-green-700">{analysisProgress}%</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <div className="bg-black rounded-lg overflow-hidden">
            {currentVideo ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={currentVideo.videoUrl}
                  className="w-full h-auto"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={isPlaying ? handleVideoPause : handleVideoPlay}
                      className="text-white hover:text-gray-300"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white hover:text-gray-300"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="text-white hover:text-gray-300"
                    >
                      {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Pose Overlay Toggle */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowPoseOverlay(!showPoseOverlay)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      showPoseOverlay 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    Pose Overlay
                  </button>
                </div>

                {/* Feedback Markers Toggle */}
                <div className="absolute top-4 right-32">
                  <button
                    onClick={() => setShowFeedbackMarkers(!showFeedbackMarkers)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      showFeedbackMarkers 
                        ? "bg-green-600 text-white" 
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    Feedback
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4" />
                  <p>No video selected</p>
                  <p className="text-sm">Upload a video to get started</p>
                </div>
              </div>
            )}
          </div>

          {/* Video List */}
          {uploadedVideos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Videos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => setCurrentVideo(video)}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      currentVideo?.id === video.id 
                        ? "border-blue-500" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={video.thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {video.analysisStatus === "completed" && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {video.analysisStatus === "processing" && (
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {video.analysisStatus === "failed" && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Video {video.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(video.duration)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analysis Panel */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id as any)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                        selectedTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {selectedTab === "upload" && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Upload your highlight video
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Get AI-powered analysis and coaching feedback
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Choose Video
                        </button>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Supported Formats</h4>
                        <p className="text-sm text-blue-700">
                          MP4, MOV, AVI, WebM (Max 500MB)
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedTab === "analysis" && currentVideo && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {currentVideo.motionData.techniqueScore}
                          </div>
                          <div className="text-sm text-gray-600">Technique</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {currentVideo.motionData.movementQuality}
                          </div>
                          <div className="text-sm text-gray-600">Movement</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {currentVideo.motionData.efficiencyScore}
                          </div>
                          <div className="text-sm text-gray-600">Efficiency</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Key Moments</h4>
                        <div className="space-y-2">
                          {currentVideo.motionData.keyMoments.map((moment, index) => (
                            <div
                              key={index}
                              onClick={() => setSelectedMoment(moment)}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                            >
                              <div>
                                <div className="font-medium text-gray-900">
                                  {moment.description}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatTime(moment.timestamp)}
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                moment.importance === "high" ? "bg-red-100 text-red-800" :
                                moment.importance === "medium" ? "bg-yellow-100 text-yellow-800" :
                                "bg-green-100 text-green-800"
                              }`}>
                                {moment.importance}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                        <div className="space-y-2">
                          {currentVideo.motionData.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                              <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                              <span className="text-sm text-blue-900">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTab === "feedback" && currentVideo && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {currentVideo.feedback.overallScore}
                        </div>
                        <div className="text-lg text-gray-600">Overall Score</div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Strengths</h4>
                        <div className="space-y-2">
                          {currentVideo.feedback.strengths.map((strength, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-900">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Areas for Improvement</h4>
                        <div className="space-y-2">
                          {currentVideo.feedback.areasForImprovement.map((area, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm text-yellow-900">{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Recommended Drills</h4>
                        <div className="space-y-3">
                          {currentVideo.feedback.drills.map((drill) => (
                            <div key={drill.id} className="p-3 border border-gray-200 rounded-lg">
                              <div className="font-medium text-gray-900">{drill.name}</div>
                              <div className="text-sm text-gray-600 mb-2">{drill.description}</div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{drill.duration} min</span>
                                <span className={`px-2 py-1 rounded-full ${
                                  drill.difficulty === "beginner" ? "bg-green-100 text-green-800" :
                                  drill.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {drill.difficulty}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTab === "comparison" && currentVideo && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {currentVideo.comparison.playerStats.techniqueScore}
                          </div>
                          <div className="text-sm text-gray-600">Technique</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {currentVideo.comparison.peerComparison.percentile}
                          </div>
                          <div className="text-sm text-gray-600">Percentile</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Progress Trend</h4>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-gray-600">
                            {currentVideo.comparison.playerStats.recentTrend} trend
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Benchmarks</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Professional</span>
                            <span className="font-medium">{currentVideo.comparison.benchmarks.professional}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Collegiate</span>
                            <span className="font-medium">{currentVideo.comparison.benchmarks.collegiate}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>High School</span>
                            <span className="font-medium">{currentVideo.comparison.benchmarks.highSchool}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Recreational</span>
                            <span className="font-medium">{currentVideo.comparison.benchmarks.recreational}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Similar Players</h4>
                        <div className="space-y-2">
                          {currentVideo.comparison.peerComparison.similarPlayers.map((player) => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{player.name}</div>
                                <div className="text-sm text-gray-500">{player.similarity}% similar</div>
                              </div>
                              <div className="text-sm font-medium text-blue-600">
                                {player.techniqueScore}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightAICoach; 