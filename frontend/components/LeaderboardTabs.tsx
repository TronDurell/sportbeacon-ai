import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { getSportRule, getSportIcon, getSportColorScheme } from '../config/sportRules';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  Star,
  StarBorder,
  Group,
  Public,
  FilterList,
  Refresh,
  Visibility,
  Whatshot,
  Bolt,
  LocalFireDepartment,
  InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const LeaderboardContainer = styled(Box)(({ theme }) => ({
  maxWidth: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1),
  },
}));

const LeaderboardCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  '&.global': {
    border: `2px solid ${theme.palette.primary.main}`,
  },
  '&.team': {
    border: `2px solid ${theme.palette.secondary.main}`,
  },
}));

const RankBadge = styled(Box)(({ theme, rank }: { theme: any; rank: number }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '0.875rem',
  color: 'white',
  backgroundColor: rank === 1 ? '#ffd700' : 
                   rank === 2 ? '#c0c0c0' : 
                   rank === 3 ? '#cd7f32' : 
                   theme.palette.primary.main,
}));

interface LeaderboardPlayer {
  player_id: string;
  player_name: string;
  player_avatar?: string;
  team_id?: string;
  team_name?: string;
  sport: string;
  rank: number;
  stats: {
    beacon_earned: number;
    drills_completed: number;
    current_streak: number;
    total_sessions: number;
    avg_score: number;
  };
  multipliers: {
    follower_bonus: number;
    streak_bonus: number;
    coach_bonus: number;
    total_multiplier: number;
  };
  achievements: {
    total_achievements: number;
    recent_achievements: string[];
  };
  social_metrics: {
    followers: number;
    following: number;
    tips_received: number;
    tips_given: number;
  };
  performance_trend: 'up' | 'down' | 'stable';
  last_active: string;
}

interface LeaderboardData {
  players: LeaderboardPlayer[];
  total_players: number;
  time_range: string;
  sport_filter?: string;
  generated_at: string;
}

// Enhanced tooltip components
const MetricTooltip = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Tooltip
    title={
      <Box>
        <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
        <Typography variant="body2">
          {children}
        </Typography>
      </Box>
    }
    placement="top"
    arrow
  >
    <Box component="span" sx={{ cursor: 'help' }}>
      <InfoIcon fontSize="small" color="action" />
    </Box>
  </Tooltip>
);

// Mobile-responsive styles
const MobileResponsiveCard = styled(LeaderboardCard)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(1),
    '& .MuiCardContent-root': {
      padding: theme.spacing(1),
    },
  },
  [theme.breakpoints.down('xs')]: {
    '& .MuiTable-root': {
      fontSize: '0.75rem',
    },
    '& .MuiTableCell-root': {
      padding: theme.spacing(0.5),
    },
  },
}));

const LeaderboardTabs: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'team' | 'global'>('team');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<LeaderboardData | null>(null);
  const [globalData, setGlobalData] = useState<LeaderboardData | null>(null);
  const [sortBy, setSortBy] = useState<'beacon' | 'drills' | 'streak' | 'score'>('beacon');
  const [sportFilter, setSportFilter] = useState<string>('all');

  // Fetch team leaderboard
  const fetchTeamLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/team/coachboard', {
        params: {
          wallet_address: user?.wallet_address,
          signature: 'mock-signature',
          message: 'mock-message',
          timeframe: 'week',
          sort: sortBy,
        },
      });

      const data = response.data;
      setTeamData({
        players: data.leaderboards.beacon_earned.map((player: any, index: number) => ({
          player_id: player.player_id,
          player_name: player.player_name,
          rank: index + 1,
          sport: 'basketball', // Default, should come from API
          stats: {
            beacon_earned: player.beacon_earned,
            drills_completed: 0, // Should come from API
            current_streak: 0,
            total_sessions: 0,
            avg_score: 0,
          },
          multipliers: {
            follower_bonus: 1.0,
            streak_bonus: 1.0,
            coach_bonus: 1.0,
            total_multiplier: 1.0,
          },
          achievements: {
            total_achievements: 0,
            recent_achievements: [],
          },
          social_metrics: {
            followers: 0,
            following: 0,
            tips_received: 0,
            tips_given: 0,
          },
          performance_trend: 'stable',
          last_active: new Date().toISOString(),
        })),
        total_players: data.leaderboards.beacon_earned.length,
        time_range: 'week',
        generated_at: data.generated_at,
      });
    } catch (err) {
      console.error('Team leaderboard fetch error:', err);
      setError('Failed to load team leaderboard');
    } finally {
      setLoading(false);
    }
  }, [user, sortBy]);

  // Fetch global leaderboard
  const fetchGlobalLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/leaderboard/global', {
        params: {
          sort_by: sortBy,
          sport: sportFilter !== 'all' ? sportFilter : undefined,
          limit: 50,
        },
      });

      const data = response.data;
      setGlobalData({
        players: data.players || [],
        total_players: data.total_players || 0,
        time_range: 'all_time',
        sport_filter: sportFilter,
        generated_at: data.generated_at,
      });
    } catch (err) {
      console.error('Global leaderboard fetch error:', err);
      setError('Failed to load global leaderboard');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sportFilter]);

  // Load data based on view mode
  useEffect(() => {
    if (viewMode === 'team') {
      fetchTeamLeaderboard();
    } else {
      fetchGlobalLeaderboard();
    }
  }, [viewMode, fetchTeamLeaderboard, fetchGlobalLeaderboard]);

  // Handle view mode toggle
  const handleViewModeChange = () => {
    setViewMode(prev => prev === 'team' ? 'global' : 'team');
  };

  // Get current data
  const currentData = viewMode === 'team' ? teamData : globalData;

  // Sort players
  const sortedPlayers = currentData?.players ? [...currentData.players].sort((a, b) => {
    switch (sortBy) {
      case 'beacon':
        return b.stats.beacon_earned - a.stats.beacon_earned;
      case 'drills':
        return b.stats.drills_completed - a.stats.drills_completed;
      case 'streak':
        return b.stats.current_streak - a.stats.current_streak;
      case 'score':
        return b.stats.avg_score - a.stats.avg_score;
      default:
        return 0;
    }
  }) : [];

  // Enhanced renderPlayerRow with tooltips and mobile optimization
  const renderPlayerRow = (player: LeaderboardPlayer, index: number) => {
    const sportRule = getSportRule(player.sport);
    const sportColors = getSportColorScheme(player.sport);
    const isCurrentUser = player.player_id === user?.wallet_address;

    return (
      <TableRow 
        key={player.player_id}
        sx={{
          backgroundColor: isCurrentUser ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          [theme.breakpoints.down('sm')]: {
            '& .MuiTableCell-root': {
              padding: theme.spacing(0.5),
            },
          },
        }}
      >
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <RankBadge rank={player.rank}>
              {player.rank}
            </RankBadge>
            {player.performance_trend === 'up' && <TrendingUp color="success" />}
            {player.performance_trend === 'down' && <TrendingUp color="error" sx={{ transform: 'rotate(180deg)' }} />}
          </Box>
        </TableCell>
        
        <TableCell>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar 
              src={player.player_avatar}
              sx={{ 
                width: { xs: 32, sm: 40 }, 
                height: { xs: 32, sm: 40 } 
              }}
            >
              {player.player_name.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="subtitle2" 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {player.player_name}
                {isCurrentUser && ' (You)'}
              </Typography>
              {player.team_name && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                >
                  {player.team_name}
                </Typography>
              )}
            </Box>
          </Box>
        </TableCell>
        
        <TableCell>
          <Chip
            icon={<span>{sportRule.icon}</span>}
            label={sportRule.displayName}
            size="small"
            sx={{ 
              backgroundColor: sportColors.primary, 
              color: 'white',
              fontSize: { xs: '0.625rem', sm: '0.75rem' }
            }}
          />
        </TableCell>
        
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography 
              variant="body2" 
              fontWeight="bold"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {player.stats.beacon_earned.toLocaleString()} BEACON
            </Typography>
            {player.multipliers.total_multiplier > 1 && (
              <Tooltip title={`${player.multipliers.total_multiplier}x multiplier from bonuses`}>
                <Chip
                  label={`${player.multipliers.total_multiplier}x`}
                  size="small"
                  color="warning"
                  sx={{ ml: 1 }}
                />
              </Tooltip>
            )}
            <MetricTooltip title="BEACON Earned">
              Total BEACON tokens earned from drills, achievements, and social interactions
            </MetricTooltip>
          </Box>
        </TableCell>
        
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {player.stats.drills_completed}
            </Typography>
            <MetricTooltip title="Drills Completed">
              Total number of training drills and exercises completed
            </MetricTooltip>
          </Box>
        </TableCell>
        
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {player.stats.current_streak}
            </Typography>
            {player.stats.current_streak > 5 && (
              <Whatshot color="warning" fontSize="small" />
            )}
            <MetricTooltip title="Current Streak">
              Consecutive days of active participation and training
            </MetricTooltip>
          </Box>
        </TableCell>
        
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {player.stats.avg_score.toFixed(1)}
            </Typography>
            <MetricTooltip title="Average Score">
              Average performance score across all completed drills
            </MetricTooltip>
          </Box>
        </TableCell>
        
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {player.social_metrics.followers}
            </Typography>
            {player.social_metrics.followers > 100 && (
              <Star color="primary" fontSize="small" />
            )}
            <MetricTooltip title="Followers">
              Number of athletes and coaches following this player
            </MetricTooltip>
          </Box>
        </TableCell>
        
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {player.achievements.total_achievements}
            </Typography>
            {player.achievements.recent_achievements.length > 0 && (
              <EmojiEvents color="success" fontSize="small" />
            )}
            <MetricTooltip title="Achievements">
              Total achievements and milestones earned
            </MetricTooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  // Enhanced sort options with tooltips
  const renderSortOptions = () => (
    <Box display="flex" alignItems="center" gap={2} mb={3} sx={{ flexWrap: 'wrap' }}>
      <Typography variant="subtitle2">Sort by:</Typography>
      {[
        { key: 'beacon', label: 'BEACON', tooltip: 'Sort by total BEACON tokens earned' },
        { key: 'drills', label: 'Drills', tooltip: 'Sort by number of drills completed' },
        { key: 'streak', label: 'Streak', tooltip: 'Sort by current training streak' },
        { key: 'score', label: 'Score', tooltip: 'Sort by average performance score' }
      ].map(({ key, label, tooltip }) => (
        <Tooltip key={key} title={tooltip}>
          <Button
            variant={sortBy === key ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSortBy(key as any)}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: '4px 8px', sm: '6px 16px' }
            }}
          >
            {label}
          </Button>
        </Tooltip>
      ))}
    </Box>
  );

  // Enhanced view mode toggle with tooltips
  const renderViewModeToggle = () => (
    <Box display="flex" alignItems="center" gap={2}>
      <FormControlLabel
        control={
          <Switch
            checked={viewMode === 'global'}
            onChange={handleViewModeChange}
            color="primary"
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={1}>
            {viewMode === 'team' ? <Group /> : <Public />}
            <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {viewMode === 'team' ? 'My Team' : 'All Players'}
            </Typography>
          </Box>
        }
      />
      <Tooltip title="Refresh leaderboard data">
        <IconButton 
          onClick={() => viewMode === 'team' ? fetchTeamLeaderboard() : fetchGlobalLeaderboard()} 
          disabled={loading}
          size="small"
        >
          <Refresh />
        </IconButton>
      </Tooltip>
    </Box>
  );

  // Enhanced table with mobile responsiveness
  const renderLeaderboardTable = () => (
    <MobileResponsiveCard className={viewMode}>
      <CardContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{
              maxHeight: { xs: 400, sm: 600 },
              overflowX: 'auto'
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Rank</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Player</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Sport</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>BEACON Earned</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Drills</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Streak</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Avg Score</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Followers</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Achievements</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPlayers.map(renderPlayerRow)}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {!loading && sortedPlayers.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No players found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {viewMode === 'team' 
                ? 'Join a team to see team leaderboards' 
                : 'Complete drills to appear on the global leaderboard'
              }
            </Typography>
          </Box>
        )}
      </CardContent>
    </MobileResponsiveCard>
  );

  if (error) {
    return (
      <LeaderboardContainer>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => viewMode === 'team' ? fetchTeamLeaderboard() : fetchGlobalLeaderboard()} variant="contained">
          Retry
        </Button>
      </LeaderboardContainer>
    );
  }

  return (
    <LeaderboardContainer>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Leaderboard
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {renderViewModeToggle()}
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="BEACON Earned" />
        <Tab label="Drills Completed" />
        <Tab label="Current Streak" />
        <Tab label="Average Score" />
      </Tabs>

      {/* Sort options */}
      {renderSortOptions()}

      {/* Leaderboard Table */}
      {renderLeaderboardTable()}

      {/* Stats Summary */}
      {currentData && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip label={`${currentData.total_players} Players`} />
            <Chip label={`${currentData.time_range} Period`} />
            {currentData.sport_filter && currentData.sport_filter !== 'all' && (
              <Chip label={`${currentData.sport_filter} Only`} />
            )}
            <Chip label={`Last Updated: ${new Date(currentData.generated_at).toLocaleString()}`} />
          </Box>
        </Box>
      )}
    </LeaderboardContainer>
  );
};

export default LeaderboardTabs; 