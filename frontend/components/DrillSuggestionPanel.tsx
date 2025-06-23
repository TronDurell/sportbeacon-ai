import React, { useState } from 'react';
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    Send as SendIcon,
    Add as AddIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { trainerAPI } from '../services/api';
import { DrillDetail } from '../types';

interface DrillSuggestionPanelProps {
    playerId: string;
    onAssignDrill: (drill: DrillDetail) => void;
}

export const DrillSuggestionPanel: React.FC<DrillSuggestionPanelProps> = ({
    playerId,
    onAssignDrill
}) => {
    const [prompt, setPrompt] = useState('');
    const [suggestions, setSuggestions] = useState<DrillDetail[]>([]);

    const getSuggestions = useMutation({
        mutationFn: async (input: string) => {
            const response = await trainerAPI.getDrillSuggestions(playerId, input);
            setSuggestions(response);
            return response;
        }
    });

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        await getSuggestions.mutateAsync(prompt);
        setPrompt('');
    };

    return (
        <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                AI Drill Suggestions
            </Typography>
            
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to work on (e.g., 'Need drills to improve shooting accuracy under pressure')"
                    variant="outlined"
                    sx={{ mb: 1 }}
                />
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!prompt.trim() || getSuggestions.isLoading}
                    endIcon={getSuggestions.isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                >
                    Get Suggestions
                </Button>
            </Box>

            {suggestions.length > 0 && (
                <List>
                    {suggestions.map((drill) => (
                        <ListItem
                            key={drill.id}
                            divider
                            sx={{
                                '&:hover': {
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            <ListItemText
                                primary={drill.name}
                                secondary={
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {drill.description}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Chip
                                                size="small"
                                                label={`Duration: ${drill.duration}min`}
                                                sx={{ mr: 1 }}
                                            />
                                            <Chip
                                                size="small"
                                                label={`Difficulty: ${drill.difficulty}`}
                                                color="primary"
                                            />
                                        </Box>
                                    </Box>
                                }
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => onAssignDrill(drill)}
                                    title="Assign Drill"
                                >
                                    <AddIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => {/* Show drill details */}}
                                    title="View Details"
                                >
                                    <InfoIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}
        </Card>
    );
}; 