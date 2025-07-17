import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AdminAuthContext';
import { useSmartLayer } from '../../contexts/SmartLayerContext';
import { useAgentOrchestration } from '../../contexts/AgentOrchestrationContext';

interface PlaymakerSession {
  type: 'Training' | 'Learning' | 'Scouting' | 'Planning' | 'Social' | 'Review';
  maxPosts: number;
  role: string;
  startTime: number;
  lastInteraction: number;
  scrollCount: number;
  rapidScrolls: number;
}

interface CoachNudge {
  id: string;
  title: string;
  message: string;
  actions: Array<{
    label: string;
    aiPrompt: string;
    variant: 'primary' | 'secondary' | 'ghost';
  }>;
}

const ROLE_COACH_NUDGES: Record<string, CoachNudge[]> = {
  player: [
    {
      id: 'player-train',
      title: 'Time to Train?',
      message: 'You\'ve been browsing for a while. Ready to put that knowledge into action?',
      actions: [
        { label: 'Start Workout', aiPrompt: 'Suggest a drill based on my current goals', variant: 'primary' },
        { label: 'Log Progress', aiPrompt: 'Help me log my recent training progress', variant: 'secondary' },
        { label: 'Find Local Game', aiPrompt: 'Find pickup games near me', variant: 'secondary' },
        { label: 'Continue Browsing', aiPrompt: 'Dismiss this nudge', variant: 'ghost' }
      ]
    },
    {
      id: 'player-highlight',
      title: 'Log a Highlight?',
      message: 'Capture your recent achievements or insights.',
      actions: [
        { label: 'Share Highlight', aiPrompt: 'Help me create a highlight post', variant: 'primary' },
        { label: 'Review Footage', aiPrompt: 'Analyze my recent game footage', variant: 'secondary' },
        { label: 'Set Goal', aiPrompt: 'Help me set a new training goal', variant: 'secondary' },
        { label: 'Not Now', aiPrompt: 'Dismiss this nudge', variant: 'ghost' }
      ]
    }
  ],
  coach: [
    {
      id: 'coach-plan',
      title: 'Planning Session?',
      message: 'Ready to plan your next training or review team performance?',
      actions: [
        { label: 'Plan Training', aiPrompt: 'Help me plan the next team training session', variant: 'primary' },
        { label: 'Review Players', aiPrompt: 'Review recent player performance data', variant: 'secondary' },
        { label: 'Team Meeting', aiPrompt: 'Schedule a team meeting or communication', variant: 'secondary' },
        { label: 'Continue', aiPrompt: 'Dismiss this nudge', variant: 'ghost' }
      ]
    },
    {
      id: 'coach-scout',
      title: 'Scouting Mode?',
      message: 'Time to scout new talent or analyze opponents?',
      actions: [
        { label: 'Scout Players', aiPrompt: 'Find potential recruits or transfer targets', variant: 'primary' },
        { label: 'Opponent Analysis', aiPrompt: 'Analyze upcoming opponent strategies', variant: 'secondary' },
        { label: 'Team Report', aiPrompt: 'Generate team performance report', variant: 'secondary' },
        { label: 'Later', aiPrompt: 'Dismiss this nudge', variant: 'ghost' }
      ]
    }
  ],
  parent: [
    {
      id: 'parent-engage',
      title: 'Stay Engaged?',
      message: 'Connect with your child\'s sports journey and community.',
      actions: [
        { label: 'Check Schedule', aiPrompt: 'Show upcoming events and games', variant: 'primary' },
        { label: 'Connect with Coach', aiPrompt: 'Help me communicate with the coach', variant: 'secondary' },
        { label: 'Join Community', aiPrompt: 'Connect with other parents', variant: 'secondary' },
        { label: 'Continue', aiPrompt: 'Dismiss this nudge', variant: 'ghost' }
      ]
    },
    {
      id: 'parent-support',
      title: 'Support Mode?',
      message: 'Ready to support your child\'s development?',
      actions: [
        { label: 'Review Progress', aiPrompt: 'Show my child\'s recent progress', variant: 'primary' },
        { label: 'Safety Check', aiPrompt: 'Review safety guidelines and protocols', variant: 'secondary' },
        { label: 'Equipment Check', aiPrompt: 'Check if equipment needs updating', variant: 'secondary' },
        { label: 'Not Now', aiPrompt: 'Dismiss this nudge', variant: 'ghost' }
      ]
    }
  ],
  admin: [
    {
      id: 'admin-manage',
      title: 'Management Mode?',
      message: 'Time to review league operations and metrics?',
      actions: [
        { label: 'Review Metrics', aiPrompt: 'Show league performance metrics', variant: 'primary' },
        { label: 'Handle Alerts', aiPrompt: 'Review system alerts and issues', variant: 'secondary' },
        { label: 'User Management', aiPrompt: 'Review user accounts and permissions', variant: 'secondary' },
        { label: 'Continue', aiPrompt: 'Dismiss this nudge', variant: 'ghost' }
      ]
    },
    {
      id: 'admin-optimize',
      title: 'Optimization Time?',
      message: 'Ready to optimize platform performance and user experience?',
      actions: [
        { label: 'System Health', aiPrompt: 'Check system performance and health', variant: 'primary' },
        { label: 'User Analytics', aiPrompt: 'Review user engagement analytics', variant: 'secondary' },
        { label: 'Feature Planning', aiPrompt: 'Plan new features or improvements', variant: 'secondary' },
        { label: 'Later', aiPrompt: 'Dismiss this nudge', variant: 'ghost' }
      ]
    }
  ]
};

const PLAYMAKER_THRESHOLDS = {
  RAPID_SCROLL: 10, // scrolls per second
  INACTIVE_TIMEOUT: 120000, // 2 minutes
  NUDGE_INTERVAL: 120000, // 2 minutes
  MAX_RAPID_SCROLLS: 5
};

export const usePlaymakerIntentEngine = () => {
  const { user } = useAuth();
  const { autopilot, triggerScrollIntervention } = useSmartLayer();
  const { sendRequest } = useAgentOrchestration();
  
  const [playmakerSession, setPlaymakerSession] = useState<PlaymakerSession | null>(null);
  const [lastNudgeTime, setLastNudgeTime] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);
  const [rapidScrolls, setRapidScrolls] = useState(0);
  const [lastScrollTime, setLastScrollTime] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rapidScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize playmaker session from localStorage or create new
  useEffect(() => {
    if (!user) return;

    const storedSession = localStorage.getItem(`sb_playmaker_session_${user.id}`);
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      // Check if session is still valid (within 4 hours)
      if (Date.now() - parsed.startTime < 14400000) {
        setPlaymakerSession(parsed);
        setLastInteractionTime(parsed.lastInteraction);
      } else {
        // Session expired, create new one
        createNewPlaymakerSession();
      }
    } else {
      createNewPlaymakerSession();
    }
  }, [user]);

  const createNewPlaymakerSession = useCallback(() => {
    if (!user) return;

    const defaultSession: PlaymakerSession = {
      type: 'Learning',
      maxPosts: 10,
      role: user.role,
      startTime: Date.now(),
      lastInteraction: Date.now(),
      scrollCount: 0,
      rapidScrolls: 0
    };

    setPlaymakerSession(defaultSession);
    setLastInteractionTime(Date.now());
    localStorage.setItem(`sb_playmaker_session_${user.id}`, JSON.stringify(defaultSession));
  }, [user]);

  const updatePlaymakerSession = useCallback((updates: Partial<PlaymakerSession>) => {
    if (!playmakerSession) return;

    const updated = { ...playmakerSession, ...updates, lastInteraction: Date.now() };
    setPlaymakerSession(updated);
    setLastInteractionTime(Date.now());
    
    if (user) {
      localStorage.setItem(`sb_playmaker_session_${user.id}`, JSON.stringify(updated));
    }
  }, [playmakerSession, user]);

  const detectRapidScrolling = useCallback(() => {
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTime;
    
    if (timeSinceLastScroll < 1000) { // Less than 1 second between scrolls
      setRapidScrolls(prev => prev + 1);
      
      if (rapidScrolls >= PLAYMAKER_THRESHOLDS.MAX_RAPID_SCROLLS) {
        // Trigger rapid scroll intervention
        const rapidScrollNudge: CoachNudge = {
          id: 'rapid-scroll',
          title: 'Slow Down, Speed Up',
          message: 'You\'re scrolling fast! Take a moment to absorb what you\'re seeing.',
          actions: [
            { label: 'Take a Break', aiPrompt: 'Suggest a quick training break or activity', variant: 'primary' },
            { label: 'Save for Later', aiPrompt: 'Help me save interesting content for later', variant: 'secondary' },
            { label: 'Continue', aiPrompt: 'Dismiss this nudge', variant: 'ghost' }
          ]
        };
        
        triggerScrollIntervention(rapidScrollNudge, now - lastInteractionTime);
        setRapidScrolls(0);
      }
    }
    
    setLastScrollTime(now);
  }, [lastScrollTime, rapidScrolls, lastInteractionTime, triggerScrollIntervention]);

  const checkForCoachNudge = useCallback(() => {
    if (!autopilot || !user || !playmakerSession) return;

    const now = Date.now();
    const timeSinceLastNudge = now - lastNudgeTime;
    const timeSinceLastInteraction = now - lastInteractionTime;

    // Check if enough time has passed since last nudge and last interaction
    if (timeSinceLastNudge > PLAYMAKER_THRESHOLDS.NUDGE_INTERVAL && 
        timeSinceLastInteraction > PLAYMAKER_THRESHOLDS.INACTIVE_TIMEOUT) {
      
      const roleNudges = ROLE_COACH_NUDGES[user.role] || ROLE_COACH_NUDGES.player;
      const randomNudge = roleNudges[Math.floor(Math.random() * roleNudges.length)];
      
      triggerScrollIntervention(randomNudge, timeSinceLastInteraction);
      setLastNudgeTime(now);
    }
  }, [autopilot, user, playmakerSession, lastNudgeTime, lastInteractionTime, triggerScrollIntervention]);

  // Scroll monitoring
  useEffect(() => {
    if (!autopilot) return;

    const handleScroll = () => {
      setScrollCount(prev => prev + 1);
      updatePlaymakerSession({ scrollCount: scrollCount + 1 });
      detectRapidScrolling();
    };

    const handleInteraction = () => {
      setLastInteractionTime(Date.now());
      updatePlaymakerSession({ lastInteraction: Date.now() });
      setRapidScrolls(0);
    };

    // Set up periodic checks for coach nudges
    scrollTimerRef.current = setInterval(checkForCoachNudge, 30000); // Check every 30 seconds

    // Set up rapid scroll detection
    rapidScrollTimerRef.current = setInterval(() => {
      if (rapidScrolls > 0) {
        setRapidScrolls(prev => Math.max(0, prev - 1));
      }
    }, 2000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
      if (rapidScrollTimerRef.current) clearInterval(rapidScrollTimerRef.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [autopilot, scrollCount, rapidScrolls, checkForCoachNudge, updatePlaymakerSession, detectRapidScrolling]);

  const endPlaymakerSession = useCallback(() => {
    if (!playmakerSession || !user) return;

    const sessionData = {
      ...playmakerSession,
      endTime: Date.now(),
      totalDuration: Date.now() - playmakerSession.startTime,
      finalScrollCount: scrollCount,
      finalRapidScrolls: rapidScrolls
    };

    // Send session data to analytics
    sendRequest({
      type: 'playmaker_session_end',
      context: 'growth_session',
      data: sessionData
    });

    // Clear session
    localStorage.removeItem(`sb_playmaker_session_${user.id}`);
    setPlaymakerSession(null);
    setScrollCount(0);
    setRapidScrolls(0);
  }, [playmakerSession, user, scrollCount, rapidScrolls, sendRequest]);

  return {
    playmakerSession,
    updatePlaymakerSession,
    endPlaymakerSession,
    scrollCount,
    rapidScrolls,
    lastInteractionTime: Date.now() - lastInteractionTime
  };
}; 