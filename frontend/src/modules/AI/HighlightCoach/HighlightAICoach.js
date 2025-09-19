import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Play, Pause, Star, TrendingUp, Target, BarChart3, Users, AlertCircle, CheckCircle, XCircle, Video, Settings, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
const HighlightAICoach = () => {
    const [currentVideo, setCurrentVideo] = useState(null);
    const [uploadedVideos, setUploadedVideos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [selectedTab, setSelectedTab] = useState("upload");
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showPoseOverlay, setShowPoseOverlay] = useState(true);
    const [showFeedbackMarkers, setShowFeedbackMarkers] = useState(true);
    const [selectedMoment, setSelectedMoment] = useState(null);
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const uploadIntervalRef = useRef(null);
    const analysisIntervalRef = useRef(null);
    // Mock data for development
    useEffect(() => {
        const mockVideos = [
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
            setCurrentVideo(mockVideos[0]);
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
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
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
            const newVideo = {
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
    const startAnalysis = async (videoId) => {
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
    const completeAnalysis = (videoId) => {
        setUploadedVideos(prev => prev.map(video => video.id === videoId
            ? { ...video, analysisStatus: "completed", analysisProgress: 100 }
            : video));
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
    const handleSeek = (event) => {
        const time = parseFloat(event.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };
    const formatTime = (seconds) => {
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
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "HighlightAI Coach" }), _jsx("p", { className: "text-gray-600 mt-1", children: "AI-powered video analysis and coaching feedback" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: [_jsx(Upload, { className: "w-4 h-4" }), "Upload Video"] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "video/*", onChange: handleFileUpload, className: "hidden" }), _jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200", children: [_jsx(Settings, { className: "w-4 h-4" }), "Settings"] })] })] }) }), isUploading && (_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-blue-900", children: "Uploading video..." }), _jsxs("span", { className: "text-sm text-blue-700", children: [uploadProgress, "%"] })] }), _jsx("div", { className: "w-full bg-blue-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300", style: { width: `${uploadProgress}%` } }) })] })), isAnalyzing && (_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, className: "bg-green-50 border border-green-200 rounded-lg p-4 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-green-900", children: "Analyzing video with AI..." }), _jsxs("span", { className: "text-sm text-green-700", children: [analysisProgress, "%"] })] }), _jsx("div", { className: "w-full bg-green-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-600 h-2 rounded-full transition-all duration-300", style: { width: `${analysisProgress}%` } }) })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2", children: [_jsx("div", { className: "bg-black rounded-lg overflow-hidden", children: currentVideo ? (_jsxs("div", { className: "relative", children: [_jsx("video", { ref: videoRef, src: currentVideo.videoUrl, className: "w-full h-auto", onTimeUpdate: handleTimeUpdate, onLoadedMetadata: handleLoadedMetadata, onPlay: () => setIsPlaying(true), onPause: () => setIsPlaying(false) }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: isPlaying ? handleVideoPause : handleVideoPlay, className: "text-white hover:text-gray-300", children: isPlaying ? _jsx(Pause, { className: "w-6 h-6" }) : _jsx(Play, { className: "w-6 h-6" }) }), _jsx("div", { className: "flex-1", children: _jsx("input", { type: "range", min: "0", max: duration, value: currentTime, onChange: handleSeek, className: "w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" }) }), _jsxs("span", { className: "text-white text-sm", children: [formatTime(currentTime), " / ", formatTime(duration)] }), _jsx("button", { onClick: () => setIsMuted(!isMuted), className: "text-white hover:text-gray-300", children: isMuted ? _jsx(VolumeX, { className: "w-5 h-5" }) : _jsx(Volume2, { className: "w-5 h-5" }) }), _jsx("button", { onClick: () => setIsFullscreen(!isFullscreen), className: "text-white hover:text-gray-300", children: isFullscreen ? _jsx(Minimize2, { className: "w-5 h-5" }) : _jsx(Maximize2, { className: "w-5 h-5" }) })] }) }), _jsx("div", { className: "absolute top-4 right-4", children: _jsx("button", { onClick: () => setShowPoseOverlay(!showPoseOverlay), className: `px-3 py-1 rounded-full text-sm font-medium ${showPoseOverlay
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-600 text-white"}`, children: "Pose Overlay" }) }), _jsx("div", { className: "absolute top-4 right-32", children: _jsx("button", { onClick: () => setShowFeedbackMarkers(!showFeedbackMarkers), className: `px-3 py-1 rounded-full text-sm font-medium ${showFeedbackMarkers
                                                    ? "bg-green-600 text-white"
                                                    : "bg-gray-600 text-white"}`, children: "Feedback" }) })] })) : (_jsx("div", { className: "flex items-center justify-center h-64 text-gray-400", children: _jsxs("div", { className: "text-center", children: [_jsx(Video, { className: "w-16 h-16 mx-auto mb-4" }), _jsx("p", { children: "No video selected" }), _jsx("p", { className: "text-sm", children: "Upload a video to get started" })] }) })) }), uploadedVideos.length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Your Videos" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: uploadedVideos.map((video) => (_jsxs("div", { onClick: () => setCurrentVideo(video), className: `cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${currentVideo?.id === video.id
                                                ? "border-blue-500"
                                                : "border-gray-200 hover:border-gray-300"}`, children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: video.thumbnailUrl, alt: "Video thumbnail", className: "w-full h-24 object-cover" }), _jsxs("div", { className: "absolute top-2 right-2", children: [video.analysisStatus === "completed" && (_jsx(CheckCircle, { className: "w-5 h-5 text-green-500" })), video.analysisStatus === "processing" && (_jsx("div", { className: "w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" })), video.analysisStatus === "failed" && (_jsx(XCircle, { className: "w-5 h-5 text-red-500" }))] })] }), _jsxs("div", { className: "p-2", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900 truncate", children: ["Video ", video.id] }), _jsx("p", { className: "text-xs text-gray-500", children: formatTime(video.duration) })] })] }, video.id))) })] }))] }), _jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "flex space-x-8 px-6", children: tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            return (_jsxs("button", { onClick: () => setSelectedTab(tab.id), className: `flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${selectedTab === tab.id
                                                    ? "border-blue-500 text-blue-600"
                                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`, children: [_jsx(Icon, { className: "w-4 h-4" }), tab.label] }, tab.id));
                                        }) }) }), _jsx("div", { className: "p-6", children: _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.2 }, children: [selectedTab === "upload" && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center", children: [_jsx(Upload, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Upload your highlight video" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Get AI-powered analysis and coaching feedback" }), _jsx("button", { onClick: () => fileInputRef.current?.click(), className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Choose Video" })] }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-blue-900 mb-2", children: "Supported Formats" }), _jsx("p", { className: "text-sm text-blue-700", children: "MP4, MOV, AVI, WebM (Max 500MB)" })] })] })), selectedTab === "analysis" && currentVideo && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: currentVideo.motionData.techniqueScore }), _jsx("div", { className: "text-sm text-gray-600", children: "Technique" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: currentVideo.motionData.movementQuality }), _jsx("div", { className: "text-sm text-gray-600", children: "Movement" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: currentVideo.motionData.efficiencyScore }), _jsx("div", { className: "text-sm text-gray-600", children: "Efficiency" })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Key Moments" }), _jsx("div", { className: "space-y-2", children: currentVideo.motionData.keyMoments.map((moment, index) => (_jsxs("div", { onClick: () => setSelectedMoment(moment), className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900", children: moment.description }), _jsx("div", { className: "text-sm text-gray-500", children: formatTime(moment.timestamp) })] }), _jsx("div", { className: `px-2 py-1 rounded-full text-xs font-medium ${moment.importance === "high" ? "bg-red-100 text-red-800" :
                                                                                    moment.importance === "medium" ? "bg-yellow-100 text-yellow-800" :
                                                                                        "bg-green-100 text-green-800"}`, children: moment.importance })] }, index))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Recommendations" }), _jsx("div", { className: "space-y-2", children: currentVideo.motionData.recommendations.map((rec, index) => (_jsxs("div", { className: "flex items-start gap-2 p-3 bg-blue-50 rounded-lg", children: [_jsx(Target, { className: "w-4 h-4 text-blue-600 mt-0.5" }), _jsx("span", { className: "text-sm text-blue-900", children: rec })] }, index))) })] })] })), selectedTab === "feedback" && currentVideo && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl font-bold text-blue-600 mb-2", children: currentVideo.feedback.overallScore }), _jsx("div", { className: "text-lg text-gray-600", children: "Overall Score" })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Strengths" }), _jsx("div", { className: "space-y-2", children: currentVideo.feedback.strengths.map((strength, index) => (_jsxs("div", { className: "flex items-center gap-2 p-2 bg-green-50 rounded-lg", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-600" }), _jsx("span", { className: "text-sm text-green-900", children: strength })] }, index))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Areas for Improvement" }), _jsx("div", { className: "space-y-2", children: currentVideo.feedback.areasForImprovement.map((area, index) => (_jsxs("div", { className: "flex items-center gap-2 p-2 bg-yellow-50 rounded-lg", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-yellow-600" }), _jsx("span", { className: "text-sm text-yellow-900", children: area })] }, index))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Recommended Drills" }), _jsx("div", { className: "space-y-3", children: currentVideo.feedback.drills.map((drill) => (_jsxs("div", { className: "p-3 border border-gray-200 rounded-lg", children: [_jsx("div", { className: "font-medium text-gray-900", children: drill.name }), _jsx("div", { className: "text-sm text-gray-600 mb-2", children: drill.description }), _jsxs("div", { className: "flex items-center gap-4 text-xs text-gray-500", children: [_jsxs("span", { children: [drill.duration, " min"] }), _jsx("span", { className: `px-2 py-1 rounded-full ${drill.difficulty === "beginner" ? "bg-green-100 text-green-800" :
                                                                                            drill.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-800" :
                                                                                                "bg-red-100 text-red-800"}`, children: drill.difficulty })] })] }, drill.id))) })] })] })), selectedTab === "comparison" && currentVideo && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: currentVideo.comparison.playerStats.techniqueScore }), _jsx("div", { className: "text-sm text-gray-600", children: "Technique" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: currentVideo.comparison.peerComparison.percentile }), _jsx("div", { className: "text-sm text-gray-600", children: "Percentile" })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Progress Trend" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-green-600" }), _jsxs("span", { className: "text-sm text-gray-600", children: [currentVideo.comparison.playerStats.recentTrend, " trend"] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Benchmarks" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Professional" }), _jsx("span", { className: "font-medium", children: currentVideo.comparison.benchmarks.professional })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Collegiate" }), _jsx("span", { className: "font-medium", children: currentVideo.comparison.benchmarks.collegiate })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "High School" }), _jsx("span", { className: "font-medium", children: currentVideo.comparison.benchmarks.highSchool })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Recreational" }), _jsx("span", { className: "font-medium", children: currentVideo.comparison.benchmarks.recreational })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Similar Players" }), _jsx("div", { className: "space-y-2", children: currentVideo.comparison.peerComparison.similarPlayers.map((player) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900", children: player.name }), _jsxs("div", { className: "text-sm text-gray-500", children: [player.similarity, "% similar"] })] }), _jsx("div", { className: "text-sm font-medium text-blue-600", children: player.techniqueScore })] }, player.id))) })] })] }))] }, selectedTab) }) })] }) })] })] }));
};
export default HighlightAICoach;
