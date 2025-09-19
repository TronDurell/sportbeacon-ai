import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../contexts/AdminAuthContext";
import { useSmartLayer } from "../../../contexts/SmartLayerContext";
import { useAgentOrchestration } from "../../../contexts/AgentOrchestrationContext";
import { useInsightsScan } from "../../../hooks/useInsightsScan";
import { useScrollIntentEngine } from "../../../hooks/ScrollIntentEngine";
import SmartAlert from "../../SmartAlert";
import ScrollInterventionModal from "../../ScrollInterventionModal";
import IntentTrigger from "../../IntentTrigger";
import PlayerDashboard from "./PlayerDashboard";
import CoachDashboard from "./CoachDashboard";
import ParentDashboard from "./ParentDashboard";
import AdminDashboard from "./AdminDashboard";
import { AlertCircle, Trophy } from "lucide-react";
const UnifiedDashboard = () => {
    const { user, isAuthenticated, loading } = useAuth();
    const { autopilot, showScrollIntervention, currentIntervention, scrollTime, dismissScrollIntervention, userIntent, setUserIntent, hasDeclaredIntent } = useSmartLayer();
    const { sendRequest } = useAgentOrchestration();
    const { insights, dismissInsight } = useInsightsScan(user?.role || "player", autopilot);
    // Initialize scroll intent engine
    useScrollIntentEngine();
    const handleInterventionAction = (action) => {
        sendRequest({
            type: "scroll_intervention_action",
            context: action.aiPrompt,
            data: { action, intervention: currentIntervention }
        });
    };
    const handleIntentComplete = (intent) => {
        setUserIntent(intent);
    };
    // Handle loading state
    if (loading) {
        return (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Loading your dashboard..." })] }) }));
    }
    // Handle unauthenticated state
    if (!isAuthenticated || !user) {
        return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsx("div", { className: "bg-white p-8 rounded-lg shadow-md max-w-md w-full", children: _jsxs("div", { className: "text-center", children: [_jsx(Trophy, { className: "w-16 h-16 text-blue-600 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Welcome to SportBeacon AI" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Please log in to access your personalized sports management dashboard." }), _jsx("button", { className: "w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors", children: "Login" })] }) }) }));
    }
    // Role-based dashboard rendering
    const renderRoleDashboard = () => {
        switch (user.role) {
            case "player":
                return _jsx(PlayerDashboard, {});
            case "coach":
                return _jsx(CoachDashboard, {});
            case "parent":
                return _jsx(ParentDashboard, {});
            case "admin":
                return _jsx(AdminDashboard, {});
            default:
                return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center", children: [_jsx(AlertCircle, { className: "w-16 h-16 text-yellow-500 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Role Not Configured" }), _jsxs("p", { className: "text-gray-600 mb-4", children: ["Your account role \"", user.role, "\" is not currently supported."] }), _jsx("p", { className: "text-sm text-gray-500", children: "Please contact your administrator to set up the appropriate role." })] }) }));
        }
    };
    return (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 }, className: "min-h-screen bg-gray-50", children: [_jsx(IntentTrigger, { isOpen: isAuthenticated && !hasDeclaredIntent, onComplete: handleIntentComplete }), _jsx(motion.header, { initial: { y: -20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.1 }, className: "bg-white shadow-sm border-b sticky top-0 z-40", children: _jsxs("div", { className: "flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-sm", children: "SB" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "SportBeacon AI" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("p", { className: "text-sm text-gray-500 capitalize", children: [user.role, " Dashboard"] }), userIntent && (_jsx("span", { className: "text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full", children: userIntent }))] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "hidden sm:block text-right", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900", children: [user.firstName, " ", user.lastName] }), _jsx("p", { className: "text-xs text-gray-500 capitalize", children: user.role })] }), _jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white text-sm font-medium", children: user.firstName?.charAt(0) || "U" }) })] })] }) }), _jsx("div", { className: "max-w-2xl mx-auto mt-4", children: _jsx(AnimatePresence, { children: autopilot && insights.map(alert => (_jsx(SmartAlert, { id: alert.id, title: alert.title, message: alert.message, status: alert.status, actions: alert.actions.map(a => ({
                            ...a,
                            onClick: () => {
                                if (a.aiPrompt) {
                                    sendRequest({ type: "autopilot_action", context: a.aiPrompt, data: alert });
                                }
                                if (a.label === "Dismiss" || a.variant === "ghost") {
                                    dismissInsight(alert.id);
                                }
                                if (a.label === "Remind me later") {
                                    dismissInsight(alert.id);
                                }
                            }
                        })), onDismiss: dismissInsight }, alert.id))) }) }), _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.main, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.3 }, className: "p-4 sm:p-6 lg:p-8", children: renderRoleDashboard() }, user.role) }), currentIntervention && (_jsx(ScrollInterventionModal, { isOpen: showScrollIntervention, onClose: dismissScrollIntervention, intervention: currentIntervention, onAction: handleInterventionAction, scrollTime: scrollTime }))] }));
};
export default UnifiedDashboard;
