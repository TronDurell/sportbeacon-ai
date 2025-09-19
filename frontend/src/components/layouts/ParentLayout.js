import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Home, Calendar as CalendarIcon, MessageSquare, Users, FileText, CreditCard, Settings as SettingsIcon } from "lucide-react";
import BaseLayout from "./BaseLayout";
import Dashboard from "../modules/Dashboard";
import Calendar from "../modules/Calendar";
import Messages from "../modules/Messages";
import Children from "../modules/Children";
import Documents from "../modules/Documents";
import Payments from "../modules/Payments";
import Settings from "../modules/Settings";
import { useAuth } from "../../contexts/AdminAuthContext";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const ParentLayout = () => {
    const { user } = useAuth();
    const { sendRequest } = useAgentOrchestration();
    const navigationItems = [
        { name: "Dashboard", icon: Home, component: Dashboard },
        { name: "Calendar", icon: CalendarIcon, component: Calendar },
        { name: "Messages", icon: MessageSquare, component: Messages },
        { name: "Children", icon: Users, component: Children },
        { name: "Documents", icon: FileText, component: Documents },
        { name: "Payments", icon: CreditCard, component: Payments },
        { name: "Settings", icon: SettingsIcon, component: Settings }
    ];
    const [activeTab, setActiveTab] = React.useState("Dashboard");
    const handleTabChange = async (tabName) => {
        setActiveTab(tabName);
        await sendRequest({
            type: "parent_navigation",
            tab: tabName,
            userId: user?.id
        });
    };
    const ActiveComponent = navigationItems.find(item => item.name === activeTab)?.component || Dashboard;
    const sidebarContent = (_jsx("nav", { className: "space-y-2", children: navigationItems.map((item) => (_jsxs("button", { onClick: () => handleTabChange(item.name), className: `w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${activeTab === item.name
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-700 hover:bg-gray-50"}`, children: [_jsx(item.icon, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: item.name })] }, item.name))) }));
    return (_jsx(BaseLayout, { sidebarContent: sidebarContent, children: _jsx(ActiveComponent, {}) }));
};
export default ParentLayout;
