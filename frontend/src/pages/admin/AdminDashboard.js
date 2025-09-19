import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AdminAuthContext";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const AdminDashboard = ({ className = "" }) => {
    const { user } = useAuth();
    const { getSystemHealth } = useAgentOrchestration();
    const [systemHealth, setSystemHealth] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        loadSystemHealth();
    }, []);
    const loadSystemHealth = async () => {
        setLoading(true);
        try {
            const health = await getSystemHealth();
            setSystemHealth(health);
        }
        catch (error) {
        }
        finally {
            setLoading(false);
        }
    };
    const stats = [
        {
            title: "Total Users",
            value: "1,234",
            change: "+12%",
            changeType: "positive"
        },
        {
            title: "Active Leagues",
            value: "45",
            change: "+5%",
            changeType: "positive"
        },
        {
            title: "Total Teams",
            value: "156",
            change: "+8%",
            changeType: "positive"
        },
        {
            title: "System Status",
            value: systemHealth?.status || "Loading...",
            change: "",
            changeType: "neutral"
        }
    ];
    const recentActivities = [
        {
            id: "1",
            type: "user_registration",
            message: "New user registered: John Doe",
            timestamp: new Date(Date.now() - 3600000)
        },
        {
            id: "2",
            type: "league_created",
            message: "New league created: Spring Soccer League",
            timestamp: new Date(Date.now() - 7200000)
        },
        {
            id: "3",
            type: "game_scheduled",
            message: "Game scheduled: Team Alpha vs Team Beta",
            timestamp: new Date(Date.now() - 10800000)
        }
    ];
    const formatTimestamp = (date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (minutes < 60) {
            return `${minutes} minutes ago`;
        }
        else if (hours < 24) {
            return `${hours} hours ago`;
        }
        else {
            return `${days} days ago`;
        }
    };
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-sm border ${className}`, children: [_jsxs("div", { className: "p-6 border-b", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Admin Dashboard" }), _jsxs("p", { className: "text-gray-600 mt-1", children: ["Welcome back, ", user?.firstName, " ", user?.lastName] })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: stats.map((stat, index) => (_jsx("div", { className: "bg-gray-50 p-6 rounded-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: stat.title }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: stat.value })] }), stat.change && (_jsx("span", { className: `text-sm font-medium ${stat.changeType === "positive" ? "text-green-600" :
                                            stat.changeType === "negative" ? "text-red-600" :
                                                "text-gray-600"}`, children: stat.change }))] }) }, index))) }), _jsxs("div", { className: "bg-gray-50 p-6 rounded-lg", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "System Health" }), loading ? (_jsx("p", { className: "text-gray-600", children: "Loading system health..." })) : systemHealth ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium text-gray-600", children: "Status:" }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${systemHealth.status === "healthy" ? "bg-green-100 text-green-800" :
                                                    systemHealth.status === "warning" ? "bg-yellow-100 text-yellow-800" :
                                                        "bg-red-100 text-red-800"}`, children: systemHealth.status })] }), systemHealth.agents && (_jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-gray-600", children: "Active Agents:" }), _jsx("div", { className: "mt-2 space-y-1", children: systemHealth.agents.map((agent, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }), _jsx("span", { className: "text-sm text-gray-700", children: agent })] }, index))) })] }))] })) : (_jsx("p", { className: "text-gray-600", children: "Unable to load system health" }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Recent Activity" }), _jsx("div", { className: "space-y-3", children: recentActivities.map((activity) => (_jsxs("div", { className: "flex items-center gap-3 p-3 border border-gray-200 rounded-lg", children: [_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm text-gray-900", children: activity.message }), _jsx("p", { className: "text-xs text-gray-500", children: formatTimestamp(activity.timestamp) })] })] }, activity.id))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("button", { className: "p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left", children: [_jsx("h4", { className: "font-medium text-gray-900", children: "Create League" }), _jsx("p", { className: "text-sm text-gray-600", children: "Set up a new sports league" })] }), _jsxs("button", { className: "p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left", children: [_jsx("h4", { className: "font-medium text-gray-900", children: "Manage Users" }), _jsx("p", { className: "text-sm text-gray-600", children: "View and manage user accounts" })] }), _jsxs("button", { className: "p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left", children: [_jsx("h4", { className: "font-medium text-gray-900", children: "System Settings" }), _jsx("p", { className: "text-sm text-gray-600", children: "Configure system preferences" })] })] })] })] })] }));
};
export default AdminDashboard;
