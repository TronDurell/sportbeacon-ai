import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Chip, TablePagination, TextField, InputAdornment, } from '@mui/material';
import { Download as DownloadIcon, Search as SearchIcon, Visibility as ViewIcon, } from '@mui/icons-material';
export const PDFHistory = ({ onPreview, onDownload, }) => {
    const [reports, setReports] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [audioUrl, setAudioUrl] = useState(null);
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch('/api/pdf-reports');
                if (!response.ok)
                    throw new Error('Failed to fetch reports');
                const data = await response.json();
                setReports(data.reports);
            }
            catch (error) {
                console.error('Error fetching PDF reports:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);
    const filteredReports = reports.filter(report => report.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const handleGenerateAudio = async () => {
        try {
            const response = await fetch('/api/audio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: selectedPlayer.id,
                    summary: selectedPlayer.summary,
                }),
            });
            if (!response.ok)
                throw new Error('Failed to generate audio');
            const data = await response.json();
            setAudioUrl(data.url);
        }
        catch (error) {
            console.error('Error generating audio:', error);
        }
    };
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx(Typography, { variant: "h6", children: "PDF Report History" }), _jsx(TextField, { size: "small", placeholder: "Search reports...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), InputProps: {
                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, {}) })),
                        } })] }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Player" }), _jsx(TableCell, { children: "Date" }), _jsx(TableCell, { children: "Key Stats" }), _jsx(TableCell, { children: "Tags" }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsx(TableBody, { children: filteredReports
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((report) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: report.playerName }), _jsx(TableCell, { children: formatDate(report.timestamp) }), _jsx(TableCell, { children: _jsxs(Box, { sx: { display: 'flex', gap: 1, flexWrap: 'wrap' }, children: [report.stats.goalsScored !== undefined && (_jsx(Chip, { size: "small", label: `Goals: ${report.stats.goalsScored}` })), report.stats.assists !== undefined && (_jsx(Chip, { size: "small", label: `Assists: ${report.stats.assists}` })), report.stats.passAccuracy !== undefined && (_jsx(Chip, { size: "small", label: `Pass Acc: ${report.stats.passAccuracy}%` }))] }) }), _jsx(TableCell, { children: _jsx(Box, { sx: { display: 'flex', gap: 0.5, flexWrap: 'wrap' }, children: report.tags.map((tag) => (_jsx(Chip, { size: "small", label: tag, variant: "outlined" }, tag))) }) }), _jsxs(TableCell, { align: "right", children: [_jsx(IconButton, { onClick: () => onPreview(report.url), size: "small", children: _jsx(ViewIcon, {}) }), _jsx(IconButton, { onClick: () => onDownload(report.url, `${report.playerName}_Report_${new Date(report.timestamp).toISOString().split('T')[0]}.pdf`), size: "small", children: _jsx(DownloadIcon, {}) })] })] }, report.id))) })] }) }), _jsx(TablePagination, { rowsPerPageOptions: [5, 10, 25], component: "div", count: filteredReports.length, rowsPerPage: rowsPerPage, page: page, onPageChange: handleChangePage, onRowsPerPageChange: handleChangeRowsPerPage }), audioUrl && (_jsx(Box, { sx: { mt: 2 }, children: _jsx("audio", { controls: true, src: audioUrl }) }))] }));
};
