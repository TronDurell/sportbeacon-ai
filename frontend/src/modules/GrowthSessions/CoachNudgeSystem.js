import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const CoachNudgeCard = ({ nudge, onDismiss, onAction }) => {
    const [isVisible, setIsVisible] = useState(true);
    const getNudgeIcon = (type) => {
        switch (type) {
            case "motivation":
                return "🔥";
            case "reminder":
                return "⏰";
            case "suggestion":
                return "💡";
            case "achievement":
                return "🏆";
            case "warning":
                return "⚠️";
            default:
                return "📢";
        }
    };
    const getNudgeColor = (type, priority) => {
        if (priority === "high") {
            switch (type) {
                case "motivation":
                    return "bg-gradient-to-r from-orange-500 to-red-500";
                case "achievement":
                    return "bg-gradient-to-r from-yellow-500 to-orange-500";
                case "warning":
                    return "bg-gradient-to-r from-red-500 to-pink-500";
                default:
                    return "bg-gradient-to-r from-blue-500 to-purple-500";
            }
        }
        switch (type) {
            case "motivation":
                return "bg-orange-100 border-orange-300";
            case "reminder":
                return "bg-blue-100 border-blue-300";
            case "suggestion":
                return "bg-green-100 border-green-300";
            case "achievement":
                return "bg-yellow-100 border-yellow-300";
            case "warning":
                return "bg-red-100 border-red-300";
            default:
                return "bg-gray-100 border-gray-300";
        }
    };
    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => onDismiss(nudge.id), 300);
    };
    const handleAction = (action) => {
        onAction(action);
        handleDismiss();
    };
    return (_jsx(AnimatePresence, { children: isVisible && (_jsxs(motion.div, { initial: { opacity: 0, y: 50, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -50, scale: 0.9 }, transition: { duration: 0.3, ease: "easeOut" }, className: `relative p-4 rounded-lg border-2 shadow-lg ${getNudgeColor(nudge.type, nudge.priority)}`, children: [nudge.priority === "high" && (_jsx("div", { className: "absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" })), _jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-2xl", children: getNudgeIcon(nudge.type) }), _jsx("h3", { className: "font-semibold text-gray-800", children: nudge.title })] }), _jsx("button", { onClick: handleDismiss, className: "text-gray-500 hover:text-gray-700 transition-colors", children: "\u2715" })] }), _jsx("p", { className: "text-gray-700 mb-4 leading-relaxed", children: nudge.message }), _jsx("div", { className: "flex flex-wrap gap-2", children: nudge.actions.map((action, index) => (_jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => handleAction(action), className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${action.variant === "primary"
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : action.variant === "secondary"
                                ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                : "bg-transparent text-gray-600 hover:bg-gray-100"}`, children: action.label }, index))) }), nudge.expiresAt && (_jsx("div", { className: "mt-3 pt-3 border-t border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [_jsx("span", { children: "Expires in:" }), _jsxs("span", { children: [Math.max(0, Math.ceil((nudge.expiresAt - Date.now()) / 1000)), "s"] })] }) }))] })) }));
};
export const CoachNudgeSystem = () => {
    const { sendRequest } = useAgentOrchestration();
    const [nudges, setNudges] = useState([]);
    const handleNudgeAction = (action) => {
        // Send action to AI orchestration
        sendRequest({
            type: "coach_nudge_action",
            context: action.aiPrompt,
            data: { action }
        });
    };
    const handleDismissNudge = (nudgeId) => {
        setNudges(prev => prev.filter(nudge => nudge.id !== nudgeId));
    };
    return (_jsx("div", { className: "fixed bottom-4 right-4 z-50 space-y-3 max-w-sm", children: _jsx(AnimatePresence, { children: nudges.map((nudge) => (_jsx(CoachNudgeCard, { nudge: nudge, onDismiss: handleDismissNudge, onAction: handleNudgeAction }, nudge.id))) }) }));
};
// Hook for generating coach nudges
export const useCoachNudgeGenerator = () => {
    const [nudges, setNudges] = useState([]);
    const generateMotivationalNudge = (context) => {
        const nudge = {
            id: `motivation_${Date.now()}`,
            title: "Time to Shine!",
            message: `You've been scrolling for a while. Ready to ${context}?`,
            type: "motivation",
            priority: "medium",
            actions: [
                { label: "Let's Go!", aiPrompt: `Help me ${context}`, variant: "primary" },
                { label: "Show Me How", aiPrompt: `Guide me through ${context}`, variant: "secondary" },
                { label: "Not Now", aiPrompt: "Dismiss this nudge", variant: "ghost" }
            ]
        };
        setNudges(prev => [...prev, nudge]);
    };
    const generateAchievementNudge = (achievement) => {
        const nudge = {
            id: `achievement_${Date.now()}`,
            title: "Great Job!",
            message: `You've completed: ${achievement}. Keep up the momentum!`,
            type: "achievement",
            priority: "high",
            actions: [
                { label: "Share Success", aiPrompt: "Help me share this achievement", variant: "primary" },
                { label: "Set Next Goal", aiPrompt: "Help me set my next goal", variant: "secondary" },
                { label: "Continue", aiPrompt: "Dismiss this nudge", variant: "ghost" }
            ]
        };
        setNudges(prev => [...prev, nudge]);
    };
    const generateReminderNudge = (reminder) => {
        const nudge = {
            id: `reminder_${Date.now()}`,
            title: "Friendly Reminder",
            message: reminder,
            type: "reminder",
            priority: "low",
            actions: [
                { label: "Do It Now", aiPrompt: "Help me complete this task", variant: "primary" },
                { label: "Schedule Later", aiPrompt: "Help me schedule this for later", variant: "secondary" },
                { label: "Dismiss", aiPrompt: "Dismiss this reminder", variant: "ghost" }
            ]
        };
        setNudges(prev => [...prev, nudge]);
    };
    return {
        nudges,
        generateMotivationalNudge,
        generateAchievementNudge,
        generateReminderNudge
    };
};
