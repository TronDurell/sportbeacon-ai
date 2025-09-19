import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SmartTile from "../../SmartTile";
import { useAgentOrchestration } from "../../../contexts/AgentOrchestrationContext";
import { Users, TrendingUp, AlertTriangle, Settings, BarChart3, DollarSign, Activity, Award, Globe } from "lucide-react";
const AdminDashboard = () => {
    const { sendRequest } = useAgentOrchestration();
    const [adminData, setAdminData] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Simulate data fetching
        const fetchAdminData = async () => {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAdminData({
                platformStats: {
                    totalUsers: 15420,
                    activeUsers: 8920,
                    totalRevenue: 125000,
                    growthRate: 23.5
                },
                systemAlerts: [
                    {
                        id: "1",
                        type: "security",
                        message: "Unusual login activity detected",
                        severity: "high",
                        timestamp: "2 hours ago"
                    },
                    {
                        id: "2",
                        type: "performance",
                        message: "Server response time increased by 15%",
                        severity: "medium",
                        timestamp: "4 hours ago"
                    },
                    {
                        id: "3",
                        type: "maintenance",
                        message: "Scheduled maintenance in 2 hours",
                        severity: "low",
                        timestamp: "6 hours ago"
                    }
                ],
                pendingActions: [
                    {
                        id: "1",
                        title: "Review suspicious user accounts",
                        description: "5 accounts flagged for review",
                        priority: "high",
                        category: "security"
                    },
                    {
                        id: "2",
                        title: "Approve new coach applications",
                        description: "12 pending coach verifications",
                        priority: "medium",
                        category: "user"
                    },
                    {
                        id: "3",
                        title: "Update payment processing",
                        description: "New Stripe integration ready",
                        priority: "medium",
                        category: "financial"
                    },
                    {
                        id: "4",
                        title: "Content moderation review",
                        description: "25 posts awaiting approval",
                        priority: "low",
                        category: "content"
                    }
                ],
                aiInsights: [
                    {
                        id: "1",
                        title: "User engagement peak times",
                        description: "Peak activity between 4-6 PM, consider targeted features",
                        impact: "high",
                        category: "user_experience"
                    },
                    {
                        id: "2",
                        title: "Revenue optimization opportunity",
                        description: "Premium features showing 40% conversion potential",
                        impact: "high",
                        category: "revenue"
                    },
                    {
                        id: "3",
                        title: "System performance trends",
                        description: "Database queries optimized, 25% faster response times",
                        impact: "medium",
                        category: "performance"
                    }
                ],
                recentActivity: [
                    {
                        id: "1",
                        action: "New user registration",
                        user: "john.doe@email.com",
                        timestamp: "5 minutes ago",
                        type: "registration"
                    },
                    {
                        id: "2",
                        action: "Payment processed",
                        user: "coach.smith@email.com",
                        timestamp: "12 minutes ago",
                        type: "payment"
                    },
                    {
                        id: "3",
                        action: "Admin login",
                        user: "admin@sportbeacon.com",
                        timestamp: "1 hour ago",
                        type: "admin"
                    }
                ],
                revenueMetrics: {
                    monthlyRevenue: 125000,
                    monthlyGrowth: 23.5,
                    topRevenueSources: [
                        { source: "Premium Subscriptions", amount: 75000, percentage: 60 },
                        { source: "Tournament Fees", amount: 35000, percentage: 28 },
                        { source: "Equipment Sales", amount: 15000, percentage: 12 }
                    ]
                },
                userMetrics: {
                    newRegistrations: 245,
                    activeSessions: 8920,
                    userSatisfaction: 4.6,
                    topUserTypes: [
                        { type: "Players", count: 8920, percentage: 58 },
                        { type: "Coaches", count: 1240, percentage: 8 },
                        { type: "Parents", count: 4260, percentage: 28 },
                        { type: "Admins", count: 1000, percentage: 6 }
                    ]
                }
            });
            setLoading(false);
        };
        fetchAdminData();
    }, []);
    const handleAIAssistance = (context) => {
        sendRequest({
            type: "admin_assistance",
            context,
            data: adminData
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
    return (_jsxs(motion.div, { variants: containerVariants, initial: "hidden", animate: "visible", className: "space-y-6", children: [_jsxs(motion.div, { variants: itemVariants, className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Admin Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Platform overview and system management" })] }), _jsxs(motion.div, { variants: itemVariants, className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Users, { className: "w-8 h-8 text-blue-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Users" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: adminData.platformStats?.totalUsers.toLocaleString() || 0 })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Activity, { className: "w-8 h-8 text-green-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Active Users" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: adminData.platformStats?.activeUsers.toLocaleString() || 0 })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(DollarSign, { className: "w-8 h-8 text-purple-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Monthly Revenue" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["$", adminData.platformStats?.totalRevenue.toLocaleString() || 0] })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TrendingUp, { className: "w-8 h-8 text-yellow-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Growth Rate" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["+", adminData.platformStats?.growthRate || 0, "%"] })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "System Alerts", icon: _jsx(AlertTriangle, { className: "w-5 h-5" }), status: adminData.systemAlerts?.some(a => a.severity === "high") ? "error" : "warning", onClickAI: () => handleAIAssistance("system_alerts"), loading: loading, children: _jsx("div", { className: "space-y-2", children: adminData.systemAlerts?.map((alert) => (_jsxs("div", { className: `p-3 rounded-lg ${alert.severity === "high" ? "bg-red-50 border border-red-200" :
                                        alert.severity === "medium" ? "bg-yellow-50 border border-yellow-200" :
                                            "bg-blue-50 border border-blue-200"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: `text-xs font-medium ${alert.severity === "high" ? "text-red-700" :
                                                        alert.severity === "medium" ? "text-yellow-700" :
                                                            "text-blue-700"}`, children: alert.type.toUpperCase() }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${alert.severity === "high" ? "bg-red-200 text-red-800" :
                                                        alert.severity === "medium" ? "bg-yellow-200 text-yellow-800" :
                                                            "bg-blue-200 text-blue-800"}`, children: alert.severity })] }), _jsx("p", { className: "text-sm text-gray-700", children: alert.message }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: alert.timestamp })] }, alert.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Pending Actions", icon: _jsx(Settings, { className: "w-5 h-5" }), status: adminData.pendingActions?.some(a => a.priority === "high") ? "warning" : "neutral", onClickAI: () => handleAIAssistance("pending_actions"), loading: loading, children: _jsx("div", { className: "space-y-2", children: adminData.pendingActions?.map((action) => (_jsxs("div", { className: "p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h4", { className: "font-medium text-gray-900 text-sm", children: action.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${action.priority === "high" ? "bg-red-100 text-red-700" :
                                                        action.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                                                            "bg-green-100 text-green-700"}`, children: action.priority })] }), _jsx("p", { className: "text-xs text-gray-600", children: action.description }), _jsx("span", { className: `text-xs px-2 py-1 rounded mt-1 inline-block ${action.category === "security" ? "bg-red-100 text-red-700" :
                                                action.category === "user" ? "bg-blue-100 text-blue-700" :
                                                    action.category === "financial" ? "bg-green-100 text-green-700" :
                                                        action.category === "content" ? "bg-purple-100 text-purple-700" :
                                                            "bg-gray-100 text-gray-700"}`, children: action.category })] }, action.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "AI Insights", icon: _jsx(Award, { className: "w-5 h-5" }), status: "success", onClickAI: () => handleAIAssistance("ai_insights"), loading: loading, children: _jsx("div", { className: "space-y-3", children: adminData.aiInsights?.map((insight) => (_jsxs("div", { className: "p-3 bg-green-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h4", { className: "font-medium text-green-900 text-sm", children: insight.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${insight.impact === "high" ? "bg-green-200 text-green-800" :
                                                        insight.impact === "medium" ? "bg-yellow-200 text-yellow-800" :
                                                            "bg-gray-200 text-gray-800"}`, children: insight.impact })] }), _jsx("p", { className: "text-xs text-green-700", children: insight.description }), _jsx("span", { className: `text-xs px-2 py-1 rounded mt-1 inline-block ${insight.category === "user_experience" ? "bg-blue-100 text-blue-700" :
                                                insight.category === "revenue" ? "bg-green-100 text-green-700" :
                                                    insight.category === "performance" ? "bg-purple-100 text-purple-700" :
                                                        "bg-gray-100 text-gray-700"}`, children: insight.category })] }, insight.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Recent Activity", icon: _jsx(BarChart3, { className: "w-5 h-5" }), status: "neutral", onClickAI: () => handleAIAssistance("recent_activity"), loading: loading, children: _jsx("div", { className: "space-y-2", children: adminData.recentActivity?.map((activity) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm text-gray-700", children: activity.action }), _jsx("p", { className: "text-xs text-gray-500", children: activity.user })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: `text-xs px-2 py-1 rounded ${activity.type === "registration" ? "bg-green-100 text-green-700" :
                                                        activity.type === "payment" ? "bg-blue-100 text-blue-700" :
                                                            activity.type === "admin" ? "bg-purple-100 text-purple-700" :
                                                                "bg-gray-100 text-gray-700"}`, children: activity.type }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: activity.timestamp })] })] }, activity.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Revenue Metrics", icon: _jsx(DollarSign, { className: "w-5 h-5" }), status: "success", onClickAI: () => handleAIAssistance("revenue_metrics"), loading: loading, children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "text-center p-3 bg-green-50 rounded-lg", children: [_jsxs("p", { className: "text-2xl font-bold text-green-900", children: ["$", adminData.revenueMetrics?.monthlyRevenue.toLocaleString() || 0] }), _jsx("p", { className: "text-sm text-green-700", children: "Monthly Revenue" }), _jsxs("p", { className: "text-xs text-green-600", children: ["+", adminData.revenueMetrics?.monthlyGrowth || 0, "% from last month"] })] }), _jsx("div", { className: "space-y-2", children: adminData.revenueMetrics?.topRevenueSources.map((source) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [_jsx("span", { className: "text-sm text-gray-700", children: source.source }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900", children: ["$", source.amount.toLocaleString()] }), _jsxs("p", { className: "text-xs text-gray-500", children: [source.percentage, "%"] })] })] }, source.source))) })] }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "User Metrics", icon: _jsx(Globe, { className: "w-5 h-5" }), status: "info", onClickAI: () => handleAIAssistance("user_metrics"), loading: loading, children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "text-center p-2 bg-blue-50 rounded", children: [_jsx("p", { className: "text-lg font-bold text-blue-900", children: adminData.userMetrics?.newRegistrations || 0 }), _jsx("p", { className: "text-xs text-blue-700", children: "New Users" })] }), _jsxs("div", { className: "text-center p-2 bg-green-50 rounded", children: [_jsxs("p", { className: "text-lg font-bold text-green-900", children: [adminData.userMetrics?.userSatisfaction || 0, "/5"] }), _jsx("p", { className: "text-xs text-green-700", children: "Satisfaction" })] })] }), _jsx("div", { className: "space-y-2", children: adminData.userMetrics?.topUserTypes.map((userType) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [_jsx("span", { className: "text-sm text-gray-700", children: userType.type }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: userType.count.toLocaleString() }), _jsxs("p", { className: "text-xs text-gray-500", children: [userType.percentage, "%"] })] })] }, userType.type))) })] }) }) })] })] }));
};
export default AdminDashboard;
