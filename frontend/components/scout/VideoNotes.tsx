import React, { useState, useCallback } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    TextField,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    LinearProgress,
    Paper,
    Grid,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Tooltip,
    Card,
    CardContent,
    ListItemIcon,
    Divider,
    Snackbar,
    Alert,
    Tabs,
    Tab,
    Switch,
    FormControlLabel,
    Stack,
    ToggleButtonGroup,
    ToggleButton,
    TableRow,
    TableCell,
    Skeleton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Share as ShareIcon, Download as DownloadIcon, EmojiEvents, TrendingUp, People, Twitter as TwitterIcon, Facebook as FacebookIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { PlayerSelfAssessmentForm } from '../components/player/PlayerSelfAssessmentForm';
import { CompareSelfToCoach } from '../components/player/CompareSelfToCoach';
import { useAssessmentAudio } from '../hooks/useAssessmentAudio';
import { AudioSummaryPlayer } from './AudioSummaryPlayer';
import { useExportBundle } from '../hooks/useExportBundle';
import { LoadingButton } from '@mui/lab';
import { QAFormChecklist } from './QAFormChecklist';
import { InsightDashboard } from '../components/player/InsightDashboard';
import { AIFeedbackChat } from '../components/player/AIFeedbackChat';
import { useCreatorAnalytics } from '@/hooks/useCreatorAnalytics';
import { formatCurrency } from '@/utils/format';
import { motion } from 'framer-motion';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { getChartTheme } from '@/utils/chartConfig';
import { WelcomeModal } from '../components/onboarding/WelcomeModal';
import { GetStartedChecklist } from '../onboarding/GetStartedChecklist';
import { useProgress } from '@/hooks/useProgress';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { TipButton } from '../components/payments/TipButton';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { LoginModal } from '@/components/auth/LoginModal';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShareProfileButton } from '../components/dashboard/ShareProfileButton';
import Head from 'next/head';
import { useRoleAuth } from '@/hooks/useRoleAuth';
import { PageTransition } from '../components/transitions/PageTransition';
import { AnimatedBadge } from '../components/badges/AnimatedBadge';
import { LeaderboardFilters } from '../components/leaderboard/LeaderboardFilters';
import { StatDelta } from '../components/stats/StatDelta';
import { useInfiniteLeaderboard } from '@/hooks/useInfiniteLeaderboard';
import { LoadingRow } from '../components/leaderboard/LoadingRow';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { WeeklySummaryEmail } from '../components/email/WeeklySummaryEmail';
import { testWeeklyEmail } from '@/utils/email/testEmail';
import { checkProfileVisibility } from '@/middleware/checkProfileVisibility';

interface VideoNote {
    id: string;
    timestamp: number;
    tag: string;
    comment: string;
    aiResponse?: string;
    createdAt: Date;
}

interface CoachAssessment {
    coachId: string;
    coachName: string;
    assessment: Record<string, number>;
    timestamp: Date;
    notes?: string;
}

interface VideoNotesProps {
    currentTime: number;
    onSeek: (time: number) => void;
    onAddNote: (note: Omit<VideoNote, 'id' | 'createdAt'>) => void;
    onDeleteNote: (id: string) => void;
    notes: VideoNote[];
    playerId: string;
    existingAssessment: Record<string, number>;
    playerSelfAssessment: Record<string, number>;
    coachAssessment: Record<string, number>;
    playerName: string;
    pdfUrl?: string;
    tasks: Array<{
        description: string;
        completed: boolean;
        timestamp?: string;
    }>;
    coachAssessments: CoachAssessment[];
    onHealthCheck: () => Promise<HealthCheckResult>;
    onIssueReport: (issue: QAIssue) => Promise<void>;
    assessmentHistory: Array<{
        date: string;
        scores: Record<string, number>;
    }>;
    badges: Array<{
        id: string;
        name: string;
        progress: number;
        category: string;
    }>;
    videoTags: Array<{
        tag: string;
        count: number;
        trend: 'up' | 'down' | 'stable';
    }>;
    onShare: () => Promise<void>;
    onExport: () => Promise<void>;
}

const NOTE_TAGS = [
    'Good pass',
    'Missed mark',
    'Strong tackle',
    'Poor positioning',
    'Great movement',
    'Decision making',
    'Technical skill',
    'Other'
];

export const GradientCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
    : `linear-gradient(45deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
  color: theme.palette.common.white,
}));

export const BadgeProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
  },
}));

export const StatsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
}));

export const VideoNotes: React.FC<VideoNotesProps> = ({
    currentTime,
    onSeek,
    onAddNote,
    onDeleteNote,
    notes,
    playerId,
    existingAssessment,
    playerSelfAssessment,
    coachAssessment,
    playerName,
    pdfUrl,
    tasks,
    coachAssessments,
    onHealthCheck,
    onIssueReport,
    assessmentHistory,
    badges,
    videoTags,
    onShare,
    onExport,
}) => {
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newNoteTag, setNewNoteTag] = useState('');
    const [newNoteComment, setNewNoteComment] = useState('');
    const { exportBundle, isExporting, error: exportError } = useExportBundle();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const { data, isLoading } = useCreatorAnalytics(playerId);
    const chartTheme = getChartTheme(theme);
    const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
    const { message, progress, isOpen, handleClose } = useProgress();
    const { guardAction, showLoginModal, closeLoginModal } = useAuthGuard();
    const { entries, hasMore } = useLeaderboard('weekly');
    const { user } = useAuth();
    const [preferences, setPreferences] = useState({
        receiveWeeklyEmail: true,
        profilePublic: true
    });
    const { isCoach, isPlayer } = useRoleAuth();
    const router = useRouter();

    const handleAddNote = useCallback(() => {
        if (!newNoteTag || !newNoteComment) return;

        onAddNote({
            timestamp: currentTime,
            tag: newNoteTag,
            comment: newNoteComment,
        });

        setNewNoteTag('');
        setNewNoteComment('');
        setIsAddingNote(false);
    }, [currentTime, newNoteTag, newNoteComment, onAddNote]);

    const formatTimestamp = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSaveAssessment = async (assessment: Record<string, number>) => {
        // Save to your backend
        await fetch('/api/player/assessment', {
            method: 'POST',
            body: JSON.stringify({
                playerId,
                assessment,
                type: 'self',
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    };

    const { audioUrl, loading: audioLoading, error: audioError } = useAssessmentAudio(
        playerId,
        'analysis.summary'
    );

    const handleExport = useCallback(async () => {
        await guardAction(async () => {
            if (!pdfUrl || !audioUrl) return;
            await exportBundle({
                playerId,
                playerName,
                pdfUrl,
                audioUrl,
                tasks,
                notes,
                assessments: {
                    self: playerSelfAssessment,
                    coach: coachAssessment,
                },
            });
        });
    }, [guardAction, exportBundle, playerId, playerName, pdfUrl, audioUrl, tasks, notes, playerSelfAssessment, coachAssessment]);

    const handleTip = useCallback(async () => {
        await guardAction(
            () => {
                // Open tip modal
            },
            `/scout/${playerId}`
        );
    }, [guardAction, playerId]);

    const handleToggle = async (field: keyof typeof preferences) => {
        if (!user) return;

        const newValue = !preferences[field];
        try {
            await updateDoc(doc(db, 'profiles', user.uid), {
                [`preferences.${field}`]: newValue
            });
            setPreferences(prev => ({
                ...prev,
                [field]: newValue
            }));
        } catch (error) {
            console.error('Error updating preferences:', error);
        }
    };

    useEffect(() => {
        if (loading) return;

        // Redirect players if trying to view other profiles
        if (isPlayer && playerId !== user?.uid) {
            router.replace('/dashboard');
        }
    }, [loading, isPlayer, playerId, router]);

    if (isLoading || !data) {
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

    const earningsChartData = {
        labels: data.earnings.timeline.map(p => p.date),
        datasets: [{
            label: 'Daily Earnings',
            data: data.earnings.timeline.map(p => p.amount),
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.light,
            fill: true,
            tension: 0.4
        }]
    };

    const tipsChartData = {
        labels: data.earnings.weeklyTips.map(p => p.date),
        datasets: [{
            label: 'Tips Count',
            data: data.earnings.weeklyTips.map(p => p.count),
            backgroundColor: theme.palette.secondary.main,
            borderRadius: 8
        }]
    };

    const referralChartData = {
        labels: data.referrals.distribution.map(p => p.tier),
        datasets: [{
            data: data.referrals.distribution.map(p => p.count),
            backgroundColor: [
                theme.palette.primary.light,
                theme.palette.secondary.light,
                theme.palette.success.light
            ]
        }]
    };

    return (
        <>
            <Head>
                <title>{playerName} - SportBeacon</title>
                <meta property="og:title" content={`${playerName} - SportBeacon`} />
                <meta property="og:description" content={`Check out ${playerName}'s performance stats and highlights`} />
                <meta property="og:image" content={`${process.env.NEXT_PUBLIC_APP_URL}/api/og/player/${playerId}`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="profile" />
                <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL}/scout/${playerId}`} />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>
            <PageTransition>
                <Box sx={{ 
                    p: isMobile ? 2 : 3,
                    '& .MuiList-root': {
                        maxHeight: isMobile ? '40vh' : '60vh',
                        overflowY: 'auto',
                    },
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2,
                        mb: 2 
                    }}>
                        <Typography variant="h6">Video Notes</Typography>
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 1,
                            mt: isMobile ? 1 : 0 
                        }}>
                            <Button
                                fullWidth={isMobile}
                                startIcon={<AddIcon />}
                                variant="outlined"
                                onClick={() => setIsAddingNote(true)}
                            >
                                Add Note
                            </Button>
                            <LoadingButton
                                fullWidth={isMobile}
                                loading={isExporting}
                                loadingPosition="start"
                                startIcon={<DownloadIcon />}
                                variant="contained"
                                onClick={handleExport}
                                disabled={!pdfUrl || !audioUrl}
                            >
                                Export Bundle
                            </LoadingButton>
                            <Button
                                startIcon={<ChatIcon />}
                                variant="outlined"
                                onClick={() => setIsAIChatOpen(true)}
                            >
                                AI Assistant
                            </Button>
                        </Box>
                    </Box>

                    <List>
                        {notes.sort((a, b) => a.timestamp - b.timestamp).map((note) => (
                            <ListItem
                                key={note.id}
                                secondaryAction={
                                    <IconButton edge="end" onClick={() => onDeleteNote(note.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => onSeek(note.timestamp)}
                                            >
                                                {formatTimestamp(note.timestamp)}
                                            </Button>
                                            <Chip label={note.tag} size="small" />
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2">{note.comment}</Typography>
                                            {note.aiResponse && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ mt: 1, fontStyle: 'italic' }}
                                                >
                                                    AI: {note.aiResponse}
                                                </Typography>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>

                    <Dialog open={isAddingNote} onClose={() => setIsAddingNote(false)}>
                        <DialogTitle>Add Note at {formatTimestamp(currentTime)}</DialogTitle>
                        <DialogContent>
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Tag</InputLabel>
                                <Select
                                    value={newNoteTag}
                                    label="Tag"
                                    onChange={(e) => setNewNoteTag(e.target.value)}
                                >
                                    {NOTE_TAGS.map((tag) => (
                                        <MenuItem key={tag} value={tag}>
                                            {tag}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Comment"
                                value={newNoteComment}
                                onChange={(e) => setNewNoteComment(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setIsAddingNote(false)}>Cancel</Button>
                            <Button onClick={handleAddNote} variant="contained" disabled={!newNoteTag || !newNoteComment}>
                                Add Note
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <PlayerSelfAssessmentForm
                        playerId={playerId}
                        onSubmit={handleSaveAssessment}
                        initialValues={existingAssessment}
                    />

                    <CompareSelfToCoach
                        selfAssessment={playerSelfAssessment}
                        coachAssessment={coachAssessment}
                    />

                    {audioLoading && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress />
                            <Typography variant="caption" color="text.secondary">
                                Generating audio summary...
                            </Typography>
                        </Box>
                    )}

                    {audioError && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            Failed to generate audio summary: {audioError.message}
                        </Typography>
                    )}

                    {audioUrl && (
                        <Box sx={{ mt: 3 }}>
                            <AudioSummaryPlayer
                                audioUrl={audioUrl}
                                summaryText="analysis.summary"
                            />
                        </Box>
                    )}

                    {exportError && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            Failed to export bundle: {exportError}
                        </Typography>
                    )}

                    <Box sx={{ mt: 3 }}>
                        <QAFormChecklist
                            playerId={playerId}
                            onIssueReport={onIssueReport}
                            onRunHealthCheck={onHealthCheck}
                        />
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <InsightDashboard
                            playerId={playerId}
                            playerName={playerName}
                            assessmentHistory={assessmentHistory}
                            badges={badges}
                            videoTags={videoTags}
                            onShare={onShare}
                            onExport={onExport}
                        />
                    </Box>

                    <AIFeedbackChat
                        open={isAIChatOpen}
                        onClose={() => setIsAIChatOpen(false)}
                        playerId={playerId}
                        playerName={playerName}
                        assessmentHistory={assessmentHistory}
                        recentDrills={recentDrills}
                        badges={badges}
                    />

                    <Box sx={{ mt: 3 }}>
                        <Grid container spacing={2}>
                            {/* Badge Status Card */}
                            <Grid item xs={12} md={4}>
                                <Card component={motion.div} whileHover={{ y: -4 }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <EmojiEvents 
                                                sx={{ 
                                                    color: theme.palette.primary.main,
                                                    fontSize: 40,
                                                    mr: 2
                                                }} 
                                            />
                                            <Box>
                                                <Typography variant="h6">{data.badge.current} Tier</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {data.badge.multiplier}x Multiplier Active
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={data.badge.progress}
                                            sx={{ 
                                                height: 8,
                                                borderRadius: 4,
                                                mb: 1
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {`${formatCurrency(data.badge.requiredAmount - data.earnings.total)} until ${data.badge.nextTier}`}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Referral Impact Card */}
                            <Grid item xs={12} md={8}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Referral Impact
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Box height={200}>
                                                    <Pie 
                                                        data={referralChartData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <List>
                                                    {data.referrals.distribution.map(tier => (
                                                        <ListItem key={tier.tier}>
                                                            <ListItemIcon>
                                                                <EmojiEvents 
                                                                    sx={{ 
                                                                        color: theme.palette[
                                                                            tier.tier === 'Gold' ? 'warning' :
                                                                            tier.tier === 'Silver' ? 'grey' :
                                                                            'primary'
                                                                        ].main
                                                                    }} 
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={`${tier.tier} Referrals`}
                                                                secondary={`${tier.count} users`}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Earnings Timeline */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Earnings Timeline
                                        </Typography>
                                        <Box height={300}>
                                            <Line
                                                data={earningsChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            ticks: {
                                                                callback: value => formatCurrency(value)
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Weekly Tips */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Tips This Week
                                        </Typography>
                                        <Box height={250}>
                                            <Bar
                                                data={tipsChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            ticks: {
                                                                stepSize: 1
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>

                    <WelcomeModal
                        open={welcomeModalOpen}
                        onClose={() => setWelcomeModalOpen(false)}
                        onGetStarted={() => {
                            // Handle get started
                        }}
                    />

                    <GetStartedChecklist
                        profile={data.profile}
                        onEditProfile={() => {
                            // Handle edit profile
                        }}
                        onUploadVideo={() => {
                            // Handle upload video
                        }}
                        onSetupPayments={() => {
                            // Handle setup payments
                        }}
                        onShareReferral={() => {
                            // Handle share referral
                        }}
                    />

                    <Snackbar open={isOpen} onClose={handleClose}>
                        <Alert severity="info" sx={{ width: '100%' }}>
                            {message}
                            <LinearProgress 
                                variant="determinate" 
                                value={progress} 
                                sx={{ mt: 1 }}
                            />
                        </Alert>
                    </Snackbar>

                    <TipButton
                        profileId={playerId}
                        canReceiveTips={data.profile.canReceiveTips}
                        onClick={handleTip}
                    />

                    <LoginModal
                        open={showLoginModal}
                        onClose={closeLoginModal}
                    />

                    <Box sx={{ mt: 3 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Privacy & Notifications
                                </Typography>

                                <Box sx={{ mt: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.profilePublic}
                                                onChange={() => handleToggle('profilePublic')}
                                            />
                                        }
                                        label="Public Profile"
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        Allow others to view your profile and stats
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 3 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.receiveWeeklyEmail}
                                                onChange={() => handleToggle('receiveWeeklyEmail')}
                                            />
                                        }
                                        label="Weekly Summary Emails"
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        Receive weekly performance reports and insights
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    <ShareProfileButton
                        playerId={playerId}
                        playerName={playerName}
                        isPublic={data.profile.preferences.profilePublic}
                    />
                </Box>
            </PageTransition>
        </>
    );
}; 