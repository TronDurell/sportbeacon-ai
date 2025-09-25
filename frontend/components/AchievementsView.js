import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Box, Container, Typography, Grid, Tabs, Tab, TextField, InputAdornment, Card, Select, MenuItem, FormControl, InputLabel, useTheme, useMediaQuery, } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { playerAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
export const AchievementsView = ({ playerId }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [activeTab, setActiveTab] = useState('achievement');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const { data: badges, isLoading } = useQuery({
        queryKey: ['player', playerId, 'badges'],
        queryFn: () => playerAPI.getPlayerBadges(playerId),
    });
    const filteredBadges = useMemo(() => {
        if (!badges)
            return [];
        return badges
            .filter(badge => badge.category === activeTab &&
            (badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                badge.description.toLowerCase().includes(searchQuery.toLowerCase())))
            .sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return (b.earnedDate ? new Date(b.earnedDate).getTime() : 0) -
                        (a.earnedDate ? new Date(a.earnedDate).getTime() : 0);
                case 'oldest':
                    return (a.earnedDate ? new Date(a.earnedDate).getTime() : 0) -
                        (b.earnedDate ? new Date(b.earnedDate).getTime() : 0);
                case 'progress': {
                    const aProgress = a.progress / a.maxProgress;
                    const bProgress = b.progress / b.maxProgress;
                    return bProgress - aProgress;
                }
                case 'alphabetical':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    }, [badges, activeTab, searchQuery, sortBy]);
    const stats = useMemo(() => {
        if (!badges)
            return null;
        const totalBadges = badges.length;
        const earnedBadges = badges.filter(b => b.earned).length;
        const progressSum = badges.reduce((sum, b) => sum + (b.progress / b.maxProgress), 0);
        const averageProgress = (progressSum / totalBadges) * 100;
        return {
            total: totalBadges,
            earned: earnedBadges,
            progress: averageProgress.toFixed(1),
        };
    }, [badges]);
    return (_jsxs(Container, { maxWidth: "lg", sx: { py: 4 }, children: [_jsxs(Box, { mb: 4, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Achievements" }), stats && (_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsxs(Card, { sx: { p: 2, textAlign: 'center' }, children: [_jsx(Typography, { variant: "h6", children: stats.earned }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Badges Earned" })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsxs(Card, { sx: { p: 2, textAlign: 'center' }, children: [_jsx(Typography, { variant: "h6", children: stats.total - stats.earned }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Badges Remaining" })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsxs(Card, { sx: { p: 2, textAlign: 'center' }, children: [_jsxs(Typography, { variant: "h6", children: [stats.progress, "%"] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Overall Progress" })] }) })] }))] }), _jsx(Box, { mb: 3, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, placeholder: "Search badges...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), InputProps: {
                                    startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, {}) })),
                                } }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Sort By" }), _jsxs(Select, { value: sortBy, onChange: (e) => setSortBy(e.target.value), label: "Sort By", children: [_jsx(MenuItem, { value: "newest", children: "Newest First" }), _jsx(MenuItem, { value: "oldest", children: "Oldest First" }), _jsx(MenuItem, { value: "progress", children: "Progress" }), _jsx(MenuItem, { value: "alphabetical", children: "Alphabetical" })] })] }) })] }) }), _jsxs(Tabs, { value: activeTab, onChange: (_, value) => setActiveTab(value), variant: isMobile ? 'scrollable' : 'fullWidth', scrollButtons: isMobile ? 'auto' : false, sx: { mb: 3 }, children: [_jsx(Tab, { label: "Achievements", value: "achievement" }), _jsx(Tab, { label: "Skills", value: "skill" }), _jsx(Tab, { label: "Social", value: "social" }), _jsx(Tab, { label: "Challenges", value: "challenge" })] }), _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.2 }, children: _jsx(Grid, { container: true, spacing: 2, children: filteredBadges.map((badge) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 3, children: _jsx(motion.div, { layout: true, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, children: _jsxs(Card, { sx: {
                                        p: 2,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        opacity: badge.earned ? 1 : 0.6,
                                    }, children: [_jsx(Box, { component: "img", src: badge.icon, alt: badge.name, sx: {
                                                width: 80,
                                                height: 80,
                                                mb: 2,
                                                filter: badge.earned ? 'none' : 'grayscale(100%)',
                                            } }), _jsx(Typography, { variant: "h6", align: "center", gutterBottom: true, children: badge.name }), _jsx(Typography, { variant: "body2", color: "text.secondary", align: "center", sx: { mb: 2 }, children: badge.description }), !badge.earned && (_jsxs(Typography, { variant: "body2", color: "primary", sx: { mt: 'auto' }, children: ["Progress: ", Math.round((badge.progress / badge.maxProgress) * 100), "%"] })), badge.earnedDate && (_jsxs(Typography, { variant: "caption", color: "text.secondary", sx: { mt: 'auto' }, children: ["Earned: ", new Date(badge.earnedDate).toLocaleDateString()] }))] }) }) }, badge.id))) }) }, activeTab) })] }));
};
