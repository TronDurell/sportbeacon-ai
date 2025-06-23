import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { getSportRule, getSportIcon, getSportColorScheme } from '../config/sportRules';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Box,
  Grid,
  Badge,
  Tooltip,
  CircularProgress,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Rating
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Share,
  Comment,
  TrendingUp,
  EmojiEvents,
  Visibility,
  PlayArrow,
  VolumeUp,
  FilterList,
  Refresh,
  Star,
  StarBorder,
  Whatshot,
  LocalFireDepartment,
  Bolt,
  TrendingDown
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animations for social triggers
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

const HighlightContainer = styled(Box)(({ theme }) => ({
  maxWidth: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1),
  },
}));

const HighlightCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  overflow: 'visible',
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
  },
  '&.viral': {
    border: `2px solid ${theme.palette.warning.main}`,
    animation: `${pulse} 2s infinite`,
  },
  '&.trending': {
    border: `2px solid ${theme.palette.error.main}`,
    animation: `${bounce} 1s infinite`,
  },
}));

const EngagementBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
    fontWeight: 'bold',
  },
}));

const FilterChip = styled(Chip)(({ theme, active }: { theme: any; active?: boolean }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[200],
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.grey[300],
  },
}));

interface Highlight {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  player_id: string;
  player_name: string;
  player_avatar?: string;
  sport: string;
  created_at: string;
  duration: number;
  engagement_score: number;
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    tips: number;
  };
  tags: string[];
  viral_indicators: {
    is_viral: boolean;
    is_trending: boolean;
    viral_score: number;
    growth_rate: number;
  };
  performance_metrics: {
    drill_score?: number;
    achievement_type?: string;
    milestone?: string;
  };
}

interface FilterOptions {
  timeRange: 'all_time' | 'this_week' | 'this_month' | 'trending';
  sport: string;
  sortBy: 'engagement' | 'tips' | 'views' | 'viral_score';
  showViralOnly: boolean;
  showTrendingOnly: boolean;
}

// Add fallback components and error handling
const FallbackThumbnail = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 200,
  backgroundColor: theme.palette.grey[200],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.spacing(1),
  border: `2px dashed ${theme.palette.grey[400]}`,
}));

const ErrorBoundary = ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <>{fallback}</>;
  }

  return (
    <ErrorBoundaryComponent onError={() => setHasError(true)}>
      {children}
    </ErrorBoundaryComponent>
  );
};

const HighlightGlobalFeed: React.FC = () => {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: 'this_week',
    sport: 'all',
    sortBy: 'engagement',
    showViralOnly: false,
    showTrendingOnly: false,
  });
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Fetch highlights
  const fetchHighlights = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      
      const response = await apiService.get('/api/highlights/global', {
        params: {
          limit: 12,
          offset: currentPage * 12,
          ...filters,
        },
      });

      const newHighlights = response.data.highlights || [];
      
      if (reset) {
        setHighlights(newHighlights);
        setPage(0);
      } else {
        setHighlights(prev => [...prev, ...newHighlights]);
        setPage(currentPage + 1);
      }
      
      setHasMore(newHighlights.length === 12);
      setError(null);
    } catch (err) {
      setError('Failed to load highlights');
      console.error('Highlights fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  // Load initial highlights
  useEffect(() => {
    fetchHighlights(true);
  }, [filters]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 1000) {
      if (!loading && hasMore) {
        fetchHighlights();
      }
    }
  }, [loading, hasMore, fetchHighlights]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Handle like/unlike
  const handleLike = async (highlightId: string) => {
    try {
      // Optimistic update
      setHighlights(prev => prev.map(h => 
        h.id === highlightId 
          ? { ...h, stats: { ...h.stats, likes: h.stats.likes + 1 } }
          : h
      ));
      
      await apiService.post('/api/highlights/like', { highlight_id: highlightId });
    } catch (err) {
      // Revert on error
      setHighlights(prev => prev.map(h => 
        h.id === highlightId 
          ? { ...h, stats: { ...h.stats, likes: h.stats.likes - 1 } }
          : h
      ));
      console.error('Like error:', err);
    }
  };

  // Handle share
  const handleShare = async (highlight: Highlight) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: highlight.title,
          text: highlight.description,
          url: `${window.location.origin}/highlight/${highlight.id}`,
        });
      } else {
        await navigator.clipboard.writeText(
          `${highlight.title} - ${highlight.description}\n${window.location.origin}/highlight/${highlight.id}`
        );
      }
      
      // Update share count
      setHighlights(prev => prev.map(h => 
        h.id === highlight.id 
          ? { ...h, stats: { ...h.stats, shares: h.stats.shares + 1 } }
          : h
      ));
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // Handle tip
  const handleTip = async (highlight: Highlight, amount: number) => {
    try {
      await apiService.post('/api/highlights/tip', {
        highlight_id: highlight.id,
        amount: amount,
      });
      
      // Update tip count
      setHighlights(prev => prev.map(h => 
        h.id === highlight.id 
          ? { ...h, stats: { ...h.stats, tips: h.stats.tips + 1 } }
          : h
      ));
    } catch (err) {
      console.error('Tip error:', err);
    }
  };

  // Get engagement icon
  const getEngagementIcon = (highlight: Highlight) => {
    if (highlight.viral_indicators.is_viral) return <LocalFireDepartment color="warning" />;
    if (highlight.viral_indicators.is_trending) return <TrendingUp color="error" />;
    if (highlight.stats.tips > 10) return <EmojiEvents color="primary" />;
    return <Visibility />;
  };

  // Get engagement color
  const getEngagementColor = (highlight: Highlight) => {
    if (highlight.viral_indicators.is_viral) return 'warning';
    if (highlight.viral_indicators.is_trending) return 'error';
    if (highlight.stats.tips > 10) return 'primary';
    return 'default';
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Enhanced renderHighlightCard with error handling
  const renderHighlightCard = (highlight: Highlight) => {
    const sportRule = getSportRule(highlight.sport);
    const sportColors = getSportColorScheme(highlight.sport);
    const isViral = highlight.viral_indicators.is_viral;
    const isTrending = highlight.viral_indicators.is_trending;

    // Handle missing or invalid data
    const safeHighlight = {
      ...highlight,
      title: highlight.title || 'Untitled Highlight',
      description: highlight.description || 'No description available',
      player_name: highlight.player_name || 'Unknown Player',
      stats: {
        views: highlight.stats?.views || 0,
        likes: highlight.stats?.likes || 0,
        comments: highlight.stats?.comments || 0,
        shares: highlight.stats?.shares || 0,
        tips: highlight.stats?.tips || 0,
        ...highlight.stats
      },
      viral_indicators: {
        is_viral: highlight.viral_indicators?.is_viral || false,
        is_trending: highlight.viral_indicators?.is_trending || false,
        viral_score: highlight.viral_indicators?.viral_score || 0,
        growth_rate: highlight.viral_indicators?.growth_rate || 0,
        ...highlight.viral_indicators
      }
    };

    return (
      <HighlightCard 
        key={safeHighlight.id}
        className={`${isViral ? 'viral' : ''} ${isTrending ? 'trending' : ''}`}
        onClick={() => setSelectedHighlight(safeHighlight)}
      >
        <ErrorBoundary 
          fallback={
            <FallbackThumbnail>
              <Box textAlign="center">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  🎥 Media Unavailable
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This highlight is currently unavailable
                </Typography>
              </Box>
            </FallbackThumbnail>
          }
        >
          <CardMedia
            component="img"
            height="200"
            image={safeHighlight.thumbnail_url}
            alt={safeHighlight.title}
            sx={{ position: 'relative' }}
            onError={(e) => {
              // Replace with fallback image
              e.currentTarget.src = '/images/fallback-thumbnail.jpg';
            }}
          />
        </ErrorBoundary>
        
        {/* Overlay with play button and duration */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
            opacity: 0,
            transition: 'opacity 0.3s',
            '&:hover': { opacity: 1 },
          }}
        >
          <IconButton
            sx={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
            }}
          >
            <PlayArrow />
          </IconButton>
        </Box>

        {/* Duration badge */}
        <Chip
          label={formatDuration(safeHighlight.duration || 0)}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
          }}
        />

        <CardContent>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Avatar 
                src={safeHighlight.player_avatar} 
                sx={{ width: 32, height: 32, mr: 1 }}
              >
                {safeHighlight.player_name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {safeHighlight.player_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {safeHighlight.created_at ? 
                    new Date(safeHighlight.created_at).toLocaleDateString() : 
                    'Unknown date'
                  }
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={<span>{sportRule.icon}</span>}
                label={sportRule.displayName}
                size="small"
                sx={{ backgroundColor: sportColors.primary, color: 'white' }}
              />
              {getEngagementIcon(safeHighlight)}
            </Box>
          </Box>

          {/* Title and description */}
          <Typography variant="h6" gutterBottom>
            {safeHighlight.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {safeHighlight.description}
          </Typography>

          {/* Performance metrics */}
          {safeHighlight.performance_metrics && (
            <Box display="flex" gap={1} mb={2}>
              {safeHighlight.performance_metrics.drill_score && (
                <Chip
                  label={`Score: ${safeHighlight.performance_metrics.drill_score}`}
                  size="small"
                  color="primary"
                />
              )}
              {safeHighlight.performance_metrics.achievement_type && (
                <Chip
                  label={safeHighlight.performance_metrics.achievement_type}
                  size="small"
                  color="success"
                />
              )}
            </Box>
          )}

          {/* Engagement stats */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  handleLike(safeHighlight.id);
                }}>
                  <FavoriteBorder />
                </IconButton>
                <Typography variant="body2">{safeHighlight.stats.likes}</Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  handleShare(safeHighlight);
                }}>
                  <Share />
                </IconButton>
                <Typography variant="body2">{safeHighlight.stats.shares}</Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <IconButton size="small">
                  <Comment />
                </IconButton>
                <Typography variant="body2">{safeHighlight.stats.comments}</Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                {safeHighlight.stats.views.toLocaleString()} views
              </Typography>
              {safeHighlight.stats.tips > 0 && (
                <Chip
                  label={`${safeHighlight.stats.tips} tips`}
                  size="small"
                  color="warning"
                />
              )}
            </Box>
          </Box>

          {/* Viral indicators */}
          {(isViral || isTrending) && (
            <Box mt={2}>
              <LinearProgress
                variant="determinate"
                value={safeHighlight.viral_indicators.viral_score}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,193,7,0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: isViral ? '#ff9800' : '#f44336',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Viral Score: {safeHighlight.viral_indicators.viral_score}%
              </Typography>
            </Box>
          )}
        </CardContent>
      </HighlightCard>
    );
  };

  // Filter chips
  const renderFilters = () => (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={() => setShowFilters(!showFilters)}>
          <FilterList />
        </IconButton>
      </Box>
      
      {showFilters && (
        <Box>
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>Time Range</Typography>
            <FilterChip
              label="All Time"
              active={filters.timeRange === 'all_time'}
              onClick={() => setFilters(prev => ({ ...prev, timeRange: 'all_time' }))}
            />
            <FilterChip
              label="This Week"
              active={filters.timeRange === 'this_week'}
              onClick={() => setFilters(prev => ({ ...prev, timeRange: 'this_week' }))}
            />
            <FilterChip
              label="This Month"
              active={filters.timeRange === 'this_month'}
              onClick={() => setFilters(prev => ({ ...prev, timeRange: 'this_month' }))}
            />
            <FilterChip
              label="Trending"
              active={filters.timeRange === 'trending'}
              onClick={() => setFilters(prev => ({ ...prev, timeRange: 'trending' }))}
            />
          </Box>
          
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>Sort By</Typography>
            <FilterChip
              label="Engagement"
              active={filters.sortBy === 'engagement'}
              onClick={() => setFilters(prev => ({ ...prev, sortBy: 'engagement' }))}
            />
            <FilterChip
              label="Most Tipped"
              active={filters.sortBy === 'tips'}
              onClick={() => setFilters(prev => ({ ...prev, sortBy: 'tips' }))}
            />
            <FilterChip
              label="Most Views"
              active={filters.sortBy === 'views'}
              onClick={() => setFilters(prev => ({ ...prev, sortBy: 'views' }))}
            />
            <FilterChip
              label="Viral Score"
              active={filters.sortBy === 'viral_score'}
              onClick={() => setFilters(prev => ({ ...prev, sortBy: 'viral_score' }))}
            />
          </Box>
          
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>Show Only</Typography>
            <FilterChip
              label="Viral"
              active={filters.showViralOnly}
              onClick={() => setFilters(prev => ({ ...prev, showViralOnly: !prev.showViralOnly }))}
            />
            <FilterChip
              label="Trending"
              active={filters.showTrendingOnly}
              onClick={() => setFilters(prev => ({ ...prev, showTrendingOnly: !prev.showTrendingOnly }))}
            />
          </Box>
        </Box>
      )}
    </Box>
  );

  if (error) {
    return (
      <HighlightContainer>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => fetchHighlights(true)} variant="contained">
          Retry
        </Button>
      </HighlightContainer>
    );
  }

  return (
    <HighlightContainer>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Global Highlights
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => fetchHighlights(true)} disabled={loading}>
            <Refresh />
          </IconButton>
          <Fab size="small" color="primary" onClick={() => setShowFilters(!showFilters)}>
            <FilterList />
          </Fab>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Time" />
        <Tab label="This Week" />
        <Tab label="Trending" />
        <Tab label="Most Tipped" />
      </Tabs>

      {/* Filters */}
      {renderFilters()}

      {/* Highlights Grid */}
      <Grid container spacing={2}>
        {highlights.map(renderHighlightCard)}
      </Grid>
      
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}
      
      {!loading && highlights.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No highlights found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or check back later for new highlights
          </Typography>
        </Box>
      )}

      {/* Highlight Detail Dialog */}
      <Dialog 
        open={!!selectedHighlight} 
        onClose={() => setSelectedHighlight(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedHighlight && (
          <>
            <DialogTitle>
              {selectedHighlight.title}
            </DialogTitle>
            <DialogContent>
              <video
                src={selectedHighlight.video_url}
                controls
                style={{ width: '100%', marginBottom: 16 }}
              />
              <Typography variant="body1" gutterBottom>
                {selectedHighlight.description}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {selectedHighlight.tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedHighlight(null)}>Close</Button>
              <Button 
                variant="contained"
                onClick={() => handleTip(selectedHighlight, 10)}
              >
                Tip 10 BEACON
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </HighlightContainer>
  );
};

export default HighlightGlobalFeed; 