import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Button,
  Chip,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert
} from '@mui/material';
import {
  ThumbUp as LikeIcon,
  ThumbUpOutlined as LikeOutlinedIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  SportsSoccer as SoccerIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  FitnessCenter as FitnessIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Visibility as ViewsIcon,
  Favorite as HeartIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Flag as FlagIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useMonetization } from '../../hooks/useMonetization';
import useChat from '../../hooks/useChat';

interface Activity {
  id: string;
  type: 'post' | 'achievement' | 'tip' | 'comment' | 'follow' | 'like' | 'share';
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  metadata?: {
    sport?: string;
    achievement?: string;
    tipAmount?: number;
    recipientName?: string;
  };
}

interface ActivityFeedProps {
  filter?: 'all' | 'posts' | 'achievements' | 'tips' | 'following';
  showCreatePost?: boolean;
}

/**
 * Social activity feed component
 * Displays user activities, interactions, and social features
 */
const ActivityFeed: React.FC<ActivityFeedProps> = ({
  filter = 'all',
  showCreatePost = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { earnings, recentPayouts } = useMonetization();
  const { messages, rooms } = useChat();

  // Local state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedFilter, setSelectedFilter] = useState(filter);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock activities data
  const mockActivities = useMemo((): Activity[] => [
    {
      id: '1',
      type: 'post',
      userId: 'user1',
      userName: 'Coach Mike',
      userAvatar: 'https://via.placeholder.com/40',
      content: 'Just finished an amazing basketball training session! Here are some key drills that helped improve our team\'s shooting accuracy. 🏀 #BasketballTraining #Coaching',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      likes: 45,
      comments: 12,
      shares: 8,
      views: 234,
      isLiked: false,
      isBookmarked: false,
      media: {
        type: 'image',
        url: 'https://via.placeholder.com/600x400',
        thumbnail: 'https://via.placeholder.com/300x200'
      },
      metadata: {
        sport: 'Basketball'
      }
    },
    {
      id: '2',
      type: 'achievement',
      userId: 'user2',
      userName: 'Sarah Johnson',
      userAvatar: 'https://via.placeholder.com/40',
      content: '🏆 Just earned the "Elite Coach" badge! Thank you to all my amazing students for your dedication and hard work. This achievement means the world to me!',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      likes: 89,
      comments: 23,
      shares: 15,
      views: 567,
      isLiked: true,
      isBookmarked: true,
      metadata: {
        achievement: 'Elite Coach',
        sport: 'Soccer'
      }
    },
    {
      id: '3',
      type: 'tip',
      userId: 'user3',
      userName: 'Alex Rodriguez',
      userAvatar: 'https://via.placeholder.com/40',
      content: 'Just received a generous tip from Coach Mike for the personalized training program! 💰 Thank you for the support!',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      likes: 34,
      comments: 7,
      shares: 3,
      views: 189,
      isLiked: false,
      isBookmarked: false,
      metadata: {
        tipAmount: 50,
        recipientName: 'Coach Mike'
      }
    },
    {
      id: '4',
      type: 'post',
      userId: 'user4',
      userName: 'Fitness Pro',
      userAvatar: 'https://via.placeholder.com/40',
      content: 'New workout routine alert! 💪 This 30-minute HIIT session is perfect for athletes looking to improve their endurance and strength. Try it out and let me know what you think!',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      likes: 67,
      comments: 18,
      shares: 12,
      views: 445,
      isLiked: false,
      isBookmarked: false,
      media: {
        type: 'video',
        url: 'https://via.placeholder.com/600x400',
        thumbnail: 'https://via.placeholder.com/300x200'
      },
      metadata: {
        sport: 'Fitness'
      }
    },
    {
      id: '5',
      type: 'comment',
      userId: 'user5',
      userName: 'Tennis Coach',
      userAvatar: 'https://via.placeholder.com/40',
      content: 'Great tips on improving serve technique! I\'ve been using similar drills with my students and the results are amazing. Keep sharing your knowledge!',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      likes: 23,
      comments: 5,
      shares: 2,
      views: 156,
      isLiked: true,
      isBookmarked: false,
      metadata: {
        sport: 'Tennis'
      }
    }
  ], []);

  // Load activities
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      let filteredActivities = mockActivities;
      
      // Apply filter
      if (selectedFilter !== 'all') {
        filteredActivities = mockActivities.filter(activity => activity.type === selectedFilter);
      }
      
      setActivities(filteredActivities);
      setIsLoading(false);
    }, 1000);
  }, [selectedFilter, mockActivities]);

  // Handle like
  const handleLike = (activityId: string) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          isLiked: !activity.isLiked,
          likes: activity.isLiked ? activity.likes - 1 : activity.likes + 1
        };
      }
      return activity;
    }));
  };

  // Handle bookmark
  const handleBookmark = (activityId: string) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          isBookmarked: !activity.isBookmarked
        };
      }
      return activity;
    }));
  };

  // Handle share
  const handleShare = (activityId: string) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          shares: activity.shares + 1
        };
      }
      return activity;
    }));
  };

  // Handle create post
  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'post',
      userId: user?.uid || 'currentUser',
      userName: user?.displayName || 'Current User',
      userAvatar: user?.photoURL,
      content: newPostContent,
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      isLiked: false,
      isBookmarked: false,
      metadata: {
        sport: selectedSport
      }
    };

    setActivities(prev => [newActivity, ...prev]);
    setNewPostContent('');
    setSelectedSport('');
    setShowCreateDialog(false);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Get sport icon
  const getSportIcon = (sport?: string) => {
    switch (sport?.toLowerCase()) {
      case 'basketball':
        return <BasketballIcon />;
      case 'soccer':
        return <SoccerIcon />;
      case 'football':
        return <FootballIcon />;
      case 'fitness':
        return <FitnessIcon />;
      default:
        return <TrophyIcon />;
    }
  };

  // Get activity type color
  const getActivityTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'achievement':
        return theme.palette.warning.main;
      case 'tip':
        return theme.palette.success.main;
      case 'post':
        return theme.palette.primary.main;
      case 'comment':
        return theme.palette.secondary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Render activity card
  const renderActivityCard = (activity: Activity) => (
    <Card key={activity.id} sx={{ mb: 2 }}>
      <CardHeader
        avatar={
          <Avatar src={activity.userAvatar}>
            {activity.userName.charAt(0)}
          </Avatar>
        }
        action={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" component="span">
              {activity.userName}
            </Typography>
            {activity.metadata?.sport && (
              <Chip
                icon={getSportIcon(activity.metadata.sport)}
                label={activity.metadata.sport}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {activity.type === 'achievement' && (
              <Chip
                icon={<TrophyIcon />}
                label="Achievement"
                size="small"
                color="warning"
              />
            )}
            {activity.type === 'tip' && (
              <Chip
                icon={<HeartIcon />}
                label={`$${activity.metadata?.tipAmount}`}
                size="small"
                color="success"
              />
            )}
          </Box>
        }
        subheader={formatTimestamp(activity.timestamp)}
      />
      
      <CardContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {activity.content}
        </Typography>
        
        {activity.media && (
          <Box sx={{ mb: 2 }}>
            <img
              src={activity.media.thumbnail || activity.media.url}
              alt="Activity media"
              style={{
                width: '100%',
                maxHeight: 300,
                objectFit: 'cover',
                borderRadius: theme.shape.borderRadius
              }}
            />
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {activity.views} views
            </Typography>
            <Typography variant="caption" color="text.secondary">
              •
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activity.comments} comments
            </Typography>
          </Box>
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={activity.isLiked ? <LikeIcon /> : <LikeOutlinedIcon />}
            onClick={() => handleLike(activity.id)}
            color={activity.isLiked ? 'primary' : 'inherit'}
            size="small"
          >
            {activity.likes}
          </Button>
          <Button
            startIcon={<CommentIcon />}
            size="small"
          >
            {activity.comments}
          </Button>
          <Button
            startIcon={<ShareIcon />}
            onClick={() => handleShare(activity.id)}
            size="small"
          >
            {activity.shares}
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => handleBookmark(activity.id)}
            color={activity.isBookmarked ? 'primary' : 'inherit'}
          >
            {activity.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
          <IconButton size="small">
            <FlagIcon />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Activity Feed
        </Typography>
        {showCreatePost && (
          <Fab
            color="primary"
            onClick={() => setShowCreateDialog(true)}
            sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>

      {/* Filter tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedFilter}
          onChange={(_, newValue) => setSelectedFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" value="all" />
          <Tab label="Posts" value="post" />
          <Tab label="Achievements" value="achievement" />
          <Tab label="Tips" value="tip" />
          <Tab label="Comments" value="comment" />
          <Tab label="Following" value="following" />
        </Tabs>
      </Paper>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Activities list */}
      <Box>
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardHeader
                avatar={<Skeleton variant="circular" width={40} height={40} />}
                title={<Skeleton variant="text" width="60%" />}
                subheader={<Skeleton variant="text" width="40%" />}
              />
              <CardContent>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))
        ) : activities.length > 0 ? (
          activities.map(renderActivityCard)
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No activities found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedFilter === 'all' 
                ? 'Start following other users to see their activities here.'
                : `No ${selectedFilter} activities found.`
              }
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Create post dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="What's on your mind? Share your thoughts, achievements, or training tips..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth>
            <InputLabel>Sport Category</InputLabel>
            <Select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              label="Sport Category"
            >
              <MenuItem value="Basketball">Basketball</MenuItem>
              <MenuItem value="Soccer">Soccer</MenuItem>
              <MenuItem value="Football">Football</MenuItem>
              <MenuItem value="Tennis">Tennis</MenuItem>
              <MenuItem value="Fitness">Fitness</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            disabled={!newPostContent.trim()}
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivityFeed; 