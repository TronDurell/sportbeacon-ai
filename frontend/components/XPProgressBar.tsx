import React from 'react';
import { Box, LinearProgress, Typography, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';

interface XPProgressBarProps {
    current: number;
    next: number;
}

const pulse = keyframes`
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
`;

export const XPProgressBar: React.FC<XPProgressBarProps> = ({ current, next }) => {
    const theme = useTheme();
    const progress = (current / next) * 100;
    const isNearLevelUp = progress >= 90;

    return (
        <Box sx={{ width: '100%', mb: 1 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                    animation: isNearLevelUp ? `${pulse} 2s infinite` : 'none',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    XP Progress
                </Typography>
                <Typography
                    variant="body2"
                    color={isNearLevelUp ? 'primary' : 'text.secondary'}
                    sx={{
                        fontWeight: isNearLevelUp ? 'bold' : 'normal',
                    }}
                >
                    {current} / {next}
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: isNearLevelUp ? theme.palette.primary.main : theme.palette.success.main,
                        transition: 'transform 0.4s ease-in-out',
                    },
                }}
            />
        </Box>
    );
}; 