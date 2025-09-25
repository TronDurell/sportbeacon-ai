import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { TrainerAPI } from '../services/trainerAPI';
import { PlayerCard } from '../components/PlayerCard';
import { InsightCard } from '../components/InsightCard';
import { AIAssistantPanel } from '../components/AIAssistantPanel';
import { CommunityCard } from '../components/CommunityCard';
import { PlayerDetailsModal } from '../components/PlayerDetailsModal';
export const TrainerView = ({ trainerId }) => {
    const [players, setPlayers] = useState([]);
    const [insights, setInsights] = useState([]);
    const [feedItems, setFeedItems] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const socket = useWebSocket('ws://localhost:3000');
    const trainerAPI = new TrainerAPI();
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const rosterData = await trainerAPI.getRoster(trainerId);
                setPlayers(rosterData.players || []);
            }
            catch (error) {
                console.error('Failed to load roster:', error);
            }
        };
        loadInitialData();
    }, [trainerId]);
    useEffect(() => {
        const loadAssistantHistory = async () => {
            try {
                const history = await trainerAPI.getAssistantHistory();
                setMessages(history || []);
            }
            catch (error) {
                console.error('Failed to load assistant history:', error);
            }
        };
        loadAssistantHistory();
    }, []);
    useEffect(() => {
        if (socket.isConnected) {
            const unsubscribePlayer = socket.subscribe('player_update', (data) => {
                setPlayers(prev => prev.map(p => p.id === data.id ? data : p));
            });
            const unsubscribeInsight = socket.subscribe('new_insight', (data) => {
                setInsights(prev => [data, ...prev]);
            });
            const unsubscribeFeed = socket.subscribe('feed_update', (data) => {
                setFeedItems(prev => [data, ...prev]);
            });
            return () => {
                unsubscribePlayer();
                unsubscribeInsight();
                unsubscribeFeed();
            };
        }
    }, [socket.isConnected]);
    const handlePlayerSelect = async (player) => {
        try {
            setSelectedPlayer(player);
            setIsModalOpen(true);
        }
        catch (error) {
            console.error('Failed to load player details:', error);
        }
    };
    const handleInsightAction = async (insightId) => {
        try {
            await trainerAPI.acknowledgeInsight(insightId);
            setInsights(prev => prev.filter(i => i.id !== insightId));
        }
        catch (error) {
            console.error('Failed to acknowledge insight:', error);
        }
    };
    const handleFeedInteraction = async (itemId, type) => {
        try {
            const updatedItem = await trainerAPI.interactWithPost(itemId, type);
            setFeedItems(prev => prev.map(f => f.id === itemId ? {
                ...f,
                stats: {
                    ...f.stats,
                    [type + 's']: f.stats[type + 's'] + 1
                },
                userInteraction: {
                    ...f.userInteraction,
                    [type]: true
                }
            } : f));
        }
        catch (error) {
            console.error('Failed to interact with post:', error);
        }
    };
    const handleAskAssistant = async (question) => {
        try {
            const response = await trainerAPI.askAssistant(question);
            setMessages(prev => [...prev, response]);
        }
        catch (error) {
            console.error('Failed to ask assistant:', error);
        }
    };
    return (_jsxs("div", { className: "trainer-view", children: [_jsx("div", { className: "header", children: _jsx("h1", { children: "Trainer Dashboard" }) }), _jsxs("div", { className: "content", children: [_jsxs("div", { className: "players-section", children: [_jsx("h2", { children: "Roster" }), _jsx("div", { className: "players-grid", children: players.map(player => (_jsx(PlayerCard, { player: player, onViewDetails: () => handlePlayerSelect(player) }, player.id))) })] }), _jsxs("div", { className: "insights-section", children: [_jsx("h2", { children: "AI Insights" }), _jsx("div", { className: "insights-grid", children: insights.map(insight => (_jsx(InsightCard, { insight: {
                                        ...insight,
                                        metric: typeof insight.metric === 'number' ? insight.metric : 0,
                                        timestamp: typeof insight.timestamp === 'string' ? insight.timestamp : new Date().toISOString()
                                    }, onAction: () => handleInsightAction(insight.id) }, insight.id))) })] }), _jsxs("div", { className: "assistant-section", children: [_jsx("h2", { children: "AI Assistant" }), _jsx(AIAssistantPanel, { responses: messages.map(msg => ({
                                    ...msg,
                                    role: msg.role === 'user' ? 'trainer' : 'ai'
                                })), isLoading: false, onSendMessage: handleAskAssistant, onStartRecording: () => { }, onStopRecording: () => { }, isRecording: false })] }), _jsxs("div", { className: "community-section", children: [_jsx("h2", { children: "Community Feed" }), _jsx("div", { className: "feed-grid", children: feedItems.map(item => (_jsx(CommunityCard, { item: {
                                        ...item,
                                        timestamp: typeof item.timestamp === 'string' ? item.timestamp : item.timestamp.toISOString()
                                    }, onInteract: (type) => handleFeedInteraction(item.id, type) }, item.id))) })] })] }), selectedPlayer && (_jsx(PlayerDetailsModal, { open: isModalOpen, onClose: () => setIsModalOpen(false), player: selectedPlayer, drillHistory: [] }))] }));
};
