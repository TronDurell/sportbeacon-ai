import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Card, Typography, TextField, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, CircularProgress, Chip } from '@mui/material';
import { Send as SendIcon, Add as AddIcon, Info as InfoIcon } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { trainerAPI } from '../services/api';
export const DrillSuggestionPanel = ({ playerId, onAssignDrill }) => {
    const [prompt, setPrompt] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const getSuggestions = useMutation({
        mutationFn: async (input) => {
            const response = await trainerAPI.getDrillSuggestions(playerId, input);
            setSuggestions(response);
            return response;
        }
    });
    const handleSubmit = async () => {
        if (!prompt.trim())
            return;
        await getSuggestions.mutateAsync(prompt);
        setPrompt('');
    };
    return (_jsxs(Card, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "AI Drill Suggestions" }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsx(TextField, { fullWidth: true, multiline: true, rows: 2, value: prompt, onChange: (e) => setPrompt(e.target.value), placeholder: "Describe what you want to work on (e.g., 'Need drills to improve shooting accuracy under pressure')", variant: "outlined", sx: { mb: 1 } }), _jsx(Button, { variant: "contained", onClick: handleSubmit, disabled: !prompt.trim() || getSuggestions.isLoading, endIcon: getSuggestions.isLoading ? _jsx(CircularProgress, { size: 20 }) : _jsx(SendIcon, {}), children: "Get Suggestions" })] }), suggestions.length > 0 && (_jsx(List, { children: suggestions.map((drill) => (_jsxs(ListItem, { divider: true, sx: {
                        '&:hover': {
                            bgcolor: 'action.hover'
                        }
                    }, children: [_jsx(ListItemText, { primary: drill.name, secondary: _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: drill.description }), _jsxs(Box, { sx: { mt: 1 }, children: [_jsx(Chip, { size: "small", label: `Duration: ${drill.duration}min`, sx: { mr: 1 } }), _jsx(Chip, { size: "small", label: `Difficulty: ${drill.difficulty}`, color: "primary" })] })] }) }), _jsxs(ListItemSecondaryAction, { children: [_jsx(IconButton, { edge: "end", onClick: () => onAssignDrill(drill), title: "Assign Drill", children: _jsx(AddIcon, {}) }), _jsx(IconButton, { edge: "end", onClick: () => { }, title: "View Details", children: _jsx(InfoIcon, {}) })] })] }, drill.id))) }))] }));
};
