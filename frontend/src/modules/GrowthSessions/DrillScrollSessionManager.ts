import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AdminAuthContext";
import { useSmartLayer } from "../../contexts/SmartLayerContext";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";

interface DrillSession {
  type: "Training" | "Learning" | "Scouting" | "Planning" | "Social" | "Review";
  maxPosts: number;
  role: string;
  description: string;
  ctaOptions: Array<{
    label: string;
    aiPrompt: string;
    variant: "primary" | "secondary" | "ghost";
  }>;
}

const DRILL_SESSION_TYPES: Record<string, DrillSession[]> = {
  player: [
    {
      type: "Training",
      maxPosts: 5,
      role: "player",
      description: "Focus on drills and skill development",
      ctaOptions: [
        { label: "Start Workout", aiPrompt: "Suggest a drill based on my goals", variant: "primary" },
        { label: "Log Progress", aiPrompt: "Help me log my training progress", variant: "secondary" },
        { label: "Find Game", aiPrompt: "Find pickup games near me", variant: "secondary" }
      ]
    },
    {
      type: "Learning",
      maxPosts: 8,
      role: "player",
      description: "Study techniques and strategies",
      ctaOptions: [
        { label: "Practice Skill", aiPrompt: "Suggest practice drills for what I learned", variant: "primary" },
        { label: "Save Notes", aiPrompt: "Help me save key insights", variant: "secondary" },
        { label: "Ask Coach", aiPrompt: "Help me ask my coach about this", variant: "secondary" }
      ]
    },
    {
      type: "Review",
      maxPosts: 6,
      role: "player",
      description: "Review highlights and performance",
      ctaOptions: [
        { label: "Share Highlight", aiPrompt: "Help me create a highlight post", variant: "primary" },
        { label: "Analyze Footage", aiPrompt: "Analyze my recent performance", variant: "secondary" },
        { label: "Set Goal", aiPrompt: "Help me set improvement goals", variant: "secondary" }
      ]
    }
  ],
  coach: [
    {
      type: "Planning",
      maxPosts: 6,
      role: "coach",
      description: "Plan training sessions and strategies",
      ctaOptions: [
        { label: "Create Plan", aiPrompt: "Help me create a training plan", variant: "primary" },
        { label: "Review Team", aiPrompt: "Review team performance data", variant: "secondary" },
        { label: "Schedule Meeting", aiPrompt: "Help me schedule team communication", variant: "secondary" }
      ]
    },
    {
      type: "Scouting",
      maxPosts: 8,
      role: "coach",
      description: "Scout players and analyze opponents",
      ctaOptions: [
        { label: "Scout Players", aiPrompt: "Find potential recruits", variant: "primary" },
        { label: "Analyze Opponent", aiPrompt: "Analyze upcoming opponent", variant: "secondary" },
        { label: "Generate Report", aiPrompt: "Create scouting report", variant: "secondary" }
      ]
    }
  ],
  parent: [
    {
      type: "Social",
      maxPosts: 7,
      role: "parent",
      description: "Connect with community and stay informed",
      ctaOptions: [
        { label: "Check Schedule", aiPrompt: "Show upcoming events", variant: "primary" },
        { label: "Connect Coach", aiPrompt: "Help me contact the coach", variant: "secondary" },
        { label: "Join Community", aiPrompt: "Connect with other parents", variant: "secondary" }
      ]
    },
    {
      type: "Review",
      maxPosts: 5,
      role: "parent",
      description: "Review child's progress and safety",
      ctaOptions: [
        { label: "Review Progress", aiPrompt: "Show my child's progress", variant: "primary" },
        { label: "Safety Check", aiPrompt: "Review safety guidelines", variant: "secondary" },
        { label: "Equipment Check", aiPrompt: "Check equipment needs", variant: "secondary" }
      ]
    }
  ],
  admin: [
    {
      type: "Planning",
      maxPosts: 6,
      role: "admin",
      description: "Manage league operations and metrics",
      ctaOptions: [
        { label: "Review Metrics", aiPrompt: "Show league performance metrics", variant: "primary" },
        { label: "Handle Alerts", aiPrompt: "Review system alerts", variant: "secondary" },
        { label: "User Management", aiPrompt: "Review user accounts", variant: "secondary" }
      ]
    },
    {
      type: "Review",
      maxPosts: 8,
      role: "admin",
      description: "Review system health and analytics",
      ctaOptions: [
        { label: "System Health", aiPrompt: "Check system performance", variant: "primary" },
        { label: "User Analytics", aiPrompt: "Review engagement data", variant: "secondary" },
        { label: "Feature Planning", aiPrompt: "Plan new features", variant: "secondary" }
      ]
    }
  ]
};

interface DrillSessionData {
  id: string;
  sessionType: DrillSession;
  startTime: number;
  endTime?: number;
  postsViewed: number;
  maxPosts: number;
  actionsTaken: string[];
  completed: boolean;
}

export const useDrillScrollSessionManager = () => {
  const { user } = useAuth();
  const { userIntent } = useSmartLayer();
  const { sendRequest } = useAgentOrchestration();
  
  const [currentDrillSession, setCurrentDrillSession] = useState<DrillSessionData | null>(null);
  const [postsViewed, setPostsViewed] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Initialize drill session based on user role and intent
  useEffect(() => {
    if (!user) return;

    const roleSessions = DRILL_SESSION_TYPES[user.role] || DRILL_SESSION_TYPES.player;
    let selectedSession: DrillSession | null;

    // Select session type based on user intent
    if (userIntent) {
      switch (userIntent) {
        case "train":
          selectedSession = roleSessions?.find(s => s.type === "Training") || roleSessions?.[0] || null;
          break;
        case "learn":
          selectedSession = roleSessions?.find(s => s.type === "Learning") || roleSessions?.[0] || null;
          break;
        case "create":
          selectedSession = roleSessions?.find(s => s.type === "Planning") || roleSessions?.[0] || null;
          break;
        case "explore":
          selectedSession = roleSessions?.find(s => s.type === "Social") || roleSessions?.[0] || null;
          break;
        default:
          selectedSession = roleSessions?.[0] || null;
      }
    } else {
      selectedSession = roleSessions?.[0] || null;
    }

    // Guard against null selectedSession
    if (!selectedSession) {
      console.warn('No drill session available for user intent:', userIntent);
      return;
    }

    const newDrillSession: DrillSessionData = {
      id: `drill_session_${Date.now()}`,
      sessionType: selectedSession,
      startTime: Date.now(),
      postsViewed: 0,
      maxPosts: selectedSession.maxPosts,
      actionsTaken: [],
      completed: false
    };

    setCurrentDrillSession(newDrillSession);
    setPostsViewed(0);
    setSessionCompleted(false);
  }, [user, userIntent]);

  const incrementPostView = useCallback(() => {
    if (!currentDrillSession) return;

    const newCount = postsViewed + 1;
    setPostsViewed(newCount);

    // Check if session should end
    if (newCount >= currentDrillSession.maxPosts && !sessionCompleted) {
      setSessionCompleted(true);
      endDrillSession();
    }
  }, [currentDrillSession, postsViewed, sessionCompleted]);

  const endDrillSession = useCallback(() => {
    if (!currentDrillSession || !user) return;

    const completedSession = {
      ...currentDrillSession,
      endTime: Date.now(),
      postsViewed,
      completed: true
    };

    // Store session data to Firestore (mock for now)
    sendRequest({
      type: "drill_session_complete",
      context: "growth_session",
      data: {
        session: completedSession,
        user: user.id,
        role: user.role,
        intent: userIntent
      }
    });

    setCurrentDrillSession(completedSession);
  }, [currentDrillSession, user, postsViewed, userIntent, sendRequest]);

  const takeDrillAction = useCallback((action: { label: string; aiPrompt: string }) => {
    if (!currentDrillSession) return;

    // Add action to session
    setCurrentDrillSession(prev => prev ? {
      ...prev,
      actionsTaken: [...prev.actionsTaken, action.label]
    } : null);

    // Send action to AI
    sendRequest({
      type: "drill_session_action",
      context: action.aiPrompt,
      data: {
        action,
        session: currentDrillSession,
        user: user?.id
      }
    });
  }, [currentDrillSession, user, sendRequest]);

  const getDrillSessionProgress = useCallback(() => {
    if (!currentDrillSession) return { progress: 0, remaining: 0 };
    
    const progress = (postsViewed / currentDrillSession.maxPosts) * 100;
    const remaining = Math.max(0, currentDrillSession.maxPosts - postsViewed);
    
    return { progress, remaining };
  }, [currentDrillSession, postsViewed]);

  const getDrillSessionCTA = useCallback(() => {
    if (!currentDrillSession || !sessionCompleted) return null;
    
    return {
      title: `Drill Session Complete: ${currentDrillSession.sessionType.description}`,
      message: `You've viewed ${postsViewed} posts. Ready to take action?`,
      options: currentDrillSession.sessionType.ctaOptions
    };
  }, [currentDrillSession, sessionCompleted, postsViewed]);

  return {
    currentDrillSession,
    postsViewed,
    sessionCompleted,
    incrementPostView,
    takeDrillAction,
    getDrillSessionProgress,
    getDrillSessionCTA,
    endDrillSession
  };
}; 