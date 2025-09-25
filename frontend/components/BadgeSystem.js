import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Grid, Paper, Typography, Tooltip, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
const BadgeContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    textAlign: 'center',
    position: 'relative',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
        transform: 'scale(1.05)',
    },
}));
const BadgeIcon = styled('img')({
    width: 64,
    height: 64,
    marginBottom: 8,
});
export const BadgeSystem = ({ badges, onBadgeClick }) => {
    const renderBadge = (badge) => (_jsx(Grid, { item: true, xs: 6, sm: 4, md: 3, children: _jsx(Tooltip, { title: _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", children: badge.name }), _jsx(Typography, { variant: "body2", children: badge.description }), !badge.earned && (_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Progress: ", badge.progress, "/", badge.maxProgress] })), badge.earnedDate && (_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Earned: ", new Date(badge.earnedDate).toLocaleDateString()] }))] }), children: _jsxs(BadgeContainer, { onClick: () => onBadgeClick?.(badge), sx: {
                    cursor: onBadgeClick ? 'pointer' : 'default',
                    opacity: badge.earned ? 1 : 0.6,
                }, children: [_jsxs(Box, { position: "relative", display: "inline-block", children: [_jsx(BadgeIcon, { src: badge.icon, alt: badge.name, style: {
                                    filter: badge.earned ? 'none' : 'grayscale(100%)',
                                } }), !badge.earned && (_jsx(CircularProgress, { variant: "determinate", value: (badge.progress / badge.maxProgress) * 100, size: 72, thickness: 2, sx: {
                                    position: 'absolute',
                                    top: -4,
                                    left: -4,
                                    color: 'primary.main',
                                } }))] }), _jsx(Typography, { variant: "subtitle2", noWrap: true, children: badge.name })] }) }) }, badge.id));
    const categorizedBadges = badges.reduce((acc, badge) => {
        if (!acc[badge.category]) {
            acc[badge.category] = [];
        }
        acc[badge.category].push(badge);
        return acc;
    }, {});
    return (_jsx(Box, { children: Object.entries(categorizedBadges).map(([category, categoryBadges]) => (_jsxs(Box, { mb: 4, children: [_jsxs(Typography, { variant: "h6", gutterBottom: true, sx: { textTransform: 'capitalize' }, children: [category, " Badges"] }), _jsx(Grid, { container: true, spacing: 2, children: categoryBadges.map(renderBadge) })] }, category))) }));
};
