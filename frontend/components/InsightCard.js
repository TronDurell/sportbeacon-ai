import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import { Warning as WarningIcon, TrendingDown as TrendingDownIcon, TrendingUp as TrendingUpIcon, LocalHospital as FatigueIcon, ArrowForward as ActionIcon } from '@mui/icons-material';
const iconMap = {
    fatigue: FatigueIcon,
    performance_drop: TrendingDownIcon,
    improvement: TrendingUpIcon,
    // Handle other types gracefully
    default: WarningIcon
};
const colorMap = {
    HIGH: 'error',
    MEDIUM: 'warning',
    LOW: 'info'
};
export const InsightCard = ({ insight, onAction }) => {
    const Icon = iconMap[insight.type] || iconMap.default;
    const color = colorMap[insight.severity];
    return (_jsx(Card, { variant: "outlined", sx: {
            borderLeft: 3,
            borderLeftColor: `${color}.main`,
            '&:hover': { boxShadow: 2 }
        }, children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "flex-start", children: [_jsxs(Box, { display: "flex", gap: 1, alignItems: "center", children: [_jsx(Icon, { sx: { color: color } }), _jsx(Typography, { variant: "subtitle1", sx: { textTransform: 'capitalize' }, children: insight.type.replace('_', ' ') })] }), _jsx(IconButton, { size: "small", onClick: onAction, color: "primary", children: _jsx(ActionIcon, {}) })] }), _jsx(Typography, { variant: "body2", sx: { mt: 1, mb: 2 }, children: insight.message }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: new Date(insight.timestamp).toLocaleDateString() }), insight.metric !== undefined && (_jsxs(Typography, { variant: "caption", color: color + '.main', fontWeight: "bold", children: [(insight.metric * 100).toFixed(0), "%"] }))] })] }) }));
};
