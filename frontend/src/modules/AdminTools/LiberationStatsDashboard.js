import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useAuth } from "../../contexts/AdminAuthContext";
import { TrendingUp, Target, Activity, Download, Filter, Zap } from "lucide-react";
const LiberationStatsDashboard = () => {
    const { user } = useAuth();
    const [liberationStats, setLiberationStats] = useState(null);
    const [filters, setFilters] = useState({
        dateRange: "30d",
        role: "all",
        sessionType: "all"
    });
    const [isLoading, setIsLoading] = useState(true);
    // Mock data generation
    useEffect(() => {
        const generateMockStats = () => {
            const mockStats = {
                summaryMetrics: {
                    totalUsers: 1850,
                    activeUsers: 1240,
                    intentDeclarationRate: 73,
                    avgScrollSessionDuration: 18.5,
                    scrollLoopInterventions: 2847,
                    timeSaved: 1240,
                    mostEffectiveNudge: "Coach Nudge - Training",
                    clickThroughRate: 68
                },
                scrollBehavior: {
                    roleBreakdown: {
                        player: {
                            avgSessionDuration: 22.3,
                            scrollInterventions: 1240,
                            recoveryActions: 892,
                            engagementRate: 72
                        },
                        coach: {
                            avgSessionDuration: 28.7,
                            scrollInterventions: 456,
                            recoveryActions: 378,
                            engagementRate: 83
                        },
                        parent: {
                            avgSessionDuration: 15.2,
                            scrollInterventions: 892,
                            recoveryActions: 567,
                            engagementRate: 64
                        },
                        admin: {
                            avgSessionDuration: 35.1,
                            scrollInterventions: 259,
                            recoveryActions: 234,
                            engagementRate: 90
                        }
                    },
                    sessionTypes: {
                        "Training": 45,
                        "Learning": 28,
                        "Scouting": 12,
                        "Planning": 10,
                        "Social": 5
                    },
                    scrollPatterns: [
                        { pattern: "Rapid Scrolling", frequency: 1240, avgDuration: 8.5, recoveryRate: 45 },
                        { pattern: "Passive Browsing", frequency: 892, avgDuration: 15.2, recoveryRate: 68 },
                        { pattern: "Content Hunting", frequency: 567, avgDuration: 12.8, recoveryRate: 72 },
                        { pattern: "Social Scrolling", frequency: 234, avgDuration: 25.3, recoveryRate: 38 }
                    ]
                },
                interventionMetrics: {
                    totalInterventions: 2847,
                    interventionsByType: {
                        "coach_nudge": 1240,
                        "scroll_break": 892,
                        "intent_reminder": 567,
                        "achievement_celebration": 148
                    },
                    successRates: {
                        "coach_nudge": 68,
                        "scroll_break": 52,
                        "intent_reminder": 75,
                        "achievement_celebration": 88
                    },
                    responseTimes: {
                        "coach_nudge": 45,
                        "scroll_break": 120,
                        "intent_reminder": 30,
                        "achievement_celebration": 15
                    },
                    topNudges: [
                        { nudgeType: "Coach Nudge - Training", served: 456, clicked: 324, successRate: 71, avgResponseTime: 42 },
                        { nudgeType: "Scroll Break - Learning", served: 234, clicked: 156, successRate: 67, avgResponseTime: 85 },
                        { nudgeType: "Intent Reminder - Planning", served: 189, clicked: 142, successRate: 75, avgResponseTime: 28 },
                        { nudgeType: "Achievement Celebration", served: 98, clicked: 87, successRate: 89, avgResponseTime: 12 }
                    ]
                },
                engagementAnalytics: {
                    alertsClicked: [
                        { alertType: "Start Workout", clicks: 324, role: "player", timestamp: Date.now() - 86400000 },
                        { alertType: "Log Progress", clicks: 234, role: "player", timestamp: Date.now() - 172800000 },
                        { alertType: "Plan Training", clicks: 156, role: "coach", timestamp: Date.now() - 259200000 },
                        { alertType: "Check Schedule", clicks: 98, role: "parent", timestamp: Date.now() - 345600000 },
                        { alertType: "Review Metrics", clicks: 67, role: "admin", timestamp: Date.now() - 432000000 }
                    ],
                    sessionsByIntent: [
                        { intent: "train", sessions: 456, avgDuration: 22.3, actionsTaken: 324 },
                        { intent: "learn", sessions: 234, avgDuration: 18.7, actionsTaken: 189 },
                        { intent: "create", sessions: 156, avgDuration: 28.5, actionsTaken: 134 },
                        { intent: "explore", sessions: 98, avgDuration: 15.2, actionsTaken: 67 },
                        { intent: "connect", sessions: 67, avgDuration: 12.8, actionsTaken: 45 }
                    ],
                    engagementByRole: [
                        { role: "player", totalSessions: 1240, activeSessions: 892, avgEngagement: 72, topActions: ["Start Workout", "Log Progress", "Find Game"] },
                        { role: "coach", totalSessions: 456, activeSessions: 378, avgEngagement: 83, topActions: ["Plan Training", "Review Players", "Team Meeting"] },
                        { role: "parent", totalSessions: 892, activeSessions: 567, avgEngagement: 64, topActions: ["Check Schedule", "Connect Coach", "Join Community"] },
                        { role: "admin", totalSessions: 259, activeSessions: 234, avgEngagement: 90, topActions: ["Review Metrics", "Handle Alerts", "User Management"] }
                    ],
                    autopilotUsage: {
                        totalUsers: 567,
                        usageByRole: { player: 234, coach: 156, parent: 134, admin: 43 },
                        avgSessionTime: 25.3,
                        effectiveness: 78
                    }
                },
                roleInsights: [
                    {
                        role: "player",
                        strugglingUsers: 45,
                        topPerformers: 234,
                        recommendations: ["Increase training-focused nudges", "Add more achievement celebrations", "Optimize drill recommendations"],
                        trends: [
                            { metric: "Engagement Rate", value: 72, change: 8, direction: "up" },
                            { metric: "Session Duration", value: 22.3, change: -2, direction: "down" },
                            { metric: "Recovery Actions", value: 892, change: 15, direction: "up" }
                        ]
                    },
                    {
                        role: "coach",
                        strugglingUsers: 12,
                        topPerformers: 156,
                        recommendations: ["Enhance planning tools", "Improve team analytics", "Add collaboration features"],
                        trends: [
                            { metric: "Engagement Rate", value: 83, change: 12, direction: "up" },
                            { metric: "Session Duration", value: 28.7, change: 5, direction: "up" },
                            { metric: "Recovery Actions", value: 378, change: 23, direction: "up" }
                        ]
                    },
                    {
                        role: "parent",
                        strugglingUsers: 28,
                        topPerformers: 134,
                        recommendations: ["Simplify communication tools", "Add safety check reminders", "Improve community features"],
                        trends: [
                            { metric: "Engagement Rate", value: 64, change: -3, direction: "down" },
                            { metric: "Session Duration", value: 15.2, change: 1, direction: "up" },
                            { metric: "Recovery Actions", value: 567, change: 8, direction: "up" }
                        ]
                    },
                    {
                        role: "admin",
                        strugglingUsers: 3,
                        topPerformers: 43,
                        recommendations: ["Add advanced analytics", "Improve system monitoring", "Enhance user management tools"],
                        trends: [
                            { metric: "Engagement Rate", value: 90, change: 5, direction: "up" },
                            { metric: "Session Duration", value: 35.1, change: 8, direction: "up" },
                            { metric: "Recovery Actions", value: 234, change: 18, direction: "up" }
                        ]
                    }
                ],
                timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
                    interventions: Math.floor(Math.random() * 100) + 50,
                    recoveries: Math.floor(Math.random() * 60) + 30,
                    engagement: Math.floor(Math.random() * 20) + 70,
                    scrollTime: Math.floor(Math.random() * 40) + 20
                }))
            };
            setLiberationStats(mockStats);
            setIsLoading(false);
        };
        setTimeout(generateMockStats, 1000);
    }, [filters]);
    const exportLiberationData = () => {
        if (!liberationStats)
            return;
        const csvContent = [
            "Liberation Stats Summary",
            `Total Users,${liberationStats.summaryMetrics.totalUsers}`,
            `Active Users,${liberationStats.summaryMetrics.activeUsers}`,
            `Intent Declaration Rate,${liberationStats.summaryMetrics.intentDeclarationRate}%`,
            `Avg Scroll Session Duration,${liberationStats.summaryMetrics.avgScrollSessionDuration} minutes`,
            `Scroll Loop Interventions,${liberationStats.summaryMetrics.scrollLoopInterventions}`,
            `Time Saved,${liberationStats.summaryMetrics.timeSaved} minutes`,
            `Most Effective Nudge,${liberationStats.summaryMetrics.mostEffectiveNudge}`,
            `Click Through Rate,${liberationStats.summaryMetrics.clickThroughRate}%`,
            "",
            "Role Breakdown",
            "Role,Avg Session Duration,Scroll Interventions,Recovery Actions,Engagement Rate",
            ...Object.entries(liberationStats.scrollBehavior.roleBreakdown).map(([role, data]) => `${role},${data.avgSessionDuration},${data.scrollInterventions},${data.recoveryActions},${data.engagementRate}%`)
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `liberation-stats-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    if (!user || user.role !== "admin") {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("p", { className: "text-gray-500", children: "Access restricted to administrators" }) }));
    }
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Liberation Stats Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Real-time insights on user scroll behavior, SmartLayer engagement, and session interventions" })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs(Button, { variant: "outline", onClick: exportLiberationData, children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "Export Data"] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "w-5 h-5" }), "Filters"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("select", { value: filters.dateRange, onChange: (e) => setFilters(prev => ({ ...prev, dateRange: e.target.value })), className: "px-3 py-2 border border-gray-300 rounded-md", children: [_jsx("option", { value: "7d", children: "Last 7 days" }), _jsx("option", { value: "30d", children: "Last 30 days" }), _jsx("option", { value: "90d", children: "Last 90 days" }), _jsx("option", { value: "1y", children: "Last year" })] }), _jsxs("select", { value: filters.role, onChange: (e) => setFilters(prev => ({ ...prev, role: e.target.value })), className: "px-3 py-2 border border-gray-300 rounded-md", children: [_jsx("option", { value: "all", children: "All Roles" }), _jsx("option", { value: "player", children: "Players" }), _jsx("option", { value: "coach", children: "Coaches" }), _jsx("option", { value: "parent", children: "Parents" }), _jsx("option", { value: "admin", children: "Admins" })] }), _jsxs("select", { value: filters.sessionType, onChange: (e) => setFilters(prev => ({ ...prev, sessionType: e.target.value })), className: "px-3 py-2 border border-gray-300 rounded-md", children: [_jsx("option", { value: "all", children: "All Session Types" }), _jsx("option", { value: "Training", children: "Training" }), _jsx("option", { value: "Learning", children: "Learning" }), _jsx("option", { value: "Scouting", children: "Scouting" }), _jsx("option", { value: "Planning", children: "Planning" }), _jsx("option", { value: "Social", children: "Social" })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Intent Declaration Rate" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [liberationStats?.summaryMetrics.intentDeclarationRate, "%"] })] }), _jsx(Target, { className: "w-8 h-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Scroll Recovery ROI" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [liberationStats?.summaryMetrics.timeSaved, " min"] })] }), _jsx(TrendingUp, { className: "w-8 h-8 text-green-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Autopilot Behavior Map" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: liberationStats?.engagementAnalytics.autopilotUsage.totalUsers })] }), _jsx(Zap, { className: "w-8 h-8 text-purple-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Coachable Moments" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: liberationStats?.summaryMetrics.scrollLoopInterventions })] }), _jsx(Activity, { className: "w-8 h-8 text-orange-600" })] }) }) })] }), _jsxs(Tabs, { defaultValue: "summary", className: "space-y-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-5", children: [_jsx(TabsTrigger, { value: "summary", children: "Summary" }), _jsx(TabsTrigger, { value: "scroll", children: "Scroll Behavior" }), _jsx(TabsTrigger, { value: "interventions", children: "Interventions" }), _jsx(TabsTrigger, { value: "engagement", children: "Engagement" }), _jsx(TabsTrigger, { value: "insights", children: "Role Insights" })] }), _jsx(TabsContent, { value: "summary", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Intent-Driven Growth Metrics" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: liberationStats?.engagementAnalytics.sessionsByIntent.map((item) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 capitalize", children: item.intent }), _jsxs("p", { className: "text-sm text-gray-500", children: [item.sessions, " sessions"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-semibold text-gray-900", children: [item.avgDuration, "min"] }), _jsxs("p", { className: "text-sm text-gray-500", children: [item.actionsTaken, " actions"] })] })] }, item.intent))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Most Effective Nudges" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: liberationStats?.interventionMetrics.topNudges.map((nudge) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-green-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: nudge.nudgeType }), _jsxs("p", { className: "text-sm text-gray-500", children: [nudge.served, " served"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-semibold text-gray-900", children: [nudge.successRate, "%"] }), _jsxs("p", { className: "text-sm text-gray-500", children: [nudge.avgResponseTime, "s"] })] })] }, nudge.nudgeType))) }) })] })] }) }), _jsx(TabsContent, { value: "scroll", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Scroll Recovery Analytics" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold mb-4", children: "Role-Based Scroll Patterns" }), _jsx("div", { className: "space-y-3", children: Object.entries(liberationStats?.scrollBehavior.roleBreakdown || {}).map(([role, data]) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium capitalize", children: role }), _jsxs("p", { className: "text-sm text-gray-500", children: [data.avgSessionDuration, "min avg"] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-semibold", children: [data.engagementRate, "%"] }), _jsxs("p", { className: "text-sm text-gray-500", children: [data.recoveryActions, " recovered"] })] })] }, role))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold mb-4", children: "Scroll Pattern Analysis" }), _jsx("div", { className: "space-y-3", children: liberationStats?.scrollBehavior.scrollPatterns.map((pattern) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: pattern.pattern }), _jsxs("p", { className: "text-sm text-gray-500", children: [pattern.frequency, " occurrences"] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-semibold", children: [pattern.recoveryRate, "%"] }), _jsxs("p", { className: "text-sm text-gray-500", children: [pattern.avgDuration, "min avg"] })] })] }, pattern.pattern))) })] })] }) }) })] }) }), _jsx(TabsContent, { value: "interventions", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Intervention Effectiveness" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold mb-4", children: "Intervention Types" }), _jsx("div", { className: "space-y-3", children: Object.entries(liberationStats?.interventionMetrics.interventionsByType || {}).map(([type, count]) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-blue-500" }), _jsx("p", { className: "font-medium", children: type.replace("_", " ") })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold", children: count }), _jsxs("p", { className: "text-sm text-gray-500", children: [liberationStats?.interventionMetrics.successRates[type], "% success"] })] })] }, type))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold mb-4", children: "Response Times" }), _jsx("div", { className: "space-y-3", children: Object.entries(liberationStats?.interventionMetrics.responseTimes || {}).map(([type, time]) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-green-500" }), _jsx("p", { className: "font-medium", children: type.replace("_", " ") })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-semibold", children: [time, "s"] }), _jsx("p", { className: "text-sm text-gray-500", children: "avg response" })] })] }, type))) })] })] }) })] }) }), _jsx(TabsContent, { value: "engagement", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Engagement Analytics" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold mb-4", children: "Top Alert Actions" }), _jsx("div", { className: "space-y-3", children: liberationStats?.engagementAnalytics.alertsClicked.map((alert) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-purple-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: alert.alertType }), _jsx("p", { className: "text-sm text-gray-500 capitalize", children: alert.role })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold", children: alert.clicks }), _jsx("p", { className: "text-sm text-gray-500", children: "clicks" })] })] }, alert.alertType))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold mb-4", children: "Autopilot Usage by Role" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: Object.entries(liberationStats?.engagementAnalytics.autopilotUsage.usageByRole || {}).map(([role, count]) => (_jsxs("div", { className: "text-center p-4 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "font-semibold capitalize", children: role }), _jsx("p", { className: "text-2xl font-bold text-blue-600", children: count }), _jsx("p", { className: "text-sm text-gray-500", children: "users" })] }, role))) })] })] }) })] }) }), _jsx(TabsContent, { value: "insights", className: "space-y-6", children: _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: liberationStats?.roleInsights.map((insight) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 capitalize", children: [insight.role, " Insights"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Struggling Users:" }), _jsx("span", { className: "font-semibold text-red-600", children: insight.strugglingUsers })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Top Performers:" }), _jsx("span", { className: "font-semibold text-green-600", children: insight.topPerformers })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h5", { className: "font-medium text-gray-900", children: "Recommendations:" }), _jsx("ul", { className: "text-sm text-gray-600 space-y-1", children: insight.recommendations.map((rec, i) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-blue-500 mt-1", children: "\u2022" }), rec] }, i))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h5", { className: "font-medium text-gray-900", children: "Trends:" }), insight.trends.map((trend, i) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("span", { className: "text-gray-600", children: [trend.metric, ":"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-semibold", children: trend.value }), _jsxs("span", { className: `flex items-center gap-1 ${trend.direction === "up" ? "text-green-600" :
                                                                                trend.direction === "down" ? "text-red-600" : "text-gray-600"}`, children: [trend.direction === "up" ? _jsx(TrendingUp, { className: "w-3 h-3" }) :
                                                                                    trend.direction === "down" ? _jsx(TrendingUp, { className: "w-3 h-3 rotate-180" }) :
                                                                                        _jsx("span", { children: "-" }), trend.change, "%"] })] })] }, i)))] })] }) })] }, insight.role))) }) })] })] }));
};
export default LiberationStatsDashboard;
