import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SmartTile from "../../SmartTile";
import { useAgentOrchestration } from "../../../contexts/AgentOrchestrationContext";
import { Calendar, Users, Target, TrendingUp, AlertTriangle, Trophy, Clipboard, BarChart3 } from "lucide-react";
const CoachDashboard = () => {
    const { sendRequest } = useAgentOrchestration();
    const [coachData, setCoachData] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Simulate data fetching
        const fetchCoachData = async () => {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setCoachData({
                nextSession: {
                    title: "Advanced Skills Training",
                    date: "Tomorrow, 4:00 PM",
                    players: 18,
                    focus: "Passing & Movement"
                },
                teamStats: {
                    totalPlayers: 22,
                    activePlayers: 20,
                    averageAttendance: 85,
                    teamRank: 2
                },
                pendingTasks: [
                    { id: "1", title: "Review player evaluations", dueDate: "Today", priority: "high", type: "evaluation" },
                    { id: "2", title: "Plan next week's training", dueDate: "Tomorrow", priority: "high", type: "planning" },
                    { id: "3", title: "Send parent updates", dueDate: "This week", priority: "medium", type: "communication" },
                    { id: "4", title: "Update team roster", dueDate: "Next week", priority: "low", type: "admin" }
                ],
                aiInsights: [
                    { id: "1", title: "Team chemistry improving", description: "Recent group activities showing positive results", impact: "high" },
                    { id: "2", title: "Focus on defensive positioning", description: "Analysis shows gaps in defensive coverage", impact: "medium" },
                    { id: "3", title: "Individual player development", description: "3 players ready for advanced training", impact: "medium" }
                ],
                recentEvaluations: [
                    { id: "1", playerName: "Alex Johnson", date: "2 days ago", score: 85 },
                    { id: "2", playerName: "Sarah Chen", date: "3 days ago", score: 92 },
                    { id: "3", playerName: "Mike Davis", date: "4 days ago", score: 78 }
                ],
                alerts: [
                    { id: "1", type: "attendance", message: "5 players missed last session", severity: "medium" },
                    { id: "2", type: "performance", message: "Team performance up 15% this month", severity: "low" },
                    { id: "3", type: "schedule", message: "Next game rescheduled to Saturday", severity: "high" }
                ]
            });
            setLoading(false);
        };
        fetchCoachData();
    }, []);
    const handleAIAssistance = (context) => {
        sendRequest({
            type: "coach_assistance",
            context,
            data: coachData
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
    return (_jsxs(motion.div, { variants: containerVariants, initial: "hidden", animate: "visible", className: "space-y-6", children: [_jsxs(motion.div, { variants: itemVariants, className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Coach Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Lead your team to victory with data-driven insights" })] }), _jsxs(motion.div, { variants: itemVariants, className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Users, { className: "w-8 h-8 text-blue-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Players" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: coachData.teamStats?.totalPlayers || 0 })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TrendingUp, { className: "w-8 h-8 text-green-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Active Players" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: coachData.teamStats?.activePlayers || 0 })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(BarChart3, { className: "w-8 h-8 text-purple-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Avg Attendance" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [coachData.teamStats?.averageAttendance || 0, "%"] })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Trophy, { className: "w-8 h-8 text-yellow-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Team Rank" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["#", coachData.teamStats?.teamRank || 0] })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Next Training Session", icon: _jsx(Calendar, { className: "w-5 h-5" }), status: "info", onClickAI: () => handleAIAssistance("next_session"), loading: loading, children: coachData.nextSession && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: coachData.nextSession.date }), _jsxs("span", { className: "text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded", children: [coachData.nextSession.players, " players"] })] }), _jsx("h4", { className: "font-medium text-gray-900", children: coachData.nextSession.title }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Focus: ", coachData.nextSession.focus] })] })) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Pending Tasks", icon: _jsx(Clipboard, { className: "w-5 h-5" }), status: coachData.pendingTasks?.some(t => t.priority === "high") ? "warning" : "neutral", onClickAI: () => handleAIAssistance("pending_tasks"), loading: loading, children: _jsx("div", { className: "space-y-2", children: coachData.pendingTasks?.slice(0, 3).map((task) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm text-gray-700", children: task.title }), _jsx("p", { className: "text-xs text-gray-500", children: task.dueDate })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("span", { className: `text-xs px-2 py-1 rounded ${task.priority === "high" ? "bg-red-100 text-red-700" :
                                                        task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                                                            "bg-green-100 text-green-700"}`, children: task.priority }), _jsx("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded", children: task.type })] })] }, task.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "AI Insights", icon: _jsx(Target, { className: "w-5 h-5" }), status: "success", onClickAI: () => handleAIAssistance("ai_insights"), loading: loading, children: _jsx("div", { className: "space-y-3", children: coachData.aiInsights?.slice(0, 2).map((insight) => (_jsxs("div", { className: "p-3 bg-green-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h4", { className: "font-medium text-green-900 text-sm", children: insight.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${insight.impact === "high" ? "bg-green-200 text-green-800" :
                                                        insight.impact === "medium" ? "bg-yellow-200 text-yellow-800" :
                                                            "bg-gray-200 text-gray-800"}`, children: insight.impact })] }), _jsx("p", { className: "text-xs text-green-700", children: insight.description })] }, insight.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Recent Evaluations", icon: _jsx(BarChart3, { className: "w-5 h-5" }), status: "neutral", onClickAI: () => handleAIAssistance("evaluations"), loading: loading, children: _jsx("div", { className: "space-y-2", children: coachData.recentEvaluations?.map((evaluation) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-700", children: evaluation.playerName }), _jsx("p", { className: "text-xs text-gray-500", children: evaluation.date })] }), _jsx("span", { className: `text-sm font-bold px-2 py-1 rounded ${evaluation.score >= 90 ? "bg-green-100 text-green-700" :
                                                evaluation.score >= 80 ? "bg-blue-100 text-blue-700" :
                                                    evaluation.score >= 70 ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-red-100 text-red-700"}`, children: evaluation.score })] }, evaluation.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, className: "lg:col-span-2", children: _jsx(SmartTile, { title: "Team Alerts", icon: _jsx(AlertTriangle, { className: "w-5 h-5" }), status: coachData.alerts?.some(a => a.severity === "high") ? "error" : "warning", onClickAI: () => handleAIAssistance("alerts"), loading: loading, children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: coachData.alerts?.map((alert) => (_jsxs("div", { className: `p-3 rounded-lg ${alert.severity === "high" ? "bg-red-50 border border-red-200" :
                                        alert.severity === "medium" ? "bg-yellow-50 border border-yellow-200" :
                                            "bg-blue-50 border border-blue-200"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: `text-xs font-medium ${alert.severity === "high" ? "text-red-700" :
                                                        alert.severity === "medium" ? "text-yellow-700" :
                                                            "text-blue-700"}`, children: alert.type.toUpperCase() }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${alert.severity === "high" ? "bg-red-200 text-red-800" :
                                                        alert.severity === "medium" ? "bg-yellow-200 text-yellow-800" :
                                                            "bg-blue-200 text-blue-800"}`, children: alert.severity })] }), _jsx("p", { className: "text-sm text-gray-700", children: alert.message })] }, alert.id))) }) }) })] })] }));
};
export default CoachDashboard;
