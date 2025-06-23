import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Grid,
    Card,
    Typography,
    IconButton,
    Divider,
    List,
    ListItem,
    Avatar,
    Badge,
    Chip,
    Button,
    TextField,
    CircularProgress,
    useTheme,
    useMediaQuery,
    Drawer,
    AppBar,
    Toolbar,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Mic as MicIcon,
    Send as SendIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Menu as MenuIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { PlayerCard } from './PlayerCard';
import { InsightCard } from './InsightCard';
import { CommunityCard } from './CommunityCard';
import { AIAssistantPanel } from './AIAssistantPanel';
import { PlayerDetailsModal } from './PlayerDetailsModal';
import { DrillSuggestionPanel } from './DrillSuggestionPanel';
import { trainerAPI } from '../services/api';
import { Player, Insight, FeedItem, Message, DrillDetail, InteractionType } from '../types';

export const TrainerHomeView: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();
    const { socket } = useWebSocket();
    const queryClient = useQueryClient();
    
    // State
    const [voiceRecording, setVoiceRecording] = useState(false);
    const [question, setQuestion] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [showDrillSuggestions, setShowDrillSuggestions] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedFilter, setSelectedFilter] = useState<string>('all');

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
        mutationFn: (question: string) => trainerAPI.sendAssistantMessage(question)
    });

    const assignDrill = useMutation({
        mutationFn: async ({ playerId, drill }: { playerId: string; drill: DrillDetail }) => {
            await trainerAPI.assignDrill(playerId, drill.id);
            queryClient.invalidateQueries(['player', playerId, 'drills']);
        }
    });

    // Handlers
    const handleVoiceQuestion = useCallback(async () => {
        setVoiceRecording(true);
        try {
            // Implementation for voice recording and transcription
        } catch (error) {
            console.error('Voice recording failed:', error);
        } finally {
            setVoiceRecording(false);
        }
    }, []);

    const handleQuestionSubmit = useCallback(async () => {
        if (!question.trim()) return;
        await askAssistant.mutateAsync(question);
        setQuestion('');
    }, [question, askAssistant]);

    const handlePlayerSelect = useCallback(async (player: Player) => {
        setSelectedPlayer(player);
        setShowDrillSuggestions(false);
        if (isMobile) {
            setMobileDrawerOpen(false);
        }
    }, [isMobile]);

    const handleAssignDrill = useCallback(async (drill: DrillDetail) => {
        if (!selectedPlayer) return;
        await assignDrill.mutateAsync({
            playerId: selectedPlayer.id,
            drill
        });
        setShowDrillSuggestions(false);
    }, [selectedPlayer, assignDrill]);

    const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = (filter?: string) => {
        if (filter) {
            setSelectedFilter(filter);
        }
        setFilterAnchorEl(null);
    };

    // Real-time updates
    useEffect(() => {
        if (!socket) return;

        socket.on('player_update', (data: Player) => {
            queryClient.invalidateQueries(['trainer', 'roster']);
        });

        socket.on('new_insight', (data: Insight) => {
            queryClient.invalidateQueries(['trainer', 'insights']);
        });

        socket.on('feed_update', (data: FeedItem) => {
            queryClient.invalidateQueries(['community', 'feed']);
        });

        return () => {
            socket.off('player_update');
            socket.off('new_insight');
            socket.off('feed_update');
        };
    }, [socket, queryClient]);

    if (rosterLoading || insightsLoading || feedLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    const mainContent = (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
                {/* Active Roster Section */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2, md: 3 } }}>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 2
                        }}>
                            <Typography variant="h5" gutterBottom>
                                Active Roster
                            </Typography>
                            <Box>
                                <IconButton onClick={handleFilterClick}>
                                    <FilterIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={filterAnchorEl}
                                    open={Boolean(filterAnchorEl)}
                                    onClose={() => handleFilterClose()}
                                >
                                    <MenuItem onClick={() => handleFilterClose('all')}>
                                        All Players
                                    </MenuItem>
                                    <MenuItem onClick={() => handleFilterClose('active')}>
                                        Active Today
                                    </MenuItem>
                                    <MenuItem onClick={() => handleFilterClose('pending')}>
                                        Pending Drills
                                    </MenuItem>
                                </Menu>
                            </Box>
                        </Box>
                        <Grid container spacing={{ xs: 1, sm: 2 }}>
                            {roster?.players.map((player: Player) => (
                                <Grid item xs={12} sm={6} key={player.id}>
                                    <PlayerCard
                                        player={player}
                                        onViewDetails={() => handlePlayerSelect(player)}
                                        compact={isMobile}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Card>

                    {/* Drill Suggestions or Insights */}
                    <Card sx={{ p: { xs: 1, sm: 2 } }}>
                        {showDrillSuggestions && selectedPlayer ? (
                            <DrillSuggestionPanel
                                playerId={selectedPlayer.id}
                                onAssignDrill={handleAssignDrill}
                            />
                        ) : (
                            <>
                                <Typography variant="h5" gutterBottom>
                                    Priority Insights
                                </Typography>
                                <List>
                                    {insights?.map((insight: Insight) => (
                                        <InsightCard
                                            key={insight.id}
                                            insight={insight}
                                            onAction={() => trainerAPI.acknowledgeInsight(insight.id)}
                                            compact={isMobile}
                                        />
                                    ))}
                                </List>
                            </>
                        )}
                    </Card>
                </Grid>

                {/* AI Assistant & Community Feed */}
                <Grid 
                    item 
                    xs={12} 
                    md={4} 
                    sx={{ 
                        display: { xs: mobileDrawerOpen ? 'block' : 'none', md: 'block' } 
                    }}
                >
                    <Card sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2, md: 3 } }}>
                        <Typography variant="h5" gutterBottom>
                            AI Assistant
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                value={question}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                                placeholder="Ask a coaching question..."
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    endAdornment: (
                                        <>
                                            <IconButton
                                                onClick={handleVoiceQuestion}
                                                disabled={voiceRecording}
                                            >
                                                <MicIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={handleQuestionSubmit}
                                                disabled={!question.trim()}
                                            >
                                                <SendIcon />
                                            </IconButton>
                                        </>
                                    )
                                }}
                            />
                        </Box>
                        <AIAssistantPanel
                            responses={askAssistant.data ? [askAssistant.data] : []}
                            isLoading={askAssistant.isLoading}
                            compact={isMobile}
                        />
                    </Card>

                    <Card sx={{ p: { xs: 1, sm: 2 } }}>
                        <Typography variant="h5" gutterBottom>
                            Community Updates
                        </Typography>
                        <List>
                            {feed?.items.map((item: FeedItem) => (
                                <CommunityCard
                                    key={item.id}
                                    item={item}
                                    onInteract={(type: InteractionType, data: any) => 
                                        trainerAPI.interactWithPost(item.id, type, data)
                                    }
                                    compact={isMobile}
                                />
                            ))}
                        </List>
                    </Card>
                </Grid>
            </Grid>

            {/* Player Details Modal */}
            {selectedPlayer && drillHistory && (
                <PlayerDetailsModal
                    open={!!selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    player={selectedPlayer}
                    drillHistory={drillHistory}
                    feedbackStats={feedbackStats}
                    isMobile={isMobile}
                />
            )}
        </Box>
    );

    return (
        <>
            {isMobile && (
                <AppBar position="fixed" color="default">
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Trainer Dashboard
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}

            {isMobile ? (
                <>
                    <Toolbar /> {/* Spacer for AppBar */}
                    <Drawer
                        anchor="right"
                        open={mobileDrawerOpen}
                        onClose={() => setMobileDrawerOpen(false)}
                        sx={{
                            '& .MuiDrawer-paper': {
                                width: '80%',
                                maxWidth: 360
                            }
                        }}
                    >
                        {mainContent}
                    </Drawer>
                    <Box sx={{ pb: 7 }}>
                        {mainContent}
                    </Box>
                </>
            ) : (
                mainContent
            )}
        </>
    );
};

export default TrainerHomeView; 