import React, { useState } from 'react';
import {
    Modal,
    Box,
    Typography,
    IconButton,
    Grid,
    Card,
    List,
    ListItem,
    ListItemText,
    Chip,
    Button,
    Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Player, DrillDetail } from '../types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface PlayerDetailsModalProps {
    open: boolean;
    onClose: () => void;
    player: Player;
    drillHistory: DrillDetail[];
}

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({
    open,
    onClose,
    player,
    drillHistory
}) => {
    const [error, setError] = useState<string | null>(null);

    const performanceData = {
        labels: drillHistory.map(drill => new Date(drill.completedAt).toLocaleDateString()),
        datasets: [
            {
                label: 'Performance Score',
                data: drillHistory.map(drill => drill.performance.score),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const
            },
            title: {
                display: true,
                text: 'Performance Trend'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100
            }
        }
    };

    const handleAction = async () => {
        try {
            // Simulate an action that might fail
            throw new Error('An error occurred while processing your request.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="player-details-modal"
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: 1000,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>

                <Grid container spacing={3}>
                    {/* Player Info */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {player.name}
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Chip label={`Level ${player.level}`} color="primary" />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Sport: {player.sport}
                                </Typography>
                            </Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Weekly Progress
                            </Typography>
                            <Typography variant="body2">
                                Drills Completed: {player.weeklyProgress.drillsCompleted}/{player.weeklyProgress.totalDrills}
                            </Typography>
                            <Typography variant="body2">
                                Performance: {player.weeklyProgress.performance}%
                            </Typography>
                        </Card>
                    </Grid>

                    {/* Performance Chart */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ p: 2 }}>
                            <Line options={chartOptions} data={performanceData} />
                        </Card>
                    </Grid>

                    {/* Recent Drills */}
                    <Grid item xs={12}>
                        <Card sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Recent Drills
                            </Typography>
                            <List>
                                {drillHistory.map((drill) => (
                                    <ListItem
                                        key={`${drill.id}-${drill.completedAt}`}
                                        divider
                                        secondaryAction={
                                            <Button
                                                size="small"
                                                onClick={() => {/* Handle reassign */}}
                                            >
                                                Reassign
                                            </Button>
                                        }
                                    >
                                        <ListItemText
                                            primary={drill.name}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2">
                                                        Completed: {new Date(drill.completedAt).toLocaleDateString()}
                                                    </Typography>
                                                    <br />
                                                    <Typography component="span" variant="body2">
                                                        Score: {drill.performance.score}%
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Modal>
    );
}; 