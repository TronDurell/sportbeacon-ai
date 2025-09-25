import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Grid, Card, Typography, LinearProgress, Avatar, List, ListItem, ListItemAvatar, ListItemText, Chip, useTheme, useMediaQuery, Drawer, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert } from '@mui/material';
import { EmojiEvents as TrophyIcon, Star as StarIcon, CheckCircle as CompletedIcon, TrendingUp as TrendingUpIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// import { DrillCard } from './DrillCard';
import { XPProgressBar } from './XPProgressBar';
import { BadgeSystem } from './BadgeSystem';
import { playerAPI } from '../services/api';
import { levelSystem } from '../services/levelSystem';
import { badgeService } from '../services/badgeService';
export const PlayerDashboard = ({ playerId }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [levelUpOpen, setLevelUpOpen] = useState(false);
    const [newBadgeOpen, setNewBadgeOpen] = useState(false);
    const [levelUpData, setLevelUpData] = useState();
    const [newBadge, setNewBadge] = useState();
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
        if (!profile)
            return;
        // Check for level up
        const levelUpResult = await levelSystem.checkLevelUp(profile);
        if (levelUpResult.leveledUp) {
            setLevelUpData({
                level: levelUpResult.newLevel,
                rewards: levelUpResult.rewards
            });
            setLevelUpOpen(true);
            triggerConfetti();
        }
        // Check for new badges
        const badges = await badgeService.checkBadgeProgress(profile);
        const newlyEarnedBadge = badges.find(b => b.earned && !profile.badges?.some(pb => pb.id === b.id && pb.unlocked));
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
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", children: _jsx(LinearProgress, {}) }));
    }
    const renderMobileDrawer = () => (_jsx(Drawer, { anchor: "left", open: drawerOpen, onClose: () => setDrawerOpen(false), children: _jsxs(Box, { sx: { width: 250, p: 2 }, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 2, children: [_jsx(Avatar, { src: profile?.avatar, sx: { width: 48, height: 48, mr: 1 } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: profile?.name }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Level ", profile?.level] })] })] }), _jsx(XPProgressBar, { current: profile?.xp.current || 0, next: profile?.xp.nextLevel || 100 }), _jsxs(List, { children: [_jsx(ListItem, { children: _jsx(ListItemText, { primary: "Completed Drills", secondary: profile?.stats.completedDrills }) }), _jsx(ListItem, { children: _jsx(ListItemText, { primary: "Average Performance", secondary: `${profile?.stats.averagePerformance}%` }) })] })] }) }));
    return (_jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [isMobile && (_jsx(Box, { sx: { mb: 2 }, children: _jsx(Fab, { size: "small", color: "primary", onClick: () => setDrawerOpen(true), children: _jsx(MenuIcon, {}) }) })), _jsxs(Grid, { container: true, spacing: { xs: 1, sm: 2, md: 3 }, children: [!isMobile && (_jsxs(Grid, { item: true, xs: 12, md: 4, children: [_jsxs(Card, { sx: { p: 2, mb: { xs: 1, sm: 2 } }, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 2, children: [_jsx(Avatar, { src: profile?.avatar, sx: { width: 64, height: 64, mr: 2 } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h5", children: profile?.name }), _jsxs(Typography, { variant: "subtitle1", color: "text.secondary", children: ["Level ", profile?.level] })] })] }), _jsx(XPProgressBar, { current: profile?.xp.current || 0, next: profile?.xp.nextLevel || 100 }), _jsx(Box, { mt: 2, children: _jsxs(Grid, { container: true, spacing: 1, children: [_jsxs(Grid, { item: true, xs: 6, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Completed Drills" }), _jsx(Typography, { variant: "h6", children: profile?.stats.completedDrills })] }), _jsxs(Grid, { item: true, xs: 6, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Average Performance" }), _jsxs(Typography, { variant: "h6", children: [profile?.stats.averagePerformance, "%"] })] })] }) })] }), _jsxs(Card, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Achievements" }), _jsx(BadgeSystem, { badges: profile?.badges || [] })] })] })), _jsxs(Grid, { item: true, xs: 12, md: isMobile ? 12 : 8, children: [_jsxs(Card, { sx: { p: 2, mb: { xs: 1, sm: 2 } }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Assigned Drills" }), _jsx(Grid, { container: true, spacing: 2, children: assignedDrills?.map((drill) => (_jsx(Grid, { item: true, xs: 12, sm: isMobile ? 12 : 6, children: _jsxs("div", { children: ["Drill: ", drill.name] }) }, drill.id))) })] }), _jsxs(Card, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Recent Activity & Insights" }), _jsxs(List, { children: [profile?.recentDrills.map((drill) => (_jsxs(ListItem, { divider: true, secondaryAction: _jsx(Chip, { label: `${drill.performance}%`, color: drill.performance >= 80 ? 'success' : 'default', size: "small" }), children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { children: _jsx(CompletedIcon, {}) }) }), _jsx(ListItemText, { primary: drill.name, secondary: new Date(drill.date).toLocaleDateString() })] }, `${drill.id}-${drill.date}`))), insights?.map((insight) => (_jsxs(ListItem, { divider: true, children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: { bgcolor: 'primary.main' }, children: _jsx(TrendingUpIcon, {}) }) }), _jsx(ListItemText, { primary: insight.message, secondary: new Date(insight.date).toLocaleDateString() })] }, insight.date)))] })] })] })] }), renderMobileDrawer(), _jsxs(Dialog, { open: levelUpOpen, onClose: () => setLevelUpOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Level Up!" }), _jsx(DialogContent, { children: _jsxs(Box, { textAlign: "center", py: 2, children: [_jsx(TrophyIcon, { sx: { fontSize: 64, color: 'primary.main' } }), _jsx(Typography, { variant: "h4", gutterBottom: true, children: "Congratulations!" }), _jsxs(Typography, { variant: "h6", children: ["You've reached Level ", levelUpData?.level] }), levelUpData?.rewards && (_jsxs(Box, { mt: 2, children: [_jsx(Typography, { variant: "subtitle1", children: "Rewards Unlocked:" }), _jsx(List, { children: levelUpData.rewards.badges?.map((badge) => (_jsxs(ListItem, { children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { children: _jsx(StarIcon, {}) }) }), _jsx(ListItemText, { primary: `New Badge: ${badge}` })] }, badge))) })] }))] }) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setLevelUpOpen(false), children: "Continue" }) })] }), _jsx(Snackbar, { open: newBadgeOpen, autoHideDuration: 6000, onClose: () => setNewBadgeOpen(false), children: _jsxs(Alert, { onClose: () => setNewBadgeOpen(false), severity: "success", sx: { width: '100%' }, children: [_jsx(Typography, { variant: "subtitle1", children: "New Badge Unlocked!" }), _jsx(Typography, { variant: "body2", children: newBadge?.name })] }) })] }));
};
