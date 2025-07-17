import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AdminAuthContext';
import { useSmartLayer } from '../contexts/SmartLayerContext';
import { useAgentOrchestration } from '../contexts/AgentOrchestrationContext';
import { 
  useDrillScrollSessionManager, 
  usePlaymakerIntentEngine,
  useScoutRoleCurationHub,
  useSessionLiberationAnalytics 
} from '../modules/GrowthSessions';
import { 
  Target, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MapPin,
  Clock,
  Users,
  Zap
} from 'lucide-react';

interface FeedPost {
  id: string;
  type: 'drill' | 'highlight' | 'tip' | 'reminder' | 'alert' | 'achievement' | 'social';
  title: string;
  content: string;
  author: string;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  location?: string;
  tags?: string[];
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
  aiInsights?: {
    relevance: number;
    actionability: number;
    motivation: number;
  };
}

interface FeedSession {
  id: string;
  type: 'training' | 'learning' | 'scouting' | 'social' | 'planning';
  startTime: number;
  duration: number;
  postsViewed: number;
  actionsTaken: number;
  intent: string;
  status: 'active' | 'completed' | 'interrupted';
}

const Feed: React.FC = () => {
  const { user } = useAuth();
  const { userIntent } = useSmartLayer();
  const { sendRequest } = useAgentOrchestration();
  
  // Growth Sessions hooks
  const {
    currentDrillSession,
    postsViewed,
    incrementPostView,
    takeDrillAction,
    getDrillSessionProgress,
    getDrillSessionCTA,
    endDrillSession
  } = useDrillScrollSessionManager();

  const {
    scrollCount,
    rapidScrolls
  } = usePlaymakerIntentEngine();

  const {
    getScoutRecommendations
  } = useScoutRoleCurationHub();

  const {
    startAnalyticsSession,
    endAnalyticsSession,
    logIntervention
  } = useSessionLiberationAnalytics();

  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<FeedSession | null>(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionData, setInterventionData] = useState<any>(null);

  // Initialize session and wire SmartIntentEngine to FeedSessionController
  useEffect(() => {
    if (!user) return;

    const initializeSession = async () => {
      // Start analytics session
      const newSessionId = startAnalyticsSession('curated');
      setSessionId(newSessionId);

      // Create feed session
      const sessionType = determineSessionType(userIntent || 'explore', user.role);
      const feedSession: FeedSession = {
        id: newSessionId || 'default-session',
        type: sessionType,
        startTime: Date.now(),
        duration: 0,
        postsViewed: 0,
        actionsTaken: 0,
        intent: userIntent || 'explore',
        status: 'active'
      };
      setCurrentSession(feedSession);

      // Generate curated feed posts
      await generateCuratedFeedPosts(feedSession);
    };

    initializeSession();
  }, [user, userIntent, startAnalyticsSession]);

  // Wire scroll detection to session management
  useEffect(() => {
    const handleScroll = () => {
      if (currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          duration: Date.now() - prev.startTime,
          postsViewed: postsViewed
        } : null);
      }

      // Trigger intervention if needed
      if (scrollCount > 50 && rapidScrolls > 3) {
        logIntervention('scroll_timeout', 'excessive_scrolling');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollCount, rapidScrolls, logIntervention, currentSession, postsViewed]);

  const determineSessionType = (intent: string, role: string): FeedSession['type'] => {
    if (intent === 'train' || intent === 'workout') return 'training';
    if (intent === 'learn' || intent === 'study') return 'learning';
    if (intent === 'scout' || intent === 'evaluate') return 'scouting';
    if (intent === 'social' || intent === 'connect') return 'social';
    if (intent === 'plan' || intent === 'organize') return 'planning';
    
    // Default based on role
    switch (role) {
      case 'player': return 'training';
      case 'coach': return 'scouting';
      case 'parent': return 'planning';
      default: return 'learning';
    }
  };

  const generateCuratedFeedPosts = async (session: FeedSession) => {
    if (!user) return;

    // Generate posts with AI insights
    const posts: FeedPost[] = [
      {
        id: '1',
        type: 'drill',
        title: 'Agility Ladder Workout',
        content: 'Improve your footwork and speed with this 15-minute ladder drill designed for your skill level...',
        author: 'Coach Smith',
        timestamp: Date.now() - 3600000,
        priority: 'high',
        location: 'Local Gym',
        tags: ['agility', 'speed', 'footwork'],
        engagement: { likes: 24, comments: 8, shares: 3 },
        aiInsights: {
          relevance: 0.95,
          actionability: 0.88,
          motivation: 0.92
        }
      },
      {
        id: '2',
        type: 'highlight',
        title: 'Team Performance Update',
        content: 'Great work this week! Team stats show 15% improvement in passing accuracy. Keep up the momentum!',
        author: 'AI Assistant',
        timestamp: Date.now() - 7200000,
        priority: 'medium',
        tags: ['performance', 'stats', 'improvement'],
        engagement: { likes: 18, comments: 5, shares: 2 },
        aiInsights: {
          relevance: 0.87,
          actionability: 0.75,
          motivation: 0.89
        }
      },
      {
        id: '3',
        type: 'tip',
        title: 'Recovery Best Practices',
        content: 'Remember to stretch for 5 minutes after training to prevent injury and improve flexibility...',
        author: 'Sports Science',
        timestamp: Date.now() - 10800000,
        priority: 'low',
        tags: ['recovery', 'stretching', 'injury-prevention'],
        engagement: { likes: 12, comments: 3, shares: 1 },
        aiInsights: {
          relevance: 0.78,
          actionability: 0.92,
          motivation: 0.65
        }
      },
      {
        id: '4',
        type: 'reminder',
        title: 'Upcoming Game',
        content: 'Don\'t forget the game tomorrow at 3:00 PM. Bring your gear and arrive 30 minutes early!',
        author: 'League Admin',
        timestamp: Date.now() - 14400000,
        priority: 'high',
        location: 'Memorial Field',
        tags: ['game', 'reminder', 'schedule'],
        engagement: { likes: 31, comments: 12, shares: 8 },
        aiInsights: {
          relevance: 0.98,
          actionability: 0.95,
          motivation: 0.87
        }
      },
      {
        id: '5',
        type: 'achievement',
        title: 'New Personal Best!',
        content: 'Congratulations! You\'ve achieved a new personal best in your 100m sprint time.',
        author: 'Performance Tracker',
        timestamp: Date.now() - 18000000,
        priority: 'high',
        tags: ['achievement', 'personal-best', 'sprint'],
        engagement: { likes: 45, comments: 15, shares: 12 },
        aiInsights: {
          relevance: 0.99,
          actionability: 0.45,
          motivation: 0.98
        }
      }
    ];

    // Filter and sort by AI insights
    const filteredPosts = posts
      .filter(post => post.aiInsights!.relevance > 0.7)
      .sort((a, b) => (b.aiInsights!.relevance + b.aiInsights!.actionability) - (a.aiInsights!.relevance + a.aiInsights!.actionability));

    setFeedPosts(filteredPosts);
  };

  const handlePostView = useCallback((postId: string) => {
    incrementPostView();
    
    // Update session metrics
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        postsViewed: prev.postsViewed + 1
      } : null);
    }
  }, [incrementPostView, currentSession]);

  const handleSessionAction = useCallback(async (action: any) => {
    await takeDrillAction(action);
    
    // Log successful intervention
    logIntervention('session_complete', 'user_action');
    
    // Update session
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        actionsTaken: prev.actionsTaken + 1,
        status: 'completed'
      } : null);
    }
    
    // End sessions
    if (sessionId) {
      endAnalyticsSession();
      await endDrillSession();
    }

    // Send to AI orchestration
    await sendRequest({
      type: 'session_action_completed',
      data: {
        action,
        sessionId,
        sessionType: currentSession?.type,
        userIntent
      }
    });
  }, [takeDrillAction, logIntervention, currentSession, sessionId, endAnalyticsSession, endDrillSession, sendRequest, userIntent]);

  const handleInterventionResponse = useCallback(async (response: 'accept' | 'dismiss') => {
    setShowIntervention(false);
    
    if (response === 'accept' && interventionData) {
      await handleSessionAction(interventionData.action);
    }
    
    logIntervention('intervention_response', response);
  }, [interventionData, handleSessionAction, logIntervention]);

  const sessionProgress = getDrillSessionProgress();
  const sessionCTA = getDrillSessionCTA();
  const roleInsights = { message: 'You\'re making great progress!' };
  const intentRecommendations = [
    { id: '1', title: 'Recommended Drill', description: 'Try this agility drill' }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to view your feed</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Session Progress Bar */}
      {currentDrillSession && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">
                {currentDrillSession.sessionType.description}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {postsViewed} / {currentDrillSession.maxPosts} posts
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sessionProgress.progress}%` }}
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            />
          </div>
          {sessionCTA && (
            <div className="mt-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">{sessionCTA.message}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Role Insights */}
      {roleInsights && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Insights for {user.role}</h3>
          </div>
          <p className="text-sm text-blue-800">{roleInsights.message}</p>
        </motion.div>
      )}

      {/* Intent Recommendations */}
      {intentRecommendations && intentRecommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Based on Your Intent
          </h3>
          {intentRecommendations.map((content: any) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg p-4 shadow-sm border border-green-200"
            >
              <h4 className="font-medium text-gray-900 mb-1">{content.title}</h4>
              <p className="text-sm text-gray-600">{content.description}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Feed Posts */}
      <div className="space-y-4">
        {feedPosts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow"
            onClick={() => handlePostView(post.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  post.priority === 'high' ? 'bg-red-500' :
                  post.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className="text-sm font-medium text-gray-900">{post.title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {post.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {post.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(post.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 mb-3">{post.content}</p>
            
            {post.tags && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {post.engagement && (
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {post.engagement.likes} likes
                </div>
                <div className="flex items-center gap-1">
                  <span>💬</span>
                  {post.engagement.comments} comments
                </div>
                <div className="flex items-center gap-1">
                  <span>📤</span>
                  {post.engagement.shares} shares
                </div>
              </div>
            )}
            
            {post.aiInsights && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500">AI Score:</span>
                  <div className="flex items-center gap-1">
                    <span>🎯</span>
                    <span className="text-blue-600">{Math.round(post.aiInsights.relevance * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⚡</span>
                    <span className="text-green-600">{Math.round(post.aiInsights.actionability * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🔥</span>
                    <span className="text-orange-600">{Math.round(post.aiInsights.motivation * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Intervention Modal */}
      <AnimatePresence>
        {showIntervention && interventionData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md mx-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {interventionData.title}
                </h3>
              </div>
              <p className="text-gray-600 mb-6">{interventionData.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleInterventionResponse('accept')}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {interventionData.action?.label || 'Take Action'}
                </button>
                <button
                  onClick={() => handleInterventionResponse('dismiss')}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feed; 