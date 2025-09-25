import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Grid, Paper, TextField, InputAdornment, List, ListItem, ListItemText, ListItemAvatar, ListItemIcon, Avatar, Typography, IconButton, Drawer, useTheme, useMediaQuery, Fab, Button, CircularProgress, Accordion, AccordionSummary, AccordionDetails, Skeleton, ButtonGroup, LinearProgress, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TableSortLabel, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Alert, Card, CardContent, Tabs, Tab, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Search, FilterList, Share, Menu as MenuIcon, Star, StarBorder, ExpandMore, Download, WhatsApp, LinkedIn, Email, Stars, EmojiEvents, TrendingUp, People, Info, EmojiEvents as TrophyIcon, Visibility as ViewsIcon, WorkspacePremium as BadgeIcon } from '@mui/icons-material';
import { VideoOverlay } from './VideoOverlay';
import { PDFExport } from './PDFExport';
import { PlayerRecap } from './PlayerRecap';
import { useRecruiterExport } from './RecruiterExportModule/useRecruiterExport';
import { generatePDF } from './RecruiterExportModule/PDFExporter';
import { generateAISummary } from './RecruiterExportModule/AIAnalyzer';
import { RadarChart } from './RadarChart';
import { VideoNotes } from './VideoNotes';
import { PDFHistory } from './PDFHistory';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { canReceiveTips } from '@/utils/accessControl';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { doc } from 'firebase/firestore';
import { useReferral } from '@/hooks/useReferral';
import { useCreatorAnalytics } from '@/hooks/useCreatorAnalytics';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PlayerReportPDF } from '@/components/pdf/PlayerReportPDF';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
const pulseAnimation = keyframes `
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;
export const ScoutDashboard = ({ organizationId, scoutId, }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [starredPlayers, setStarredPlayers] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const { generateExport, exportProgress } = useRecruiterExport();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [shareableUrl, setShareableUrl] = useState(null);
    const [isUploadingPDF, setIsUploadingPDF] = useState(false);
    const [exportPanelExpanded, setExportPanelExpanded] = useState(false);
    const [comparisonType, setComparisonType] = useState('none');
    const [comparisonStats, setComparisonStats] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterRole, setFilterRole] = useState('');
    const [filterImprovementArea, setFilterImprovementArea] = useState('');
    const [videoNotes, setVideoNotes] = useState([]);
    const [currentVideoTime, setCurrentVideoTime] = useState(0);
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalTips, setTotalTips] = useState(0);
    const [lastDoc, setLastDoc] = useState(null);
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('weekly');
    const [roleFilter, setRoleFilter] = useState('all');
    const [entries, setEntries] = useState([]);
    // Mock data - replace with actual API calls
    const [players] = useState([
        {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '2000-01-01',
            nationality: 'England',
            height: 180,
            weight: 75,
            preferredFoot: 'right',
            primaryPosition: 'Forward',
            alternatePositions: ['Winger'],
            currentTeam: {
                id: 'team1',
                name: 'FC Example',
                league: 'Premier League',
            },
            stats: {
                gamesPlayed: 25,
                goalsScored: 12,
                assists: 8,
                minutesPlayed: 2250,
                yellowCards: 3,
                redCards: 0,
                passAccuracy: 85,
                shotAccuracy: 68,
                tacklesWon: 45,
                distanceCovered: 245.5,
            },
            history: [],
            watchlist: true,
            priority: 'high',
            status: 'active',
            mediaUrls: {
                profileImage: 'https://example.com/profile.jpg',
                highlightVideos: ['https://example.com/highlight1.mp4'],
            },
        },
        // Add more mock players as needed
    ]);
    // Cleanup effect for blob URL
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, []);
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        // Implement search logic here
    }, []);
    const handlePlayerSelect = useCallback((player) => {
        setSelectedPlayer(player);
        if (isMobile) {
            setDrawerOpen(false);
        }
    }, [isMobile]);
    const handleStarPlayer = useCallback((playerId) => {
        setStarredPlayers(prev => prev.includes(playerId)
            ? prev.filter(id => id !== playerId)
            : [...prev, playerId]);
    }, []);
    const handleExportPDF = useCallback(async () => {
        if (!selectedPlayer)
            return;
        setIsGeneratingPDF(true);
        try {
            // Implement PDF generation logic here
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
            // Handle successful export
        }
        catch (error) {
            console.error('Failed to generate PDF:', error);
        }
        finally {
            setIsGeneratingPDF(false);
        }
    }, [selectedPlayer]);
    const generatePlayerAISummary = async (player) => {
        try {
            const summary = await generateAISummary({
                stats: player.stats,
                history: player.history,
                position: player.primaryPosition,
                age: new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()
            });
            return {
                strengths: summary.strengths,
                improvements: summary.improvements,
                recommendations: summary.recommendations,
                roles: summary.roles
            };
        }
        catch (error) {
            console.error('Failed to generate AI summary:', error);
            return null;
        }
    };
    const uploadPDFToStorage = async (pdfBlob) => {
        const formData = new FormData();
        formData.append('file', pdfBlob, 'player_report.pdf');
        formData.append('playerId', selectedPlayer?.id || '');
        const response = await fetch('/api/upload-pdf', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Failed to upload PDF');
        }
        return response.json();
    };
    const generateAndPreparePDF = async () => {
        if (!selectedPlayer)
            return null;
        // Generate AI summary
        const aiSummary = await generatePlayerAISummary(selectedPlayer);
        // Prepare player data for PDF
        const playerData = {
            player: {
                id: selectedPlayer.id,
                name: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
                position: selectedPlayer.primaryPosition,
                age: new Date().getFullYear() - new Date(selectedPlayer.dateOfBirth).getFullYear(),
                height: `${selectedPlayer.height} cm`,
                weight: `${selectedPlayer.weight} kg`,
                team: selectedPlayer.currentTeam.name,
                level: selectedPlayer.currentTeam.league,
                stats: selectedPlayer.stats,
                percentiles: {}, // Add percentiles if available
                trends: {} // Add trends if available
            },
            drillHistory: [], // Add drill history if available
            aiAnalysis: aiSummary,
            videoClips: selectedPlayer.mediaUrls.highlightVideos.map((url, index) => ({
                id: `clip-${index}`,
                url,
                timestamp: Date.now(),
                description: `Highlight clip ${index + 1}`,
                skillTags: []
            })),
            badges: [] // Add badges if available
        };
        // Generate PDF blob
        return generatePDF([playerData], {
            includeAIAnalysis: true,
            includeVideoClips: true,
            customHeader: 'Scout Report'
        });
    };
    const handlePreviewClick = useCallback(async () => {
        if (!selectedPlayer)
            return;
        setIsGeneratingPreview(true);
        try {
            const pdfBlob = await generateAndPreparePDF();
            if (!pdfBlob)
                return;
            // Cleanup previous URL if exists
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
            // Upload PDF and get shareable URL
            setIsUploadingPDF(true);
            const shareableURL = await uploadPDFToStorage(pdfBlob);
            setShareableUrl(shareableURL);
        }
        catch (error) {
            console.error('Failed to generate PDF preview:', error);
        }
        finally {
            setIsGeneratingPreview(false);
            setIsUploadingPDF(false);
        }
    }, [selectedPlayer, pdfUrl]);
    const handleDownloadClick = useCallback(async () => {
        if (!selectedPlayer)
            return;
        setIsGeneratingPreview(true);
        try {
            const pdfBlob = await generateAndPreparePDF();
            if (!pdfBlob)
                return;
            // Create a download link
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedPlayer.firstName}_${selectedPlayer.lastName}_Report.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Failed to download PDF:', error);
        }
        finally {
            setIsGeneratingPreview(false);
        }
    }, [selectedPlayer]);
    const handleShare = useCallback((platform) => {
        if (!shareableUrl)
            return;
        const text = `Check out this player report for ${selectedPlayer?.firstName} ${selectedPlayer?.lastName}`;
        const url = shareableUrl.url;
        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`);
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
                break;
            case 'email':
                window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}: ${url}`)}`);
                break;
        }
    }, [shareableUrl, selectedPlayer]);
    const fetchComparisonStats = useCallback(async (type) => {
        try {
            const response = await fetch(`/api/stats/${type}-averages?teamId=${selectedPlayer?.currentTeam.id}`);
            if (!response.ok)
                throw new Error(`Failed to fetch ${type} averages`);
            const data = await response.json();
            setComparisonStats(data.stats);
        }
        catch (error) {
            console.error(`Error fetching ${type} averages:`, error);
            setComparisonStats(null);
        }
    }, [selectedPlayer]);
    const handleComparisonChange = useCallback((type) => {
        setComparisonType(type);
        if (type !== 'none') {
            fetchComparisonStats(type);
        }
        else {
            setComparisonStats(null);
        }
    }, [fetchComparisonStats]);
    const handleAddVideoNote = useCallback((note) => {
        setVideoNotes(prev => [...prev, {
                ...note,
                id: uuidv4(),
                createdAt: new Date()
            }]);
    }, []);
    const handleDeleteVideoNote = useCallback((id) => {
        setVideoNotes(prev => prev.filter(note => note.id !== id));
    }, []);
    const handleVideoTimeUpdate = useCallback((time) => {
        setCurrentVideoTime(time);
    }, []);
    const handleVideoSeek = useCallback((time) => {
        // Implement video seeking logic in VideoOverlay
    }, []);
    const sortPlayers = useCallback((players) => {
        return [...players].sort((a, b) => {
            let valueA, valueB;
            switch (sortBy) {
                case 'name':
                    valueA = `${a.firstName} ${a.lastName}`;
                    valueB = `${b.firstName} ${b.lastName}`;
                    break;
                case 'age':
                    valueA = new Date(a.dateOfBirth).getTime();
                    valueB = new Date(b.dateOfBirth).getTime();
                    break;
                case 'performance':
                    valueA = calculatePerformanceScore(a);
                    valueB = calculatePerformanceScore(b);
                    break;
                default:
                    return 0;
            }
            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            }
            else {
                return valueA < valueB ? 1 : -1;
            }
        });
    }, [sortBy, sortOrder]);
    const filterPlayers = useCallback((players) => {
        return players.filter(player => {
            if (filterRole && !player.primaryPosition.toLowerCase().includes(filterRole.toLowerCase())) {
                return false;
            }
            if (filterImprovementArea) {
                // Implement improvement area filtering logic
                return true;
            }
            return true;
        });
    }, [filterRole, filterImprovementArea]);
    const filteredPlayers = useMemo(() => {
        let filtered = players.filter(player => `${player.firstName} ${player.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));
        filtered = filterPlayers(filtered);
        return sortPlayers(filtered);
    }, [players, searchQuery, filterPlayers, sortPlayers]);
    const drawerContent = (_jsxs(Box, { sx: { width: 320, p: 2 }, children: [_jsx(TextField, { fullWidth: true, placeholder: "Search players...", value: searchQuery, onChange: (e) => handleSearch(e.target.value), InputProps: {
                    startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(Search, {}) })),
                    endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { size: "small", children: _jsx(FilterList, {}) }) })),
                } }), _jsx(List, { sx: { mt: 2 }, children: filteredPlayers.map((player) => (_jsxs(ListItem, { button: true, selected: selectedPlayer?.id === player.id, onClick: () => handlePlayerSelect(player), children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { src: player.mediaUrls.profileImage }) }), _jsx(ListItemText, { primary: `${player.firstName} ${player.lastName}`, secondary: `${player.currentTeam.name} • ${player.primaryPosition}` }), _jsx(IconButton, { onClick: (e) => {
                                e.stopPropagation();
                                handleStarPlayer(player.id);
                            }, children: starredPlayers.includes(player.id) ? (_jsx(Star, { color: "primary" })) : (_jsx(StarBorder, {})) })] }, player.id))) })] }));
    const fetchTips = async () => {
        try {
            setLoading(true);
            const tipsRef = collection(db, 'tips');
            let q = query(tipsRef, where('profileId', '==', scoutId), orderBy(sortBy, sortOrder), limit(rowsPerPage));
            if (page > 0 && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }
            const snapshot = await getDocs(q);
            const tipDocs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTips(tipDocs);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            // Get total count
            const countSnapshot = await getDocs(query(tipsRef, where('profileId', '==', scoutId)));
            setTotalTips(countSnapshot.size);
        }
        catch (error) {
            console.error('Error fetching tips:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTips();
    }, [scoutId, page, rowsPerPage, sortBy, sortOrder]);
    const handleSort = (field) => {
        const isAsc = sortBy === field && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortBy(field);
        setPage(0);
    };
    const getMethodColor = (method) => {
        switch (method) {
            case 'stripe': return 'primary';
            case 'crypto': return 'secondary';
            default: return 'default';
        }
    };
    // Handle referral code from URL
    useEffect(() => {
        const ref = router.query.ref;
        if (ref && typeof ref === 'string') {
            localStorage.setItem('refCode', ref);
        }
    }, [router.query.ref]);
    // Query for referral stats
    const { stats } = useReferral(scoutId);
    // Query for creator analytics
    const { data: analyticsData, isLoading: isAnalyticsLoading } = useCreatorAnalytics(scoutId);
    const canExport = ['coach', 'scout'].includes(user?.role || '');
    const fetchLeaderboardData = async () => {
        setLoading(true);
        try {
            const summariesRef = collection(db, 'weeklySummaries');
            let q = query(summariesRef);
            // Apply role filter
            if (roleFilter !== 'all') {
                q = query(q, where('role', '==', roleFilter));
            }
            // Apply sorting based on active tab
            const sortField = getSortField(activeTab);
            q = query(q, orderBy(sortField, 'desc'), limit(50));
            const snapshot = await getDocs(q);
            const leaderboardData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEntries(leaderboardData);
        }
        catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getSortField = (tab) => {
        switch (tab) {
            case 'weekly': return 'stats.weeklyTips';
            case 'views': return 'stats.viewCount';
            case 'shares': return 'stats.shareCount';
            case 'improved': return 'stats.streakScore';
            case 'badges': return 'stats.badge.percentile';
            default: return 'stats.weeklyTips';
        }
    };
    const getBadgeColor = (tier) => {
        switch (tier) {
            case 'Gold': return theme.palette.warning.main;
            case 'Silver': return theme.palette.grey[400];
            default: return theme.palette.warning.dark;
        }
    };
    const renderStatValue = (entry) => {
        switch (activeTab) {
            case 'weekly':
                return `$${entry.stats.weeklyTips.toFixed(2)}`;
            case 'views':
                return `${entry.stats.viewCount} views`;
            case 'shares':
                return `${entry.stats.shareCount} shares`;
            case 'improved':
                return `${entry.stats.streakScore} streak`;
            case 'badges':
                return (_jsx(Chip, { label: `${entry.stats.badge.tier} (Top ${entry.stats.badge.percentile}%)`, sx: { backgroundColor: getBadgeColor(entry.stats.badge.tier) } }));
            default:
                return '';
        }
    };
    const renderSkeletons = () => (Array(5).fill(0).map((_, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx(Skeleton, { variant: "text", width: 30 }) }), _jsx(TableCell, { children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Skeleton, { variant: "circular", width: 40, height: 40 }), _jsx(Skeleton, { variant: "text", width: 120 })] }) }), _jsx(TableCell, { children: _jsx(Skeleton, { variant: "text", width: 80 }) }), _jsx(TableCell, { children: _jsx(Skeleton, { variant: "text", width: 100 }) }), _jsx(TableCell, { children: _jsx(Skeleton, { variant: "rectangular", width: 100, height: 36 }) })] }, index))));
    return (_jsxs(Box, { sx: { display: 'flex', height: '100vh' }, children: [isMobile ? (_jsx(Drawer, { anchor: "left", open: drawerOpen, onClose: () => setDrawerOpen(false), children: drawerContent })) : (_jsx(Paper, { elevation: 2, sx: {
                    width: 320,
                    height: '100%',
                    overflow: 'auto',
                    borderRadius: 0,
                }, children: drawerContent })), _jsxs(Box, { sx: { flex: 1, p: 3, overflow: 'auto' }, children: [isMobile && (_jsx(IconButton, { sx: { mb: 2 }, onClick: () => setDrawerOpen(true), children: _jsx(MenuIcon, {}) })), selectedPlayer ? (_jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(VideoOverlay, { player: selectedPlayer, videoUrl: selectedPlayer.mediaUrls.highlightVideos[0], markers: [], onMarkerAdd: () => { }, onMarkerClick: () => { } }) }), _jsx(Grid, { item: true, xs: 12, md: 8, children: _jsx(PlayerRecap, { player: selectedPlayer, evaluation: undefined }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsxs(Box, { sx: { position: 'sticky', top: theme.spacing(3) }, children: [_jsx(PDFExport, { player: selectedPlayer, evaluation: undefined, onExport: handleExportPDF, isGenerating: isGeneratingPDF }), _jsxs(Fab, { color: "primary", variant: "extended", sx: { mt: 2 }, onClick: () => {
                                                // Implement share functionality
                                            }, children: [_jsx(Share, { sx: { mr: 1 } }), "Share Report"] })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(RadarChart, { playerStats: selectedPlayer.stats, playerPercentiles: {}, comparisonStats: comparisonStats, comparisonType: comparisonType, onComparisonChange: handleComparisonChange }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(VideoNotes, { currentTime: currentVideoTime, onSeek: handleVideoSeek, onAddNote: handleAddVideoNote, onDeleteNote: handleDeleteVideoNote, notes: videoNotes }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(PDFHistory, { onPreview: (url) => {
                                        if (pdfUrl) {
                                            URL.revokeObjectURL(pdfUrl);
                                        }
                                        setPdfUrl(url);
                                    }, onDownload: (url, filename) => {
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = filename;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    } }) })] })) : (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", children: _jsx(Typography, { variant: "h6", color: "text.secondary", children: "Select a player to view their profile" }) })), selectedPlayer && (_jsx(Box, { sx: { mt: 3 }, children: _jsxs(Accordion, { expanded: exportPanelExpanded, onChange: () => setExportPanelExpanded(!exportPanelExpanded), children: [_jsx(AccordionSummary, { expandIcon: _jsx(ExpandMore, {}), children: _jsx(Typography, { children: "Export Options" }) }), _jsxs(AccordionDetails, { children: [_jsx(Box, { sx: { display: 'flex', gap: 2, mb: 2 }, children: canExport ? (_jsx(PDFDownloadLink, { document: _jsx(PlayerReportPDF, { player: selectedPlayer, analysis: undefined, timestamp: new Date() }), fileName: `sportbeacon-${selectedPlayer.firstName.toLowerCase().replace(/\s+/g, '-')}-${selectedPlayer.id}.pdf`, children: ({ loading, error }) => (_jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(Download, {}), disabled: loading, sx: { mt: 2 }, children: loading ? 'Generating Report...' : 'Export Player Report' })) })) : (_jsx(Tooltip, { title: "Only coaches and scouts can export reports", children: _jsx("span", { children: _jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(Download, {}), disabled: true, sx: { mt: 2 }, children: "Export Player Report" }) }) })) }), isGeneratingPreview && !pdfUrl && (_jsx(Skeleton, { variant: "rectangular", width: "100%", height: 600, sx: { borderRadius: 1 } })), pdfUrl && (_jsxs(_Fragment, { children: [_jsx(Box, { sx: { mt: 2, height: 600, border: 1, borderColor: 'divider', borderRadius: 1 }, children: _jsx("iframe", { src: pdfUrl, style: {
                                                            width: '100%',
                                                            height: '100%',
                                                            border: 'none'
                                                        }, title: "PDF Preview" }) }), isUploadingPDF ? (_jsxs(Box, { sx: { mt: 2, display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(CircularProgress, { size: 20 }), _jsx(Typography, { children: "Preparing sharing options..." })] })) : shareableUrl && (_jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Share Report" }), _jsxs(ButtonGroup, { variant: "outlined", size: "small", children: [_jsx(IconButton, { onClick: () => handleShare('whatsapp'), children: _jsx(WhatsApp, {}) }), _jsx(IconButton, { onClick: () => handleShare('linkedin'), children: _jsx(LinkedIn, {}) }), _jsx(IconButton, { onClick: () => handleShare('email'), children: _jsx(Email, {}) })] })] }))] }))] })] }) })), _jsxs(Box, { sx: { mt: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Tip History" }), loading && page === 0 ? (_jsx(Skeleton, {})) : (_jsx(CreatorInvoiceTable, { profileId: scoutId }))] }), isAnalyticsLoading ? (_jsx(Skeleton, { variant: "rounded", height: 300 })) : (_jsx(CreatorAnalytics, { profileId: scoutId })), _jsxs(Box, { sx: { mt: 3 }, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Leaderboard" }), _jsx(Box, { sx: { mb: 3 }, children: _jsxs(ToggleButtonGroup, { value: roleFilter, exclusive: true, onChange: (_, value) => value && setRoleFilter(value), size: "small", children: [_jsx(ToggleButton, { value: "all", children: "All" }), _jsx(ToggleButton, { value: "player", children: "Players Only" }), _jsx(ToggleButton, { value: "coach", children: "Coaches Only" })] }) }), _jsxs(Tabs, { value: activeTab, onChange: (_, value) => setActiveTab(value), variant: "scrollable", scrollButtons: "auto", children: [_jsx(Tab, { icon: _jsx(TrophyIcon, {}), label: "Weekly Tips", value: "weekly" }), _jsx(Tab, { icon: _jsx(ViewsIcon, {}), label: "Views", value: "views" }), _jsx(Tab, { icon: _jsx(ShareIcon, {}), label: "Shares", value: "shares" }), _jsx(Tab, { icon: _jsx(TrendingIcon, {}), label: "Most Improved", value: "improved" }), _jsx(Tab, { icon: _jsx(BadgeIcon, {}), label: "Top Badge Holders", value: "badges" })] })] }), _jsx(TableContainer, { component: Paper, elevation: 2, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Rank" }), _jsx(TableCell, { children: "Player" }), _jsx(TableCell, { children: "Stats" }), _jsx(TableCell, { children: "Badge" }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsx(TableBody, { children: loading ? (renderSkeletons()) : (entries.map((entry, index) => (_jsxs(TableRow, { sx: {
                                            backgroundColor: entry.id === user?.uid
                                                ? alpha(theme.palette.primary.main, 0.1)
                                                : 'inherit'
                                        }, children: [_jsx(TableCell, { children: _jsxs(Typography, { variant: "h6", children: ["#", index + 1] }) }), _jsx(TableCell, { children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Avatar, { src: entry.avatarUrl, alt: entry.name }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", children: entry.name }), _jsx(Chip, { label: entry.role, size: "small", color: entry.role === 'coach' ? 'primary' : 'secondary' })] })] }) }), _jsx(TableCell, { children: renderStatValue(entry) }), _jsx(TableCell, { children: _jsx(Chip, { label: entry.stats.badge.tier, sx: {
                                                        backgroundColor: getBadgeColor(entry.stats.badge.tier),
                                                        color: 'white'
                                                    } }) }), _jsx(TableCell, { align: "right", children: _jsx(Link, { href: `/scout/${entry.id}`, passHref: true, children: _jsx(Button, { variant: "outlined", size: "small", children: "View Profile" }) }) })] }, entry.id)))) })] }) })] })] }));
};
export const CreatorInvoiceTable = ({ profileId }) => {
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortField, setSortField] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState('desc');
    const [totalTips, setTotalTips] = useState(0);
    const [lastDoc, setLastDoc] = useState(null);
    const fetchTips = async () => {
        try {
            setLoading(true);
            const tipsRef = collection(db, 'tips');
            let q = query(tipsRef, where('profileId', '==', profileId), orderBy(sortField, sortOrder), limit(rowsPerPage));
            if (page > 0 && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }
            const snapshot = await getDocs(q);
            const tipDocs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTips(tipDocs);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            // Get total count
            const countSnapshot = await getDocs(query(tipsRef, where('profileId', '==', profileId)));
            setTotalTips(countSnapshot.size);
        }
        catch (error) {
            console.error('Error fetching tips:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTips();
    }, [profileId, page, rowsPerPage, sortField, sortOrder]);
    const handleSort = (field) => {
        const isAsc = sortField === field && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortField(field);
        setPage(0);
    };
    if (loading && page === 0) {
        return (_jsx(TableContainer, { component: Paper, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Date" }), _jsx(TableCell, { align: "right", children: "Amount" }), _jsx(TableCell, { align: "right", children: "Multiplier" }), _jsx(TableCell, { children: "Method" }), _jsx(TableCell, { children: "Status" })] }) }), _jsx(TableBody, { children: [...Array(5)].map((_, i) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx(Skeleton, {}) }), _jsx(TableCell, { children: _jsx(Skeleton, {}) }), _jsx(TableCell, { children: _jsx(Skeleton, {}) }), _jsx(TableCell, { children: _jsx(Skeleton, {}) }), _jsx(TableCell, { children: _jsx(Skeleton, {}) })] }, i))) })] }) }));
    }
    return (_jsxs(Paper, { children: [_jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx(TableSortLabel, { active: sortField === 'timestamp', direction: sortOrder, onClick: () => handleSort('timestamp'), children: "Date" }) }), _jsx(TableCell, { align: "right", children: _jsx(TableSortLabel, { active: sortField === 'amount', direction: sortOrder, onClick: () => handleSort('amount'), children: "Amount" }) }), _jsx(TableCell, { align: "right", children: _jsx(TableSortLabel, { active: sortField === 'multiplier', direction: sortOrder, onClick: () => handleSort('multiplier'), children: "Multiplier" }) }), _jsx(TableCell, { children: "Method" }), _jsx(TableCell, { children: "Status" })] }) }), _jsx(TableBody, { children: tips.map((tip) => (_jsxs(TableRow, { "data-testid": "invoice-row", children: [_jsxs(TableCell, { "data-testid": "amount", children: ["$", tip.amount.toFixed(2)] }), _jsx(TableCell, { "data-testid": "method", children: tip.method }), _jsxs(TableCell, { "data-testid": "multiplier", children: [tip.multiplier.toFixed(1), "x"] }), _jsx(TableCell, { children: _jsx(Chip, { label: tip.status, color: tip.status === 'completed' ? 'success' : 'warning', size: "small" }) })] }, tip.id))) })] }) }), _jsx(TablePagination, { component: "div", count: totalTips, page: page, onPageChange: (_, newPage) => setPage(newPage), rowsPerPage: rowsPerPage, onRowsPerPageChange: (e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                } })] }));
};
export const canReceiveTips = (profile) => {
    if (!profile)
        return false;
    return profile.isVerified && profile.payoutEnabled;
};
export const getPayoutStatus = (profile) => {
    if (!profile.isVerified) {
        return { canPayout: false, reason: 'Profile not verified' };
    }
    if (!profile.payoutEnabled) {
        return { canPayout: false, reason: 'Payout not enabled' };
    }
    if (!profile.payoutSettings?.stripeConnected && !profile.payoutSettings?.cryptoWalletVerified) {
        return { canPayout: false, reason: 'No payment method configured' };
    }
    return { canPayout: true };
};
export const TipModal = ({ open, onClose, recipientProfile, currentUserId }) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('stripe');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    if (!canReceiveTips(recipientProfile)) {
        return null;
    }
    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);
            const tipAmount = parseFloat(amount);
            if (isNaN(tipAmount) || tipAmount <= 0) {
                throw new Error('Please enter a valid amount');
            }
            // Create tip document in Firestore
            const tipRef = doc(db, 'tips', `tip_${Date.now()}`);
            await setDoc(tipRef, {
                amount: tipAmount,
                method,
                senderId: currentUserId,
                recipientId: recipientProfile.id,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Update tip status to completed
            await setDoc(tipRef, {
                status: 'completed',
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast.success('Tip sent successfully!');
            onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process tip');
            toast.error('Failed to send tip');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Dialog, { "data-testid": "TipModal", open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, children: [_jsxs(DialogTitle, { "data-testid": "TipModal-title", children: ["Send Tip to ", recipientProfile.name] }), _jsx(DialogContent, { children: _jsxs(Box, { sx: { my: 2 }, children: [error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), _jsx(TextField, { label: "Amount", value: amount, onChange: (e) => setAmount(e.target.value), type: "number", fullWidth: true, required: true, InputProps: {
                                startAdornment: _jsx(InputAdornment, { position: "start", children: "$" })
                            }, sx: { mb: 2 } }), _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Payment Method" }), _jsxs(Select, { "data-testid": "method-select", value: method, onChange: (e) => setMethod(e.target.value), label: "Payment Method", children: [_jsx(MenuItem, { value: "stripe", children: "Stripe" }), _jsx(MenuItem, { value: "crypto", children: "Cryptocurrency" })] })] })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, disabled: loading, children: "Cancel" }), _jsx(LoadingButton, { onClick: handleSubmit, loading: loading, variant: "contained", color: "primary", "data-testid": "submit-tip", children: "Send Tip" })] })] }));
};
const DAILY_TIP_LIMIT = 10;
export const useEarnings = (profileId) => {
    return useQuery(['earnings', profileId], async () => {
        const tipsRef = collection(db, 'tips');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Get all completed tips
        const tipsQuery = query(tipsRef, where('recipientId', '==', profileId), where('status', '==', 'completed'), orderBy('createdAt', 'desc'));
        // Get today's tips for limit calculation
        const todayTipsQuery = query(tipsRef, where('recipientId', '==', profileId), where('createdAt', '>=', today));
        const [tipsSnapshot, todayTipsSnapshot] = await Promise.all([
            getDocs(tipsQuery),
            getDocs(todayTipsQuery)
        ]);
        const tipHistory = tipsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const totalEarnings = tipHistory.reduce((sum, tip) => sum + (tip.amount * tip.multiplier), 0);
        const pendingPayouts = tipHistory
            .filter(tip => !tip.payoutId)
            .reduce((sum, tip) => sum + (tip.amount * tip.multiplier), 0);
        // Calculate remaining daily limit
        const tipsToday = todayTipsSnapshot.size;
        const remainingTips = Math.max(0, DAILY_TIP_LIMIT - tipsToday);
        // Calculate when limit resets
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return {
            totalEarnings,
            pendingPayouts,
            streakMultiplier: tipHistory[0]?.multiplier || 1,
            tipHistory,
            dailyLimit: {
                remaining: remainingTips,
                total: DAILY_TIP_LIMIT,
                resetsAt: tomorrow
            }
        };
    }, {
        staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
        cacheTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
    });
};
// Mutation hook for triggering tips
export const useTriggerTip = () => {
    const queryClient = useQueryClient();
    return useMutation(async ({ profileId, amount, method }) => {
        // Check daily limit
        const { dailyLimit } = await queryClient.fetchQuery(['earnings', profileId]);
        if (dailyLimit.remaining <= 0) {
            throw new Error(`Daily tip limit reached. Resets at ${dailyLimit.resetsAt.toLocaleTimeString()}`);
        }
        const response = await fetch('/api/tips/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId, amount, method })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        return response.json();
    }, {
        onSuccess: (_, { profileId }) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries(['earnings', profileId]);
            queryClient.invalidateQueries(['streaks', profileId]);
        }
    });
};
// Hook for exporting earnings data
export const useExportEarnings = (profileId) => {
    const { data: earnings } = useEarnings(profileId);
    const exportToCSV = () => {
        if (!earnings)
            return;
        const headers = ['Date', 'Amount', 'Multiplier', 'Method', 'Status'];
        const rows = earnings.tipHistory.map(tip => [
            new Date(tip.createdAt).toLocaleDateString(),
            tip.amount.toFixed(2),
            tip.multiplier.toFixed(1),
            tip.method,
            tip.status
        ]);
        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `earnings_${profileId}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    return { exportToCSV };
};
export const ReferralModal = ({ open, onClose, profile }) => {
    const { stats } = useReferral(profile.id);
    const referralUrl = `${window.location.origin}/signup?ref=${profile.id}`;
    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralUrl);
    };
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join me on SportBeacon',
                    text: 'Use my referral code to get started!',
                    url: referralUrl
                });
            }
            catch (err) {
                console.error('Error sharing:', err);
            }
        }
        else {
            handleCopyLink();
        }
    };
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Refer & Earn Rewards" }), _jsxs(DialogContent, { children: [_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Your Referral Code" }), _jsx(TextField, { fullWidth: true, value: referralUrl, InputProps: {
                                    readOnly: true,
                                    endAdornment: (_jsx(Button, { variant: "contained", onClick: handleCopyLink, startIcon: _jsx(Share, {}), children: "Copy" }))
                                } })] }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Your Progress" }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 1 }, children: [_jsx(Stars, { color: "primary", sx: { mr: 1 } }), _jsxs(Typography, { variant: "subtitle1", children: [stats?.currentTier, " Tier"] })] }), _jsx(LinearProgress, { variant: "determinate", value: stats?.nextTierProgress || 0, sx: { mb: 1 } }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: `${stats?.activeReferrals || 0} active referrals - ${stats?.totalRewards || 0} rewards earned` })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Tier Benefits" }), _jsxs(List, { children: [_jsxs(ListItem, { children: [_jsx(ListItemIcon, { children: _jsx(EmojiEvents, { color: "action" }) }), _jsx(ListItemText, { primary: "Bronze Tier (3+ referrals)", secondary: "1.2x multiplier on tips" }), _jsx(Chip, { label: stats?.currentTier === 'Bronze' ? 'Current' : 'Locked', color: stats?.currentTier === 'Bronze' ? 'primary' : 'default', size: "small" })] }), _jsxs(ListItem, { children: [_jsx(ListItemIcon, { children: _jsx(EmojiEvents, { color: "primary" }) }), _jsx(ListItemText, { primary: "Silver Tier (5+ referrals)", secondary: "1.5x multiplier on tips" }), _jsx(Chip, { label: stats?.currentTier === 'Silver' ? 'Current' : 'Locked', color: stats?.currentTier === 'Silver' ? 'primary' : 'default', size: "small" })] }), _jsxs(ListItem, { children: [_jsx(ListItemIcon, { children: _jsx(EmojiEvents, { color: "secondary" }) }), _jsx(ListItemText, { primary: "Gold Tier (10+ referrals)", secondary: "2x multiplier on tips" }), _jsx(Chip, { label: stats?.currentTier === 'Gold' ? 'Current' : 'Locked', color: stats?.currentTier === 'Gold' ? 'primary' : 'default', size: "small" })] })] })] })] })] }));
};
const CreatorAnalytics = ({ profileId }) => {
    const { data: analyticsData, isLoading: isAnalyticsLoading } = useCreatorAnalytics(profileId);
    if (isAnalyticsLoading || !analyticsData) {
        return (_jsxs(Grid, { container: true, spacing: 2, children: [[...Array(4)].map((_, i) => (_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Skeleton, { variant: "rounded", height: 140 }) }, i))), _jsx(Grid, { item: true, xs: 12, children: _jsx(Skeleton, { variant: "rounded", height: 300 }) })] }));
    }
    const chartData = {
        labels: analyticsData.tipVolumeOverTime.map(p => p.date),
        datasets: [
            {
                label: 'Weekly Tips',
                data: analyticsData.tipVolumeOverTime.map(p => p.amount),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const dataPoint = analyticsData.tipVolumeOverTime[context.dataIndex];
                        return [
                            `Amount: $${dataPoint.amount.toFixed(2)}`,
                            `Tips: ${dataPoint.count}`
                        ];
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return `$${Number(value)}`;
                    }
                }
            }
        }
    };
    return (_jsx(Box, { sx: { mt: 3 }, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(StatCard, { title: "Monthly Revenue", value: `$${analyticsData.mrr.toFixed(2)}`, icon: _jsx(TrendingUp, {}), tooltip: "Revenue from the current month", color: "success.main" }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(StatCard, { title: "Total Tips", value: analyticsData.totalTips, icon: _jsx(Stars, {}), tooltip: "Total number of tips received" }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(StatCard, { title: "Active Referrals", value: `${analyticsData.referrals.active}/${analyticsData.referrals.total}`, icon: _jsx(People, {}), tooltip: "Active referrals out of total referrals" }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Typography, { variant: "subtitle2", color: "text.secondary", children: ["Progress to ", analyticsData.badgeProgress.next] }), _jsx(Box, { sx: { mt: 1, mb: 1 }, children: _jsx(LinearProgress, { variant: "determinate", value: analyticsData.badgeProgress.progress, sx: { height: 8, borderRadius: 4 } }) }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [analyticsData.badgeProgress.progress.toFixed(0), "% Complete"] })] }) }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Tip Volume Trend" }), _jsx(Box, { sx: { height: 300 }, children: _jsx(Line, { data: chartData, options: chartOptions }) })] }) }) })] }) }));
};
export default CreatorAnalytics;
// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);
const StatCard = ({ title, value, icon, tooltip, color = 'primary.main' }) => (_jsx(Card, { component: motion.div, whileHover: { y: -4 }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { children: [_jsxs(Typography, { variant: "subtitle2", color: "text.secondary", children: [title, tooltip && (_jsx(Tooltip, { title: tooltip, children: _jsx(IconButton, { size: "small", children: _jsx(Info, { fontSize: "small" }) }) }))] }), _jsx(Typography, { variant: "h5", sx: { color }, children: value })] }), _jsx(Box, { sx: { color }, children: icon })] }) }) }));
