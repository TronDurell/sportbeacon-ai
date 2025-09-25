import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, } from 'recharts';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
const STAT_CATEGORIES = [
    {
        name: 'Shooting',
        stats: ['goalsScored', 'shotAccuracy']
    },
    {
        name: 'Passing',
        stats: ['passAccuracy', 'assists']
    },
    {
        name: 'Physical',
        stats: ['distanceCovered', 'sprintSpeed']
    },
    {
        name: 'Defense',
        stats: ['tacklesWon', 'interceptions']
    }
];
export const RadarChart = ({ playerStats, playerPercentiles, comparisonStats, comparisonType, onComparisonChange, }) => {
    const formatData = () => {
        return STAT_CATEGORIES.map(category => {
            const categoryData = {
                category: category.name,
                player: category.stats.reduce((acc, stat) => acc + (playerPercentiles[stat] || 0), 0) / category.stats.length,
            };
            if (comparisonStats && comparisonType !== 'none') {
                categoryData[comparisonType] = category.stats.reduce((acc, stat) => acc + (comparisonStats[stat] || 0), 0) / category.stats.length;
            }
            return categoryData;
        });
    };
    return (_jsxs(Box, { sx: { width: '100%', height: 400 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Performance Radar" }), _jsxs(ToggleButtonGroup, { value: comparisonType, exclusive: true, onChange: (_, value) => value && onComparisonChange(value), size: "small", children: [_jsx(ToggleButton, { value: "none", children: "Player Only" }), _jsx(ToggleButton, { value: "team", children: "vs Team" }), _jsx(ToggleButton, { value: "league", children: "vs League" })] })] }), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(RechartsRadar, { data: formatData(), children: [_jsx(PolarGrid, {}), _jsx(PolarAngleAxis, { dataKey: "category" }), _jsx(PolarRadiusAxis, { angle: 30, domain: [0, 100] }), _jsx(Radar, { name: "Player", dataKey: "player", stroke: "#8884d8", fill: "#8884d8", fillOpacity: 0.6 }), comparisonType !== 'none' && comparisonStats && (_jsx(Radar, { name: comparisonType === 'team' ? 'Team Average' : 'League Average', dataKey: comparisonType, stroke: "#82ca9d", fill: "#82ca9d", fillOpacity: 0.6 })), _jsx(Legend, {})] }) })] }));
};
