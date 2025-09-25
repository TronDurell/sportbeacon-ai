import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
// import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, IconButton, Tooltip, } from '@mui/material';
import { Download, Share, FileCopy, Email, WhatsApp, LinkedIn, } from '@mui/icons-material';
import { PDFTemplate } from './PDFTemplate';
export const ScoutReportExport = ({ player, badges, aiAnalysis, videoSnapshots, drillHistory, organizationLogo, }) => {
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const handleShare = async () => {
        setIsGenerating(true);
        try {
            // Generate PDF blob
            const pdfDoc = (_jsx(PDFTemplate, { player: player, badges: badges, aiRecap: aiAnalysis, videoSnapshots: videoSnapshots, drillHistory: drillHistory, organizationLogo: organizationLogo }));
            const blob = await pdf(pdfDoc).toBlob();
            // Upload to temporary storage and get shareable link
            const formData = new FormData();
            formData.append('file', blob, `${player.firstName}_${player.lastName}_Scout_Report.pdf`);
            // Replace with your actual API endpoint
            const response = await fetch('/api/reports/share', {
                method: 'POST',
                body: formData,
            });
            const { url } = await response.json();
            setShareUrl(url);
            setShareDialogOpen(true);
        }
        catch (error) {
            console.error('Failed to generate shareable report:', error);
        }
        finally {
            setIsGenerating(false);
        }
    };
    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
    };
    const handleEmailShare = () => {
        const subject = `Scout Report - ${player.firstName} ${player.lastName}`;
        const body = `Check out this scouting report:\n\n${shareUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
    return (_jsxs(Box, { children: [_jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(PDFDownloadLink, { document: _jsx(PDFTemplate, { player: player, badges: badges, aiRecap: aiAnalysis, videoSnapshots: videoSnapshots, drillHistory: drillHistory, organizationLogo: organizationLogo }), fileName: `${player.firstName}_${player.lastName}_Scout_Report.pdf`, children: ({ loading }) => (_jsx(Button, { variant: "contained", startIcon: _jsx(Download, {}), disabled: loading, children: loading ? 'Preparing...' : 'Download PDF' })) }), _jsx(Button, { variant: "outlined", startIcon: _jsx(Share, {}), onClick: handleShare, disabled: isGenerating, children: isGenerating ? 'Generating...' : 'Share Report' })] }), _jsxs(Dialog, { open: shareDialogOpen, onClose: () => setShareDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Share Scout Report" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 3, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Report Link" }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(Typography, { variant: "body2", sx: {
                                                        flex: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        bgcolor: 'grey.100',
                                                        p: 1,
                                                        borderRadius: 1,
                                                    }, children: shareUrl }), _jsx(Tooltip, { title: "Copy link", children: _jsx(IconButton, { onClick: handleCopyLink, size: "small", children: _jsx(FileCopy, {}) }) })] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Share via" }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: "Email", children: _jsx(IconButton, { onClick: handleEmailShare, children: _jsx(Email, {}) }) }), _jsx(Tooltip, { title: "WhatsApp", children: _jsx(IconButton, { onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Scout Report - ${player.firstName} ${player.lastName}\n${shareUrl}`)}`), children: _jsx(WhatsApp, {}) }) }), _jsx(Tooltip, { title: "LinkedIn", children: _jsx(IconButton, { onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`), children: _jsx(LinkedIn, {}) }) })] })] })] }) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setShareDialogOpen(false), children: "Close" }) })] })] }));
};
