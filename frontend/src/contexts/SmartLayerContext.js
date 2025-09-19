import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from "react";
const SmartLayerContext = createContext(undefined);
export const SmartLayerProvider = ({ children }) => {
    const [autopilot, setAutopilotState] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("sb_autopilot");
            return stored === "true";
        }
        return false;
    });
    const [userIntent, setUserIntentState] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("sb_user_intent");
        }
        return null;
    });
    // Existing SmartLayer state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
    const [showScrollIntervention, setShowScrollIntervention] = useState(false);
    const [currentIntervention, setCurrentIntervention] = useState(null);
    const [scrollTime, setScrollTime] = useState(0);
    useEffect(() => {
        localStorage.setItem("sb_autopilot", String(autopilot));
    }, [autopilot]);
    useEffect(() => {
        if (userIntent) {
            localStorage.setItem("sb_user_intent", userIntent);
        }
    }, [userIntent]);
    const setAutopilot = (on) => setAutopilotState(on);
    const toggleAutopilot = () => setAutopilotState((prev) => !prev);
    const setUserIntent = (intent) => setUserIntentState(intent);
    const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
    const toggleAIAssistant = () => setIsAIAssistantOpen((prev) => !prev);
    const triggerScrollIntervention = (intervention, scrollTimeMs) => {
        setCurrentIntervention(intervention);
        setScrollTime(scrollTimeMs);
        setShowScrollIntervention(true);
    };
    const dismissScrollIntervention = () => {
        setShowScrollIntervention(false);
        setCurrentIntervention(null);
        setScrollTime(0);
    };
    return (_jsx(SmartLayerContext.Provider, { value: {
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
        }, children: children }));
};
export const useSmartLayer = () => {
    const ctx = useContext(SmartLayerContext);
    if (!ctx)
        throw new Error("useSmartLayer must be used within SmartLayerProvider");
    return ctx;
};
