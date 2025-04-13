import React from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import {
    Warning as WarningIcon,
    TrendingDown as TrendingDownIcon,
    TrendingUp as TrendingUpIcon,
    LocalHospital as FatigueIcon,
    ArrowForward as ActionIcon
} from '@mui/icons-material';

interface Insight {
    id: string;
    type: 'fatigue' | 'performance_drop' | 'improvement';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    metric: number;
    message: string;
    timestamp: string;
}

interface InsightCardProps {
    insight: Insight;
    onAction: () => void;
}

const iconMap = {
    fatigue: FatigueIcon,
    performance_drop: TrendingDownIcon,
    improvement: TrendingUpIcon
};

const colorMap = {
    HIGH: 'error',
    MEDIUM: 'warning',
    LOW: 'info'
} as const;

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onAction }) => {
    const Icon = iconMap[insight.type];
    const color = colorMap[insight.severity];

    return (
        <Card 
            variant="outlined"
            sx={{ 
                borderLeft: 3,
                borderLeftColor: `${color}.main`,
                '&:hover': { boxShadow: 2 }
            }}
        >
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex" gap={1} alignItems="center">
                        <Icon color={color} />
                        <Typography 
                            variant="subtitle1"
                            sx={{ textTransform: 'capitalize' }}
                        >
                            {insight.type.replace('_', ' ')}
                        </Typography>
                    </Box>
                    <IconButton 
                        size="small" 
                        onClick={onAction}
                        color="primary"
                    >
                        <ActionIcon />
                    </IconButton>
                </Box>

                <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                    {insight.message}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                        {new Date(insight.timestamp).toLocaleDateString()}
                    </Typography>
                    {insight.metric !== undefined && (
                        <Typography 
                            variant="caption"
                            color={color + '.main'}
                            fontWeight="bold"
                        >
                            {(insight.metric * 100).toFixed(0)}%
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}; 