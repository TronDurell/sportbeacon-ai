import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from "react-router-dom";
import BaseLayout from "./BaseLayout";
import { Home, Users, Trophy, Settings, BarChart3, Shield, FileText, Calendar, DollarSign, AlertTriangle } from "lucide-react";
const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigation = [
        { name: "Dashboard", href: "/admin/dashboard", icon: Home },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Leagues", href: "/admin/leagues", icon: Trophy },
        { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { name: "Reports", href: "/admin/reports", icon: FileText },
        { name: "Calendar", href: "/admin/calendar", icon: Calendar },
        { name: "Billing", href: "/admin/billing", icon: DollarSign },
        { name: "Security", href: "/admin/security", icon: Shield },
        { name: "Alerts", href: "/admin/alerts", icon: AlertTriangle },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ];
    const sidebarContent = (_jsx("nav", { className: "space-y-2", children: navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (_jsxs(Link, { to: item.href, className: `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"}`, children: [_jsx(Icon, { className: "h-5 w-5" }), _jsx("span", { className: "font-medium", children: item.name })] }, item.name));
        }) }));
    const headerContent = (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Admin Dashboard" }), _jsx("p", { className: "text-sm text-gray-600", children: "System overview and management" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-blue-600", children: "1,234" }), _jsx("p", { className: "text-xs text-gray-500", children: "Total Users" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-green-600", children: "45" }), _jsx("p", { className: "text-xs text-gray-500", children: "Active Leagues" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-purple-600", children: "156" }), _jsx("p", { className: "text-xs text-gray-500", children: "Total Teams" })] })] })] }));
    return (_jsx(BaseLayout, { sidebarContent: sidebarContent, headerContent: headerContent, children: children }));
};
export default AdminLayout;
