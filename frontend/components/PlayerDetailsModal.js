import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Modal, Box, Typography, IconButton, Grid, Card, List, ListItem, ListItemText, Chip, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
export const PlayerDetailsModal = ({ open, onClose, player, drillHistory }) => {
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
                position: 'top'
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
    return (_jsx(Modal, { open: open, onClose: onClose, "aria-labelledby": "player-details-modal", children: _jsxs(Box, { sx: {
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
            }, children: [_jsx(IconButton, { onClick: onClose, sx: { position: 'absolute', right: 8, top: 8 }, children: _jsx(CloseIcon, {}) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsxs(Card, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: player.name }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsx(Chip, { label: `Level ${player.level}`, color: "primary" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: ["Sport: ", player.sport] })] }), _jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Weekly Progress" }), _jsxs(Typography, { variant: "body2", children: ["Drills Completed: ", player.weeklyProgress.drillsCompleted, "/", player.weeklyProgress.totalDrills] }), _jsxs(Typography, { variant: "body2", children: ["Performance: ", player.weeklyProgress.performance, "%"] })] }) }), _jsx(Grid, { item: true, xs: 12, md: 8, children: _jsx(Card, { sx: { p: 2 }, children: _jsx(Line, { options: chartOptions, data: performanceData }) }) }), _jsx(Grid, { item: true, xs: 12, children: _jsxs(Card, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Recent Drills" }), _jsx(List, { children: drillHistory.map((drill) => (_jsx(ListItem, { divider: true, secondaryAction: _jsx(Button, { size: "small", onClick: () => { }, children: "Reassign" }), children: _jsx(ListItemText, { primary: drill.name, secondary: _jsxs(_Fragment, { children: [_jsxs(Typography, { component: "span", variant: "body2", children: ["Completed: ", new Date(drill.completedAt).toLocaleDateString()] }), _jsx("br", {}), _jsxs(Typography, { component: "span", variant: "body2", children: ["Score: ", drill.performance.score, "%"] })] }) }) }, `${drill.id}-${drill.completedAt}`))) })] }) })] })] }) }));
};
