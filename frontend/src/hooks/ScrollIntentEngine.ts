import { useState, useEffect, useCallback } from "react";
import { useSmartLayer } from "../contexts/SmartLayerContext";
import { useAgentOrchestration } from "../contexts/AgentOrchestrationContext";

interface ScrollIntervention {
  id: string;
  title: string;
  message: string;
  actions: Array<{
    label: string;
    aiPrompt: string;
    variant: "primary" | "secondary" | "ghost";
  }>;
}

const SCROLL_TIMEOUT = 90000; // 90 seconds
const STORAGE_KEY = "sb_scroll_analytics";

interface ScrollAnalytics {
  totalScrollTime: number;
  interventionsTriggered: number;
  lastIntervention: number;
  streakDays: number;
}

export const useScrollIntentEngine = () => {
  const [lastActionTime, setLastActionTime] = useState(Date.now());
  const [interventionTriggered, setInterventionTriggered] = useState(false);
  const [scrollAnalytics, setScrollAnalytics] = useState<ScrollAnalytics>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        totalScrollTime: 0,
        interventionsTriggered: 0,
        lastIntervention: 0,
        streakDays: 0
      };
    }
    return {
      totalScrollTime: 0,
      interventionsTriggered: 0,
      lastIntervention: 0,
      streakDays: 0
    };
  });

  const { autopilot } = useSmartLayer();
  const { sendRequest } = useAgentOrchestration();

  // Save analytics to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scrollAnalytics));
  }, [scrollAnalytics]);

  const generateIntervention = useCallback((): ScrollIntervention => {
    const interventions = [
      {
        id: "drill-suggestion",
        title: "Ready to Train?",
        message: "You've been browsing for a while. Time to put that knowledge into action!",
        actions: [
          {
            label: "Start a Drill",
            aiPrompt: "Suggest a drill based on my current goals and skill level",
            variant: "primary" as const
          },
          {
            label: "Find Nearby Gym",
            aiPrompt: "Find gyms or training facilities near my location",
            variant: "secondary" as const
          },
          {
            label: "What did I learn?",
            aiPrompt: "Help me reflect on what I learned from this browsing session",
            variant: "ghost" as const
          }
        ]
      },
      {
        id: "goal-reflection",
        title: "Purpose Check",
        message: "Take a moment to reflect on your sports goals and progress.",
        actions: [
          {
            label: "Review My Goals",
            aiPrompt: "Show me my current goals and progress tracking",
            variant: "primary" as const
          },
          {
            label: "Find Pickup Game",
            aiPrompt: "Find pickup games or local leagues near me",
            variant: "secondary" as const
          },
          {
            label: "Skip for Now",
            aiPrompt: "Dismiss this intervention",
            variant: "ghost" as const
          }
        ]
      },
      {
        id: "social-connection",
        title: "Connect & Grow",
        message: "Sports are better with others. Ready to connect with your community?",
        actions: [
          {
            label: "Find Teammates",
            aiPrompt: "Connect me with players in my area with similar goals",
            variant: "primary" as const
          },
          {
            label: "Join a League",
            aiPrompt: "Show me local leagues and tournaments I can join",
            variant: "secondary" as const
          },
          {
            label: "Not Now",
            aiPrompt: "Dismiss this intervention",
            variant: "ghost" as const
          }
        ]
      }
    ];

    const randomIndex = Math.floor(Math.random() * interventions.length);
    return interventions[randomIndex] || interventions[0] || {
      id: 'default',
      title: 'Stay Focused',
      message: 'Take a moment to reflect on your goals.',
      actions: []
    };
  }, []);

  const showInterventionModal = useCallback(() => {
    if (!autopilot) return;

    const intervention = generateIntervention();
    
    // Update analytics
    setScrollAnalytics(prev => ({
      ...prev,
      interventionsTriggered: prev.interventionsTriggered + 1,
      lastIntervention: Date.now()
    }));

    // Send intervention to SmartLayer
    sendRequest({
      type: "scroll_intervention",
      context: "passive_scroll_detected",
      data: {
        intervention,
        scrollTime: Date.now() - lastActionTime,
        analytics: scrollAnalytics
      }
    });

    setInterventionTriggered(true);
  }, [autopilot, generateIntervention, sendRequest, lastActionTime, scrollAnalytics]);

  const resetIntervention = useCallback(() => {
    setInterventionTriggered(false);
    setLastActionTime(Date.now());
  }, []);

  useEffect(() => {
    if (!autopilot) return;

    const handleScroll = () => {
      const timeSinceLastAction = Date.now() - lastActionTime;
      
      if (timeSinceLastAction > SCROLL_TIMEOUT && !interventionTriggered) {
        showInterventionModal();
      }
    };

    const handleInteraction = () => {
      setLastActionTime(Date.now());
      if (interventionTriggered) {
        resetIntervention();
      }
    };

    // Track scroll time
    const scrollTimer = setInterval(() => {
      if (interventionTriggered) return;
      
      setScrollAnalytics(prev => ({
        ...prev,
        totalScrollTime: prev.totalScrollTime + 1000
      }));
    }, 1000);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("mousemove", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      clearInterval(scrollTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [autopilot, lastActionTime, interventionTriggered, showInterventionModal, resetIntervention, scrollAnalytics]);

  return {
    interventionTriggered,
    resetIntervention,
    scrollAnalytics,
    showInterventionModal
  };
}; 