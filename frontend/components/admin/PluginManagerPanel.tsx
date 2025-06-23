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
  FormControl
} from '@mui/material';
import {
  Extension,
  Code,
  BugReport,
  CheckCircle,
  Error,
  Warning,
  Download,
  Upload,
  PlayArrow,
  Stop,
  Settings,
  Security,
  Speed,
  Storage,
  ExpandMore,
  Add,
  Edit,
  Delete,
  Visibility,
  Preview,
  Build,
  TestTube,
  Verified,
  Warning as WarningIcon,
  Info,
  Star,
  StarBorder
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'drill' | 'sport_mode' | 'visualization' | 'analytics' | 'integration' | 'gamification';
  author: string;
  rating: number;
  downloads: number;
  status: 'active' | 'inactive' | 'installing' | 'updating' | 'error';
  compatibility: {
    minVersion: string;
    maxVersion: string;
    dependencies: string[];
    conflicts: string[];
  };
  permissions: string[];
  size: number;
  lastUpdated: string;
  isVerified: boolean;
  isPremium: boolean;
  price: number;
  tags: string[];
  changelog: ChangelogEntry[];
  documentation: string;
  support: {
    email: string;
    website: string;
    discord: string;
  };
}

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

interface PluginValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityScore: number;
  performanceScore: number;
  compatibilityScore: number;
}

interface DependencyMatrix {
  [pluginId: string]: {
    dependencies: string[];
    dependents: string[];
    conflicts: string[];
  };
}

const PluginManagerPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [marketplacePlugins, setMarketplacePlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [pluginValidation, setPluginValidation] = useState<PluginValidation | null>(null);
  const [dependencyMatrix, setDependencyMatrix] = useState<DependencyMatrix>({});
  const [uploadDialog, setUploadDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [validationDialog, setValidationDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [federations, setFederations] = useState<string[]>(['Global', 'UIL', 'NCAA', 'AAU', 'FIFA', 'NBA']);
  const [selectedFederation, setSelectedFederation] = useState<string>('Global');

  useEffect(() => {
    loadPluginData();
  }, []);

  const loadPluginData = async () => {
    try {
      setLoading(true);
      
      // Load installed plugins
      const installedPlugins = await loadInstalledPlugins();
      setPlugins(installedPlugins);
      
      // Load marketplace plugins
      const marketplaceData = await loadMarketplacePlugins();
      setMarketplacePlugins(marketplaceData);
      
      // Load dependency matrix
      const matrix = await loadDependencyMatrix();
      setDependencyMatrix(matrix);
      
    } catch (error) {
      console.error('Error loading plugin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledPlugins = async (): Promise<Plugin[]> => {
    // Mock data - replace with actual API call
    return [
      {
        id: 'advanced_basketball_drills',
        name: 'Advanced Basketball Drills',
        description: 'Advanced basketball training drills with AI analysis',
        version: '1.2.0',
        type: 'drill',
        author: 'SportBeacon Team',
        rating: 4.8,
        downloads: 1250,
        status: 'active',
        compatibility: {
          minVersion: '2.0.0',
          maxVersion: '3.0.0',
          dependencies: ['core_drills'],
          conflicts: []
        },
        permissions: ['read_user_data', 'write_drill_logs'],
        size: 2048576, // 2MB
        lastUpdated: '2024-02-15',
        isVerified: true,
        isPremium: false,
        price: 0,
        tags: ['basketball', 'drills', 'advanced'],
        changelog: [
          {
            version: '1.2.0',
            date: '2024-02-15',
            changes: ['Added new shooting drills', 'Improved AI analysis', 'Bug fixes']
          }
        ],
        documentation: 'https://docs.sportbeacon.ai/plugins/advanced-basketball-drills',
        support: {
          email: 'support@sportbeacon.ai',
          website: 'https://sportbeacon.ai/support',
          discord: 'https://discord.gg/sportbeacon'
        }
      },
      {
        id: 'soccer_tactics_analyzer',
        name: 'Soccer Tactics Analyzer',
        description: 'Advanced soccer tactics analysis and visualization',
        version: '2.1.0',
        type: 'analytics',
        author: 'Tactics Pro',
        rating: 4.9,
        downloads: 890,
        status: 'active',
        compatibility: {
          minVersion: '2.0.0',
          maxVersion: '3.0.0',
          dependencies: ['core_analytics'],
          conflicts: ['old_tactics_plugin']
        },
        permissions: ['read_match_data', 'write_analytics'],
        size: 5120000, // 5MB
        lastUpdated: '2024-02-10',
        isVerified: true,
        isPremium: true,
        price: 9.99,
        tags: ['soccer', 'tactics', 'analysis'],
        changelog: [
          {
            version: '2.1.0',
            date: '2024-02-10',
            changes: ['Enhanced tactical analysis', 'New visualization options', 'Performance improvements']
          }
        ],
        documentation: 'https://docs.sportbeacon.ai/plugins/soccer-tactics-analyzer',
        support: {
          email: 'support@tacticspro.com',
          website: 'https://tacticspro.com/support',
          discord: 'https://discord.gg/tacticspro'
        }
      }
    ];
  };

  const loadMarketplacePlugins = async (): Promise<Plugin[]> => {
    // Mock data - replace with actual API call
    return [
      {
        id: '3d_performance_visualizer',
        name: '3D Performance Visualizer',
        description: '3D visualization of player performance data',
        version: '1.5.0',
        type: 'visualization',
        author: 'Visual Sports',
        rating: 4.7,
        downloads: 567,
        status: 'inactive',
        compatibility: {
          minVersion: '2.0.0',
          maxVersion: '3.0.0',
          dependencies: ['core_visualization'],
          conflicts: []
        },
        permissions: ['read_performance_data'],
        size: 10485760, // 10MB
        lastUpdated: '2024-02-01',
        isVerified: true,
        isPremium: true,
        price: 4.99,
        tags: ['visualization', '3d', 'performance'],
        changelog: [
          {
            version: '1.5.0',
            date: '2024-02-01',
            changes: ['Added 3D rendering', 'Performance optimizations', 'New chart types']
          }
        ],
        documentation: 'https://docs.sportbeacon.ai/plugins/3d-performance-visualizer',
        support: {
          email: 'support@visualsports.com',
          website: 'https://visualsports.com/support',
          discord: 'https://discord.gg/visualsports'
        }
      }
    ];
  };

  const loadDependencyMatrix = async (): Promise<DependencyMatrix> => {
    // Mock data - replace with actual API call
    return {
      'advanced_basketball_drills': {
        dependencies: ['core_drills'],
        dependents: [],
        conflicts: []
      },
      'soccer_tactics_analyzer': {
        dependencies: ['core_analytics'],
        dependents: [],
        conflicts: ['old_tactics_plugin']
      },
      '3d_performance_visualizer': {
        dependencies: ['core_visualization'],
        dependents: [],
        conflicts: []
      }
    };
  };

  const validatePlugin = async (pluginFile: File): Promise<PluginValidation> => {
    // Mock validation - replace with actual validation logic
    return {
      isValid: true,
      errors: [],
      warnings: ['Plugin size is large (10MB)'],
      securityScore: 85,
      performanceScore: 90,
      compatibilityScore: 95
    };
  };

  const installPlugin = async (pluginId: string) => {
    try {
      // Mock installation - replace with actual API call
      console.log(`Installing plugin: ${pluginId}`);
      
      // Update plugin status
      setPlugins(prev => prev.map(plugin => 
        plugin.id === pluginId 
          ? { ...plugin, status: 'installing' as const }
          : plugin
      ));
      
      // Simulate installation process
      setTimeout(() => {
        setPlugins(prev => prev.map(plugin => 
          plugin.id === pluginId 
            ? { ...plugin, status: 'active' as const }
            : plugin
        ));
      }, 2000);
      
    } catch (error) {
      console.error('Error installing plugin:', error);
    }
  };

  const uninstallPlugin = async (pluginId: string) => {
    try {
      // Mock uninstallation - replace with actual API call
      console.log(`Uninstalling plugin: ${pluginId}`);
      
      setPlugins(prev => prev.filter(plugin => plugin.id !== pluginId));
      
    } catch (error) {
      console.error('Error uninstalling plugin:', error);
    }
  };

  const updatePlugin = async (pluginId: string, newVersion: string) => {
    try {
      // Mock update - replace with actual API call
      console.log(`Updating plugin: ${pluginId} to version ${newVersion}`);
      
      setPlugins(prev => prev.map(plugin => 
        plugin.id === pluginId 
          ? { ...plugin, status: 'updating' as const, version: newVersion }
          : plugin
      ));
      
      // Simulate update process
      setTimeout(() => {
        setPlugins(prev => prev.map(plugin => 
          plugin.id === pluginId 
            ? { ...plugin, status: 'active' as const }
            : plugin
        ));
      }, 3000);
      
    } catch (error) {
      console.error('Error updating plugin:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'installing': return 'warning';
      case 'updating': return 'info';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'inactive': return <Stop />;
      case 'installing': return <Download />;
      case 'updating': return <Build />;
      case 'error': return <Error />;
      default: return <Info />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drill': return <Code />;
      case 'sport_mode': return <Extension />;
      case 'visualization': return <Visibility />;
      case 'analytics': return <Speed />;
      case 'integration': return <Settings />;
      case 'gamification': return <Star />;
      default: return <Extension />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderInstalledPluginsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Installed Plugins</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Federation</InputLabel>
            <Select
              value={selectedFederation}
              label="Federation"
              onChange={e => setSelectedFederation(e.target.value)}
            >
              {federations.map(fed => (
                <MenuItem key={fed} value={fed}>{fed}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialog(true)}
          >
            Upload Plugin
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {plugins.map((plugin) => {
          // Simulate federation-scoped status and errors
          const federationStatus = plugin.status === 'active' && selectedFederation !== 'Global'
            ? Math.random() > 0.2 ? 'active' : 'inactive' // Randomly simulate federation activation
            : plugin.status;
          const hasError = plugin.status === 'error';
          const hasDependencyIssue = plugin.compatibility.dependencies.length > 0 && Math.random() > 0.7;
          const federationToggle = federationStatus === 'active';
          return (
            <Grid item xs={12} md={6} lg={4} key={plugin.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTypeIcon(plugin.type)}
                      <Typography variant="h6" component="h3">
                        {plugin.name}
                      </Typography>
                      {plugin.isVerified && (
                        <Tooltip title="Verified Plugin">
                          <Verified color="primary" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                    <Chip
                      icon={getStatusIcon(federationStatus)}
                      label={federationStatus}
                      color={getStatusColor(federationStatus)}
                      size="small"
                    />
                  </Box>

                  {/* Dynamic status alerts */}
                  {hasError && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      Plugin error detected. Please check logs or reinstall.
                    </Alert>
                  )}
                  {hasDependencyIssue && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      Missing dependencies: {plugin.compatibility.dependencies.join(', ')}
                    </Alert>
                  )}
                  {selectedFederation !== 'Global' && federationStatus === 'inactive' && (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      This plugin is not enabled for {selectedFederation}. Toggle below to activate.
                    </Alert>
                  )}

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {plugin.description}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      v{plugin.version}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(plugin.size)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Star color="warning" fontSize="small" />
                    <Typography variant="caption">{plugin.rating}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({plugin.downloads} downloads)
                    </Typography>
                  </Box>

                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {plugin.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>

                  {/* Federation-scoped toggle */}
                  {selectedFederation !== 'Global' && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={federationToggle}
                          color="primary"
                          onChange={() => {
                            // Simulate federation toggle logic
                            // In production, call API to enable/disable for federation
                          }}
                        />
                      }
                      label={`Enable for ${selectedFederation}`}
                      sx={{ mb: 2 }}
                    />
                  )}

                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedPlugin(plugin);
                        setPreviewDialog(true);
                      }}
                    >
                      Preview
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedPlugin(plugin);
                        setValidationDialog(true);
                      }}
                    >
                      Validate
                    </Button>
                    {plugin.status === 'active' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => uninstallPlugin(plugin.id)}
                      >
                        Uninstall
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => installPlugin(plugin.id)}
                      >
                        Install
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  const renderMarketplaceTab = () => (
    <Box>
      <Typography variant="h5" mb={3}>Plugin Marketplace</Typography>

      <Grid container spacing={3}>
        {marketplacePlugins.map((plugin) => (
          <Grid item xs={12} md={6} lg={4} key={plugin.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getTypeIcon(plugin.type)}
                    <Typography variant="h6" component="h3">
                      {plugin.name}
                    </Typography>
                    {plugin.isVerified && (
                      <Tooltip title="Verified Plugin">
                        <Verified color="primary" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                  <Chip
                    label={plugin.isPremium ? `$${plugin.price}` : 'Free'}
                    color={plugin.isPremium ? 'warning' : 'success'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {plugin.description}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Star color="warning" fontSize="small" />
                  <Typography variant="caption">{plugin.rating}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({plugin.downloads} downloads)
                  </Typography>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  {plugin.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>

                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedPlugin(plugin);
                      setPreviewDialog(true);
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => installPlugin(plugin.id)}
                  >
                    Install
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderDependenciesTab = () => (
    <Box>
      <Typography variant="h5" mb={3}>Dependency Matrix</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plugin</TableCell>
              <TableCell>Dependencies</TableCell>
              <TableCell>Dependents</TableCell>
              <TableCell>Conflicts</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(dependencyMatrix).map(([pluginId, deps]) => (
              <TableRow key={pluginId}>
                <TableCell>
                  <Typography variant="subtitle2">{pluginId}</Typography>
                </TableCell>
                <TableCell>
                  {deps.dependencies.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {deps.dependencies.map((dep) => (
                        <Chip key={dep} label={dep} size="small" color="primary" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {deps.dependents.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {deps.dependents.map((dep) => (
                        <Chip key={dep} label={dep} size="small" color="secondary" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {deps.conflicts.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {deps.conflicts.map((conflict) => (
                        <Chip key={conflict} label={conflict} size="small" color="error" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined">
                    Resolve
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box>
      <Typography variant="h5" mb={3}>Plugin Analytics</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Plugin Usage</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Drills', value: 45 },
                      { name: 'Analytics', value: 25 },
                      { name: 'Visualization', value: 20 },
                      { name: 'Integration', value: 10 }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}%`}
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Plugin Performance</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { month: 'Jan', installs: 120, uninstalls: 10 },
                  { month: 'Feb', installs: 150, uninstalls: 15 },
                  { month: 'Mar', installs: 180, uninstalls: 12 },
                  { month: 'Apr', installs: 200, uninstalls: 18 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="installs" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="uninstalls" stroke="#ff7300" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
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
        <Tab label="Installed" icon={<Extension />} />
        <Tab label="Marketplace" icon={<Download />} />
        <Tab label="Dependencies" icon={<Settings />} />
        <Tab label="Analytics" icon={<Speed />} />
      </Tabs>

      {activeTab === 0 && renderInstalledPluginsTab()}
      {activeTab === 1 && renderMarketplaceTab()}
      {activeTab === 2 && renderDependenciesTab()}
      {activeTab === 3 && renderAnalyticsTab()}

      {/* Upload Plugin Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Plugin</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <input
                accept=".zip"
                style={{ display: 'none' }}
                id="plugin-file"
                type="file"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="plugin-file">
                <Button variant="outlined" component="span">
                  Choose Plugin File (.zip)
                </Button>
              </label>
              {uploadedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {uploadedFile.name}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plugin Name"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Plugin Type</InputLabel>
                <Select label="Plugin Type">
                  <MenuItem value="drill">Drill</MenuItem>
                  <MenuItem value="sport_mode">Sport Mode</MenuItem>
                  <MenuItem value="visualization">Visualization</MenuItem>
                  <MenuItem value="analytics">Analytics</MenuItem>
                  <MenuItem value="integration">Integration</MenuItem>
                  <MenuItem value="gamification">Gamification</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Version"
                variant="outlined"
                placeholder="1.0.0"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button variant="contained">Upload & Validate</Button>
        </DialogActions>
      </Dialog>

      {/* Plugin Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Plugin Preview: {selectedPlugin?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPlugin && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Details</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedPlugin.description}
                </Typography>
                
                <Typography variant="subtitle2">Author: {selectedPlugin.author}</Typography>
                <Typography variant="subtitle2">Version: {selectedPlugin.version}</Typography>
                <Typography variant="subtitle2">Size: {formatFileSize(selectedPlugin.size)}</Typography>
                <Typography variant="subtitle2">Last Updated: {selectedPlugin.lastUpdated}</Typography>
                
                <Box mt={2}>
                  <Typography variant="subtitle2">Permissions:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedPlugin.permissions.map((permission) => (
                      <Chip key={permission} label={permission} size="small" />
                    ))}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Changelog</Typography>
                <List dense>
                  {selectedPlugin.changelog.map((entry, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`v${entry.version} - ${entry.date}`}
                        secondary={
                          <ul>
                            {entry.changes.map((change, i) => (
                              <li key={i}>{change}</li>
                            ))}
                          </ul>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          <Button variant="contained">Install Plugin</Button>
        </DialogActions>
      </Dialog>

      {/* Plugin Validation Dialog */}
      <Dialog open={validationDialog} onClose={() => setValidationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Plugin Validation: {selectedPlugin?.name}
        </DialogTitle>
        <DialogContent>
          {pluginValidation && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {pluginValidation.isValid ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Error color="error" />
                  )}
                  <Typography variant="h6">
                    {pluginValidation.isValid ? 'Validation Passed' : 'Validation Failed'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Security Score</Typography>
                    <Typography variant="h4" color="primary">
                      {pluginValidation.securityScore}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Performance Score</Typography>
                    <Typography variant="h4" color="success">
                      {pluginValidation.performanceScore}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Compatibility Score</Typography>
                    <Typography variant="h4" color="info">
                      {pluginValidation.compatibilityScore}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {pluginValidation.errors.length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="h6">Errors:</Typography>
                    <ul>
                      {pluginValidation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </Alert>
                </Grid>
              )}
              
              {pluginValidation.warnings.length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="h6">Warnings:</Typography>
                    <ul>
                      {pluginValidation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setValidationDialog(false)}>Close</Button>
          <Button variant="contained" disabled={!pluginValidation?.isValid}>
            Install Plugin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PluginManagerPanel; 