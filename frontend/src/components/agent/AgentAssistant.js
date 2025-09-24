import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Coach's Agent Assistant Component
 * Provides AI-powered assistance for coaches and administrators
 */
import { useState, useCallback, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, UserGroupIcon, ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useAgentClient } from '../../hooks/useAgentClient';
import { useAuth } from '../../hooks/useAuth';
import { isFeatureEnabled } from '../../featureFlags';
export function AgentAssistant() {
    const { user } = useAuth();
    const agentClient = useAgentClient();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    // Check if assistant is enabled
    const assistantEnabled = isFeatureEnabled('ASSISTANT_ENABLED');
    // Initialize with welcome message
    useEffect(() => {
        if (assistantEnabled && messages.length === 0) {
            setMessages([{
                    id: 'welcome',
                    type: 'assistant',
                    content: `Hello ${user?.displayName || 'Coach'}! I'm your SportBeacon AI Assistant. I can help you with player statistics, team reports, and performance analysis. What would you like to know?`,
                    timestamp: new Date(),
                    actions: [
                        {
                            label: 'Show Team Stats',
                            action: () => handleSuggestedAction('team-stats'),
                            icon: ChartBarIcon
                        },
                        {
                            label: 'Generate Report',
                            action: () => handleSuggestedAction('generate-report'),
                            icon: DocumentArrowDownIcon
                        }
                    ]
                }]);
        }
    }, [assistantEnabled, user, messages.length]);
    // Suggested actions based on context
    const suggestedActions = [
        {
            id: 'team-stats',
            label: 'Team Performance',
            description: 'View current team statistics and trends',
            icon: ChartBarIcon,
            category: 'stats',
            action: async () => {
                try {
                    const result = await agentClient.calculateKPI(user?.teamId || '', {
                        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        to: new Date().toISOString()
                    });
                    addMessage('assistant', `Here are your team's performance metrics for the last week:`, {
                        kpis: result.kpis,
                        type: 'kpi-data'
                    });
                }
                catch (error) {
                    addMessage('assistant', `Sorry, I couldn't retrieve team statistics. ${error instanceof Error ? error.message : 'Please try again.'}`);
                }
            }
        },
        {
            id: 'pending-submissions',
            label: 'Pending Reviews',
            description: 'Check submissions that need verification',
            icon: ClockIcon,
            category: 'stats',
            action: async () => {
                try {
                    const result = await agentClient.listPendingSubmissions(user?.teamId || '');
                    if (result.submissions.length === 0) {
                        addMessage('assistant', 'Great! No pending submissions to review. All stats are up to date.');
                    }
                    else {
                        addMessage('assistant', `Found ${result.submissions.length} pending submissions that need review:`, {
                            submissions: result.submissions,
                            type: 'pending-submissions'
                        });
                    }
                }
                catch (error) {
                    addMessage('assistant', `Sorry, I couldn't retrieve pending submissions. ${error instanceof Error ? error.message : 'Please try again.'}`);
                }
            }
        },
        {
            id: 'generate-report',
            label: 'Weekly Report',
            description: 'Generate comprehensive team performance report',
            icon: DocumentArrowDownIcon,
            category: 'reports',
            action: async () => {
                try {
                    const result = await agentClient.exportDataset({
                        teamId: user?.teamId,
                        range: {
                            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                            to: new Date().toISOString()
                        }
                    }, 'json');
                    addMessage('assistant', `Weekly report generated successfully! You can download it from the link below.`, {
                        jobId: result.jobId,
                        statusUrl: result.statusUrl,
                        type: 'export-result'
                    });
                }
                catch (error) {
                    addMessage('assistant', `Sorry, I couldn't generate the report. ${error instanceof Error ? error.message : 'Please try again.'}`);
                }
            }
        },
        {
            id: 'team-notifications',
            label: 'Send Update',
            description: 'Send notification to team members',
            icon: UserGroupIcon,
            category: 'notifications',
            action: async () => {
                const message = prompt('Enter your message for the team:');
                if (message) {
                    try {
                        await agentClient.sendNotification({
                            group: `team_${user?.teamId}`
                        }, message);
                        addMessage('assistant', `Notification sent successfully to all team members!`);
                    }
                    catch (error) {
                        addMessage('assistant', `Sorry, I couldn't send the notification. ${error instanceof Error ? error.message : 'Please try again.'}`);
                    }
                }
            }
        }
    ];
    const addMessage = useCallback((type, content, data, actions) => {
        const message = {
            id: Date.now().toString(),
            type,
            content,
            timestamp: new Date(),
            data,
            actions
        };
        setMessages(prev => [...prev, message]);
    }, []);
    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim() || agentClient.isLoading)
            return;
        const userMessage = inputValue.trim();
        setInputValue('');
        addMessage('user', userMessage);
        setIsTyping(true);
        try {
            // Simple keyword-based responses for now
            // In a real implementation, this would use an LLM
            let response = '';
            const responseData = null;
            let responseActions = undefined;
            if (userMessage.toLowerCase().includes('stats') || userMessage.toLowerCase().includes('performance')) {
                response = 'I can help you with team statistics and performance metrics. Here are some options:';
                responseActions = [
                    {
                        label: 'View Team Stats',
                        action: () => handleSuggestedAction('team-stats'),
                        icon: ChartBarIcon
                    },
                    {
                        label: 'Check Pending Reviews',
                        action: () => handleSuggestedAction('pending-submissions'),
                        icon: ClockIcon
                    }
                ];
            }
            else if (userMessage.toLowerCase().includes('report')) {
                response = 'I can generate various reports for your team. Here are the available options:';
                responseActions = [
                    {
                        label: 'Generate Weekly Report',
                        action: () => handleSuggestedAction('generate-report'),
                        icon: DocumentArrowDownIcon
                    }
                ];
            }
            else if (userMessage.toLowerCase().includes('notification') || userMessage.toLowerCase().includes('message')) {
                response = 'I can help you send notifications to your team members.';
                responseActions = [
                    {
                        label: 'Send Team Update',
                        action: () => handleSuggestedAction('team-notifications'),
                        icon: UserGroupIcon
                    }
                ];
            }
            else {
                response = 'I understand you\'re looking for help. Here are some things I can assist you with:';
                responseActions = suggestedActions.slice(0, 3).map(action => ({
                    label: action.label,
                    action: () => handleSuggestedAction(action.id),
                    icon: action.icon
                }));
            }
            addMessage('assistant', response, responseData, responseActions);
        }
        catch (error) {
            addMessage('assistant', `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Please try again.'}`);
        }
        finally {
            setIsTyping(false);
        }
    }, [inputValue, agentClient.isLoading, addMessage, suggestedActions]);
    const handleSuggestedAction = useCallback(async (actionId) => {
        const action = suggestedActions.find(a => a.id === actionId);
        if (action) {
            try {
                await action.action();
            }
            catch (error) {
                addMessage('assistant', `Sorry, I couldn't complete that action. ${error instanceof Error ? error.message : 'Please try again.'}`);
            }
        }
    }, [suggestedActions, addMessage]);
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);
    // Don't render if assistant is not enabled
    if (!assistantEnabled) {
        return null;
    }
    return (_jsxs("div", { className: `fixed bottom-4 right-4 z-50 transition-all duration-300 ${isExpanded ? 'w-96 h-[600px]' : 'w-16 h-16'}`, children: [isExpanded && (_jsxs("div", { className: "bg-white rounded-lg shadow-xl border border-gray-200 h-full flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(SparklesIcon, { className: "h-6 w-6 text-blue-600" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "AI Assistant" })] }), _jsx("button", { onClick: () => setIsExpanded(false), className: "text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.map((message) => (_jsx("div", { className: `flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : message.type === 'system'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-900'}`, children: [_jsx("p", { className: "text-sm", children: message.content }), message.data && (_jsxs("div", { className: "mt-2", children: [message.data.type === 'kpi-data' && (_jsxs("div", { className: "bg-white bg-opacity-20 rounded p-2", children: [_jsx("h4", { className: "font-semibold mb-1", children: "Team KPIs" }), _jsx("div", { className: "text-xs space-y-1", children: Object.entries(message.data.kpis).slice(0, 3).map(([key, value]) => (_jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { children: [key.replace(/_/g, ' '), ":"] }), _jsx("span", { children: typeof value === 'object' ? value.value : value })] }, key))) })] })), message.data.type === 'pending-submissions' && (_jsxs("div", { className: "bg-white bg-opacity-20 rounded p-2", children: [_jsx("h4", { className: "font-semibold mb-1", children: "Pending Submissions" }), _jsx("div", { className: "text-xs", children: message.data.submissions.map((sub, index) => (_jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { children: ["Player ", sub.playerId.slice(-4), ":"] }), _jsxs("span", { children: [sub.stats.length, " stats"] })] }, index))) })] }))] })), message.actions && message.actions.length > 0 && (_jsx("div", { className: "mt-2 space-y-1", children: message.actions.map((action, index) => (_jsxs("button", { onClick: action.action, className: "w-full text-left px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1", children: [action.icon && _jsx(action.icon, { className: "h-3 w-3" }), _jsx("span", { children: action.label })] }, index))) }))] }) }, message.id))), isTyping && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-gray-100 text-gray-900 px-4 py-2 rounded-lg", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) }) }))] }), _jsx("div", { className: "p-4 border-t border-gray-200", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyPress: handleKeyPress, placeholder: "Ask me anything about your team...", className: "flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", disabled: agentClient.isLoading }), _jsx("button", { onClick: handleSendMessage, disabled: !inputValue.trim() || agentClient.isLoading, className: "px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed", children: "Send" })] }) })] })), !isExpanded && (_jsx("button", { onClick: () => setIsExpanded(true), className: "w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center", children: _jsx(ChatBubbleLeftRightIcon, { className: "h-8 w-8" }) })), isExpanded && (_jsx("div", { className: "absolute top-2 right-2", children: agentClient.isConnected ? (_jsx(CheckCircleIcon, { className: "h-4 w-4 text-green-500", title: "Connected" })) : (_jsx(ExclamationTriangleIcon, { className: "h-4 w-4 text-yellow-500", title: "Disconnected" })) }))] }));
}
