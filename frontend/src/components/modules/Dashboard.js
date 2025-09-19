import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Calendar, Target, MessageSquare, Activity, BarChart3 } from "lucide-react";
import { useAuth } from "../../contexts/AdminAuthContext";
const Dashboard = () => {
    const { user } = useAuth();
    const stats = [
        {
            label: "Upcoming Events",
            value: "5",
            change: "+2",
            icon: Calendar,
            color: "text-blue-600"
        },
        {
            label: "Performance Score",
            value: "87%",
            change: "+5%",
            icon: Target,
            color: "text-green-600"
        },
        {
            label: "Unread Messages",
            value: "3",
            change: "-1",
            icon: MessageSquare,
            color: "text-purple-600"
        },
        {
            label: "Active Sessions",
            value: "12",
            change: "+3",
            icon: Activity,
            color: "text-orange-600"
        }
    ];
    const recentActivity = [
        {
            id: "1",
            type: "practice",
            title: "Team Practice Completed",
            time: "2 hours ago",
            description: "Great session focusing on passing drills"
        },
        {
            id: "2",
            type: "game",
            title: "Game Scheduled",
            time: "1 day ago",
            description: "Next game vs Eagles on Saturday"
        },
        {
            id: "3",
            type: "message",
            title: "New Message from Coach",
            time: "2 days ago",
            description: "Updated training schedule available"
        }
    ];
    const getActivityIcon = (type) => {
        switch (type) {
            case "practice": return "⚽";
            case "game": return "🏆";
            case "message": return "💬";
            default: return "📅";
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900", children: ["Welcome back, ", user?.firstName, "!"] }), _jsx("p", { className: "text-gray-600", children: "Here's what's happening with your sports activities today." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: stats.map((stat, index) => (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: stat.label }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: stat.value })] }), _jsx(stat.icon, { className: `w-8 h-8 ${stat.color}` })] }), _jsxs("div", { className: "mt-4", children: [_jsx("span", { className: "text-sm text-green-600", children: stat.change }), _jsx("span", { className: "text-sm text-gray-500 ml-1", children: "from last week" })] })] }, index))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Recent Activity" }), _jsx("div", { className: "space-y-4", children: recentActivity.map((activity) => (_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "text-2xl", children: getActivityIcon(activity.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-medium text-gray-900", children: activity.title }), _jsx("p", { className: "text-sm text-gray-600", children: activity.description }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: activity.time })] })] }, activity.id))) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { className: "w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3", children: [_jsx(Calendar, { className: "w-5 h-5 text-blue-500" }), _jsx("span", { children: "Schedule Practice" })] }), _jsxs("button", { className: "w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3", children: [_jsx(Target, { className: "w-5 h-5 text-green-500" }), _jsx("span", { children: "View Performance" })] }), _jsxs("button", { className: "w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3", children: [_jsx(MessageSquare, { className: "w-5 h-5 text-purple-500" }), _jsx("span", { children: "Send Message" })] }), _jsxs("button", { className: "w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3", children: [_jsx(BarChart3, { className: "w-5 h-5 text-orange-500" }), _jsx("span", { children: "Generate Report" })] })] })] })] })] }));
};
export default Dashboard;
