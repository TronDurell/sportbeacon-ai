import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox, Typography, } from '@mui/material';
import { PictureAsPdf, Download } from '@mui/icons-material';
export const PDFExport = ({ player, evaluation, onExport, isGenerating, }) => {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState({
        includeStats: true,
        includeEvaluation: true,
        includeHistory: true,
        includeMedia: true,
        includeAchievements: true,
    });
    const handleOptionChange = (option) => {
        setOptions((prev) => ({
            ...prev,
            [option]: !prev[option],
        }));
    };
    const handleExport = async () => {
        try {
            await onExport();
            setOpen(false);
        }
        catch (error) {
            console.error('Export failed:', error);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "contained", startIcon: _jsx(PictureAsPdf, {}), onClick: () => setOpen(true), children: "Generate Report" }), _jsxs(Dialog, { open: open, onClose: () => setOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Export Player Report" }), _jsxs(DialogContent, { children: [_jsxs(Typography, { variant: "body2", color: "textSecondary", paragraph: true, children: ["Select the sections to include in the PDF report for", ' ', player.firstName, " ", player.lastName] }), _jsxs(FormGroup, { children: [_jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: options.includeStats, onChange: () => handleOptionChange('includeStats') }), label: "Performance Statistics" }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: options.includeEvaluation, onChange: () => handleOptionChange('includeEvaluation') }), label: "Scout Evaluation" }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: options.includeHistory, onChange: () => handleOptionChange('includeHistory') }), label: "Career History" }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: options.includeMedia, onChange: () => handleOptionChange('includeMedia') }), label: "Media & Highlights" }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: options.includeAchievements, onChange: () => handleOptionChange('includeAchievements') }), label: "Achievements & Badges" })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleExport, variant: "contained", startIcon: isGenerating ? _jsx(CircularProgress, { size: 20 }) : _jsx(Download, {}), disabled: isGenerating, children: isGenerating ? 'Generating...' : 'Export PDF' })] })] })] }));
};
