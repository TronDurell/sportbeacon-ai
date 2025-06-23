import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    IconButton,
    Drawer,
    useTheme,
    useMediaQuery,
    Fab,
    Divider,
    Button,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Skeleton,
    ButtonGroup,
    LinearProgress,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Card,
    CardContent,
    Container,
    Tabs,
    Tab,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import {
    Search,
    FilterList,
    Share,
    Menu as MenuIcon,
    Star,
    StarBorder,
    ExpandMore,
    Download,
    WhatsApp,
    LinkedIn,
    Email,
    Stars,
    EmojiEvents,
    TrendingUp,
    People,
    Info,
    EmojiEvents as TrophyIcon,
    Visibility as ViewsIcon,
    WorkspacePremium as BadgeIcon
} from '@mui/icons-material';
import { VideoOverlay } from './VideoOverlay';
import { PDFExport } from './PDFExport';
import { PlayerRecap } from './PlayerRecap';
import { ScoutPlayer } from '../../types/player';
import { useRecruiterExport } from './RecruiterExportModule/useRecruiterExport';
import { generatePDF } from './RecruiterExportModule/PDFExporter';
import { generateAISummary } from './RecruiterExportModule/AIAnalyzer';
import { RadarChart } from './RadarChart';
import { VideoNotes } from './VideoNotes';
import { PDFHistory } from './PDFHistory';
import { v4 as uuidv4 } from 'uuid';
import { useLikeStreaks } from '@/hooks/useLikeStreaks';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TipRecord } from '@/types/creator';
import { Profile } from '@/types/profile';
import { canReceiveTips } from '@/utils/accessControl';
import { toast } from 'react-hot-toast';
import { TipModal } from './earnings/TipModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useReferral } from '@/hooks/useReferral';
import { ReferralModal } from './earnings/ReferralModal';
import { useCreatorAnalytics } from '@/hooks/useCreatorAnalytics';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CreatorAnalytics } from '../earnings/CreatorAnalytics';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PlayerReportPDF } from '@/components/pdf/PlayerReportPDF';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface ScoutDashboardProps {
    organizationId: string;
    scoutId: string;
}

interface ShareableURL {
    url: string;
    expiresAt: Date;
}

const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

export const ScoutDashboard: React.FC<ScoutDashboardProps> = ({
    organizationId,
    scoutId,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedPlayer, setSelectedPlayer] = useState<ScoutPlayer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [starredPlayers, setStarredPlayers] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { generateExport, exportProgress } = useRecruiterExport();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [shareableUrl, setShareableUrl] = useState<ShareableURL | null>(null);
    const [isUploadingPDF, setIsUploadingPDF] = useState(false);
    const [exportPanelExpanded, setExportPanelExpanded] = useState(false);
    const [comparisonType, setComparisonType] = useState<'team' | 'league' | 'none'>('none');
    const [comparisonStats, setComparisonStats] = useState<Record<string, number> | null>(null);
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [filterRole, setFilterRole] = useState<string>('');
    const [filterImprovementArea, setFilterImprovementArea] = useState<string>('');
    const [videoNotes, setVideoNotes] = useState<VideoNote[]>([]);
    const [currentVideoTime, setCurrentVideoTime] = useState(0);
    const [tips, setTips] = useState<TipRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalTips, setTotalTips] = useState(0);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabValue>('weekly');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

    // Mock data - replace with actual API calls
    const [players] = useState<ScoutPlayer[]>([
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

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        // Implement search logic here
    }, []);

    const handlePlayerSelect = useCallback((player: ScoutPlayer) => {
        setSelectedPlayer(player);
        if (isMobile) {
            setDrawerOpen(false);
        }
    }, [isMobile]);

    const handleStarPlayer = useCallback((playerId: string) => {
        setStarredPlayers(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    }, []);

    const handleExportPDF = useCallback(async () => {
        if (!selectedPlayer) return;
        setIsGeneratingPDF(true);
        try {
            // Implement PDF generation logic here
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
            // Handle successful export
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    }, [selectedPlayer]);

    const generatePlayerAISummary = async (player: ScoutPlayer) => {
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
        } catch (error) {
            console.error('Failed to generate AI summary:', error);
            return null;
        }
    };

    const uploadPDFToStorage = async (pdfBlob: Blob): Promise<ShareableURL> => {
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
        if (!selectedPlayer) return null;

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
        if (!selectedPlayer) return;

        setIsGeneratingPreview(true);
        try {
            const pdfBlob = await generateAndPreparePDF();
            if (!pdfBlob) return;

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
        } catch (error) {
            console.error('Failed to generate PDF preview:', error);
        } finally {
            setIsGeneratingPreview(false);
            setIsUploadingPDF(false);
        }
    }, [selectedPlayer, pdfUrl]);

    const handleDownloadClick = useCallback(async () => {
        if (!selectedPlayer) return;

        setIsGeneratingPreview(true);
        try {
            const pdfBlob = await generateAndPreparePDF();
            if (!pdfBlob) return;

            // Create a download link
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedPlayer.firstName}_${selectedPlayer.lastName}_Report.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download PDF:', error);
        } finally {
            setIsGeneratingPreview(false);
        }
    }, [selectedPlayer]);

    const handleShare = useCallback((platform: 'whatsapp' | 'linkedin' | 'email') => {
        if (!shareableUrl) return;

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

    const fetchComparisonStats = useCallback(async (type: 'team' | 'league') => {
        try {
            const response = await fetch(`/api/stats/${type}-averages?teamId=${selectedPlayer?.currentTeam.id}`);
            if (!response.ok) throw new Error(`Failed to fetch ${type} averages`);
            const data = await response.json();
            setComparisonStats(data.stats);
        } catch (error) {
            console.error(`Error fetching ${type} averages:`, error);
            setComparisonStats(null);
        }
    }, [selectedPlayer]);

    const handleComparisonChange = useCallback((type: 'team' | 'league' | 'none') => {
        setComparisonType(type);
        if (type !== 'none') {
            fetchComparisonStats(type);
        } else {
            setComparisonStats(null);
        }
    }, [fetchComparisonStats]);

    const handleAddVideoNote = useCallback((note: Omit<VideoNote, 'id' | 'createdAt'>) => {
        setVideoNotes(prev => [...prev, {
            ...note,
            id: uuidv4(),
            createdAt: new Date()
        }]);
    }, []);

    const handleDeleteVideoNote = useCallback((id: string) => {
        setVideoNotes(prev => prev.filter(note => note.id !== id));
    }, []);

    const handleVideoTimeUpdate = useCallback((time: number) => {
        setCurrentVideoTime(time);
    }, []);

    const handleVideoSeek = useCallback((time: number) => {
        // Implement video seeking logic in VideoOverlay
    }, []);

    const sortPlayers = useCallback((players: ScoutPlayer[]) => {
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
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    }, [sortBy, sortOrder]);

    const filterPlayers = useCallback((players: ScoutPlayer[]) => {
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
        let filtered = players.filter(player =>
            `${player.firstName} ${player.lastName}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
        );
        
        filtered = filterPlayers(filtered);
        return sortPlayers(filtered);
    }, [players, searchQuery, filterPlayers, sortPlayers]);

    const drawerContent = (
        <Box sx={{ width: 320, p: 2 }}>
            <TextField
                fullWidth
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton size="small">
                                <FilterList />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            <List sx={{ mt: 2 }}>
                {filteredPlayers.map((player) => (
                    <ListItem
                        key={player.id}
                        button
                        selected={selectedPlayer?.id === player.id}
                        onClick={() => handlePlayerSelect(player)}
                    >
                        <ListItemAvatar>
                            <Avatar src={player.mediaUrls.profileImage} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${player.firstName} ${player.lastName}`}
                            secondary={`${player.currentTeam.name} • ${player.primaryPosition}`}
                        />
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStarPlayer(player.id);
                            }}
                        >
                            {starredPlayers.includes(player.id) ? (
                                <Star color="primary" />
                            ) : (
                                <StarBorder />
                            )}
                        </IconButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    const fetchTips = async () => {
        try {
            setLoading(true);
            const tipsRef = collection(db, 'tips');
            let q = query(
                tipsRef,
                where('profileId', '==', scoutId),
                orderBy(sortBy, sortOrder),
                limit(rowsPerPage)
            );

            if (page > 0 && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            const tipDocs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TipRecord[];

            setTips(tipDocs);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

            // Get total count
            const countSnapshot = await getDocs(
                query(tipsRef, where('profileId', '==', scoutId))
            );
            setTotalTips(countSnapshot.size);
        } catch (error) {
            console.error('Error fetching tips:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTips();
    }, [scoutId, page, rowsPerPage, sortBy, sortOrder]);

    const handleSort = (field: string) => {
        const isAsc = sortBy === field && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortBy(field);
        setPage(0);
    };

    const getMethodColor = (method: string) => {
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
            })) as LeaderboardEntry[];

            setEntries(leaderboardData);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSortField = (tab: TabValue): string => {
        switch (tab) {
            case 'weekly': return 'stats.weeklyTips';
            case 'views': return 'stats.viewCount';
            case 'shares': return 'stats.shareCount';
            case 'improved': return 'stats.streakScore';
            case 'badges': return 'stats.badge.percentile';
            default: return 'stats.weeklyTips';
        }
    };

    const getBadgeColor = (tier: string) => {
        switch (tier) {
            case 'Gold': return theme.palette.warning.main;
            case 'Silver': return theme.palette.grey[400];
            default: return theme.palette.warning.dark;
        }
    };

    const renderStatValue = (entry: LeaderboardEntry) => {
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
                return (
                    <Chip
                        label={`${entry.stats.badge.tier} (Top ${entry.stats.badge.percentile}%)`}
                        sx={{ backgroundColor: getBadgeColor(entry.stats.badge.tier) }}
                    />
                );
            default:
                return '';
        }
    };

    const renderSkeletons = () => (
        Array(5).fill(0).map((_, index) => (
            <TableRow key={index}>
                <TableCell>
                    <Skeleton variant="text" width={30} />
                </TableCell>
                <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="text" width={120} />
                    </Box>
                </TableCell>
                <TableCell>
                    <Skeleton variant="text" width={80} />
                </TableCell>
                <TableCell>
                    <Skeleton variant="text" width={100} />
                </TableCell>
                <TableCell>
                    <Skeleton variant="rectangular" width={100} height={36} />
                </TableCell>
            </TableRow>
        ))
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {isMobile ? (
                <Drawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                <Paper
                    elevation={2}
                    sx={{
                        width: 320,
                        height: '100%',
                        overflow: 'auto',
                        borderRadius: 0,
                    }}
                >
                    {drawerContent}
                </Paper>
            )}

            <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
                {isMobile && (
                    <IconButton
                        sx={{ mb: 2 }}
                        onClick={() => setDrawerOpen(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                {selectedPlayer ? (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <VideoOverlay
                                player={selectedPlayer}
                                videoUrl={selectedPlayer.mediaUrls.highlightVideos[0]}
                                markers={[]} // Add your markers here
                                onMarkerAdd={() => {}} // Implement marker handling
                                onMarkerClick={() => {}}
                            />
                        </Grid>

                        <Grid item xs={12} md={8}>
                            <PlayerRecap
                                player={selectedPlayer}
                                evaluation={undefined} // Add evaluation if available
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Box sx={{ position: 'sticky', top: theme.spacing(3) }}>
                                <PDFExport
                                    player={selectedPlayer}
                                    evaluation={undefined} // Add evaluation if available
                                    onExport={handleExportPDF}
                                    isGenerating={isGeneratingPDF}
                                />
                                
                                <Fab
                                    color="primary"
                                    variant="extended"
                                    sx={{ mt: 2 }}
                                    onClick={() => {
                                        // Implement share functionality
                                    }}
                                >
                                    <Share sx={{ mr: 1 }} />
                                    Share Report
                                </Fab>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <RadarChart
                                playerStats={selectedPlayer.stats}
                                playerPercentiles={{}} // Add percentiles data
                                comparisonStats={comparisonStats}
                                comparisonType={comparisonType}
                                onComparisonChange={handleComparisonChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <VideoNotes
                                currentTime={currentVideoTime}
                                onSeek={handleVideoSeek}
                                onAddNote={handleAddVideoNote}
                                onDeleteNote={handleDeleteVideoNote}
                                notes={videoNotes}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <PDFHistory
                                onPreview={(url) => {
                                    if (pdfUrl) {
                                        URL.revokeObjectURL(pdfUrl);
                                    }
                                    setPdfUrl(url);
                                }}
                                onDownload={(url, filename) => {
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = filename;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            />
                        </Grid>
                    </Grid>
                ) : (
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                    >
                        <Typography variant="h6" color="text.secondary">
                            Select a player to view their profile
                        </Typography>
                    </Box>
                )}

                {selectedPlayer && (
                    <Box sx={{ mt: 3 }}>
                        <Accordion
                            expanded={exportPanelExpanded}
                            onChange={() => setExportPanelExpanded(!exportPanelExpanded)}
                        >
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography>Export Options</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    {canExport ? (
                                        <PDFDownloadLink
                                            document={
                                                <PlayerReportPDF
                                                    player={selectedPlayer}
                                                    analysis={undefined}
                                                    timestamp={new Date()}
                                                />
                                            }
                                            fileName={`sportbeacon-${selectedPlayer.firstName.toLowerCase().replace(/\s+/g, '-')}-${selectedPlayer.id}.pdf`}
                                        >
                                            {({ loading, error }) => (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<Download />}
                                                    disabled={loading}
                                                    sx={{ mt: 2 }}
                                                >
                                                    {loading ? 'Generating Report...' : 'Export Player Report'}
                                                </Button>
                                            )}
                                        </PDFDownloadLink>
                                    ) : (
                                        <Tooltip title="Only coaches and scouts can export reports">
                                            <span>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<Download />}
                                                    disabled
                                                    sx={{ mt: 2 }}
                                                >
                                                    Export Player Report
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    )}
                                </Box>

                                {isGeneratingPreview && !pdfUrl && (
                                    <Skeleton 
                                        variant="rectangular" 
                                        width="100%" 
                                        height={600} 
                                        sx={{ borderRadius: 1 }}
                                    />
                                )}

                                {pdfUrl && (
                                    <>
                                        <Box sx={{ mt: 2, height: 600, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                            <iframe
                                                src={pdfUrl}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none'
                                                }}
                                                title="PDF Preview"
                                            />
                                        </Box>

                                        {isUploadingPDF ? (
                                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={20} />
                                                <Typography>Preparing sharing options...</Typography>
                                            </Box>
                                        ) : shareableUrl && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Share Report
                                                </Typography>
                                                <ButtonGroup variant="outlined" size="small">
                                                    <IconButton onClick={() => handleShare('whatsapp')}>
                                                        <WhatsApp />
                                                    </IconButton>
                                                    <IconButton onClick={() => handleShare('linkedin')}>
                                                        <LinkedIn />
                                                    </IconButton>
                                                    <IconButton onClick={() => handleShare('email')}>
                                                        <Email />
                                                    </IconButton>
                                                </ButtonGroup>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                )}

                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Tip History
                    </Typography>
                    {loading && page === 0 ? (
                        <Skeleton />
                    ) : (
                        <CreatorInvoiceTable profileId={scoutId} />
                    )}
                </Box>

                {/* Creator Analytics */}
                {isAnalyticsLoading ? (
                    <Skeleton variant="rounded" height={300} />
                ) : (
                    <CreatorAnalytics profileId={scoutId} />
                )}

                <Box sx={{ mt: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Leaderboard
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <ToggleButtonGroup
                            value={roleFilter}
                            exclusive
                            onChange={(_, value) => value && setRoleFilter(value)}
                            size="small"
                        >
                            <ToggleButton value="all">All</ToggleButton>
                            <ToggleButton value="player">Players Only</ToggleButton>
                            <ToggleButton value="coach">Coaches Only</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <Tabs
                        value={activeTab}
                        onChange={(_, value) => setActiveTab(value)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab
                            icon={<TrophyIcon />}
                            label="Weekly Tips"
                            value="weekly"
                        />
                        <Tab
                            icon={<ViewsIcon />}
                            label="Views"
                            value="views"
                        />
                        <Tab
                            icon={<ShareIcon />}
                            label="Shares"
                            value="shares"
                        />
                        <Tab
                            icon={<TrendingIcon />}
                            label="Most Improved"
                            value="improved"
                        />
                        <Tab
                            icon={<BadgeIcon />}
                            label="Top Badge Holders"
                            value="badges"
                        />
                    </Tabs>
                </Box>

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Rank</TableCell>
                                <TableCell>Player</TableCell>
                                <TableCell>Stats</TableCell>
                                <TableCell>Badge</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                renderSkeletons()
                            ) : (
                                entries.map((entry, index) => (
                                    <TableRow
                                        key={entry.id}
                                        sx={{
                                            backgroundColor: entry.id === user?.uid
                                                ? alpha(theme.palette.primary.main, 0.1)
                                                : 'inherit'
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="h6">
                                                #{index + 1}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar
                                                    src={entry.avatarUrl}
                                                    alt={entry.name}
                                                />
                                                <Box>
                                                    <Typography variant="subtitle1">
                                                        {entry.name}
                                                    </Typography>
                                                    <Chip
                                                        label={entry.role}
                                                        size="small"
                                                        color={entry.role === 'coach' ? 'primary' : 'secondary'}
                                                    />
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {renderStatValue(entry)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={entry.stats.badge.tier}
                                                sx={{
                                                    backgroundColor: getBadgeColor(entry.stats.badge.tier),
                                                    color: 'white'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Link
                                                href={`/scout/${entry.id}`}
                                                passHref
                                            >
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                >
                                                    View Profile
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export const CreatorInvoiceTable: React.FC<{ profileId: string }> = ({ profileId }) => {
    const [tips, setTips] = useState<TipRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortField, setSortField] = useState<string>('timestamp');
    const [sortOrder, setSortOrder] = useState<string>('desc');
    const [totalTips, setTotalTips] = useState(0);
    const [lastDoc, setLastDoc] = useState<any>(null);

    const fetchTips = async () => {
        try {
            setLoading(true);
            const tipsRef = collection(db, 'tips');
            let q = query(
                tipsRef,
                where('profileId', '==', profileId),
                orderBy(sortField, sortOrder),
                limit(rowsPerPage)
            );

            if (page > 0 && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            const tipDocs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TipRecord[];

            setTips(tipDocs);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

            // Get total count
            const countSnapshot = await getDocs(
                query(tipsRef, where('profileId', '==', profileId))
            );
            setTotalTips(countSnapshot.size);
        } catch (error) {
            console.error('Error fetching tips:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTips();
    }, [profileId, page, rowsPerPage, sortField, sortOrder]);

    const handleSort = (field: string) => {
        const isAsc = sortField === field && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortField(field);
        setPage(0);
    };

    if (loading && page === 0) {
        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Multiplier</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton /></TableCell>
                                <TableCell><Skeleton /></TableCell>
                                <TableCell><Skeleton /></TableCell>
                                <TableCell><Skeleton /></TableCell>
                                <TableCell><Skeleton /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    return (
        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'timestamp'}
                                    direction={sortOrder}
                                    onClick={() => handleSort('timestamp')}
                                >
                                    Date
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={sortField === 'amount'}
                                    direction={sortOrder}
                                    onClick={() => handleSort('amount')}
                                >
                                    Amount
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={sortField === 'multiplier'}
                                    direction={sortOrder}
                                    onClick={() => handleSort('multiplier')}
                                >
                                    Multiplier
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tips.map((tip) => (
                            <TableRow 
                                data-testid="invoice-row"
                                key={tip.id}
                            >
                                <TableCell data-testid="amount">
                                    ${tip.amount.toFixed(2)}
                                </TableCell>
                                <TableCell data-testid="method">
                                    {tip.method}
                                </TableCell>
                                <TableCell data-testid="multiplier">
                                    {tip.multiplier.toFixed(1)}x
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={tip.status}
                                        color={tip.status === 'completed' ? 'success' : 'warning'}
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={totalTips}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
            />
        </Paper>
    );
};

export interface PayoutSettings {
    stripeConnected: boolean;
    cryptoWalletVerified: boolean;
    minimumPayout: number;
    preferredMethod: 'stripe' | 'crypto';
}

export interface Profile {
    id: string;
    isVerified: boolean;
    payoutEnabled: boolean;
    payoutSettings?: PayoutSettings;
    lastActive?: Date;
    streakDays: number;
    totalEarnings: number;
    tier: 'Bronze' | 'Silver' | 'Gold';
}

export const canReceiveTips = (profile: Profile | null): boolean => {
    if (!profile) return false;
    return profile.isVerified && profile.payoutEnabled;
};

export const getPayoutStatus = (profile: Profile): {
    canPayout: boolean;
    reason?: string;
} => {
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

export const TipModal: React.FC<{
    open: boolean;
    onClose: () => void;
    recipientProfile: Profile;
    currentUserId: string;
}> = ({
    open,
    onClose,
    recipientProfile,
    currentUserId
}) => {
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<'stripe' | 'crypto'>('stripe');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process tip');
            toast.error('Failed to send tip');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            data-testid="TipModal"
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle data-testid="TipModal-title">
                Send Tip to {recipientProfile.name}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ my: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        label="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="number"
                        fullWidth
                        required
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                            data-testid="method-select"
                            value={method}
                            onChange={(e) => setMethod(e.target.value as 'stripe' | 'crypto')}
                            label="Payment Method"
                        >
                            <MenuItem value="stripe">Stripe</MenuItem>
                            <MenuItem value="crypto">Cryptocurrency</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <LoadingButton
                    onClick={handleSubmit}
                    loading={loading}
                    variant="contained"
                    color="primary"
                    data-testid="submit-tip"
                >
                    Send Tip
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface EarningsData {
    totalEarnings: number;
    pendingPayouts: number;
    streakMultiplier: number;
    tipHistory: TipRecord[];
    dailyLimit: {
        remaining: number;
        total: number;
        resetsAt: Date;
    };
}

const DAILY_TIP_LIMIT = 10;

export const useEarnings = (profileId: string) => {
    return useQuery(
        ['earnings', profileId],
        async (): Promise<EarningsData> => {
            const tipsRef = collection(db, 'tips');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get all completed tips
            const tipsQuery = query(
                tipsRef,
                where('recipientId', '==', profileId),
                where('status', '==', 'completed'),
                orderBy('createdAt', 'desc')
            );

            // Get today's tips for limit calculation
            const todayTipsQuery = query(
                tipsRef,
                where('recipientId', '==', profileId),
                where('createdAt', '>=', today)
            );

            const [tipsSnapshot, todayTipsSnapshot] = await Promise.all([
                getDocs(tipsQuery),
                getDocs(todayTipsQuery)
            ]);

            const tipHistory = tipsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TipRecord[];

            const totalEarnings = tipHistory.reduce((sum, tip) => 
                sum + (tip.amount * tip.multiplier), 0);

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
        },
        {
            staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
            cacheTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
        }
    );
};

// Mutation hook for triggering tips
export const useTriggerTip = () => {
    const queryClient = useQueryClient();

    return useMutation(
        async ({ profileId, amount, method }: {
            profileId: string;
            amount: number;
            method: 'stripe' | 'crypto';
        }) => {
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
        },
        {
            onSuccess: (_, { profileId }) => {
                // Invalidate relevant queries
                queryClient.invalidateQueries(['earnings', profileId]);
                queryClient.invalidateQueries(['streaks', profileId]);
            }
        }
    );
};

// Hook for exporting earnings data
export const useExportEarnings = (profileId: string) => {
    const { data: earnings } = useEarnings(profileId);

    const exportToCSV = () => {
        if (!earnings) return;

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

export const ReferralModal: React.FC<{
    open: boolean;
    onClose: () => void;
    profile: Profile;
}> = ({
    open,
    onClose,
    profile
}) => {
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
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Refer & Earn Rewards</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Your Referral Code
                    </Typography>
                    <TextField
                        fullWidth
                        value={referralUrl}
                        InputProps={{
                            readOnly: true,
                            endAdornment: (
                                <Button
                                    variant="contained"
                                    onClick={handleCopyLink}
                                    startIcon={<Share />}
                                >
                                    Copy
                                </Button>
                            )
                        }}
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Your Progress
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Stars color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">
                            {stats?.currentTier} Tier
                        </Typography>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={stats?.nextTierProgress || 0}
                        sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {`${stats?.activeReferrals || 0} active referrals - ${stats?.totalRewards || 0} rewards earned`}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" gutterBottom>
                        Tier Benefits
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <EmojiEvents color="action" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Bronze Tier (3+ referrals)"
                                secondary="1.2x multiplier on tips"
                            />
                            <Chip 
                                label={stats?.currentTier === 'Bronze' ? 'Current' : 'Locked'}
                                color={stats?.currentTier === 'Bronze' ? 'primary' : 'default'}
                                size="small"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <EmojiEvents color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Silver Tier (5+ referrals)"
                                secondary="1.5x multiplier on tips"
                            />
                            <Chip
                                label={stats?.currentTier === 'Silver' ? 'Current' : 'Locked'}
                                color={stats?.currentTier === 'Silver' ? 'primary' : 'default'}
                                size="small"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <EmojiEvents color="secondary" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Gold Tier (10+ referrals)"
                                secondary="2x multiplier on tips"
                            />
                            <Chip
                                label={stats?.currentTier === 'Gold' ? 'Current' : 'Locked'}
                                color={stats?.currentTier === 'Gold' ? 'primary' : 'default'}
                                size="small"
                            />
                        </ListItem>
                    </List>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export const CreatorAnalytics: React.FC<{ profileId: string }> = ({ profileId }) => {
    const { data: analyticsData, isLoading: isAnalyticsLoading } = useCreatorAnalytics(profileId);

    if (isAnalyticsLoading || !analyticsData) {
        return (
            <Grid container spacing={2}>
                {[...Array(4)].map((_, i) => (
                    <Grid item xs={12} md={3} key={i}>
                        <Skeleton variant="rounded" height={140} />
                    </Grid>
                ))}
                <Grid item xs={12}>
                    <Skeleton variant="rounded" height={300} />
                </Grid>
            </Grid>
        );
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
                    label: (context: any) => {
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
                    callback: (value: number) => `$${value}`
                }
            }
        }
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <StatCard
                        title="Monthly Revenue"
                        value={`$${analyticsData.mrr.toFixed(2)}`}
                        icon={<TrendingUp />}
                        tooltip="Revenue from the current month"
                        color="success.main"
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <StatCard
                        title="Total Tips"
                        value={analyticsData.totalTips}
                        icon={<Stars />}
                        tooltip="Total number of tips received"
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <StatCard
                        title="Active Referrals"
                        value={`${analyticsData.referrals.active}/${analyticsData.referrals.total}`}
                        icon={<People />}
                        tooltip="Active referrals out of total referrals"
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Progress to {analyticsData.badgeProgress.next}
                            </Typography>
                            <Box sx={{ mt: 1, mb: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={analyticsData.badgeProgress.progress}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {analyticsData.badgeProgress.progress.toFixed(0)}% Complete
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Tip Volume Trend
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <Line data={chartData} options={chartOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CreatorAnalytics;

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    tooltip?: string;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    tooltip,
    color = 'primary.main'
}) => (
    <Card component={motion.div} whileHover={{ y: -4 }}>
        <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                        {title}
                        {tooltip && (
                            <Tooltip title={tooltip}>
                                <IconButton size="small">
                                    <Info fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Typography>
                    <Typography variant="h5" sx={{ color }}>
                        {value}
                    </Typography>
                </Box>
                <Box sx={{ color }}>
                    {icon}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

type TabValue = 'weekly' | 'views' | 'shares' | 'improved' | 'badges';
type RoleFilter = 'all' | 'coach' | 'player'; 