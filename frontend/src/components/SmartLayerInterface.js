import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useSmartLayer } from "../contexts/SmartLayerContext";
import { useAuth } from "../contexts/AdminAuthContext";
import { useAgentOrchestration } from "../contexts/AgentOrchestrationContext";
import { Users, Trophy, Settings, MessageSquare, Calendar, BarChart3, Shield, Bot, X } from "lucide-react";
const SmartLayerInterface = ({ className = "" }) => {
    const { user } = useAuth();
    const { isAIAssistantOpen, toggleAIAssistant } = useSmartLayer();
    const { startAgent } = useAgentOrchestration();
    const [activeTab, setActiveTab] = useState("dashboard");
    // Role-based tab configuration
    const getTabsForRole = (role) => {
        switch (role) {
            case "player":
                return [
                    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                    { id: "schedule", label: "Schedule", icon: Calendar },
                    { id: "messages", label: "Messages", icon: MessageSquare },
                    { id: "achievements", label: "Achievements", icon: Trophy }
                ];
            case "coach":
                return [
                    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                    { id: "teams", label: "Teams", icon: Users },
                    { id: "schedule", label: "Schedule", icon: Calendar },
                    { id: "messages", label: "Messages", icon: MessageSquare },
                    { id: "analytics", label: "Analytics", icon: BarChart3 }
                ];
            case "parent":
                return [
                    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                    { id: "children", label: "Children", icon: Users },
                    { id: "schedule", label: "Schedule", icon: Calendar },
                    { id: "messages", label: "Messages", icon: MessageSquare },
                    { id: "payments", label: "Payments", icon: Shield }
                ];
            case "admin":
                return [
                    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                    { id: "users", label: "Users", icon: Users },
                    { id: "leagues", label: "Leagues", icon: Trophy },
                    { id: "settings", label: "Settings", icon: Settings },
                    { id: "analytics", label: "Analytics", icon: BarChart3 }
                ];
            default:
                return [
                    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                    { id: "schedule", label: "Schedule", icon: Calendar },
                    { id: "messages", label: "Messages", icon: MessageSquare }
                ];
        }
    };
    const tabs = getTabsForRole(user?.role || "player");
    const renderTabContent = (tabId) => {
        switch (tabId) {
            case "dashboard":
                return (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(BarChart3, { className: "h-5 w-5" }), "Welcome, ", user?.firstName || "User", "!"] }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-gray-600", children: "This is your personalized dashboard. Here you can view your stats, upcoming events, and recent activity." }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-blue-500" }), _jsx("span", { className: "text-sm font-medium", children: "Upcoming Events" })] }), _jsx("p", { className: "text-2xl font-bold mt-2", children: "3" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "h-4 w-4 text-green-500" }), _jsx("span", { className: "text-sm font-medium", children: "Unread Messages" })] }), _jsx("p", { className: "text-2xl font-bold mt-2", children: "5" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Trophy, { className: "h-4 w-4 text-yellow-500" }), _jsx("span", { className: "text-sm font-medium", children: "Achievements" })] }), _jsx("p", { className: "text-2xl font-bold mt-2", children: "12" })] }) })] })] }));
            case "schedule":
                return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-5 w-5" }), "Schedule"] }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-gray-600", children: "View and manage your upcoming games, practices, and events." }) })] }));
            case "messages":
                return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "h-5 w-5" }), "Messages"] }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-gray-600", children: "Communicate with coaches, teammates, and parents." }) })] }));
            default:
                return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: tabId.charAt(0).toUpperCase() + tabId.slice(1) }) }), _jsx(CardContent, { children: _jsxs("p", { className: "text-gray-600", children: ["Content for ", tabId, " tab is coming soon."] }) })] }));
        }
    };
    return (_jsxs("div", { className: `min-h-screen bg-gray-50 ${className}`, children: [_jsx("header", { className: "bg-white shadow-sm border-b", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsx("div", { className: "flex items-center", children: _jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "SportBeacon AI" }) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { onClick: toggleAIAssistant, variant: "outline", className: "flex items-center gap-2", children: [_jsx(Bot, { className: "h-4 w-4" }), "AI Assistant"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white text-sm font-medium", children: user?.firstName?.charAt(0) || "U" }) }), _jsxs("span", { className: "text-sm font-medium text-gray-700", children: [user?.firstName, " ", user?.lastName] })] })] })] }) }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsx("div", { className: "flex gap-8", children: _jsx("div", { className: "flex-1", children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsx(TabsList, { className: "grid w-full grid-cols-5", children: tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (_jsxs(TabsTrigger, { value: tab.id, className: "flex items-center gap-2", children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: tab.label })] }, tab.id));
                                    }) }), tabs.map((tab) => (_jsx(TabsContent, { value: tab.id, className: "mt-6", children: renderTabContent(tab.id) }, tab.id)))] }) }) }) }), _jsx(AnimatePresence, { children: isAIAssistantOpen && (_jsx(motion.div, { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" }, transition: { type: "spring", damping: 25, stiffness: 200 }, className: "fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l z-50", children: _jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bot, { className: "h-5 w-5 text-blue-500" }), _jsx("h2", { className: "text-lg font-semibold", children: "AI Assistant" })] }), _jsx(Button, { onClick: toggleAIAssistant, variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "flex-1 p-4 overflow-y-auto", children: _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm", children: "How can I help you today?" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { variant: "outline", className: "w-full justify-start", onClick: () => startAgent("scheduler"), children: "Schedule a game or practice" }), _jsx(Button, { variant: "outline", className: "w-full justify-start", onClick: () => startAgent("notifier"), children: "Send team notifications" }), _jsx(Button, { variant: "outline", className: "w-full justify-start", onClick: () => startAgent("analyzer"), children: "Analyze team performance" })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm", children: "Recent Activity" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2 text-sm text-gray-600", children: [_jsx("p", { children: "\u2022 Scheduled practice for tomorrow" }), _jsx("p", { children: "\u2022 Sent reminder to team" }), _jsx("p", { children: "\u2022 Updated player stats" })] }) })] })] }) })] }) })) })] }));
};
export default SmartLayerInterface;
