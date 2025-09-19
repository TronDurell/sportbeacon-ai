import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react";
const Analytics = () => {
    const stats = [
        { label: "Total Users", value: "1,234", icon: Users, change: "+12%" },
        { label: "Active Sessions", value: "456", icon: TrendingUp, change: "+8%" },
        { label: "Events This Month", value: "89", icon: Calendar, change: "+15%" },
        { label: "Engagement Rate", value: "78%", icon: BarChart3, change: "+5%" }
    ];
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Analytics Dashboard" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: stats.map((stat, index) => (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: stat.label }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: stat.value })] }), _jsx(stat.icon, { className: "w-8 h-8 text-blue-500" })] }), _jsxs("div", { className: "mt-4", children: [_jsx("span", { className: "text-sm text-green-600", children: stat.change }), _jsx("span", { className: "text-sm text-gray-500 ml-1", children: "from last month" })] })] }, index))) }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Platform Overview" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "User Growth" }), _jsx("div", { className: "h-32 bg-gray-100 rounded flex items-center justify-center", children: _jsx("span", { className: "text-gray-500", children: "Chart placeholder" }) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Engagement Metrics" }), _jsx("div", { className: "h-32 bg-gray-100 rounded flex items-center justify-center", children: _jsx("span", { className: "text-gray-500", children: "Chart placeholder" }) })] })] })] })] }));
};
export default Analytics;
