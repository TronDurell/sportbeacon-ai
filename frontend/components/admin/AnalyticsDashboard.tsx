import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  SportsSoccer as SportsIcon,
  Public as PublicIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { api } from '../../services/api';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalFederations: number;
  activeFederations: number;
  totalConflicts: number;
  resolvedConflicts: number;
  totalHarmonizedRules: number;
  averageConfidenceScore: number;
  regionDistribution: Array<{ region: string; users: number; federations: number }>;
  sportDistribution: Array<{ sport: string; users: number; conflicts: number }>;
  conflictTrends: Array<{ date: string; conflicts: number; resolved: number }>;
  federationPerformance: Array<{ federation: string; members: number; conflicts: number; resolutionRate: number }>;
  regionStats: Array<{ region: string; strengthMultiplier: number; competitionLevel: number; infrastructure: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedRegion]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load various analytics data
      const [
        usersResponse,
        federationsResponse,
        conflictsResponse,
        harmonizedRulesResponse,
        regionStatsResponse
      ] = await Promise.all([
        api.get('/analytics/users'),
        api.get('/federations'),
        api.get('/federations/conflicts'),
        api.get('/federations/rules/harmonized'),
        api.get('/federations/regions/stats')
      ]);

      // Process and combine data
      const analyticsData: AnalyticsData = {
        totalUsers: usersResponse.data.total || 0,
        activeUsers: usersResponse.data.active || 0,
        totalFederations: federationsResponse.data.length || 0,
        activeFederations: federationsResponse.data.filter((f: any) => f.status === 'active').length || 0,
        totalConflicts: conflictsResponse.data.total_conflicts || 0,
        resolvedConflicts: conflictsResponse.data.conflicts.filter((c: any) => c.status === 'resolved').length || 0,
        totalHarmonizedRules: harmonizedRulesResponse.data.length || 0,
        averageConfidenceScore: calculateAverageConfidence(harmonizedRulesResponse.data),
        regionDistribution: processRegionDistribution(federationsResponse.data, usersResponse.data),
        sportDistribution: processSportDistribution(conflictsResponse.data.conflicts),
        conflictTrends: generateConflictTrends(conflictsResponse.data.conflicts),
        federationPerformance: processFederationPerformance(federationsResponse.data, conflictsResponse.data.conflicts),
        regionStats: processRegionStats(regionStatsResponse.data.regions)
      };

      setData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageConfidence = (harmonizedRules: any[]): number => {
    if (!harmonizedRules || harmonizedRules.length === 0) return 0;
    const total = harmonizedRules.reduce((sum, rule) => sum + (rule.confidence_score || 0), 0);
    return total / harmonizedRules.length;
  };

  const processRegionDistribution = (federations: any[], usersData: any): Array<{ region: string; users: number; federations: number }> => {
    const regionMap = new Map<string, { users: number; federations: number }>();
    
    // Process federations
    federations.forEach((federation: any) => {
      const region = federation.region || 'Unknown';
      const current = regionMap.get(region) || { users: 0, federations: 0 };
      current.federations += 1;
      regionMap.set(region, current);
    });

    // Process users (if available)
    if (usersData.regionDistribution) {
      usersData.regionDistribution.forEach((item: any) => {
        const current = regionMap.get(item.region) || { users: 0, federations: 0 };
        current.users = item.count;
        regionMap.set(item.region, current);
      });
    }

    return Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      users: data.users,
      federations: data.federations
    }));
  };

  const processSportDistribution = (conflicts: any[]): Array<{ sport: string; users: number; conflicts: number }> => {
    const sportMap = new Map<string, { users: number; conflicts: number }>();
    
    conflicts.forEach((conflict: any) => {
      const sport = conflict.sport || 'Unknown';
      const current = sportMap.get(sport) || { users: 0, conflicts: 0 };
      current.conflicts += 1;
      sportMap.set(sport, current);
    });

    return Array.from(sportMap.entries()).map(([sport, data]) => ({
      sport,
      users: data.users,
      conflicts: data.conflicts
    }));
  };

  const generateConflictTrends = (conflicts: any[]): Array<{ date: string; conflicts: number; resolved: number }> => {
    const trends = new Map<string, { conflicts: number; resolved: number }>();
    
    conflicts.forEach((conflict: any) => {
      const date = new Date(conflict.created_at).toISOString().split('T')[0];
      const current = trends.get(date) || { conflicts: 0, resolved: 0 };
      current.conflicts += 1;
      if (conflict.status === 'resolved') {
        current.resolved += 1;
      }
      trends.set(date, current);
    });

    return Array.from(trends.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  };

  const processFederationPerformance = (federations: any[], conflicts: any[]): Array<{ federation: string; members: number; conflicts: number; resolutionRate: number }> => {
    return federations.map((federation: any) => {
      const federationConflicts = conflicts.filter((c: any) => 
        c.federation1_id === federation.id || c.federation2_id === federation.id
      );
      const resolvedConflicts = federationConflicts.filter((c: any) => c.status === 'resolved');
      
      return {
        federation: federation.name,
        members: federation.member_count || 0,
        conflicts: federationConflicts.length,
        resolutionRate: federationConflicts.length > 0 ? resolvedConflicts.length / federationConflicts.length : 0
      };
    }).sort((a, b) => b.members - a.members).slice(0, 10); // Top 10 federations
  };

  const processRegionStats = (regionStats: any): Array<{ region: string; strengthMultiplier: number; competitionLevel: number; infrastructure: number }> => {
    return Object.entries(regionStats).map(([region, stats]: [string, any]) => ({
      region,
      strengthMultiplier: stats.strength_multiplier || 1.0,
      competitionLevel: stats.competition_level || 1.0,
      infrastructure: stats.sports_infrastructure || 1.0
    }));
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
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="warning">
        No analytics data available
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Region</InputLabel>
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              label="Region"
            >
              <MenuItem value="all">All Regions</MenuItem>
              <MenuItem value="North America">North America</MenuItem>
              <MenuItem value="Europe">Europe</MenuItem>
              <MenuItem value="Asia">Asia</MenuItem>
              <MenuItem value="South America">South America</MenuItem>
              <MenuItem value="Africa">Africa</MenuItem>
              <MenuItem value="Oceania">Oceania</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {data.totalUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {data.activeUsers.toLocaleString()} active
                  </Typography>
                </Box>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Federations
                  </Typography>
                  <Typography variant="h4">
                    {data.totalFederations}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {data.activeFederations} active
                  </Typography>
                </Box>
                <PublicIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Rule Conflicts
                  </Typography>
                  <Typography variant="h4">
                    {data.totalConflicts}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {data.resolvedConflicts} resolved
                  </Typography>
                </Box>
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Harmonized Rules
                  </Typography>
                  <Typography variant="h4">
                    {data.totalHarmonizedRules}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {(data.averageConfidenceScore * 100).toFixed(1)}% avg confidence
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Region Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Region Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.regionDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="federations" fill="#8884d8" name="Federations" />
                  <Bar dataKey="users" fill="#82ca9d" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Sport Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sport Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.sportDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ sport, conflicts }) => `${sport}: ${conflicts}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="conflicts"
                  >
                    {data.sportDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Conflict Trends */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conflict Resolution Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.conflictTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="conflicts" stroke="#8884d8" name="New Conflicts" />
                  <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Region Performance Radar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Region Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data.regionStats}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="region" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Strength Multiplier"
                    dataKey="strengthMultiplier"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Competition Level"
                    dataKey="competitionLevel"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Federation Performance Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Federation Performance
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Federation</TableCell>
                      <TableCell>Members</TableCell>
                      <TableCell>Conflicts</TableCell>
                      <TableCell>Resolution Rate</TableCell>
                      <TableCell>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.federationPerformance.map((federation, index) => (
                      <TableRow key={index}>
                        <TableCell>{federation.federation}</TableCell>
                        <TableCell>{federation.members.toLocaleString()}</TableCell>
                        <TableCell>{federation.conflicts}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={federation.resolutionRate * 100}
                              sx={{ width: 60 }}
                            />
                            <Typography variant="body2">
                              {(federation.resolutionRate * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={federation.resolutionRate > 0.8 ? 'Excellent' : 
                                   federation.resolutionRate > 0.6 ? 'Good' : 
                                   federation.resolutionRate > 0.4 ? 'Fair' : 'Poor'}
                            color={federation.resolutionRate > 0.8 ? 'success' : 
                                   federation.resolutionRate > 0.6 ? 'warning' : 'error'}
                            size="small"
                          />
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
    </Box>
  );
};

export default AnalyticsDashboard; 