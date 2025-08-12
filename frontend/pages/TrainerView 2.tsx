import React, { useEffect, useState, useCallback } from 'react';
import { 
    Container, 
    Grid, 
    Typography, 
    Box, 
    Paper, 
    CircularProgress, 
    Alert, 
    Snackbar,
    Button
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { PlayerCard } from '@/components/PlayerCard';
import { InsightCard } from '@/components/InsightCard';
import { CommunityCard } from '@/components/CommunityCard';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { trainerAPI } from '@/services/api';
import type { Player, Insight, FeedItem, Message } from '@/types';

interface LoadingState {
    players: boolean;
    insights: boolean;
    feed: boolean;
    assistant: boolean;
}

interface ErrorState {
    players?: string;
    insights?: string;
    feed?: string;
    assistant?: string;
}

export const TrainerView = () => {
    const { user } = useAuth();
    const socket = useWebSocket('ws://localhost:3000');

    // State
    const [isRecording, setIsRecording] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState<LoadingState>({
        players: true,
        insights: true,
        feed: true,
        assistant: true
    });
    const [errors, setErrors] = useState<ErrorState>({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const });

    // Data fetching
    const fetchData = useCallback(async () => {
        try {
            setLoading(prev => ({ ...prev, players: true }));
            const rosterData = await trainerAPI.getRoster();
            setPlayers(rosterData);
            setErrors(prev => ({ ...prev, players: undefined }));
        } catch (error) {
            setErrors(prev => ({ 
                ...prev, 
                players: error instanceof Error ? error.message : 'Failed to load roster' 
            }));
        } finally {
            setLoading(prev => ({ ...prev, players: false }));
        }

        try {
            setLoading(prev => ({ ...prev, insights: true }));
            const insightsData = await trainerAPI.getInsights();
            setInsights(insightsData);
            setErrors(prev => ({ ...prev, insights: undefined }));
        } catch (error) {
            setErrors(prev => ({ 
                ...prev, 
                insights: error instanceof Error ? error.message : 'Failed to load insights' 
            }));
        } finally {
            setLoading(prev => ({ ...prev, insights: false }));
        }

        try {
            setLoading(prev => ({ ...prev, feed: true }));
            const feedData = await trainerAPI.getFeed();
            setFeed(feedData.items);
            setErrors(prev => ({ ...prev, feed: undefined }));
        } catch (error) {
            setErrors(prev => ({ 
                ...prev, 
                feed: error instanceof Error ? error.message : 'Failed to load feed' 
            }));
        } finally {
            setLoading(prev => ({ ...prev, feed: false }));
        }

        try {
            setLoading(prev => ({ ...prev, assistant: true }));
            const history = await trainerAPI.getAssistantHistory();
            setMessages(history);
            setErrors(prev => ({ ...prev, assistant: undefined }));
        } catch (error) {
            setErrors(prev => ({ 
                ...prev, 
                assistant: error instanceof Error ? error.message : 'Failed to load assistant history' 
            }));
        } finally {
            setLoading(prev => ({ ...prev, assistant: false }));
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // WebSocket handlers
    useEffect(() => {
        if (!socket) return;

        socket.on('player_update', (data: Player) => {
            setPlayers(prev => prev.map(p => p.id === data.id ? data : p));
        });

        socket.on('new_insight', (data: Insight) => {
            setInsights(prev => [data, ...prev]);
        });

        socket.on('feed_update', (data: FeedItem) => {
            setFeed(prev => [data, ...prev]);
        });

        return () => {
            socket.off('player_update');
            socket.off('new_insight');
            socket.off('feed_update');
        };
    }, [socket]);

    // Event handlers
    const handleSendMessage = async (message: string) => {
        try {
            const response = await trainerAPI.sendAssistantMessage(message);
            setMessages(prev => [...prev, response]);
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to send message',
                severity: 'error'
            });
        }
    };

    const handleViewPlayerDetails = (playerId: string) => {
        // Navigate to player details page
        window.location.href = `/trainer/players/${playerId}`;
    };

    const handleInsightAction = async (insightId: string) => {
        try {
            await trainerAPI.acknowledgeInsight(insightId);
            setInsights(prev => 
                prev.map(i => i.id === insightId ? { ...i, acknowledged: true } : i)
            );
            setSnackbar({
                open: true,
                message: 'Insight acknowledged',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to acknowledge insight',
                severity: 'error'
            });
        }
    };

    const handleFeedInteraction = async (feedId: string, type: 'like' | 'comment' | 'share') => {
        try {
            await trainerAPI.interactWithPost(feedId, type);
            setFeed(prev => prev.map(f => {
                if (f.id === feedId) {
                    return {
                        ...f,
                        stats: {
                            ...f.stats,
                            [type + 's']: f.stats[type + 's' as keyof typeof f.stats] + 1
                        },
                        userInteraction: {
                            ...f.userInteraction,
                            [type + 'd']: true
                        }
                    };
                }
                return f;
            }));
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Failed to ${type} post`,
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Render loading states
    const renderLoading = () => (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
        </Box>
    );

    // Render error states
    const renderError = (message: string, onRetry: () => void) => (
        <Alert 
            severity="error" 
            action={
                <Button
                    color="inherit"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={onRetry}
                >
                    Retry
                </Button>
            }
        >
            {message}
        </Alert>
    );

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Welcome, Coach {user?.name}
            </Typography>

            <Grid container spacing={3}>
                {/* Left Column - Roster & Insights */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Active Roster
                        </Typography>
                        {loading.players ? renderLoading() :
                            errors.players ? renderError(errors.players, fetchData) : (
                                <Grid container spacing={2}>
                                    {players.map((player) => (
                                        <Grid item xs={12} sm={6} key={player.id}>
                                            <PlayerCard
                                                player={player}
                                                onViewDetails={() => handleViewPlayerDetails(player.id)}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            )
                        }
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Priority Insights
                        </Typography>
                        {loading.insights ? renderLoading() :
                            errors.insights ? renderError(errors.insights, fetchData) : (
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {insights.map((insight) => (
                                        <InsightCard
                                            key={insight.id}
                                            insight={insight}
                                            onAction={() => handleInsightAction(insight.id)}
                                        />
                                    ))}
                                </Box>
                            )
                        }
                    </Paper>
                </Grid>

                {/* Right Column - AI Assistant & Feed */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, mb: 3, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>
                            AI Assistant
                        </Typography>
                        {loading.assistant ? renderLoading() :
                            errors.assistant ? renderError(errors.assistant, fetchData) : (
                                <AIAssistantPanel
                                    responses={messages}
                                    isLoading={false}
                                    onSendMessage={handleSendMessage}
                                    onStartRecording={() => setIsRecording(true)}
                                    onStopRecording={() => setIsRecording(false)}
                                    isRecording={isRecording}
                                    quickReplies={[
                                        'Create drill sequence',
                                        'Show shooting stats',
                                        'Schedule practice'
                                    ]}
                                />
                            )
                        }
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Community Feed
                        </Typography>
                        {loading.feed ? renderLoading() :
                            errors.feed ? renderError(errors.feed, fetchData) : (
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {feed.map((item) => (
                                        <CommunityCard
                                            key={item.id}
                                            item={item}
                                            onInteract={(type) => handleFeedInteraction(item.id, type)}
                                        />
                                    ))}
                                </Box>
                            )
                        }
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}; 