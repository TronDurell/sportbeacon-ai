import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ScrollIntervention {
  id: string;
  title: string;
  message: string;
  actions: Array<{
    label: string;
    aiPrompt: string;
    variant: 'primary' | 'secondary' | 'ghost';
  }>;
}

interface SmartLayerContextType {
  autopilot: boolean;
  setAutopilot: (on: boolean) => void;
  toggleAutopilot: () => void;
  // User intent state
  userIntent: string | null;
  setUserIntent: (intent: string) => void;
  hasDeclaredIntent: boolean;
  // Existing SmartLayer properties
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isAIAssistantOpen: boolean;
  toggleAIAssistant: () => void;
  // Scroll intervention state
  showScrollIntervention: boolean;
  currentIntervention: ScrollIntervention | null;
  scrollTime: number;
  triggerScrollIntervention: (intervention: ScrollIntervention, scrollTime: number) => void;
  dismissScrollIntervention: () => void;
}

const SmartLayerContext = createContext<SmartLayerContextType | undefined>(undefined);

export const SmartLayerProvider = ({ children }: { children: ReactNode }) => {
  const [autopilot, setAutopilotState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sb_autopilot');
      return stored === 'true';
    }
    return false;
  });

  const [userIntent, setUserIntentState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sb_user_intent');
    }
    return null;
  });

  // Existing SmartLayer state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  const [showScrollIntervention, setShowScrollIntervention] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState<ScrollIntervention | null>(null);
  const [scrollTime, setScrollTime] = useState(0);

  useEffect(() => {
    localStorage.setItem('sb_autopilot', String(autopilot));
  }, [autopilot]);

  useEffect(() => {
    if (userIntent) {
      localStorage.setItem('sb_user_intent', userIntent);
    }
  }, [userIntent]);

  const setAutopilot = (on: boolean) => setAutopilotState(on);
  const toggleAutopilot = () => setAutopilotState((prev) => !prev);

  const setUserIntent = (intent: string) => setUserIntentState(intent);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const toggleAIAssistant = () => setIsAIAssistantOpen((prev) => !prev);

  const triggerScrollIntervention = (intervention: ScrollIntervention, scrollTimeMs: number) => {
    setCurrentIntervention(intervention);
    setScrollTime(scrollTimeMs);
    setShowScrollIntervention(true);
  };

  const dismissScrollIntervention = () => {
    setShowScrollIntervention(false);
    setCurrentIntervention(null);
    setScrollTime(0);
  };

  return (
    <SmartLayerContext.Provider value={{ 
      autopilot, 
      setAutopilot, 
      toggleAutopilot,
      userIntent,
      setUserIntent,
      hasDeclaredIntent: !!userIntent,
      sidebarCollapsed,
      toggleSidebar,
      isAIAssistantOpen,
      toggleAIAssistant,
      showScrollIntervention,
      currentIntervention,
      scrollTime,
      triggerScrollIntervention,
      dismissScrollIntervention
    }}>
      {children}
    </SmartLayerContext.Provider>
  );
};

export const useSmartLayer = () => {
  const ctx = useContext(SmartLayerContext);
  if (!ctx) throw new Error('useSmartLayer must be used within SmartLayerProvider');
  return ctx;
}; 