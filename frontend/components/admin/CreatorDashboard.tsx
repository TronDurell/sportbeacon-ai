import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  MonetizationOn,
  Star,
  EmojiEvents,
  LocalFireDepartment,
  Visibility,
  ThumbUp,
  Share,
  CalendarToday,
  LocationOn,
  People,
  AttachMoney,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CreatorStats {
  id: string;
  name: string;
  avatar: string;
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  tipCount: number;
  likeStreak: number;
  maxStreak: number;
  totalLikes: number;
  totalViews: number;
  totalShares: number;
  eventsCreated: number;
  followers: number;
  rank: number;
  badges: Badge[];
  recentActivity: Activity[];
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  earnedAt: Date;
}

interface Activity {
  id: string;
  type: 'tip' | 'like' | 'share' | 'event' | 'streak';
  amount?: number;
  description: string;
  timestamp: Date;
}

interface TipTransaction {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
  message?: string;
  tipperName?: string;
}

interface StreakLog {
  id: string;
  userId: string;
  streakCount: number;
  lastLikeDate: Date;
  isActive: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const CreatorDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [creators, setCreators] = useState<CreatorStats[]>([]);
  const [topCreators, setTopCreators] = useState<CreatorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<CreatorStats | null>(null);

  // Fetch creator data with Stripe tips and streak logs
  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true);
        
        // Fetch all users who are creators
        const usersQuery = query(
          collection(db, 'users'),
          where('isCreator', '==', true)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const creatorsData: CreatorStats[] = [];

        for (const userDoc of usersSnapshot.docs) {
          const user = userDoc.data();
          
          // Fetch Stripe tips for this creator
          const tipsQuery = query(
            collection(db, 'stripe.tips'),
            where('creatorId', '==', userDoc.id),
            where('status', '==', 'completed')
          );
          
          const tipsSnapshot = await getDocs(tipsQuery);
          const tips = tipsSnapshot.docs.map(doc => doc.data() as TipTransaction);
          
          // Fetch like streak logs
          const streakQuery = query(
            collection(db, 'like_streak_logs'),
            where('userId', '==', userDoc.id),
            where('isActive', '==', true)
          );
          
          const streakSnapshot = await getDocs(streakQuery);
          const streakLogs = streakSnapshot.docs.map(doc => doc.data() as StreakLog);
          
          // Calculate earnings
          const totalEarnings = tips.reduce((sum, tip) => sum + tip.amount, 0);
          const now = new Date();
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const monthlyEarnings = tips
            .filter(tip => new Date(tip.createdAt) >= monthAgo)
            .reduce((sum, tip) => sum + tip.amount, 0);
            
          const weeklyEarnings = tips
            .filter(tip => new Date(tip.createdAt) >= weekAgo)
            .reduce((sum, tip) => sum + tip.amount, 0);

          // Get current streak
          const currentStreak = streakLogs.length > 0 ? Math.max(...streakLogs.map(s => s.streakCount)) : 0;
          
          // Generate badges based on achievements
          const badges = generateBadges(totalEarnings, currentStreak, tips.length, user.totalLikes || 0);
          
          // Generate recent activity
          const recentActivity = generateRecentActivity(tips, streakLogs);

          const creatorStats: CreatorStats = {
            id: userDoc.id,
            name: user.displayName || user.name || 'Unknown Creator',
            avatar: user.photoURL || user.avatar || '',
            totalEarnings,
            monthlyEarnings,
            weeklyEarnings,
            tipCount: tips.length,
            likeStreak: currentStreak,
            maxStreak: user.maxStreak || currentStreak,
            totalLikes: user.totalLikes || 0,
            totalViews: user.totalViews || 0,
            totalShares: user.totalShares || 0,
            eventsCreated: user.eventsCreated || 0,
            followers: user.followers || 0,
            rank: 0, // Will be calculated after sorting
            badges,
            recentActivity,
          };

          creatorsData.push(creatorStats);
        }

        // Sort by total earnings and assign ranks
        creatorsData.sort((a, b) => b.totalEarnings - a.totalEarnings);
        creatorsData.forEach((creator, index) => {
          creator.rank = index + 1;
        });

        setCreators(creatorsData);
        setTopCreators(creatorsData.slice(0, 10));
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch creator data:', err);
        setError('Failed to load creator data');
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, []);

  // Generate badges based on achievements
  const generateBadges = (
    totalEarnings: number,
    currentStreak: number,
    tipCount: number,
    totalLikes: number
  ): Badge[] => {
    const badges: Badge[] = [];

    // Earnings badges
    if (totalEarnings >= 1000) {
      badges.push({
        id: 'earnings_1k',
        name: 'Earnings Champion',
        icon: '💰',
        color: '#FFD700',
        description: 'Earned $1,000+ in tips',
        earnedAt: new Date(),
      });
    }

    if (totalEarnings >= 100) {
      badges.push({
        id: 'earnings_100',
        name: 'Tip Magnet',
        icon: '💎',
        color: '#C0C0C0',
        description: 'Earned $100+ in tips',
        earnedAt: new Date(),
      });
    }

    // Streak badges
    if (currentStreak >= 30) {
      badges.push({
        id: 'streak_30',
        name: 'Streak Master',
        icon: '🔥',
        color: '#FF4500',
        description: '30+ day like streak',
        earnedAt: new Date(),
      });
    }

    if (currentStreak >= 7) {
      badges.push({
        id: 'streak_7',
        name: 'Weekly Warrior',
        icon: '⚡',
        color: '#FFA500',
        description: '7+ day like streak',
        earnedAt: new Date(),
      });
    }

    // Engagement badges
    if (tipCount >= 50) {
      badges.push({
        id: 'tips_50',
        name: 'Tip Collector',
        icon: '🎯',
        color: '#32CD32',
        description: 'Received 50+ tips',
        earnedAt: new Date(),
      });
    }

    if (totalLikes >= 1000) {
      badges.push({
        id: 'likes_1k',
        name: 'Like Legend',
        icon: '👍',
        color: '#4169E1',
        description: '1,000+ total likes',
        earnedAt: new Date(),
      });
    }

    return badges;
  };

  // Generate recent activity from tips and streaks
  const generateRecentActivity = (
    tips: TipTransaction[],
    streakLogs: StreakLog[]
  ): Activity[] => {
    const activities: Activity[] = [];

    // Add recent tips
    tips.slice(0, 5).forEach(tip => {
      activities.push({
        id: tip.id,
        type: 'tip',
        amount: tip.amount,
        description: `Received $${tip.amount} tip${tip.message ? `: "${tip.message}"` : ''}`,
        timestamp: new Date(tip.createdAt),
      });
    });

    // Add streak milestones
    streakLogs.forEach(streak => {
      if (streak.streakCount % 7 === 0) { // Weekly milestones
        activities.push({
          id: `streak_${streak.id}`,
          type: 'streak',
          description: `Reached ${streak.streakCount} day streak!`,
          timestamp: new Date(streak.lastLikeDate),
        });
      }
    });

    // Sort by timestamp and return recent 10
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  };

  // Chart data for earnings over time
  const earningsChartData = useMemo(() => {
    if (!selectedCreator) return [];
    
    // Generate mock data for the last 12 months
    const data = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEarnings = Math.random() * selectedCreator.monthlyEarnings * 1.5;
      
      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        earnings: Math.round(monthEarnings),
      });
    }
    
    return data;
  }, [selectedCreator]);

  // Pie chart data for earnings breakdown
  const earningsBreakdownData = useMemo(() => {
    if (!selectedCreator) return [];
    
    return [
      { name: 'Tips', value: selectedCreator.totalEarnings, color: '#0088FE' },
      { name: 'Events', value: selectedCreator.eventsCreated * 10, color: '#00C49F' },
      { name: 'Sponsorships', value: selectedCreator.followers * 0.5, color: '#FFBB28' },
    ];
  }, [selectedCreator]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Creator Dashboard
      </Typography>
      
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Top Creators" />
        <Tab label="Earnings Analytics" />
        <Tab label="Streak Leaderboard" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <MonetizationOn color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Earnings</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  ${creators.reduce((sum, c) => sum + c.totalEarnings, 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Across all creators
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <People color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Creators</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {creators.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <LocalFireDepartment color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Avg Streak</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {Math.round(creators.reduce((sum, c) => sum + c.likeStreak, 0) / creators.length)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Days active
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ThumbUp color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Tips</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {creators.reduce((sum, c) => sum + c.tipCount, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Received this month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Creators Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Earners This Month
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Creator</TableCell>
                        <TableCell>Monthly Earnings</TableCell>
                        <TableCell>Total Earnings</TableCell>
                        <TableCell>Streak</TableCell>
                        <TableCell>Badges</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCreators.map((creator) => (
                        <TableRow key={creator.id} hover>
                          <TableCell>
                            <Chip
                              label={`#${creator.rank}`}
                              color={creator.rank <= 3 ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar src={creator.avatar} sx={{ mr: 1 }}>
                                {creator.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">{creator.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              ${creator.monthlyEarnings.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              ${creator.totalEarnings.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocalFireDepartment color="warning" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">{creator.likeStreak} days</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.5}>
                              {creator.badges.slice(0, 3).map((badge) => (
                                <Tooltip key={badge.id} title={badge.description}>
                                  <Chip
                                    label={badge.icon}
                                    size="small"
                                    sx={{ backgroundColor: badge.color, color: 'white' }}
                                  />
                                </Tooltip>
                              ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  All Creators Leaderboard
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Creator</TableCell>
                        <TableCell>Total Earnings</TableCell>
                        <TableCell>Tips Received</TableCell>
                        <TableCell>Current Streak</TableCell>
                        <TableCell>Followers</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {creators.map((creator) => (
                        <TableRow key={creator.id} hover>
                          <TableCell>
                            <Chip
                              label={`#${creator.rank}`}
                              color={creator.rank <= 3 ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar src={creator.avatar} sx={{ mr: 1 }}>
                                {creator.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">{creator.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              ${creator.totalEarnings.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{creator.tipCount}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocalFireDepartment color="warning" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">{creator.likeStreak} days</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{creator.followers}</Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => setSelectedCreator(creator)}
                            >
                              <Visibility />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && selectedCreator && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Earnings Over Time - {selectedCreator.name}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={earningsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Earnings Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={earningsBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {earningsBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity - {selectedCreator.name}
                </Typography>
                <Box>
                  {selectedCreator.recentActivity.map((activity) => (
                    <Box key={activity.id} display="flex" alignItems="center" py={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: activity.type === 'tip' ? '#4CAF50' : '#FF9800',
                          mr: 2,
                        }}
                      />
                      <Typography variant="body2" flex={1}>
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.timestamp.toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Streak Leaderboard
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Creator</TableCell>
                        <TableCell>Current Streak</TableCell>
                        <TableCell>Max Streak</TableCell>
                        <TableCell>Total Likes</TableCell>
                        <TableCell>Progress</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {creators
                        .sort((a, b) => b.likeStreak - a.likeStreak)
                        .map((creator, index) => (
                          <TableRow key={creator.id} hover>
                            <TableCell>
                              <Chip
                                label={`#${index + 1}`}
                                color={index < 3 ? 'primary' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Avatar src={creator.avatar} sx={{ mr: 1 }}>
                                  {creator.name.charAt(0)}
                                </Avatar>
                                <Typography variant="body2">{creator.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <LocalFireDepartment color="warning" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" fontWeight="bold">
                                  {creator.likeStreak} days
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{creator.maxStreak} days</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{creator.totalLikes}</Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <LinearProgress
                                  variant="determinate"
                                  value={(creator.likeStreak / creator.maxStreak) * 100}
                                  sx={{ width: 100, mr: 1 }}
                                />
                                <Typography variant="caption">
                                  {Math.round((creator.likeStreak / creator.maxStreak) * 100)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}; 