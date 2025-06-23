import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Rating,
  Stack
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  Star,
  StarBorder,
  ThumbUp,
  ThumbDown,
  Visibility,
  VisibilityOff,
  PlayArrow,
  Pause,
  Stop,
  Settings,
  Analytics,
  Dashboard,
  ExpandMore,
  Add,
  Edit,
  Delete,
  Visibility as VisibilityIcon,
  Preview,
  Build,
  TestTube,
  Verified,
  Warning as WarningIcon,
  Info,
  Star as StarIcon,
  AttachMoney,
  People,
  Speed,
  Storage,
  CloudUpload,
  CloudDownload,
  Wifi,
  WifiOff,
  CheckCircle,
  Error,
  Warning,
  Notifications,
  Email,
  Chat,
  Forum,
  Feedback,
  BugReport,
  Lightbulb,
  Rocket,
  Flag,
  CalendarToday,
  Schedule,
  Event,
  Campaign,
  EmojiEvents,
  LocalFireDepartment,
  TrendingFlat,
  ShowChart,
  BarChart,
  PieChart,
  ScatterPlot,
  Timeline as TimelineIcon,
  Assessment,
  Insights,
  Psychology,
  School,
  Sports,
  FitnessCenter,
  DirectionsRun,
  SportsBasketball,
  SportsSoccer,
  SportsTennis,
  SportsVolleyball,
  SportsBaseball,
  SportsHockey,
  SportsCricket,
  SportsRugby,
  SportsGolf,
  SportsEsports
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Legend
} from 'recharts';

interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  estimatedRelease: string;
  progress: number;
  assignee?: string;
  dependencies?: string[];
  tags: string[];
}

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  type: 'feature' | 'bugfix' | 'improvement' | 'security';
  title: string;
  description: string;
  author: string;
  breaking?: boolean;
}

interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  status: 'open' | 'in_progress' | 'completed' | 'declined';
  priority: 'low' | 'medium' | 'high' | 'critical';
  comments: Comment[];
}

interface Comment {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  isAdmin: boolean;
}

interface AnalyticsData {
  tipDistribution: TipDistributionData[];
  highlightEngagement: HighlightEngagementData[];
  aiAccuracyTrends: AIAccuracyData[];
  userEngagement: UserEngagementData[];
  systemPerformance: SystemPerformanceData[];
  sportBreakdown: SportBreakdownData[];
  rewardMetrics: RewardMetricsData[];
  federationStats: FederationStatsData[];
}

interface TipDistributionData {
  amount: number;
  count: number;
  percentage: number;
  category: string;
}

interface HighlightEngagementData {
  date: string;
  views: number;
  arParticipation: number;
  shares: number;
  likes: number;
  comments: number;
}

interface AIAccuracyData {
  date: string;
  accuracy: number;
  confidence: number;
  feedbackScore: number;
  improvement: number;
}

interface UserEngagementData {
  date: string;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  sessionDuration: number;
}

interface SystemPerformanceData {
  date: string;
  responseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface SportBreakdownData {
  sport: string;
  users: number;
  highlights: number;
  drills: number;
  engagement: number;
}

interface RewardMetricsData {
  date: string;
  tokensAwarded: number;
  tokensBurned: number;
  tipsGiven: number;
  tipsReceived: number;
}

interface FederationStatsData {
  federation: string;
  teams: number;
  players: number;
  events: number;
  engagement: number;
}

const RoadmapPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedSport, setSelectedSport] = useState('all');

  useEffect(() => {
    loadRoadmapData();
  }, []);

  const loadRoadmapData = async () => {
    try {
      setLoading(true);
      
      // Load features
      const featuresData = await loadFeatures();
      setFeatures(featuresData);
      
      // Load changelog
      const changelogData = await loadChangelog();
      setChangelog(changelogData);
      
      // Load feedback
      const feedbackData = await loadFeedback();
      setFeedback(feedbackData);
      
      // Load analytics data
      const analyticsData = await loadAnalyticsData();
      setAnalyticsData(analyticsData);
      
    } catch (error) {
      console.error('Error loading roadmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async (): Promise<Feature[]> => {
    // Mock data - replace with actual API call
    return [
      {
        id: '1',
        title: 'AI Video Analysis',
        description: 'Advanced video analysis using computer vision and AI to provide detailed coaching insights',
        status: 'in_progress',
        priority: 'high',
        category: 'AI/ML',
        estimatedRelease: '2024-03-15',
        progress: 75,
        assignee: 'AI Team',
        tags: ['AI', 'Video', 'Coaching']
      },
      {
        id: '2',
        title: 'Real-time Match Tracking',
        description: 'Live match tracking with real-time statistics and performance metrics',
        status: 'planned',
        priority: 'critical',
        category: 'Core Features',
        estimatedRelease: '2024-04-01',
        progress: 0,
        tags: ['Real-time', 'Tracking', 'Statistics']
      },
      {
        id: '3',
        title: 'Advanced Analytics Dashboard',
        description: 'Comprehensive analytics dashboard with customizable reports and insights',
        status: 'completed',
        priority: 'medium',
        category: 'Analytics',
        estimatedRelease: '2024-02-01',
        progress: 100,
        tags: ['Analytics', 'Dashboard', 'Reports']
      },
      {
        id: '4',
        title: 'Mobile AR Experience',
        description: 'Augmented reality experience for mobile devices with real-time overlays',
        status: 'in_progress',
        priority: 'high',
        category: 'Mobile',
        estimatedRelease: '2024-05-01',
        progress: 45,
        assignee: 'Mobile Team',
        tags: ['AR', 'Mobile', 'Real-time']
      },
      {
        id: '5',
        title: 'Blockchain Rewards System',
        description: 'Decentralized rewards system using blockchain technology',
        status: 'planned',
        priority: 'medium',
        category: 'Web3',
        estimatedRelease: '2024-06-01',
        progress: 0,
        tags: ['Blockchain', 'Rewards', 'Web3']
      }
    ];
  };

  const loadChangelog = async (): Promise<ChangelogEntry[]> => {
    // Mock data - replace with actual API call
    return [
      {
        id: '1',
        version: '2.1.0',
        date: '2024-02-15',
        type: 'feature',
        title: 'Enhanced Drill Recommendations',
        description: 'Improved AI-powered drill recommendations based on player performance and goals',
        author: 'AI Team'
      },
      {
        id: '2',
        version: '2.0.5',
        date: '2024-02-10',
        type: 'bugfix',
        title: 'Fixed Video Upload Issues',
        description: 'Resolved issues with video upload functionality and improved error handling',
        author: 'Backend Team'
      },
      {
        id: '3',
        version: '2.0.4',
        date: '2024-02-05',
        type: 'security',
        title: 'Security Updates',
        description: 'Applied critical security patches and improved authentication system',
        author: 'Security Team',
        breaking: true
      }
    ];
  };

  const loadFeedback = async (): Promise<FeedbackItem[]> => {
    // Mock data - replace with actual API call
    return [
      {
        id: '1',
        type: 'feature',
        title: 'Add support for more sports',
        description: 'Would love to see support for swimming and track & field',
        user: 'coach_sarah',
        timestamp: '2024-02-15T10:30:00Z',
        upvotes: 45,
        downvotes: 2,
        status: 'in_progress',
        priority: 'high',
        comments: [
          {
            id: '1',
            user: 'admin',
            content: 'This is in our roadmap for Q2 2024',
            timestamp: '2024-02-15T11:00:00Z',
            isAdmin: true
          }
        ]
      },
      {
        id: '2',
        type: 'bug',
        title: 'AR overlay not working on iOS',
        description: 'AR stats overlay disappears after 30 seconds on iPhone',
        user: 'player_mike',
        timestamp: '2024-02-14T15:20:00Z',
        upvotes: 23,
        downvotes: 1,
        status: 'open',
        priority: 'critical',
        comments: []
      }
    ];
  };

  const loadAnalyticsData = async (): Promise<AnalyticsData> => {
    // Mock analytics data - replace with actual API calls
    const data: AnalyticsData = {
      tipDistribution: [
        { amount: 1, count: 150, percentage: 30, category: 'Micro Tips' },
        { amount: 5, count: 200, percentage: 40, category: 'Standard Tips' },
        { amount: 10, count: 100, percentage: 20, category: 'Generous Tips' },
        { amount: 25, count: 50, percentage: 10, category: 'Premium Tips' }
      ],
      highlightEngagement: [
        { date: '2024-02-01', views: 1200, arParticipation: 180, shares: 45, likes: 89, comments: 23 },
        { date: '2024-02-02', views: 1350, arParticipation: 210, shares: 52, likes: 95, comments: 28 },
        { date: '2024-02-03', views: 1100, arParticipation: 165, shares: 38, likes: 76, comments: 19 },
        { date: '2024-02-04', views: 1450, arParticipation: 225, shares: 58, likes: 102, comments: 31 },
        { date: '2024-02-05', views: 1600, arParticipation: 240, shares: 65, likes: 115, comments: 35 }
      ],
      aiAccuracyTrends: [
        { date: '2024-02-01', accuracy: 87, confidence: 92, feedbackScore: 4.2, improvement: 2.1 },
        { date: '2024-02-02', accuracy: 89, confidence: 94, feedbackScore: 4.3, improvement: 1.8 },
        { date: '2024-02-03', accuracy: 91, confidence: 95, feedbackScore: 4.4, improvement: 1.5 },
        { date: '2024-02-04', accuracy: 93, confidence: 96, feedbackScore: 4.5, improvement: 1.2 },
        { date: '2024-02-05', accuracy: 94, confidence: 97, feedbackScore: 4.6, improvement: 0.9 }
      ],
      userEngagement: [
        { date: '2024-02-01', activeUsers: 1250, newUsers: 45, returningUsers: 1205, sessionDuration: 18.5 },
        { date: '2024-02-02', activeUsers: 1320, newUsers: 52, returningUsers: 1268, sessionDuration: 19.2 },
        { date: '2024-02-03', activeUsers: 1280, newUsers: 38, returningUsers: 1242, sessionDuration: 17.8 },
        { date: '2024-02-04', activeUsers: 1400, newUsers: 65, returningUsers: 1335, sessionDuration: 20.1 },
        { date: '2024-02-05', activeUsers: 1480, newUsers: 72, returningUsers: 1408, sessionDuration: 21.3 }
      ],
      systemPerformance: [
        { date: '2024-02-01', responseTime: 245, errorRate: 0.8, cpuUsage: 65, memoryUsage: 72 },
        { date: '2024-02-02', responseTime: 238, errorRate: 0.7, cpuUsage: 68, memoryUsage: 75 },
        { date: '2024-02-03', responseTime: 252, errorRate: 0.9, cpuUsage: 62, memoryUsage: 70 },
        { date: '2024-02-04', responseTime: 231, errorRate: 0.6, cpuUsage: 71, memoryUsage: 78 },
        { date: '2024-02-05', responseTime: 225, errorRate: 0.5, cpuUsage: 74, memoryUsage: 80 }
      ],
      sportBreakdown: [
        { sport: 'Basketball', users: 850, highlights: 1250, drills: 320, engagement: 92 },
        { sport: 'Soccer', users: 720, highlights: 980, drills: 280, engagement: 88 },
        { sport: 'Tennis', users: 450, highlights: 650, drills: 180, engagement: 85 },
        { sport: 'Volleyball', users: 380, highlights: 520, drills: 150, engagement: 82 },
        { sport: 'Baseball', users: 320, highlights: 420, drills: 120, engagement: 79 },
        { sport: 'Esports', users: 280, highlights: 380, drills: 90, engagement: 76 }
      ],
      rewardMetrics: [
        { date: '2024-02-01', tokensAwarded: 12500, tokensBurned: 3200, tipsGiven: 450, tipsReceived: 380 },
        { date: '2024-02-02', tokensAwarded: 13200, tokensBurned: 3400, tipsGiven: 480, tipsReceived: 410 },
        { date: '2024-02-03', tokensAwarded: 11800, tokensBurned: 3000, tipsGiven: 420, tipsReceived: 360 },
        { date: '2024-02-04', tokensAwarded: 14500, tokensBurned: 3800, tipsGiven: 520, tipsReceived: 450 },
        { date: '2024-02-05', tokensAwarded: 15200, tokensBurned: 4000, tipsGiven: 550, tipsReceived: 480 }
      ],
      federationStats: [
        { federation: 'UIL', teams: 1250, players: 18750, events: 45, engagement: 94 },
        { federation: 'NCAA', teams: 890, players: 13350, events: 32, engagement: 91 },
        { federation: 'AAU', teams: 680, players: 10200, events: 28, engagement: 88 },
        { federation: 'FIFA', teams: 420, players: 6300, events: 18, engagement: 85 },
        { federation: 'NBA', teams: 30, players: 450, events: 12, engagement: 92 }
      ]
    };
    
    return data;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'planned': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'in_progress': return <TrendingUp />;
      case 'planned': return <Schedule />;
      case 'cancelled': return <Delete />;
      default: return <Timeline />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <PriorityHigh />;
      case 'high': return <Star />;
      case 'medium': return <Visibility />;
      case 'low': return <Code />;
      default: return <Code />;
    }
  };

  const renderFeaturesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Product Roadmap</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
        >
          Add Feature
        </Button>
      </Box>

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} md={6} lg={4} key={feature.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h3">
                    {feature.title}
                  </Typography>
                  <Box>
                    <Tooltip title={feature.status}>
                      <Chip
                        icon={getStatusIcon(feature.status)}
                        label={feature.status.replace('_', ' ')}
                        color={getStatusColor(feature.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    </Tooltip>
                    <Tooltip title={`Priority: ${feature.priority}`}>
                      <Chip
                        icon={getPriorityIcon(feature.priority)}
                        label={feature.priority}
                        color={getPriorityColor(feature.priority)}
                        size="small"
                      />
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {feature.description}
                </Typography>

                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    Progress: {feature.progress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={feature.progress}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    Release: {feature.estimatedRelease}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {feature.category}
                  </Typography>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {feature.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>

                {feature.assignee && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Assigned to: {feature.assignee}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderChangelogTab = () => (
    <Box>
      <Typography variant="h5" mb={3}>Changelog</Typography>
      
      <List>
        {changelog.map((entry) => (
          <React.Fragment key={entry.id}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <Chip
                  label={entry.version}
                  color="primary"
                  size="small"
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1">
                      {entry.title}
                    </Typography>
                    <Chip
                      label={entry.type}
                      size="small"
                      color={entry.type === 'security' ? 'error' : 'default'}
                    />
                    {entry.breaking && (
                      <Chip
                        label="Breaking"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {entry.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.date} • {entry.author}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Analytics Dashboard</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="1d">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Sport</InputLabel>
            <Select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              label="Sport"
            >
              <MenuItem value="all">All Sports</MenuItem>
              <MenuItem value="basketball">Basketball</MenuItem>
              <MenuItem value="soccer">Soccer</MenuItem>
              <MenuItem value="tennis">Tennis</MenuItem>
              <MenuItem value="volleyball">Volleyball</MenuItem>
              <MenuItem value="baseball">Baseball</MenuItem>
              <MenuItem value="esports">Esports</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {analyticsData && (
        <Grid container spacing={3}>
          {/* Tip Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Tip Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.tipDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                    >
                      {['#8884d8', '#82ca9d', '#ffc658', '#ff7300'].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Highlight Engagement vs AR Participation */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <Visibility sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Highlight Engagement vs AR Participation
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analyticsData.highlightEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#8884d8" name="Views" />
                    <Line type="monotone" dataKey="arParticipation" stroke="#82ca9d" strokeWidth={2} name="AR Participation" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* AI Accuracy Trends */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                  AI Accuracy Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.aiAccuracyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#8884d8" strokeWidth={2} name="Accuracy %" />
                    <Line type="monotone" dataKey="confidence" stroke="#82ca9d" strokeWidth={2} name="Confidence %" />
                    <Line type="monotone" dataKey="feedbackScore" stroke="#ffc658" strokeWidth={2} name="Feedback Score" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* User Engagement */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                  User Engagement
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.userEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="activeUsers" stackId="1" stroke="#8884d8" fill="#8884d8" name="Active Users" />
                    <Area type="monotone" dataKey="newUsers" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="New Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Sport Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <Sports sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Sport Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.sportBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sport" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#8884d8" name="Users" />
                    <Bar dataKey="highlights" fill="#82ca9d" name="Highlights" />
                    <Bar dataKey="drills" fill="#ffc658" name="Drills" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* System Performance */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                  System Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.systemPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="responseTime" stroke="#8884d8" strokeWidth={2} name="Response Time (ms)" />
                    <Line type="monotone" dataKey="errorRate" stroke="#ff7300" strokeWidth={2} name="Error Rate (%)" />
                    <Line type="monotone" dataKey="cpuUsage" stroke="#82ca9d" strokeWidth={2} name="CPU Usage (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Federation Stats */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Federation Statistics
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={analyticsData.federationStats}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="federation" />
                    <PolarRadiusAxis />
                    <Radar name="Teams" dataKey="teams" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Players" dataKey="players" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Radar name="Events" dataKey="events" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderFeedbackTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">User Feedback & Roadmap</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Add Feedback
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Feedback Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Feedback Summary</Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Total Feedback</Typography>
                  <Typography variant="h6">{feedback.length}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Open Issues</Typography>
                  <Typography variant="h6" color="warning.main">
                    {feedback.filter(f => f.status === 'open').length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>In Progress</Typography>
                  <Typography variant="h6" color="info.main">
                    {feedback.filter(f => f.status === 'in_progress').length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Completed</Typography>
                  <Typography variant="h6" color="success.main">
                    {feedback.filter(f => f.status === 'completed').length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Feedback List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Recent Feedback</Typography>
              <List>
                {feedback.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getFeedbackIcon(item.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">{item.title}</Typography>
                            <Chip
                              label={item.priority}
                              size="small"
                              color={getPriorityColor(item.priority)}
                            />
                            <Chip
                              label={item.status}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                              <Typography variant="caption">
                                by {item.user} • {new Date(item.timestamp).toLocaleDateString()}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <ThumbUp fontSize="small" />
                                <Typography variant="caption">{item.upvotes}</Typography>
                                <ThumbDown fontSize="small" />
                                <Typography variant="caption">{item.downvotes}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        }
                      />
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Roadmap" icon={<Timeline />} />
        <Tab label="Changelog" icon={<Code />} />
        <Tab label="Analytics" icon={<Analytics />} />
      </Tabs>

      {activeTab === 0 && renderFeaturesTab()}
      {activeTab === 1 && renderChangelogTab()}
      {activeTab === 2 && renderAnalyticsTab()}
    </Box>
  );
};

export default RoadmapPanel; 