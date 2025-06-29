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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  MonetizationOn,
  LocationOn,
  People,
  SportsSoccer,
  EmojiEvents,
  AttachMoney,
  CalendarToday,
  LocalFireDepartment,
  Visibility,
  ThumbUp,
  Share,
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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CivicMetrics {
  town: string;
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  totalVenues: number;
  totalEarnings: number;
  totalTips: number;
  totalLikes: number;
  totalViews: number;
  sportBreakdown: SportBreakdown[];
  venueUsage: VenueUsage[];
  economicActivity: EconomicActivity[];
  creatorImpact: CreatorImpact[];
  monthlyTrends: MonthlyTrend[];
}

interface SportBreakdown {
  sport: string;
  participants: number;
  events: number;
  venues: number;
  revenue: number;
}

interface VenueUsage {
  venueId: string;
  venueName: string;
  town: string;
  usageHours: number;
  eventsHosted: number;
  participants: number;
  revenue: number;
  capacity: number;
  utilization: number;
}

interface EconomicActivity {
  month: string;
  tips: number;
  eventFees: number;
  sponsorships: number;
  totalRevenue: number;
  activeCreators: number;
  newUsers: number;
}

interface CreatorImpact {
  creatorId: string;
  creatorName: string;
  town: string;
  eventsCreated: number;
  participantsReached: number;
  revenueGenerated: number;
  followers: number;
  engagementRate: number;
}

interface MonthlyTrend {
  month: string;
  users: number;
  events: number;
  revenue: number;
  engagement: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function CivicDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTown, setSelectedTown] = useState<string>('all');
  const [metrics, setMetrics] = useState<CivicMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [towns, setTowns] = useState<string[]>([]);

  // Fetch civic metrics data
  useEffect(() => {
    const fetchCivicData = async () => {
      try {
        setLoading(true);
        
        // Fetch all towns
        const townsQuery = query(collection(db, 'towns'));
        const townsSnapshot = await getDocs(townsQuery);
        const townsList = townsSnapshot.docs.map(doc => doc.data().name);
        setTowns(townsList);

        // Fetch users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch events
        const eventsQuery = query(collection(db, 'events'));
        const eventsSnapshot = await getDocs(eventsQuery);
        const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch venues
        const venuesQuery = query(collection(db, 'venues'));
        const venuesSnapshot = await getDocs(venuesQuery);
        const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch Stripe tips
        const tipsQuery = query(
          collection(db, 'stripe.tips'),
          where('status', '==', 'completed')
        );
        const tipsSnapshot = await getDocs(tipsQuery);
        const tips = tipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculate metrics
        const civicMetrics = calculateCivicMetrics(users, events, venues, tips, selectedTown);
        setMetrics(civicMetrics);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch civic data:', err);
        setError('Failed to load civic data');
        setLoading(false);
      }
    };

    fetchCivicData();
  }, [selectedTown]);

  // Calculate civic metrics
  const calculateCivicMetrics = (
    users: any[],
    events: any[],
    venues: any[],
    tips: any[],
    townFilter: string
  ): CivicMetrics => {
    // Filter by town if specified
    const filteredUsers = townFilter === 'all' ? users : users.filter(u => u.town === townFilter);
    const filteredEvents = townFilter === 'all' ? events : events.filter(e => e.town === townFilter);
    const filteredVenues = townFilter === 'all' ? venues : venues.filter(v => v.town === townFilter);
    const filteredTips = townFilter === 'all' ? tips : tips.filter(t => t.town === townFilter);

    // Calculate sport breakdown
    const sportBreakdown = calculateSportBreakdown(filteredEvents, filteredVenues, filteredTips);

    // Calculate venue usage
    const venueUsage = calculateVenueUsage(filteredVenues, filteredEvents);

    // Calculate economic activity
    const economicActivity = calculateEconomicActivity(filteredTips, filteredEvents, filteredUsers);

    // Calculate creator impact
    const creatorImpact = calculateCreatorImpact(filteredUsers, filteredEvents, filteredTips);

    // Calculate monthly trends
    const monthlyTrends = calculateMonthlyTrends(filteredUsers, filteredEvents, filteredTips);

    return {
      town: townFilter === 'all' ? 'All Towns' : townFilter,
      totalUsers: filteredUsers.length,
      activeUsers: filteredUsers.filter(u => u.lastActive && new Date(u.lastActive) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      totalEvents: filteredEvents.length,
      totalVenues: filteredVenues.length,
      totalEarnings: filteredTips.reduce((sum, tip) => sum + tip.amount, 0),
      totalTips: filteredTips.length,
      totalLikes: filteredUsers.reduce((sum, user) => sum + (user.totalLikes || 0), 0),
      totalViews: filteredUsers.reduce((sum, user) => sum + (user.totalViews || 0), 0),
      sportBreakdown,
      venueUsage,
      economicActivity,
      creatorImpact,
      monthlyTrends,
    };
  };

  // Calculate sport breakdown
  const calculateSportBreakdown = (events: any[], venues: any[], tips: any[]): SportBreakdown[] => {
    const sports = ['Soccer', 'Basketball', 'Baseball', 'Tennis', 'Swimming', 'Track', 'Volleyball'];
    
    return sports.map(sport => {
      const sportEvents = events.filter(e => e.sportType === sport);
      const sportVenues = venues.filter(v => v.sportTypes?.includes(sport));
      const sportTips = tips.filter(t => t.sportType === sport);
      
      return {
        sport,
        participants: sportEvents.reduce((sum, e) => sum + (e.participants?.length || 0), 0),
        events: sportEvents.length,
        venues: sportVenues.length,
        revenue: sportTips.reduce((sum, t) => sum + t.amount, 0),
      };
    }).filter(s => s.events > 0);
  };

  // Calculate venue usage
  const calculateVenueUsage = (venues: any[], events: any[]): VenueUsage[] => {
    return venues.map(venue => {
      const venueEvents = events.filter(e => e.venueId === venue.id);
      const usageHours = venueEvents.reduce((sum, e) => {
        const duration = e.endTime && e.startTime ? 
          (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / (1000 * 60 * 60) : 2;
        return sum + duration;
      }, 0);
      
      const participants = venueEvents.reduce((sum, e) => sum + (e.participants?.length || 0), 0);
      const revenue = venueEvents.reduce((sum, e) => sum + (e.fee || 0), 0);
      const utilization = venue.capacity ? (participants / venue.capacity) * 100 : 0;

      return {
        venueId: venue.id,
        venueName: venue.name,
        town: venue.town,
        usageHours,
        eventsHosted: venueEvents.length,
        participants,
        revenue,
        capacity: venue.capacity || 0,
        utilization,
      };
    });
  };

  // Calculate economic activity
  const calculateEconomicActivity = (tips: any[], events: any[], users: any[]): EconomicActivity[] => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthTips = tips.filter(t => {
        const tipDate = new Date(t.createdAt);
        return tipDate.getMonth() === date.getMonth() && tipDate.getFullYear() === date.getFullYear();
      });
      
      const monthEvents = events.filter(e => {
        const eventDate = new Date(e.startTime);
        return eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
      });
      
      const monthUsers = users.filter(u => {
        const userDate = new Date(u.createdAt);
        return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear();
      });

      months.push({
        month: monthStr,
        tips: monthTips.reduce((sum, t) => sum + t.amount, 0),
        eventFees: monthEvents.reduce((sum, e) => sum + (e.fee || 0), 0),
        sponsorships: monthEvents.reduce((sum, e) => sum + (e.sponsorshipAmount || 0), 0),
        totalRevenue: 0, // Will be calculated
        activeCreators: users.filter(u => u.isCreator && u.lastActive && new Date(u.lastActive) > new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000)).length,
        newUsers: monthUsers.length,
      });
    }

    // Calculate total revenue
    months.forEach(month => {
      month.totalRevenue = month.tips + month.eventFees + month.sponsorships;
    });

    return months;
  };

  // Calculate creator impact
  const calculateCreatorImpact = (users: any[], events: any[], tips: any[]): CreatorImpact[] => {
    const creators = users.filter(u => u.isCreator);
    
    return creators.map(creator => {
      const creatorEvents = events.filter(e => e.creatorId === creator.id);
      const creatorTips = tips.filter(t => t.creatorId === creator.id);
      
      return {
        creatorId: creator.id,
        creatorName: creator.displayName || creator.name || 'Unknown Creator',
        town: creator.town || 'Unknown',
        eventsCreated: creatorEvents.length,
        participantsReached: creatorEvents.reduce((sum, e) => sum + (e.participants?.length || 0), 0),
        revenueGenerated: creatorTips.reduce((sum, t) => sum + t.amount, 0),
        followers: creator.followers || 0,
        engagementRate: creator.followers ? ((creator.totalLikes || 0) / creator.followers) * 100 : 0,
      };
    }).sort((a, b) => b.revenueGenerated - a.revenueGenerated);
  };

  // Calculate monthly trends
  const calculateMonthlyTrends = (users: any[], events: any[], tips: any[]): MonthlyTrend[] => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthUsers = users.filter(u => {
        const userDate = new Date(u.createdAt);
        return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear();
      });
      
      const monthEvents = events.filter(e => {
        const eventDate = new Date(e.startTime);
        return eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
      });
      
      const monthTips = tips.filter(t => {
        const tipDate = new Date(t.createdAt);
        return tipDate.getMonth() === date.getMonth() && tipDate.getFullYear() === date.getFullYear();
      });

      months.push({
        month: monthStr,
        users: monthUsers.length,
        events: monthEvents.length,
        revenue: monthTips.reduce((sum, t) => sum + t.amount, 0),
        engagement: monthEvents.reduce((sum, e) => sum + (e.likes || 0) + (e.shares || 0), 0),
      });
    }

    return months;
  };

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

  if (!metrics) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No civic data available
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Civic Sports Infrastructure Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Town</InputLabel>
          <Select
            value={selectedTown}
            label="Town"
            onChange={(e) => setSelectedTown(e.target.value)}
          >
            <MenuItem value="all">All Towns</MenuItem>
            {towns.map((town) => (
              <MenuItem key={town} value={town}>{town}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Economic Activity" />
        <Tab label="Venue Usage" />
        <Tab label="Creator Impact" />
        <Tab label="Sport Analytics" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <People color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Users</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {metrics.totalUsers.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.activeUsers} active this month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <EmojiEvents color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Events</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {metrics.totalEvents.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Across {metrics.totalVenues} venues
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <MonetizationOn color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Revenue</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  ${metrics.totalEarnings.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From {metrics.totalTips} tips
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ThumbUp color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Engagement</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {metrics.totalLikes.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.totalViews.toLocaleString()} views
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Trends Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Trends - {metrics.town}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="New Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="events"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Events"
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="3"
                      stroke="#ffc658"
                      fill="#ffc658"
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Sport Breakdown */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sport Participation
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.sportBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ sport, participants }) => `${sport}: ${participants}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="participants"
                    >
                      {metrics.sportBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
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
                  Economic Activity - {metrics.town}
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={metrics.economicActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="tips" fill="#8884d8" name="Tips" />
                    <Bar dataKey="eventFees" fill="#82ca9d" name="Event Fees" />
                    <Bar dataKey="sponsorships" fill="#ffc658" name="Sponsorships" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Breakdown
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell>Tips</TableCell>
                        <TableCell>Event Fees</TableCell>
                        <TableCell>Sponsorships</TableCell>
                        <TableCell>Total Revenue</TableCell>
                        <TableCell>Active Creators</TableCell>
                        <TableCell>New Users</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.economicActivity.map((activity) => (
                        <TableRow key={activity.month}>
                          <TableCell>{activity.month}</TableCell>
                          <TableCell>${activity.tips.toLocaleString()}</TableCell>
                          <TableCell>${activity.eventFees.toLocaleString()}</TableCell>
                          <TableCell>${activity.sponsorships.toLocaleString()}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              ${activity.totalRevenue.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{activity.activeCreators}</TableCell>
                          <TableCell>{activity.newUsers}</TableCell>
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

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Venue Utilization - {metrics.town}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Venue</TableCell>
                        <TableCell>Town</TableCell>
                        <TableCell>Usage Hours</TableCell>
                        <TableCell>Events Hosted</TableCell>
                        <TableCell>Participants</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell>Utilization</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.venueUsage.map((venue) => (
                        <TableRow key={venue.venueId}>
                          <TableCell>{venue.venueName}</TableCell>
                          <TableCell>{venue.town}</TableCell>
                          <TableCell>{venue.usageHours.toFixed(1)}h</TableCell>
                          <TableCell>{venue.eventsHosted}</TableCell>
                          <TableCell>{venue.participants}</TableCell>
                          <TableCell>${venue.revenue.toLocaleString()}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LinearProgress
                                variant="determinate"
                                value={venue.utilization}
                                sx={{ width: 100, mr: 1 }}
                              />
                              <Typography variant="caption">
                                {venue.utilization.toFixed(1)}%
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

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Creator Impact - {metrics.town}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Creator</TableCell>
                        <TableCell>Town</TableCell>
                        <TableCell>Events Created</TableCell>
                        <TableCell>Participants Reached</TableCell>
                        <TableCell>Revenue Generated</TableCell>
                        <TableCell>Followers</TableCell>
                        <TableCell>Engagement Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.creatorImpact.slice(0, 10).map((creator) => (
                        <TableRow key={creator.creatorId}>
                          <TableCell>{creator.creatorName}</TableCell>
                          <TableCell>{creator.town}</TableCell>
                          <TableCell>{creator.eventsCreated}</TableCell>
                          <TableCell>{creator.participantsReached}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              ${creator.revenueGenerated.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{creator.followers}</TableCell>
                          <TableCell>{creator.engagementRate.toFixed(1)}%</TableCell>
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

      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sport Participation Radar
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={metrics.sportBreakdown}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="sport" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Participants"
                      dataKey="participants"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sport Revenue Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.sportBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sport" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                    <Bar dataKey="events" fill="#ffc658" name="Events" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
} 