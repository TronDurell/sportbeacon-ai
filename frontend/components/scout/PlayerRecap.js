import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Skeleton, Chip, Divider, List, ListItem, ListItemText, ListItemIcon, Rating, useTheme, } from '@mui/material';
import { TrendingUp, Star, SportsSoccer, Psychology, Speed, EmojiEvents, } from '@mui/icons-material';
const generateAIRecap = async (player, evaluation) => {
    // This would typically be an API call to your AI service
    // For now, we'll simulate a response
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                summary: `${player.firstName} ${player.lastName} is a ${player.primaryPosition} who demonstrates exceptional technical ability and tactical awareness. Based on recent performance data and scouting evaluations, the player shows significant potential for development in high-level competitive environments.`,
                strengths: [
                    'Excellent ball control and first touch',
                    'Strong tactical understanding of the game',
                    'High work rate and stamina',
                    'Natural leadership qualities',
                ],
                improvements: [
                    'Could improve aerial ability',
                    'Decision making under pressure',
                    'Consistency in big matches',
                ],
                roleRecommendations: [
                    {
                        role: 'Advanced Playmaker',
                        confidence: 0.85,
                        reasoning: 'Exceptional vision and passing ability combined with technical skills',
                    },
                    {
                        role: 'Box-to-Box Midfielder',
                        confidence: 0.75,
                        reasoning: 'High stamina and good all-round attributes',
                    },
                ],
                potentialScore: 8.5,
                keyStats: [
                    {
                        stat: 'passAccuracy',
                        value: player.stats.passAccuracy,
                        trend: 'up',
                        significance: 'Above average for position',
                    },
                    {
                        stat: 'distanceCovered',
                        value: player.stats.distanceCovered,
                        trend: 'stable',
                        significance: 'Consistent high performance',
                    },
                ],
            });
        }, 1500);
    });
};
export const PlayerRecap = ({ player, evaluation }) => {
    const theme = useTheme();
    const [recap, setRecap] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadRecap = async () => {
            setLoading(true);
            try {
                const aiRecap = await generateAIRecap(player, evaluation);
                setRecap(aiRecap);
            }
            catch (error) {
                console.error('Failed to generate recap:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadRecap();
    }, [player, evaluation]);
    if (loading) {
        return (_jsxs(Box, { children: [_jsx(Skeleton, { variant: "text", height: 40 }), _jsx(Skeleton, { variant: "rectangular", height: 120 }), _jsx(Skeleton, { variant: "text", height: 30 }), _jsx(Skeleton, { variant: "text", height: 30 })] }));
    }
    if (!recap) {
        return (_jsx(Typography, { color: "error", children: "Failed to generate player recap. Please try again." }));
    }
    return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "AI-Generated Player Analysis" }), _jsx(Typography, { variant: "body1", paragraph: true, children: recap.summary }), _jsx(Divider, { sx: { my: 2 } }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Key Strengths" }), _jsx(List, { dense: true, children: recap.strengths.map((strength, index) => (_jsxs(ListItem, { children: [_jsx(ListItemIcon, { children: _jsx(Star, { color: "primary" }) }), _jsx(ListItemText, { primary: strength })] }, index))) }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Areas for Improvement" }), _jsx(List, { dense: true, children: recap.improvements.map((improvement, index) => (_jsxs(ListItem, { children: [_jsx(ListItemIcon, { children: _jsx(TrendingUp, { color: "secondary" }) }), _jsx(ListItemText, { primary: improvement })] }, index))) }), _jsx(Divider, { sx: { my: 2 } }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Recommended Roles" }), recap.roleRecommendations.map((role, index) => (_jsxs(Box, { mb: 2, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(SportsSoccer, { color: "primary" }), _jsx(Typography, { variant: "subtitle2", children: role.role }), _jsx(Rating, { value: role.confidence * 5, readOnly: true, precision: 0.5, size: "small" })] }), _jsx(Typography, { variant: "body2", color: "textSecondary", children: role.reasoning })] }, index))), _jsx(Divider, { sx: { my: 2 } }), _jsx(Box, { display: "flex", gap: 1, flexWrap: "wrap", children: recap.keyStats.map((stat, index) => (_jsx(Chip, { icon: stat.trend === 'up' ? (_jsx(TrendingUp, {})) : stat.trend === 'down' ? (_jsx(Speed, {})) : (_jsx(Psychology, {})), label: `${stat.stat}: ${stat.value}`, color: stat.trend === 'up' ? 'success' : 'default', variant: "outlined" }, index))) }), _jsxs(Box, { mt: 2, p: 2, bgcolor: theme.palette.background.default, borderRadius: 1, children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Overall Potential Score" }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(EmojiEvents, { color: "primary" }), _jsx(Rating, { value: recap.potentialScore / 2, readOnly: true, precision: 0.5, size: "large" }), _jsxs(Typography, { children: [recap.potentialScore.toFixed(1), " / 10"] })] })] })] }) }));
};
