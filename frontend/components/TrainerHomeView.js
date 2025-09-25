import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Grid, Card, Typography, IconButton, List, TextField, CircularProgress, useTheme, useMediaQuery, Drawer, AppBar, Toolbar, Menu, MenuItem } from '@mui/material';
import { Mic as MicIcon, Send as SendIcon, Menu as MenuIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { PlayerCard } from './PlayerCard';
import { InsightCard } from './InsightCard';
import { CommunityCard } from './CommunityCard';
import { AIAssistantPanel } from './AIAssistantPanel';
import { PlayerDetailsModal } from './PlayerDetailsModal';
import { DrillSuggestionPanel } from './DrillSuggestionPanel';
import { trainerAPI } from '../services/api';
export const TrainerHomeView = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();
    const { socket } = useWebSocket('ws://localhost:3000');
    const queryClient = useQueryClient();
    // State
    const [voiceRecording, setVoiceRecording] = useState(false);
    const [question, setQuestion] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showDrillSuggestions, setShowDrillSuggestions] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('all');
    // Queries
    const { data: roster, isLoading: rosterLoading } = useQuery({
        queryKey: ['trainer', 'roster'],
        queryFn: () => trainerAPI.getRoster()
    });
    const { data: drillHistory, isLoading: historyLoading } = useQuery({
        queryKey: ['player', selectedPlayer?.id, 'drills'],
        queryFn: () => selectedPlayer ? trainerAPI.getPlayerDrillHistory(selectedPlayer.id) : Promise.resolve([]),
        enabled: !!selectedPlayer
    });
    const { data: insights, isLoading: insightsLoading } = useQuery({
        queryKey: ['trainer', 'insights'],
        queryFn: () => trainerAPI.getInsights()
    });
    const { data: feed, isLoading: feedLoading } = useQuery({
        queryKey: ['community', 'feed'],
        queryFn: () => trainerAPI.getFeed()
    });
    // Calculate feedback stats
    const feedbackStats = drillHistory?.reduce((stats, drill) => {
        if (drill.feedback) {
            stats.totalFeedback++;
            stats.averageEnjoyment += drill.feedback.enjoyment;
            stats.averageDifficulty += drill.feedback.difficulty;
            if (drill.feedback.challenges?.length) {
                stats.totalChallenges += drill.feedback.challenges.length;
            }
        }
        return stats;
    }, {
        totalFeedback: 0,
        averageEnjoyment: 0,
        averageDifficulty: 0,
        totalChallenges: 0
    });
    if (feedbackStats?.totalFeedback) {
        feedbackStats.averageEnjoyment /= feedbackStats.totalFeedback;
        feedbackStats.averageDifficulty /= feedbackStats.totalFeedback;
    }
    // Mutations
    const askAssistant = useMutation({
        mutationFn: (question) => trainerAPI.sendAssistantMessage(question)
    });
    const assignDrill = useMutation({
        mutationFn: async ({ playerId, drill }) => {
            await trainerAPI.assignDrill(playerId, drill.id);
            queryClient.invalidateQueries(['player', playerId, 'drills']);
        }
    });
    // Handlers
    const handleVoiceQuestion = useCallback(async () => {
        setVoiceRecording(true);
        try {
            // Implementation for voice recording and transcription
        }
        catch (error) {
            console.error('Voice recording failed:', error);
        }
        finally {
            setVoiceRecording(false);
        }
    }, []);
    const handleQuestionSubmit = useCallback(async () => {
        if (!question.trim())
            return;
        await askAssistant.mutateAsync(question);
        setQuestion('');
    }, [question, askAssistant]);
    const handlePlayerSelect = useCallback(async (player) => {
        setSelectedPlayer(player);
        setShowDrillSuggestions(false);
        if (isMobile) {
            setMobileDrawerOpen(false);
        }
    }, [isMobile]);
    const handleAssignDrill = useCallback(async (drill) => {
        if (!selectedPlayer)
            return;
        await assignDrill.mutateAsync({
            playerId: selectedPlayer.id,
            drill
        });
        setShowDrillSuggestions(false);
    }, [selectedPlayer, assignDrill]);
    const handleFilterClick = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };
    const handleFilterClose = (filter) => {
        if (filter) {
            setSelectedFilter(filter);
        }
        setFilterAnchorEl(null);
    };
    const handleViewPlayerDetails = useCallback((player) => {
        handlePlayerSelect(player);
    }, [handlePlayerSelect]);
    // Real-time updates
    useEffect(() => {
        if (!socket)
            return;
        socket?.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'player_update') {
                    queryClient.invalidateQueries(['trainer', 'roster']);
                }
                else if (data.type === 'new_insight') {
                    queryClient.invalidateQueries(['trainer', 'insights']);
                }
                else if (data.type === 'feed_update') {
                    queryClient.invalidateQueries(['community', 'feed']);
                }
            }
            catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
        return () => {
            socket?.removeEventListener('message', () => { });
        };
    }, [socket, queryClient]);
    if (rosterLoading || insightsLoading || feedLoading) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", children: _jsx(CircularProgress, {}) }));
    }
    const mainContent = (_jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Grid, { container: true, spacing: { xs: 1, sm: 2, md: 3 }, children: [_jsxs(Grid, { item: true, xs: 12, md: 8, children: [_jsxs(Card, { sx: { p: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 2
                                        }, children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "Active Roster" }), _jsxs(Box, { children: [_jsx(IconButton, { onClick: handleFilterClick, children: _jsx(FilterIcon, {}) }), _jsxs(Menu, { anchorEl: filterAnchorEl, open: Boolean(filterAnchorEl), onClose: () => handleFilterClose(), children: [_jsx(MenuItem, { onClick: () => handleFilterClose('all'), children: "All Players" }), _jsx(MenuItem, { onClick: () => handleFilterClose('active'), children: "Active Today" }), _jsx(MenuItem, { onClick: () => handleFilterClose('pending'), children: "Pending Drills" })] })] })] }), _jsx(Grid, { container: true, spacing: { xs: 1, sm: 2 }, children: roster?.players.map((player) => (_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(PlayerCard, { player: player, onViewDetails: () => handleViewPlayerDetails(player) }) }, player.id))) })] }), _jsx(Card, { sx: { p: { xs: 1, sm: 2 } }, children: showDrillSuggestions && selectedPlayer ? (_jsx(DrillSuggestionPanel, { playerId: selectedPlayer.id, onAssignDrill: handleAssignDrill })) : (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "Priority Insights" }), _jsx(List, { children: insights?.map((insight) => (_jsx(InsightCard, { insight: {
                                                    ...insight,
                                                    metric: typeof insight.metric === 'number' ? insight.metric : 0,
                                                    timestamp: typeof insight.timestamp === 'string' ? insight.timestamp : new Date().toISOString()
                                                }, onAction: () => trainerAPI.acknowledgeInsight(insight.id), compact: isMobile }, insight.id))) })] })) })] }), _jsxs(Grid, { item: true, xs: 12, md: 4, sx: {
                            display: { xs: mobileDrawerOpen ? 'block' : 'none', md: 'block' }
                        }, children: [_jsxs(Card, { sx: { p: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2, md: 3 } }, children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "AI Assistant" }), _jsx(Box, { sx: { mb: 2 }, children: _jsx(TextField, { fullWidth: true, value: question, onChange: (e) => setQuestion(e.target.value), placeholder: "Ask a coaching question...", variant: "outlined", size: "small", InputProps: {
                                                endAdornment: (_jsxs(_Fragment, { children: [_jsx(IconButton, { onClick: handleVoiceQuestion, disabled: voiceRecording, children: _jsx(MicIcon, {}) }), _jsx(IconButton, { onClick: handleQuestionSubmit, disabled: !question.trim(), children: _jsx(SendIcon, {}) })] }))
                                            } }) }), _jsx(AIAssistantPanel, { responses: askAssistant.data ? [{
                                                ...askAssistant.data,
                                                role: askAssistant.data.role === 'user' ? 'trainer' : 'ai'
                                            }] : [], isLoading: askAssistant.isLoading, onSendMessage: handleAskAssistant, onStartRecording: () => { }, onStopRecording: () => { }, isRecording: false, compact: isMobile })] }), _jsxs(Card, { sx: { p: { xs: 1, sm: 2 } }, children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "Community Updates" }), _jsx(List, { children: feed?.items.map((item) => (_jsx(CommunityCard, { item: {
                                                ...item,
                                                timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date(item.timestamp).toISOString()
                                            }, onInteract: (type) => trainerAPI.interactWithPost(item.id, type), compact: isMobile }, item.id))) })] })] })] }), selectedPlayer && drillHistory && (_jsx(PlayerDetailsModal, { open: !!selectedPlayer, onClose: () => setSelectedPlayer(null), player: selectedPlayer, drillHistory: drillHistory, isMobile: isMobile }))] }));
    return (_jsxs(_Fragment, { children: [isMobile && (_jsx(AppBar, { position: "fixed", color: "default", children: _jsxs(Toolbar, { children: [_jsx(IconButton, { edge: "start", color: "inherit", onClick: () => setMobileDrawerOpen(!mobileDrawerOpen), children: _jsx(MenuIcon, {}) }), _jsx(Typography, { variant: "h6", sx: { flexGrow: 1 }, children: "Trainer Dashboard" })] }) })), isMobile ? (_jsxs(_Fragment, { children: [_jsx(Toolbar, {}), " ", _jsx(Drawer, { anchor: "right", open: mobileDrawerOpen, onClose: () => setMobileDrawerOpen(false), sx: {
                            '& .MuiDrawer-paper': {
                                width: '80%',
                                maxWidth: 360
                            }
                        }, children: mainContent }), _jsx(Box, { sx: { pb: 7 }, children: mainContent })] })) : (mainContent)] }));
};
export default TrainerHomeView;
