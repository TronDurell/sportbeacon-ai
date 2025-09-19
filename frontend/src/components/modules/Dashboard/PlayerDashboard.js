import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SmartTile from "../../SmartTile";
import { useAgentOrchestration } from "../../../contexts/AgentOrchestrationContext";
import { Calendar, Clock, CheckCircle, Trophy, Target, TrendingUp, MapPin, Star, Activity } from "lucide-react";
const PlayerDashboard = () => {
    const { sendRequest } = useAgentOrchestration();
    const [playerData, setPlayerData] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Simulate data fetching
        const fetchPlayerData = async () => {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setPlayerData({
                nextEvent: {
                    title: "Team Practice",
                    date: "Tomorrow, 3:00 PM",
                    location: "Main Field",
                    type: "practice"
                },
                pendingTasks: [
                    { id: "1", title: "Complete fitness assessment", dueDate: "Today", priority: "high" },
                    { id: "2", title: "Review game footage", dueDate: "Tomorrow", priority: "medium" },
                    { id: "3", title: "Update player profile", dueDate: "This week", priority: "low" }
                ],
                aiSuggestions: [
                    { id: "1", title: "Focus on agility drills", description: "Based on your recent performance, try these specific drills", type: "training" },
                    { id: "2", title: "Hydration reminder", description: "Increase water intake before practice sessions", type: "nutrition" },
                    { id: "3", title: "Recovery routine", description: "Implement stretching routine after training", type: "recovery" }
                ],
                recentAchievements: [
                    { id: "1", title: "Perfect Attendance", date: "2 days ago", category: "dedication" },
                    { id: "2", title: "Skill Improvement", date: "1 week ago", category: "performance" }
                ],
                stats: {
                    sessionsThisWeek: 4,
                    goalsCompleted: 8,
                    improvementScore: 85,
                    teamRank: 3
                }
            });
            setLoading(false);
        };
        fetchPlayerData();
    }, []);
    const handleAIAssistance = (context) => {
        sendRequest({
            type: "player_assistance",
            context,
            data: playerData
        });
    };
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };
    return (_jsxs(motion.div, { variants: containerVariants, initial: "hidden", animate: "visible", className: "space-y-6", children: [_jsxs(motion.div, { variants: itemVariants, className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Welcome back, Player!" }), _jsx("p", { className: "text-gray-600", children: "Ready to dominate today's training session?" })] }), _jsxs(motion.div, { variants: itemVariants, className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Activity, { className: "w-8 h-8 text-blue-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Sessions This Week" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: playerData.stats?.sessionsThisWeek || 0 })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CheckCircle, { className: "w-8 h-8 text-green-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Goals Completed" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: playerData.stats?.goalsCompleted || 0 })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TrendingUp, { className: "w-8 h-8 text-purple-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Improvement Score" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [playerData.stats?.improvementScore || 0, "%"] })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Trophy, { className: "w-8 h-8 text-yellow-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Team Rank" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["#", playerData.stats?.teamRank || 0] })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Next Event", icon: _jsx(Calendar, { className: "w-5 h-5" }), status: "info", onClickAI: () => handleAIAssistance("next_event"), loading: loading, children: playerData.nextEvent && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4 text-gray-500" }), _jsx("span", { className: "text-sm text-gray-600", children: playerData.nextEvent.date })] }), _jsx("h4", { className: "font-medium text-gray-900", children: playerData.nextEvent.title }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-500" }), _jsx("span", { className: "text-sm text-gray-600", children: playerData.nextEvent.location })] })] })) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Pending Tasks", icon: _jsx(CheckCircle, { className: "w-5 h-5" }), status: playerData.pendingTasks?.some(t => t.priority === "high") ? "warning" : "neutral", onClickAI: () => handleAIAssistance("pending_tasks"), loading: loading, children: _jsx("div", { className: "space-y-2", children: playerData.pendingTasks?.slice(0, 3).map((task) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [_jsx("span", { className: "text-sm text-gray-700", children: task.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${task.priority === "high" ? "bg-red-100 text-red-700" :
                                                task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                                                    "bg-green-100 text-green-700"}`, children: task.priority })] }, task.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "AI Suggestions", icon: _jsx(Target, { className: "w-5 h-5" }), status: "success", onClickAI: () => handleAIAssistance("ai_suggestions"), loading: loading, children: _jsx("div", { className: "space-y-3", children: playerData.aiSuggestions?.slice(0, 2).map((suggestion) => (_jsxs("div", { className: "p-3 bg-blue-50 rounded-lg", children: [_jsx("h4", { className: "font-medium text-blue-900 text-sm", children: suggestion.title }), _jsx("p", { className: "text-xs text-blue-700 mt-1", children: suggestion.description })] }, suggestion.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Recent Achievements", icon: _jsx(Star, { className: "w-5 h-5" }), status: "success", onClickAI: () => handleAIAssistance("achievements"), loading: loading, children: _jsx("div", { className: "space-y-2", children: playerData.recentAchievements?.map((achievement) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-yellow-50 rounded", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-yellow-900", children: achievement.title }), _jsx("p", { className: "text-xs text-yellow-700", children: achievement.date })] }), _jsx("span", { className: "text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded", children: achievement.category })] }, achievement.id))) }) }) })] })] }));
};
export default PlayerDashboard;
