import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  EmojiEvents,
  Whatshot,
  Star,
  Visibility,
  Refresh,
  Download,
  Settings,
  Security,
  Analytics,
  Psychology
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const AdminContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.grey[50],
  minHeight: '100vh',
}));

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

interface AdminStats {
  total_users: number;
  total_teams: number;
  total_highlights: number;
  total_beacon_earned: number;
  active_coaches: number;
  viral_clips_count: number;
}

interface TopPlayer {
  player_id: string;
  player_name: string;
  player_avatar?: string;
  sport: string;
  beacon_earned: number;
  tips_received: number;
  followers: number;
  viral_clips: number;
}

interface ViralClip {
  id: string;
  title: string;
  player_name: string;
  sport: string;
  views: number;
  likes: number;
  shares: number;
  tips: number;
  viral_score: number;
  created_at: string;
}

interface CoachAIPerformance {
  summaries_generated: number;
  voice_feedback_count: number;
  average_response_time: number;
  success_rate: number;
  languages_used: string[];
  personality_usage: Record<string, number>;
}

interface TokenUsage {
  total_beacon_minted: number;
  total_beacon_burned: number;
  circulating_supply: number;
  top_earners: TopPlayer[];
  recent_transactions: any[];
}

const AdminOverview: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [viralClips, setViralClips] = useState<ViralClip[]>([]);
  const [coachPerformance, setCoachPerformance] = useState<CoachAIPerformance | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<TopPlayer | null>(null);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);

  // Check admin access
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'coach' | 'admin' | 'org_partner'>('coach');

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      const response = await apiService.get('/api/admin/access', {
        params: {
          wallet_address: user?.wallet_address,
          signature: 'mock-signature',
          message: 'mock-message',
        },
      });

      setHasAccess(response.data.has_access);
      setAccessLevel(response.data.access_level);
    } catch (err) {
      setHasAccess(false);
      setError('Access denied. Admin privileges required.');
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch all admin data in parallel
      const [statsRes, playersRes, clipsRes, coachRes, tokenRes] = await Promise.all([
        apiService.get('/api/admin/stats'),
        apiService.get('/api/admin/top-players'),
        apiService.get('/api/admin/viral-clips'),
        apiService.get('/api/admin/coach-performance'),
        apiService.get('/api/admin/token-usage')
      ]);

      setAdminStats(statsRes.data);
      setTopPlayers(playersRes.data.players);
      setViralClips(clipsRes.data.clips);
      setCoachPerformance(coachRes.data);
      setTokenUsage(tokenRes.data);
      setError(null);
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchAdminData();
    }
  }, [hasAccess]);

  const handleRefresh = () => {
    fetchAdminData();
  };

  const handlePlayerClick = (player: TopPlayer) => {
    setSelectedPlayer(player);
    setShowPlayerDialog(true);
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'org_partner': return 'error';
      case 'admin': return 'warning';
      case 'coach': return 'success';
      default: return 'default';
    }
  };

  const renderMetricsOverview = () => (
    <Grid container spacing={3} mb={4}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {adminStats?.total_users?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
              </Box>
              <Avatar sx={{ backgroundColor: 'primary.main' }}>
                <Visibility />
              </Avatar>
            </Box>
          </CardContent>
        </MetricCard>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="secondary">
                  {adminStats?.total_teams?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Teams
                </Typography>
              </Box>
              <Avatar sx={{ backgroundColor: 'secondary.main' }}>
                <EmojiEvents />
              </Avatar>
            </Box>
          </CardContent>
        </MetricCard>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {adminStats?.viral_clips_count?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Viral Clips
                </Typography>
              </Box>
              <Avatar sx={{ backgroundColor: 'warning.main' }}>
                <Whatshot />
              </Avatar>
            </Box>
          </CardContent>
        </MetricCard>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {adminStats?.total_beacon_earned?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  BEACON Earned
                </Typography>
              </Box>
              <Avatar sx={{ backgroundColor: 'success.main' }}>
                <Star />
              </Avatar>
            </Box>
          </CardContent>
        </MetricCard>
      </Grid>
    </Grid>
  );

  const renderTopPlayers = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Most Tipped Players
          </Typography>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>

        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell>Sport</TableCell>
                <TableCell>BEACON Earned</TableCell>
                <TableCell>Tips Received</TableCell>
                <TableCell>Followers</TableCell>
                <TableCell>Viral Clips</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topPlayers.map((player, index) => (
                <TableRow key={player.player_id} hover>
                  <TableCell>
                    <Chip 
                      label={index + 1} 
                      color={index < 3 ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar src={player.player_avatar} sx={{ width: 32, height: 32 }}>
                        {player.player_name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight="bold">
                        {player.player_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={player.sport} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {player.beacon_earned.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {player.tips_received}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {player.followers.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Badge badgeContent={player.viral_clips} color="warning">
                      <Whatshot color="warning" />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handlePlayerClick(player)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderViralClips = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Most Viral Clips
        </Typography>

        <Grid container spacing={2}>
          {viralClips.map((clip) => (
            <Grid item xs={12} sm={6} md={4} key={clip.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    {clip.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    by {clip.player_name} • {clip.sport}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography variant="caption">
                      👁️ {clip.views.toLocaleString()}
                    </Typography>
                    <Typography variant="caption">
                      ❤️ {clip.likes.toLocaleString()}
                    </Typography>
                    <Typography variant="caption">
                      🔄 {clip.shares.toLocaleString()}
                    </Typography>
                    <Typography variant="caption">
                      💰 {clip.tips.toLocaleString()}
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={clip.viral_score}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Viral Score: {clip.viral_score}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderCoachPerformance = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Coach AI Performance
        </Typography>

        {coachPerformance && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {coachPerformance.summaries_generated.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Summaries Generated
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary" fontWeight="bold">
                  {coachPerformance.voice_feedback_count.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Voice Feedback
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {coachPerformance.average_response_time.toFixed(2)}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {coachPerformance.success_rate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Personality Usage
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {Object.entries(coachPerformance.personality_usage).map(([personality, count]) => (
                  <Chip
                    key={personality}
                    label={`${personality}: ${count}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Languages Used
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {coachPerformance.languages_used.map((lang) => (
                  <Chip
                    key={lang}
                    label={lang}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  const renderTokenUsage = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          BEACON Token Usage
        </Typography>

        {tokenUsage && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {tokenUsage.total_beacon_minted.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Minted
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error" fontWeight="bold">
                  {tokenUsage.total_beacon_burned.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Burned
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {tokenUsage.circulating_supply.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Circulating Supply
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {((tokenUsage.circulating_supply / tokenUsage.total_beacon_minted) * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Circulation Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  if (!hasAccess) {
    return (
      <AdminContainer>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Access denied. Admin privileges required.'}
        </Alert>
      </AdminContainer>
    );
  }

  if (loading) {
    return (
      <AdminContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AdminContainer>
    );
  }

  return (
    <AdminContainer>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Admin Dashboard
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={`Access Level: ${accessLevel}`}
              color={getAccessLevelColor(accessLevel)}
              icon={<Security />}
            />
            <Typography variant="body2" color="text.secondary">
              Welcome back, {user?.wallet_address?.slice(0, 8)}...
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Download />}>
            Export Data
          </Button>
          <Button variant="outlined" startIcon={<Settings />}>
            Settings
          </Button>
        </Box>
      </Box>

      {/* Metrics Overview */}
      {renderMetricsOverview()}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Top Players" icon={<EmojiEvents />} />
        <Tab label="Viral Clips" icon={<Whatshot />} />
        <Tab label="Coach AI" icon={<Psychology />} />
        <Tab label="Token Usage" icon={<Analytics />} />
      </Tabs>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && renderTopPlayers()}
        {activeTab === 1 && renderViralClips()}
        {activeTab === 2 && renderCoachPerformance()}
        {activeTab === 3 && renderTokenUsage()}
      </Box>

      {/* Player Details Dialog */}
      <Dialog
        open={showPlayerDialog}
        onClose={() => setShowPlayerDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedPlayer && (
          <>
            <DialogTitle>
              Player Details: {selectedPlayer.player_name}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Typography variant="body2">
                    BEACON Earned: {selectedPlayer.beacon_earned.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Tips Received: {selectedPlayer.tips_received}
                  </Typography>
                  <Typography variant="body2">
                    Followers: {selectedPlayer.followers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Viral Clips: {selectedPlayer.viral_clips}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sport Information
                  </Typography>
                  <Typography variant="body2">
                    Sport: {selectedPlayer.sport}
                  </Typography>
                  <Typography variant="body2">
                    Player ID: {selectedPlayer.player_id}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowPlayerDialog(false)}>Close</Button>
              <Button variant="contained">View Full Profile</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </AdminContainer>
  );
};

export default AdminOverview; 