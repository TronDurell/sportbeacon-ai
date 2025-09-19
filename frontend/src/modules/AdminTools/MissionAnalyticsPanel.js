import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useAuth } from "../../contexts/AdminAuthContext";
import { TrendingUp, Target, Activity, Download, Filter } from "lucide-react";
const MissionAnalyticsPanel = () => {
    const { user } = useAuth();
    const [missionData, setMissionData] = useState(null);
    const [filters, setFilters] = useState({
        dateRange: "30d",
        role: "all",
        intent: "all"
    });
    const [isLoading, setIsLoading] = useState(true);
    // Mock data generation
    useEffect(() => {
        const generateMockData = () => {
            const mockData = {
                intentTriggers: [
                    { intent: "train", count: 245, percentage: 35, role: "player", timestamp: Date.now() - 86400000 },
                    { intent: "learn", count: 180, percentage: 26, role: "player", timestamp: Date.now() - 172800000 },
                    { intent: "create", count: 120, percentage: 17, role: "coach", timestamp: Date.now() - 259200000 },
                    { intent: "explore", count: 95, percentage: 14, role: "parent", timestamp: Date.now() - 345600000 },
                    { intent: "connect", count: 55, percentage: 8, role: "admin", timestamp: Date.now() - 432000000 }
                ],
                scrollInterventions: [
                    { type: "coach_nudge", count: 320, successRate: 68, averageResponseTime: 45, role: "player" },
                    { type: "scroll_break", count: 180, successRate: 52, averageResponseTime: 120, role: "coach" },
                    { type: "intent_reminder", count: 95, successRate: 75, averageResponseTime: 30, role: "parent" },
                    { type: "achievement_celebration", count: 45, successRate: 88, averageResponseTime: 15, role: "admin" }
                ],
                aiActions: [
                    { action: "drill_started", count: 156, completionRate: 82, averageTime: 25, role: "player" },
                    { action: "progress_logged", count: 98, completionRate: 91, averageTime: 12, role: "player" },
                    { action: "goal_set", count: 67, completionRate: 78, averageTime: 18, role: "coach" },
                    { action: "community_engaged", count: 43, completionRate: 65, averageTime: 35, role: "parent" },
                    { action: "coach_contacted", count: 28, completionRate: 72, averageTime: 22, role: "admin" }
                ],
                roleBreakdown: [
                    { role: "player", totalUsers: 1250, activeUsers: 890, engagementRate: 71, averageSessionTime: 18 },
                    { role: "coach", totalUsers: 180, activeUsers: 145, engagementRate: 81, averageSessionTime: 25 },
                    { role: "parent", totalUsers: 320, activeUsers: 210, engagementRate: 66, averageSessionTime: 12 },
                    { role: "admin", totalUsers: 45, activeUsers: 42, engagementRate: 93, averageSessionTime: 30 }
                ],
                timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
                    interventions: Math.floor(Math.random() * 50) + 20,
                    actions: Math.floor(Math.random() * 30) + 10,
                    engagement: Math.floor(Math.random() * 30) + 60
                }))
            };
            setMissionData(mockData);
            setIsLoading(false);
        };
        // Simulate API call delay
        setTimeout(generateMockData, 1000);
    }, [filters]);
    const exportData = () => {
        if (!missionData)
            return;
        const csvContent = [
            "Intent Triggers,Count,Percentage,Role",
            ...missionData.intentTriggers.map(item => `${item.intent},${item.count},${item.percentage},${item.role}`),
            "",
            "Scroll Interventions,Count,Success Rate,Avg Response Time,Role",
            ...missionData.scrollInterventions.map(item => `${item.type},${item.count},${item.successRate},${item.averageResponseTime},${item.role}`)
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mission-analytics-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    if (!user || user.role !== "admin") {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("p", { className: "text-gray-500", children: "Access restricted to administrators" }) }));
    }
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Mission Analytics Panel" }), _jsx("p", { className: "text-gray-600", children: "Track user intent triggers, scroll interventions, and AI-driven actions" })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs(Button, { variant: "outline", onClick: exportData, children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "Export Data"] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "w-5 h-5" }), "Filters"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("select", { value: filters.dateRange, onChange: (e) => setFilters(prev => ({ ...prev, dateRange: e.target.value })), className: "px-3 py-2 border border-gray-300 rounded-md", children: [_jsx("option", { value: "7d", children: "Last 7 days" }), _jsx("option", { value: "30d", children: "Last 30 days" }), _jsx("option", { value: "90d", children: "Last 90 days" }), _jsx("option", { value: "1y", children: "Last year" })] }), _jsxs("select", { value: filters.role, onChange: (e) => setFilters(prev => ({ ...prev, role: e.target.value })), className: "px-3 py-2 border border-gray-300 rounded-md", children: [_jsx("option", { value: "all", children: "All Roles" }), _jsx("option", { value: "player", children: "Players" }), _jsx("option", { value: "coach", children: "Coaches" }), _jsx("option", { value: "parent", children: "Parents" }), _jsx("option", { value: "admin", children: "Admins" })] }), _jsxs("select", { value: filters.intent, onChange: (e) => setFilters(prev => ({ ...prev, intent: e.target.value })), className: "px-3 py-2 border border-gray-300 rounded-md", children: [_jsx("option", { value: "all", children: "All Intents" }), _jsx("option", { value: "train", children: "Train" }), _jsx("option", { value: "learn", children: "Learn" }), _jsx("option", { value: "create", children: "Create" }), _jsx("option", { value: "explore", children: "Explore" }), _jsx("option", { value: "connect", children: "Connect" })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Intent Triggers" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: missionData?.intentTriggers.reduce((sum, item) => sum + item.count, 0) })] }), _jsx(Target, { className: "w-8 h-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Scroll Interventions" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: missionData?.scrollInterventions.reduce((sum, item) => sum + item.count, 0) })] }), _jsx(Activity, { className: "w-8 h-8 text-green-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "AI Actions Taken" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: missionData?.aiActions.reduce((sum, item) => sum + item.count, 0) })] }), _jsx(TrendingUp, { className: "w-8 h-8 text-purple-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Avg Engagement Rate" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [missionData?.roleBreakdown ?
                                                        Math.round(missionData.roleBreakdown.reduce((sum, item) => sum + item.engagementRate, 0) / missionData.roleBreakdown.length) : 0, "%"] })] }), _jsx(TrendingUp, { className: "w-8 h-8 text-orange-600" })] }) }) })] }), _jsxs(Tabs, { defaultValue: "intents", className: "space-y-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "intents", children: "Intent Triggers" }), _jsx(TabsTrigger, { value: "interventions", children: "Scroll Interventions" }), _jsx(TabsTrigger, { value: "actions", children: "AI Actions" }), _jsx(TabsTrigger, { value: "roles", children: "Role Breakdown" })] }), _jsx(TabsContent, { value: "intents", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Intent Trigger Distribution" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: missionData?.intentTriggers.map((item) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 capitalize", children: item.intent }), _jsx("p", { className: "text-sm text-gray-500", children: item.role })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold text-gray-900", children: item.count }), _jsxs("p", { className: "text-sm text-gray-500", children: [item.percentage, "%"] })] })] }, item.intent))) }) })] }) }), _jsx(TabsContent, { value: "interventions", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Scroll Intervention Effectiveness" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: missionData?.scrollInterventions.map((item) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-green-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: item.type.replace("_", " ") }), _jsx("p", { className: "text-sm text-gray-500", children: item.role })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold text-gray-900", children: item.count }), _jsxs("p", { className: "text-sm text-gray-500", children: [item.successRate, "% success"] }), _jsxs("p", { className: "text-xs text-gray-400", children: [item.averageResponseTime, "s avg"] })] })] }, item.type))) }) })] }) }), _jsx(TabsContent, { value: "actions", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "AI Action Completion Rates" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: missionData?.aiActions.map((item) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-purple-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: item.action.replace("_", " ") }), _jsx("p", { className: "text-sm text-gray-500", children: item.role })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold text-gray-900", children: item.count }), _jsxs("p", { className: "text-sm text-gray-500", children: [item.completionRate, "% completed"] }), _jsxs("p", { className: "text-xs text-gray-400", children: [item.averageTime, "s avg"] })] })] }, item.action))) }) })] }) }), _jsx(TabsContent, { value: "roles", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Role-Based Engagement" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: missionData?.roleBreakdown.map((item) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-orange-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 capitalize", children: item.role }), _jsxs("p", { className: "text-sm text-gray-500", children: [item.activeUsers, "/", item.totalUsers, " active"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-semibold text-gray-900", children: [item.engagementRate, "%"] }), _jsxs("p", { className: "text-sm text-gray-500", children: [item.averageSessionTime, "min avg"] })] })] }, item.role))) }) })] }) })] })] }));
};
export default MissionAnalyticsPanel;
