import React, { useState, useEffect, useCallback } from 'react';
import { useSocialGraph } from '../hooks/useSocialGraph';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
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
  Grid,
  Badge,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Share,
  Comment,
  TrendingUp,
  EmojiEvents,
  FitnessCenter,
  Group,
  FilterList,
  Refresh,
  PlayArrow,
  VolumeUp,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components for AR-friendly layout
const FeedContainer = styled(Box)(({ theme }) => ({
  maxWidth: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1),
  },
  // AR-friendly spacing
  '& .MuiCard-root': {
    marginBottom: theme.spacing(2),
    borderRadius: theme.spacing(1.5),
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    },
  },
}));

const FeedCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  overflow: 'visible',
  '& .feed-preview': {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
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

interface FeedItem {
  id: string;
  type: 'drill_completion' | 'achievement_earned' | 'tip_sent' | 'streak_milestone' | 'follow_event';
  user_id: string;
  user_name: string;
  user_avatar?: string;
  timestamp: string;
  content: {
    drill_name?: string;
    drill_score?: number;
    achievement_name?: string;
    achievement_description?: string;
    tip_amount?: number;
    streak_days?: number;
    follow_type?: 'athlete' | 'coach';
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  multiplier?: {
    type: 'follower_bonus' | 'streak_bonus' | 'coach_bonus';
    value: number;
    icon: string;
  };
}

interface FilterOptions {
  team: string;
  drillType: string;
  followedOnly: boolean;
  mostTipped: boolean;
  showAchievements: boolean;
  showDrills: boolean;
  showTips: boolean;
}

const SocialDiscoveryFeed: React.FC = () => {
  const { user } = useAuth();
  const { 
    followStatus, 
    toggleFollow, 
    followers, 
    following,
    isLoading: socialLoading 
  } = useSocialGraph();
  
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    team: 'all',
    drillType: 'all',
    followedOnly: false,
    mostTipped: false,
    showAchievements: true,
    showDrills: true,
    showTips: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [previewItem, setPreviewItem] = useState<FeedItem | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Fetch feed data
  const fetchFeed = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      
      const response = await apiService.get('/api/social/follow/feed', {
        params: {
          limit: 20,
          offset: currentPage * 20,
          filter_type: 'all',
          ...filters,
        },
      });

      const newItems = response.data.feed || [];
      
      if (reset) {
        setFeedItems(newItems);
        setPage(0);
      } else {
        setFeedItems(prev => [...prev, ...newItems]);
        setPage(currentPage + 1);
      }
      
      setHasMore(newItems.length === 20);
      setError(null);
    } catch (err) {
      setError('Failed to load feed');
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  // Load initial feed
  useEffect(() => {
    fetchFeed(true);
  }, [filters]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 1000) {
      if (!loading && hasMore) {
        fetchFeed();
      }
    }
  }, [loading, hasMore, fetchFeed]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Handle like/unlike
  const handleLike = async (itemId: string) => {
    try {
      // Optimistic update
      setFeedItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, stats: { ...item.stats, likes: item.stats.likes + 1 } }
          : item
      ));
      
      // TODO: Call API to persist like
      await apiService.post('/api/social/interactions', {
        item_id: itemId,
        type: 'like',
      });
    } catch (err) {
      // Revert on error
      setFeedItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, stats: { ...item.stats, likes: item.stats.likes - 1 } }
          : item
      ));
      console.error('Like error:', err);
    }
  };

  // Handle share
  const handleShare = async (item: FeedItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${item.user_name} on SportBeacon`,
          text: getShareText(item),
          url: `${window.location.origin}/feed/${item.id}`,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(getShareText(item));
        // Show success message
      }
      
      // Update share count
      setFeedItems(prev => prev.map(feedItem => 
        feedItem.id === item.id 
          ? { ...feedItem, stats: { ...feedItem.stats, shares: feedItem.stats.shares + 1 } }
          : feedItem
      ));
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // Handle preview
  const handlePreview = (item: FeedItem) => {
    setPreviewItem(item);
  };

  // Get share text
  const getShareText = (item: FeedItem): string => {
    switch (item.type) {
      case 'drill_completion':
        return `${item.user_name} completed ${item.content.drill_name} with score ${item.content.drill_score}! 🏆`;
      case 'achievement_earned':
        return `${item.user_name} earned ${item.content.achievement_name}! 🎉`;
      case 'tip_sent':
        return `${item.user_name} tipped ${item.content.tip_amount} BEACON! 💰`;
      case 'streak_milestone':
        return `${item.user_name} reached ${item.content.streak_days} day streak! 🔥`;
      default:
        return `${item.user_name} is active on SportBeacon! 🏃‍♂️`;
    }
  };

  // Render feed item
  const renderFeedItem = (item: FeedItem) => {
    const isFollowing = followStatus[item.user_id];
    const isLiked = false; // TODO: Track liked state

    return (
      <FeedCard key={item.id}>
        <CardContent>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Avatar 
                src={item.user_avatar} 
                sx={{ width: 48, height: 48, mr: 2 }}
              >
                {item.user_name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {item.user_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(item.timestamp).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              {item.multiplier && (
                <Tooltip title={`${item.multiplier.type} bonus: ${item.multiplier.value}x`}>
                  <Chip 
                    icon={<span>{item.multiplier.icon}</span>}
                    label={`${item.multiplier.value}x`}
                    size="small"
                    color="warning"
                  />
                </Tooltip>
              )}
              
              <Button
                variant={isFollowing ? "contained" : "outlined"}
                size="small"
                onClick={() => toggleFollow(item.user_id)}
                disabled={socialLoading}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </Box>
          </Box>

          {/* Content */}
          <Box 
            className="feed-preview"
            onClick={() => handlePreview(item)}
            sx={{ cursor: 'pointer' }}
          >
            {renderFeedContent(item)}
          </Box>

          {/* Actions */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton 
                size="small" 
                onClick={() => handleLike(item.id)}
                color={isLiked ? "error" : "default"}
              >
                {isLiked ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
              <Typography variant="body2">{item.stats.likes}</Typography>
              
              <IconButton size="small">
                <Comment />
              </IconButton>
              <Typography variant="body2">{item.stats.comments}</Typography>
              
              <IconButton size="small" onClick={() => handleShare(item)}>
                <Share />
              </IconButton>
              <Typography variant="body2">{item.stats.shares}</Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              {item.type === 'drill_completion' && (
                <Chip 
                  icon={<FitnessCenter />}
                  label={`Score: ${item.content.drill_score}`}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </FeedCard>
    );
  };

  // Render feed content based on type
  const renderFeedContent = (item: FeedItem) => {
    switch (item.type) {
      case 'drill_completion':
        return (
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              🏃‍♂️ Completed {item.content.drill_name}
            </Typography>
            <Typography variant="body1">
              Achieved a score of <strong>{item.content.drill_score}</strong> points!
            </Typography>
          </Box>
        );
        
      case 'achievement_earned':
        return (
          <Box>
            <Typography variant="h6" color="success.main" gutterBottom>
              🏆 Earned {item.content.achievement_name}
            </Typography>
            <Typography variant="body1">
              {item.content.achievement_description}
            </Typography>
          </Box>
        );
        
      case 'tip_sent':
        return (
          <Box>
            <Typography variant="h6" color="warning.main" gutterBottom>
              💰 Tipped {item.content.tip_amount} BEACON
            </Typography>
            <Typography variant="body1">
              Supporting great performance!
            </Typography>
          </Box>
        );
        
      case 'streak_milestone':
        return (
          <Box>
            <Typography variant="h6" color="error.main" gutterBottom>
              🔥 {item.content.streak_days} Day Streak!
            </Typography>
            <Typography variant="body1">
              Incredible consistency and dedication!
            </Typography>
          </Box>
        );
        
      case 'follow_event':
        return (
          <Box>
            <Typography variant="h6" color="info.main" gutterBottom>
              👥 Started following a {item.content.follow_type}
            </Typography>
            <Typography variant="body1">
              Building connections in the community!
            </Typography>
          </Box>
        );
        
      default:
        return (
          <Typography variant="body1">
            New activity from {item.user_name}
          </Typography>
        );
    }
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
            <Typography variant="subtitle2" gutterBottom>Content Type</Typography>
            <FilterChip
              label="Drills"
              active={filters.showDrills}
              onClick={() => setFilters(prev => ({ ...prev, showDrills: !prev.showDrills }))}
            />
            <FilterChip
              label="Achievements"
              active={filters.showAchievements}
              onClick={() => setFilters(prev => ({ ...prev, showAchievements: !prev.showAchievements }))}
            />
            <FilterChip
              label="Tips"
              active={filters.showTips}
              onClick={() => setFilters(prev => ({ ...prev, showTips: !prev.showTips }))}
            />
          </Box>
          
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>View Options</Typography>
            <FilterChip
              label="Followed Only"
              active={filters.followedOnly}
              onClick={() => setFilters(prev => ({ ...prev, followedOnly: !prev.followedOnly }))}
            />
            <FilterChip
              label="Most Tipped"
              active={filters.mostTipped}
              onClick={() => setFilters(prev => ({ ...prev, mostTipped: !prev.mostTipped }))}
            />
          </Box>
        </Box>
      )}
    </Box>
  );

  if (error) {
    return (
      <FeedContainer>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => fetchFeed(true)} variant="contained">
          Retry
        </Button>
      </FeedContainer>
    );
  }

  return (
    <FeedContainer>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Discovery Feed
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => fetchFeed(true)} disabled={loading}>
            <Refresh />
          </IconButton>
          <Fab size="small" color="primary" onClick={() => setShowFilters(!showFilters)}>
            <FilterList />
          </Fab>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Activity" />
        <Tab label="Following" />
        <Tab label="Trending" />
        <Tab label="My Team" />
      </Tabs>

      {/* Filters */}
      {renderFilters()}

      {/* Feed Items */}
      <Box>
        {feedItems.map(renderFeedItem)}
        
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && feedItems.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No activity to show
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Follow some users or complete drills to see activity here
            </Typography>
          </Box>
        )}
      </Box>

      {/* Preview Dialog */}
      <Dialog 
        open={!!previewItem} 
        onClose={() => setPreviewItem(null)}
        maxWidth="md"
        fullWidth
      >
        {previewItem && (
          <>
            <DialogTitle>
              {previewItem.user_name}'s Activity
            </DialogTitle>
            <DialogContent>
              {renderFeedContent(previewItem)}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewItem(null)}>Close</Button>
              <Button 
                variant="contained"
                onClick={() => {
                  // TODO: Navigate to detailed view
                  setPreviewItem(null);
                }}
              >
                View Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </FeedContainer>
  );
};

export default SocialDiscoveryFeed; 