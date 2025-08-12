import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  AttachMoney as MoneyIcon,
  Visibility as ViewsIcon,
  ThumbUp as LikesIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { useAuth } from '../../hooks/useAuth';
import { useMonetization } from '../../hooks/useMonetization';
import useChat from '../../hooks/useChat';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

interface AnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  showRealTime?: boolean;
}

/**
 * Comprehensive analytics dashboard
 * Provides real-time metrics, charts, and insights
 */
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = '30d',
  showRealTime = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { earnings, payouts } = useMonetization();
  const { messages, rooms, unreadCounts } = useChat();

  // Local state
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Mock data - in real implementation, this would come from analytics service
  const mockData = useMemo(() => ({
    // User engagement metrics
    totalUsers: 15420,
    activeUsers: 8920,
    newUsers: 1240,
    userGrowth: 8.5,

    // Content metrics
    totalPosts: 45600,
    totalViews: 2340000,
    totalLikes: 89000,
    totalShares: 15600,
    engagementRate: 12.4,

    // Revenue metrics
    totalRevenue: earnings?.totalEarnings || 0,
    monthlyRevenue: 15420,
    revenueGrowth: 15.2,
    averageTip: 8.50,

    // Chat metrics
    totalMessages: messages.length,
    activeChats: rooms.length,
    responseTime: 2.3, // minutes
    chatSatisfaction: 4.6, // out of 5

    // Time series data
    dailyActivity: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      users: Math.floor(Math.random() * 1000) + 500,
      posts: Math.floor(Math.random() * 200) + 50,
      revenue: Math.floor(Math.random() * 1000) + 200,
      messages: Math.floor(Math.random() * 500) + 100
    })),

    // Top performing content
    topContent: [
      { title: 'Advanced Basketball Drills', views: 45000, likes: 1200, revenue: 850 },
      { title: 'Soccer Training Tips', views: 38000, likes: 980, revenue: 720 },
      { title: 'Fitness Workout Plan', views: 32000, likes: 850, revenue: 650 },
      { title: 'Nutrition Guide', views: 28000, likes: 720, revenue: 580 },
      { title: 'Mental Game Strategies', views: 25000, likes: 680, revenue: 520 }
    ],

    // User demographics
    demographics: {
      ageGroups: [
        { label: '13-17', value: 15 },
        { label: '18-24', value: 35 },
        { label: '25-34', value: 28 },
        { label: '35-44', value: 15 },
        { label: '45+', value: 7 }
      ],
      sports: [
        { label: 'Basketball', value: 30 },
        { label: 'Soccer', value: 25 },
        { label: 'Football', value: 20 },
        { label: 'Tennis', value: 15 },
        { label: 'Other', value: 10 }
      ]
    }
  }), [earnings?.totalEarnings, messages.length, rooms.length]);

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary
        }
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: theme.palette.divider
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      },
      y: {
        grid: {
          color: theme.palette.divider
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      }
    }
  };

  // Activity chart data
  const activityChartData = {
    labels: mockData.dailyActivity.map(d => d.date),
    datasets: [
      {
        label: 'Active Users',
        data: mockData.dailyActivity.map(d => d.users),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Posts',
        data: mockData.dailyActivity.map(d => d.posts),
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.main + '20',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Revenue chart data
  const revenueChartData = {
    labels: mockData.dailyActivity.map(d => d.date),
    datasets: [
      {
        label: 'Daily Revenue',
        data: mockData.dailyActivity.map(d => d.revenue),
        backgroundColor: theme.palette.success.main + '80',
        borderColor: theme.palette.success.main,
        borderWidth: 2
      }
    ]
  };

  // Demographics chart data
  const demographicsChartData = {
    labels: mockData.demographics.ageGroups.map(d => d.label),
    datasets: [
      {
        label: 'Age Distribution',
        data: mockData.demographics.ageGroups.map(d => d.value),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main
        ],
        borderWidth: 2,
        borderColor: theme.palette.background.paper
      }
    ]
  };

  // Sports distribution chart data
  const sportsChartData = {
    labels: mockData.demographics.sports.map(d => d.label),
    datasets: [
      {
        label: 'Sports Distribution',
        data: mockData.demographics.sports.map(d => d.value),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main
        ],
        borderWidth: 2,
        borderColor: theme.palette.background.paper
      }
    ]
  };

  // Performance metrics
  const performanceMetrics = [
    {
      title: 'Total Users',
      value: mockData.totalUsers.toLocaleString(),
      change: mockData.userGrowth,
      icon: <PeopleIcon />,
      color: theme.palette.primary.main
    },
    {
      title: 'Total Views',
      value: mockData.totalViews.toLocaleString(),
      change: 12.8,
      icon: <ViewsIcon />,
      color: theme.palette.secondary.main
    },
    {
      title: 'Total Revenue',
      value: `$${mockData.totalRevenue.toLocaleString()}`,
      change: mockData.revenueGrowth,
      icon: <MoneyIcon />,
      color: theme.palette.success.main
    },
    {
      title: 'Engagement Rate',
      value: `${mockData.engagementRate}%`,
      change: 2.1,
      icon: <LikesIcon />,
      color: theme.palette.warning.main
    }
  ];

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Handle time range change
  const handleTimeRangeChange = (newRange: string) => {
    setSelectedTimeRange(newRange as '7d' | '30d' | '90d' | '1y');
    handleRefresh();
  };

  // Render metric card
  const renderMetricCard = (metric: any) => (
    <Card key={metric.title} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              backgroundColor: metric.color + '20',
              color: metric.color,
              mr: 2
            }}
          >
            {metric.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div">
              {metric.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {metric.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {metric.change > 0 ? (
              <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
            ) : (
              <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5 }} />
            )}
            <Typography
              variant="caption"
              color={metric.change > 0 ? 'success.main' : 'error.main'}
            >
              {Math.abs(metric.change)}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
          <IconButton>
            <DownloadIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Loading indicator */}
      {isLoading && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Performance metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {performanceMetrics.map(renderMetricCard)}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Activity chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="User Activity"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line data={activityChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader
              title="Revenue"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Bar data={revenueChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Demographics charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Age Distribution"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Doughnut data={demographicsChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Sports Distribution"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Doughnut data={sportsChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top performing content */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Top Performing Content"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                {mockData.topContent.map((content, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {content.title}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Views: {content.views.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Likes: {content.likes.toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="success.main">
                        ${content.revenue}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 