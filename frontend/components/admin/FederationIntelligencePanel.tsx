import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixHighIcon,
  Public as PublicIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { api } from '../../services/api';

interface RegionStats {
  region: string;
  strength_multiplier: number;
  travel_penalty: number;
  timezone_adjustment: number;
  climate_adjustment: number;
  population_density: number;
  sports_infrastructure: number;
  competition_level: number;
}

interface RuleConflict {
  id: string;
  federation1_id: string;
  federation2_id: string;
  sport: string;
  rule_type: string;
  conflict_description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'escalated';
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

interface HarmonizedRule {
  sport: string;
  rule_type: string;
  base_rule: Record<string, any>;
  federation_overrides: Record<string, Record<string, any>>;
  harmonized_rule: Record<string, any>;
  confidence_score: number;
  last_updated: string;
}

interface Federation {
  id: string;
  name: string;
  type: string;
  region: string;
  sports: string[];
  status: string;
  verified: boolean;
}

const FederationIntelligencePanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [regionStats, setRegionStats] = useState<Record<string, RegionStats>>({});
  const [conflicts, setConflicts] = useState<RuleConflict[]>([]);
  const [harmonizedRules, setHarmonizedRules] = useState<HarmonizedRule[]>([]);
  const [federations, setFederations] = useState<Federation[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<RuleConflict | null>(null);
  const [harmonizeDialogOpen, setHarmonizeDialogOpen] = useState(false);
  const [selectedFederations, setSelectedFederations] = useState<string[]>([]);
  const [normalizeDialogOpen, setNormalizeDialogOpen] = useState(false);
  const [normalizeData, setNormalizeData] = useState({
    stats: { points: 25, assists: 8, rebounds: 12 },
    player_region: 'North America',
    competition_region: 'Europe'
  });
  const [normalizedStats, setNormalizedStats] = useState<Record<string, any> | null>(null);

  const sports = ['basketball', 'soccer', 'baseball', 'football', 'volleyball', 'tennis'];
  const regions = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];
  const severities = ['low', 'medium', 'high', 'critical'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRegionStats(),
        loadConflicts(),
        loadHarmonizedRules(),
        loadFederations()
      ]);
    } catch (error) {
      console.error('Error loading federation intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRegionStats = async () => {
    try {
      const response = await api.get('/federations/regions/stats');
      setRegionStats(response.data.regions);
    } catch (error) {
      console.error('Error loading region stats:', error);
    }
  };

  const loadConflicts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity);
      if (selectedSport) params.append('sport', selectedSport);
      
      const response = await api.get(`/federations/conflicts?${params}`);
      setConflicts(response.data.conflicts);
    } catch (error) {
      console.error('Error loading conflicts:', error);
    }
  };

  const loadHarmonizedRules = async () => {
    try {
      const rules: HarmonizedRule[] = [];
      for (const sport of sports) {
        try {
          const response = await api.get(`/federations/rules/harmonized/${sport}`);
          rules.push(response.data);
        } catch (error) {
          // Rule not found for this sport
        }
      }
      setHarmonizedRules(rules);
    } catch (error) {
      console.error('Error loading harmonized rules:', error);
    }
  };

  const loadFederations = async () => {
    try {
      const response = await api.get('/federations');
      setFederations(response.data);
    } catch (error) {
      console.error('Error loading federations:', error);
    }
  };

  const handleResolveConflict = async (conflict: RuleConflict) => {
    setSelectedConflict(conflict);
    setConflictDialogOpen(true);
  };

  const resolveConflict = async () => {
    if (!selectedConflict) return;
    
    try {
      const response = await api.post(`/federations/conflicts/${selectedConflict.id}/resolve`);
      setConflictDialogOpen(false);
      setSelectedConflict(null);
      loadConflicts(); // Refresh conflicts
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  const handleHarmonizeRules = async () => {
    if (selectedFederations.length < 2 || !selectedSport) return;
    
    try {
      const response = await api.post('/federations/rules/harmonize', {
        sport: selectedSport,
        federations: selectedFederations
      });
      setHarmonizeDialogOpen(false);
      setSelectedFederations([]);
      setSelectedSport('');
      loadHarmonizedRules(); // Refresh harmonized rules
    } catch (error) {
      console.error('Error harmonizing rules:', error);
    }
  };

  const handleNormalizeStats = async () => {
    try {
      const response = await api.post('/federations/stats/normalize', normalizeData);
      setNormalizedStats(response.data.normalized_stats);
    } catch (error) {
      console.error('Error normalizing stats:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon />;
      case 'high': return <WarningIcon />;
      case 'medium': return <InfoIcon />;
      case 'low': return <CheckCircleIcon />;
      default: return <InfoIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'pending': return 'warning';
      case 'escalated': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Federation Intelligence
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
        >
          Refresh Data
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Region Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Region Statistics
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Region</InputLabel>
                <Select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  <MenuItem value="all">All Regions</MenuItem>
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {selectedRegion === 'all' ? (
                <Box mt={2}>
                  {regions.map((region) => {
                    const stats = regionStats[region];
                    if (!stats) return null;
                    
                    return (
                      <Accordion key={region}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1">
                            {region} - Strength: {stats.strength_multiplier.toFixed(2)}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Travel Penalty: {(stats.travel_penalty * 100).toFixed(1)}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Timezone Adj: {(stats.timezone_adjustment * 100).toFixed(1)}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Climate Adj: {(stats.climate_adjustment * 100).toFixed(1)}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Competition Level: {stats.competition_level.toFixed(2)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              ) : (
                <Box mt={2}>
                  {regionStats[selectedRegion] && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Strength Multiplier: {regionStats[selectedRegion].strength_multiplier.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Travel Penalty: {(regionStats[selectedRegion].travel_penalty * 100).toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Timezone Adjustment: {(regionStats[selectedRegion].timezone_adjustment * 100).toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Climate Adjustment: {(regionStats[selectedRegion].climate_adjustment * 100).toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Population Density: {regionStats[selectedRegion].population_density.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Sports Infrastructure: {regionStats[selectedRegion].sports_infrastructure.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Competition Level: {regionStats[selectedRegion].competition_level.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stat Normalization */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stat Normalization
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AutoFixHighIcon />}
                onClick={() => setNormalizeDialogOpen(true)}
                fullWidth
              >
                Normalize Player Stats
              </Button>
              
              {normalizedStats && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Normalized Results:
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(normalizedStats).map(([key, value]) => (
                      <Grid item xs={6} key={key}>
                        <Typography variant="body2">
                          {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Rule Conflicts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Rule Conflicts ({conflicts.length})
                </Typography>
                <Box display="flex" gap={1}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Sport</InputLabel>
                    <Select
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      label="Sport"
                    >
                      <MenuItem value="">All Sports</MenuItem>
                      {sports.map((sport) => (
                        <MenuItem key={sport} value={sport}>
                          {sport}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Severity</InputLabel>
                    <Select
                      value={selectedSeverity}
                      onChange={(e) => setSelectedSeverity(e.target.value)}
                      label="Severity"
                    >
                      <MenuItem value="all">All Severities</MenuItem>
                      {severities.map((severity) => (
                        <MenuItem key={severity} value={severity}>
                          {severity}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={loadConflicts}
                  >
                    Filter
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sport</TableCell>
                      <TableCell>Rule Type</TableCell>
                      <TableCell>Federations</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {conflicts.map((conflict) => (
                      <TableRow key={conflict.id}>
                        <TableCell>{conflict.sport}</TableCell>
                        <TableCell>{conflict.rule_type}</TableCell>
                        <TableCell>
                          <Chip label={conflict.federation1_id} size="small" sx={{ mr: 0.5 }} />
                          <Chip label={conflict.federation2_id} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getSeverityIcon(conflict.severity)}
                            label={conflict.severity}
                            color={getSeverityColor(conflict.severity) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={conflict.status}
                            color={getStatusColor(conflict.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(conflict.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {conflict.status === 'pending' && (
                            <Tooltip title="Resolve with AI">
                              <IconButton
                                size="small"
                                onClick={() => handleResolveConflict(conflict)}
                              >
                                <AutoFixHighIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Harmonized Rules */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Harmonized Rules ({harmonizedRules.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PublicIcon />}
                  onClick={() => setHarmonizeDialogOpen(true)}
                >
                  Harmonize New Rules
                </Button>
              </Box>

              <Grid container spacing={2}>
                {harmonizedRules.map((rule) => (
                  <Grid item xs={12} md={6} key={`${rule.sport}_${rule.rule_type}`}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                          <Typography variant="subtitle1">
                            {rule.sport} - {rule.rule_type}
                          </Typography>
                          <Chip
                            label={`${(rule.confidence_score * 100).toFixed(0)}%`}
                            color={rule.confidence_score > 0.8 ? 'success' : rule.confidence_score > 0.6 ? 'warning' : 'error'}
                            size="small"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" gutterBottom>
                          <strong>Harmonized Rule:</strong>
                        </Typography>
                        <Box component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                          {JSON.stringify(rule.harmonized_rule, null, 2)}
                        </Box>
                        
                        {Object.keys(rule.federation_overrides).length > 0 && (
                          <>
                            <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                              <strong>Federation Overrides:</strong>
                            </Typography>
                            <Box component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                              {JSON.stringify(rule.federation_overrides, null, 2)}
                            </Box>
                          </>
                        )}
                        
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Last Updated: {new Date(rule.last_updated).toLocaleString()}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Conflict Resolution Dialog */}
      <Dialog open={conflictDialogOpen} onClose={() => setConflictDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Resolve Rule Conflict</DialogTitle>
        <DialogContent>
          {selectedConflict && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Sport:</strong> {selectedConflict.sport}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Rule Type:</strong> {selectedConflict.rule_type}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Federations:</strong> {selectedConflict.federation1_id} vs {selectedConflict.federation2_id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {selectedConflict.conflict_description}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Severity:</strong> {selectedConflict.severity}
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                This will use AI to automatically resolve the conflict based on safety, fairness, and competitive integrity.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
          <Button onClick={resolveConflict} variant="contained" color="primary">
            Resolve with AI
          </Button>
        </DialogActions>
      </Dialog>

      {/* Harmonize Rules Dialog */}
      <Dialog open={harmonizeDialogOpen} onClose={() => setHarmonizeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Harmonize Sport Rules</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Sport</InputLabel>
            <Select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              label="Sport"
            >
              {sports.map((sport) => (
                <MenuItem key={sport} value={sport}>
                  {sport}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Federations (select 2 or more)</InputLabel>
            <Select
              multiple
              value={selectedFederations}
              onChange={(e) => setSelectedFederations(e.target.value as string[])}
              label="Federations (select 2 or more)"
            >
              {federations.map((federation) => (
                <MenuItem key={federation.id} value={federation.id}>
                  {federation.name} ({federation.region})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            This will create harmonized rules across the selected federations, resolving conflicts and creating a unified rule set.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHarmonizeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleHarmonizeRules} 
            variant="contained" 
            color="primary"
            disabled={selectedFederations.length < 2 || !selectedSport}
          >
            Harmonize Rules
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stat Normalization Dialog */}
      <Dialog open={normalizeDialogOpen} onClose={() => setNormalizeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Normalize Player Statistics</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Player Statistics (JSON)"
                multiline
                rows={4}
                value={JSON.stringify(normalizeData.stats, null, 2)}
                onChange={(e) => {
                  try {
                    const stats = JSON.parse(e.target.value);
                    setNormalizeData({ ...normalizeData, stats });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                helperText="Enter player statistics as JSON"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Player Region</InputLabel>
                <Select
                  value={normalizeData.player_region}
                  onChange={(e) => setNormalizeData({ ...normalizeData, player_region: e.target.value })}
                  label="Player Region"
                >
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Competition Region</InputLabel>
                <Select
                  value={normalizeData.competition_region}
                  onChange={(e) => setNormalizeData({ ...normalizeData, competition_region: e.target.value })}
                  label="Competition Region"
                >
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            This will normalize player statistics based on region factors including travel distance, timezone differences, climate, and competition level.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNormalizeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleNormalizeStats} variant="contained" color="primary">
            Normalize Stats
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FederationIntelligencePanel; 