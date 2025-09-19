import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Admin Dashboard with Agent Assistant Integration
 * Demonstrates the agentic interface capabilities
 */
import { useState, useEffect } from 'react';
import { ChartBarIcon, UserGroupIcon, DocumentTextIcon, BellIcon, CogIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { AgentAssistant } from '../components/agent/AgentAssistant';
import { useAuth } from '../hooks/useAuth';
import { useAgentClient } from '../hooks/useAgentClient';
import { isFeatureEnabled } from '../featureFlags';
export function AdminDashboard() {
    const { user } = useAuth();
    const agentClient = useAgentClient();
    const [stats, setStats] = useState({
        totalPlayers: 0,
        activePlayers: 0,
        pendingSubmissions: 0,
        verifiedStats: 0,
        teamKPIs: {}
    });
    const [isLoading, setIsLoading] = useState(true);
    // Check if agent features are enabled
    const agentsEnabled = isFeatureEnabled('AGENTS_ENABLED');
    const assistantEnabled = isFeatureEnabled('ASSISTANT_ENABLED');
    // Load dashboard data
    useEffect(() => {
        loadDashboardData();
    }, [user]);
    const loadDashboardData = async () => {
        if (!user || !agentsEnabled) {
            setIsLoading(false);
            return;
        }
        try {
            // Load team KPIs
            const kpiResult = await agentClient.calculateKPI(user.teamId || '', {
                from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                to: new Date().toISOString()
            });
            // Load pending submissions
            const pendingResult = await agentClient.listPendingSubmissions(user.teamId || '');
            setStats({
                totalPlayers: 25, // Mock data
                activePlayers: 20, // Mock data
                pendingSubmissions: pendingResult.submissions?.length || 0,
                verifiedStats: 150, // Mock data
                teamKPIs: kpiResult.kpis || {}
            });
        }
        catch (error) {
            console.error('Error loading dashboard data:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleQuickAction = async (action) => {
        try {
            switch (action) {
                case 'verify-pending':
                    // Trigger verification of pending submissions
                    if (stats.pendingSubmissions > 0) {
                        // In a real implementation, this would trigger the verification agent
                        alert(`Verifying ${stats.pendingSubmissions} pending submissions...`);
                    }
                    break;
                case 'generate-report':
                    // Generate team report
                    const result = await agentClient.exportDataset({
                        teamId: user?.teamId,
                        range: {
                            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                            to: new Date().toISOString()
                        }
                    }, 'json');
                    alert(`Report generation started. Job ID: ${result.jobId}`);
                    break;
                case 'send-notification':
                    const message = prompt('Enter notification message:');
                    if (message) {
                        await agentClient.sendNotification({
                            group: `team_${user?.teamId}`
                        }, message);
                        alert('Notification sent successfully!');
                    }
                    break;
            }
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Loading dashboard..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white shadow", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center py-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Admin Dashboard" }), _jsxs("p", { className: "mt-1 text-sm text-gray-500", children: ["Welcome back, ", user?.displayName || 'Admin'] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [agentsEnabled && (_jsxs("div", { className: "flex items-center space-x-2 text-sm text-green-600", children: [_jsx(SparklesIcon, { className: "h-5 w-5" }), _jsx("span", { children: "AI Agents Active" })] })), _jsx("button", { className: "p-2 text-gray-400 hover:text-gray-600", children: _jsx(CogIcon, { className: "h-6 w-6" }) })] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx(UserGroupIcon, { className: "h-8 w-8 text-blue-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Total Players" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats.totalPlayers })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx(ChartBarIcon, { className: "h-8 w-8 text-green-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Active Players" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats.activePlayers })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx(DocumentTextIcon, { className: "h-8 w-8 text-yellow-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Pending Reviews" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats.pendingSubmissions })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx(BellIcon, { className: "h-8 w-8 text-purple-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Verified Stats" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats.verifiedStats })] })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-8", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("button", { onClick: () => handleQuickAction('verify-pending'), disabled: stats.pendingSubmissions === 0, className: "flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(DocumentTextIcon, { className: "h-5 w-5 mr-2" }), "Verify Pending (", stats.pendingSubmissions, ")"] }), _jsxs("button", { onClick: () => handleQuickAction('generate-report'), className: "flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500", children: [_jsx(ChartBarIcon, { className: "h-5 w-5 mr-2" }), "Generate Report"] }), _jsxs("button", { onClick: () => handleQuickAction('send-notification'), className: "flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500", children: [_jsx(BellIcon, { className: "h-5 w-5 mr-2" }), "Send Notification"] })] })] }), Object.keys(stats.teamKPIs).length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Team Performance KPIs" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: Object.entries(stats.teamKPIs).slice(0, 6).map(([key, value]) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 capitalize", children: key.replace(/_/g, ' ') }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: typeof value === 'object' ? value.value : value }), typeof value === 'object' && value.trend && (_jsxs("p", { className: `text-sm ${value.trend === 'up' ? 'text-green-600' :
                                                value.trend === 'down' ? 'text-red-600' :
                                                    'text-gray-600'}`, children: [value.trend === 'up' ? '↗' : value.trend === 'down' ? '↘' : '→', value.change ? ` ${value.change.toFixed(1)}%` : ''] }))] }, key))) })] })), agentsEnabled && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6 mt-8", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "AI Agent Status" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${agentClient.isConnected ? 'bg-green-500' : 'bg-red-500'}` }), _jsx("span", { className: "text-sm text-gray-600", children: "MCP Server Connection" }), _jsx("span", { className: `text-sm font-medium ${agentClient.isConnected ? 'text-green-600' : 'text-red-600'}`, children: agentClient.isConnected ? 'Connected' : 'Disconnected' })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-green-500" }), _jsx("span", { className: "text-sm text-gray-600", children: "Verification Agent" }), _jsx("span", { className: "text-sm font-medium text-green-600", children: "Active" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-green-500" }), _jsx("span", { className: "text-sm text-gray-600", children: "Reporting Agent" }), _jsx("span", { className: "text-sm font-medium text-green-600", children: "Active" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${assistantEnabled ? 'bg-green-500' : 'bg-gray-400'}` }), _jsx("span", { className: "text-sm text-gray-600", children: "AI Assistant" }), _jsx("span", { className: `text-sm font-medium ${assistantEnabled ? 'text-green-600' : 'text-gray-600'}`, children: assistantEnabled ? 'Enabled' : 'Disabled' })] })] })] }))] }), assistantEnabled && _jsx(AgentAssistant, {})] }));
}
