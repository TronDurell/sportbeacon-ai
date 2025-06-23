import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Card,
    Typography,
    LinearProgress,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Chip,
    IconButton,
    Badge,
    useTheme,
    useMediaQuery,
    Drawer,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Snackbar,
    Alert
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Star as StarIcon,
    PlayArrow as PlayIcon,
    CheckCircle as CompletedIcon,
    Timer as TimerIcon,
    TrendingUp as TrendingUpIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayerProfile, DrillDetail } from '../types';
import { DrillCard } from './DrillCard';
import { XPProgressBar } from './XPProgressBar';
import { BadgeSystem } from './BadgeSystem';
import { playerAPI } from '../services/api';
import { levelSystem } from '../services/levelSystem';
import { badgeService } from '../services/badgeService';
import confetti from 'canvas-confetti';

interface PlayerDashboardProps {
    playerId: string;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ playerId }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [levelUpOpen, setLevelUpOpen] = useState(false);
    const [newBadgeOpen, setNewBadgeOpen] = useState(false);
    const [levelUpData, setLevelUpData] = useState<{ level: number; rewards?: any }>();
    const [newBadge, setNewBadge] = useState<any>();
    const queryClient = useQueryClient();

    // Queries
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['player', playerId, 'profile'],
        queryFn: () => playerAPI.getProfile(playerId)
    });

    const { data: assignedDrills, isLoading: drillsLoading } = useQuery({
        queryKey: ['player', playerId, 'assigned-drills'],
        queryFn: () => playerAPI.getAssignedDrills(playerId)
    });

    const { data: insights, isLoading: insightsLoading } = useQuery({
        queryKey: ['player', playerId, 'insights'],
        queryFn: () => playerAPI.getInsights(playerId)
    });

    useEffect(() => {
        if (profile) {
            checkLevelAndBadges();
        }
    }, [profile]);

    const checkLevelAndBadges = async () => {
        if (!profile) return;

        // Check for level up
        const levelUpResult = await levelSystem.checkLevelUp(profile);
        if (levelUpResult.leveledUp) {
            setLevelUpData({
                level: levelUpResult.newLevel!,
                rewards: levelUpResult.rewards
            });
            setLevelUpOpen(true);
            triggerConfetti();
        }

        // Check for new badges
        const badges = await badgeService.checkBadgeProgress(profile);
        const newlyEarnedBadge = badges.find(b => 
            b.earned && !profile.badges?.some(pb => pb.id === b.id && pb.earned)
        );

        if (newlyEarnedBadge) {
            setNewBadge(newlyEarnedBadge);
            setNewBadgeOpen(true);
            await badgeService.playUnlockSound(newlyEarnedBadge);
        }
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    if (profileLoading || drillsLoading || insightsLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <LinearProgress />
            </Box>
        );
    }

    const renderMobileDrawer = () => (
        <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
        >
            <Box sx={{ width: 250, p: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                        src={profile?.avatar}
                        sx={{ width: 48, height: 48, mr: 1 }}
                    />
                    <Box>
                        <Typography variant="h6">{profile?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Level {profile?.level}
                        </Typography>
                    </Box>
                </Box>
                <XPProgressBar
                    current={profile?.xp.current || 0}
                    next={profile?.xp.nextLevel || 100}
                />
                <List>
                    <ListItem>
                        <ListItemText
                            primary="Completed Drills"
                            secondary={profile?.stats.completedDrills}
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="Average Performance"
                            secondary={`${profile?.stats.averagePerformance}%`}
                        />
                    </ListItem>
                </List>
            </Box>
        </Drawer>
    );

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {isMobile && (
                <Box sx={{ mb: 2 }}>
                    <Fab
                        size="small"
                        color="primary"
                        onClick={() => setDrawerOpen(true)}
                    >
                        <MenuIcon />
                    </Fab>
                </Box>
            )}

            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
                {/* Player Profile Section - Hide on mobile */}
                {!isMobile && (
                    <Grid item xs={12} md={4}>
                        <Card sx={{ p: 2, mb: { xs: 1, sm: 2 } }}>
                            <Box display="flex" alignItems="center" mb={2}>
                                <Avatar
                                    src={profile?.avatar}
                                    sx={{ width: 64, height: 64, mr: 2 }}
                                />
                                <Box>
                                    <Typography variant="h5">{profile?.name}</Typography>
                                    <Typography variant="subtitle1" color="text.secondary">
                                        Level {profile?.level}
                                    </Typography>
                                </Box>
                            </Box>

                            <XPProgressBar
                                current={profile?.xp.current || 0}
                                next={profile?.xp.nextLevel || 100}
                            />

                            <Box mt={2}>
                                <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            Completed Drills
                                        </Typography>
                                        <Typography variant="h6">
                                            {profile?.stats.completedDrills}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            Average Performance
                                        </Typography>
                                        <Typography variant="h6">
                                            {profile?.stats.averagePerformance}%
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Card>

                        {/* Badges Section */}
                        <Card sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Achievements
                            </Typography>
                            <BadgeSystem badges={profile?.badges || []} />
                        </Card>
                    </Grid>
                )}

                {/* Main Content Section */}
                <Grid item xs={12} md={isMobile ? 12 : 8}>
                    <Card sx={{ p: 2, mb: { xs: 1, sm: 2 } }}>
                        <Typography variant="h6" gutterBottom>
                            Assigned Drills
                        </Typography>
                        <Grid container spacing={2}>
                            {assignedDrills?.map((drill: DrillDetail) => (
                                <Grid item xs={12} sm={isMobile ? 12 : 6} key={drill.id}>
                                    <DrillCard
                                        drill={drill}
                                        onStart={() => {/* Handle drill start */}}
                                        compact={isMobile}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Card>

                    {/* Recent Activity & Insights */}
                    <Card sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Activity & Insights
                        </Typography>
                        <List>
                            {profile?.recentDrills.map((drill) => (
                                <ListItem
                                    key={`${drill.id}-${drill.date}`}
                                    divider
                                    secondaryAction={
                                        <Chip
                                            label={`${drill.performance}%`}
                                            color={drill.performance >= 80 ? 'success' : 'default'}
                                            size="small"
                                        />
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar>
                                            <CompletedIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={drill.name}
                                        secondary={new Date(drill.date).toLocaleDateString()}
                                    />
                                </ListItem>
                            ))}

                            {insights?.map((insight) => (
                                <ListItem
                                    key={insight.date}
                                    divider
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            <TrendingUpIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={insight.message}
                                        secondary={new Date(insight.date).toLocaleDateString()}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Card>
                </Grid>
            </Grid>

            {/* Mobile Drawer */}
            {renderMobileDrawer()}

            {/* Level Up Dialog */}
            <Dialog
                open={levelUpOpen}
                onClose={() => setLevelUpOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Level Up!</DialogTitle>
                <DialogContent>
                    <Box textAlign="center" py={2}>
                        <TrophyIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                        <Typography variant="h4" gutterBottom>
                            Congratulations!
                        </Typography>
                        <Typography variant="h6">
                            You've reached Level {levelUpData?.level}
                        </Typography>
                        {levelUpData?.rewards && (
                            <Box mt={2}>
                                <Typography variant="subtitle1">Rewards Unlocked:</Typography>
                                <List>
                                    {levelUpData.rewards.badges?.map((badge: string) => (
                                        <ListItem key={badge}>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <StarIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary={`New Badge: ${badge}`} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLevelUpOpen(false)}>Continue</Button>
                </DialogActions>
            </Dialog>

            {/* New Badge Notification */}
            <Snackbar
                open={newBadgeOpen}
                autoHideDuration={6000}
                onClose={() => setNewBadgeOpen(false)}
            >
                <Alert
                    onClose={() => setNewBadgeOpen(false)}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    <Typography variant="subtitle1">New Badge Unlocked!</Typography>
                    <Typography variant="body2">{newBadge?.name}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
}; 