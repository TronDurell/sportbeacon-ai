import React from 'react';
import {
    Radar,
    RadarChart as RechartsRadar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';

interface StatCategory {
    name: string;
    stats: string[];
}

const STAT_CATEGORIES: StatCategory[] = [
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

interface RadarChartProps {
    playerStats: Record<string, number>;
    playerPercentiles: Record<string, number>;
    comparisonStats?: Record<string, number>;
    comparisonType: 'team' | 'league' | 'none';
    onComparisonChange: (type: 'team' | 'league' | 'none') => void;
}

export const RadarChart: React.FC<RadarChartProps> = ({
    playerStats,
    playerPercentiles,
    comparisonStats,
    comparisonType,
    onComparisonChange,
}) => {
    const formatData = () => {
        return STAT_CATEGORIES.map(category => {
            const categoryData = {
                category: category.name,
                player: category.stats.reduce((acc, stat) => acc + (playerPercentiles[stat] || 0), 0) / category.stats.length,
            };

            if (comparisonStats && comparisonType !== 'none') {
                categoryData[comparisonType] = category.stats.reduce((acc, stat) => 
                    acc + (comparisonStats[stat] || 0), 0) / category.stats.length;
            }

            return categoryData;
        });
    };

    return (
        <Box sx={{ width: '100%', height: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Performance Radar</Typography>
                <ToggleButtonGroup
                    value={comparisonType}
                    exclusive
                    onChange={(_, value) => value && onComparisonChange(value)}
                    size="small"
                >
                    <ToggleButton value="none">
                        Player Only
                    </ToggleButton>
                    <ToggleButton value="team">
                        vs Team
                    </ToggleButton>
                    <ToggleButton value="league">
                        vs League
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            
            <ResponsiveContainer width="100%" height="100%">
                <RechartsRadar data={formatData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                        name="Player"
                        dataKey="player"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                    />
                    {comparisonType !== 'none' && comparisonStats && (
                        <Radar
                            name={comparisonType === 'team' ? 'Team Average' : 'League Average'}
                            dataKey={comparisonType}
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            fillOpacity={0.6}
                        />
                    )}
                    <Legend />
                </RechartsRadar>
            </ResponsiveContainer>
        </Box>
    );
}; 