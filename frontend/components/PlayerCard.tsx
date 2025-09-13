import React from 'react';
import { Card, CardContent, Typography, Avatar, Box, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import type { Player } from '../types';

interface PlayerCardProps {
    player: Player;
    onViewDetails: () => void;
    compact?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onViewDetails }) => {
    const performanceTrend = player.weeklyProgress?.performance || 0;
    const completionRate = player.weeklyProgress ? (player.weeklyProgress.drillsCompleted / player.weeklyProgress.totalDrills) * 100 : 0;
    const playerName = player.name || `${player.firstName} ${player.lastName}`;

    return (
        <Card 
            sx={{ 
                cursor: 'pointer',
                '&:hover': { boxShadow: 3 }
            }}
            onClick={onViewDetails}
        >
            <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                        src={player.avatar}
                        alt={playerName}
                        sx={{ width: 56, height: 56 }}
                    />
                    <Box>
                        <Typography variant="h6">{playerName}</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                                label={player.sport}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                            <Chip 
                                label={player.level}
                                size="small"
                                color="secondary"
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Weekly Progress
                        </Typography>
                        <Typography variant="body1">
                            {player.weeklyProgress.drillsCompleted}/{player.weeklyProgress.totalDrills} Drills
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {completionRate.toFixed(0)}% Complete
                        </Typography>
                    </Box>
                    <Box textAlign="right">
                        <Box display="flex" alignItems="center" gap={0.5}>
                            {performanceTrend >= 0 ? (
                                <TrendingUp color="success" />
                            ) : (
                                <TrendingDown color="error" />
                            )}
                            <Typography
                                variant="h6"
                                color={performanceTrend >= 0 ? 'success.main' : 'error.main'}
                            >
                                {performanceTrend >= 0 ? '+' : ''}{(performanceTrend * 100).toFixed(0)}%
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Performance
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}; 