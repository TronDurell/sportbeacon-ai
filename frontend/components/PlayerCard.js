import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, Typography, Avatar, Box, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
export const PlayerCard = ({ player, onViewDetails }) => {
    const performanceTrend = player.weeklyProgress?.performance || 0;
    const completionRate = player.weeklyProgress ? (player.weeklyProgress.drillsCompleted / player.weeklyProgress.totalDrills) * 100 : 0;
    const playerName = player.name || `${player.firstName} ${player.lastName}`;
    return (_jsx(Card, { sx: {
            cursor: 'pointer',
            '&:hover': { boxShadow: 3 }
        }, onClick: onViewDetails, children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 2, mb: 2, children: [_jsx(Avatar, { src: player.avatar, alt: playerName, sx: { width: 56, height: 56 } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: playerName }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Chip, { label: player.sport, size: "small", color: "primary", variant: "outlined" }), _jsx(Chip, { label: player.level, size: "small", color: "secondary", variant: "outlined" })] })] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Weekly Progress" }), _jsxs(Typography, { variant: "body1", children: [player.weeklyProgress.drillsCompleted, "/", player.weeklyProgress.totalDrills, " Drills"] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [completionRate.toFixed(0), "% Complete"] })] }), _jsxs(Box, { textAlign: "right", children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 0.5, children: [performanceTrend >= 0 ? (_jsx(TrendingUp, { color: "success" })) : (_jsx(TrendingDown, { color: "error" })), _jsxs(Typography, { variant: "h6", color: performanceTrend >= 0 ? 'success.main' : 'error.main', children: [performanceTrend >= 0 ? '+' : '', (performanceTrend * 100).toFixed(0), "%"] })] }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Performance" })] })] })] }) }));
};
