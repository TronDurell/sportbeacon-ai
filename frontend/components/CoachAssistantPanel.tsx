// TODO: Phase 2 - Social Feed Integration
// - Integrate with real-time social feed API
// - Add community interaction features (likes, comments, shares)
// - Implement feed filtering and personalization

// TODO: Phase 2 - Notification System
// - Add real-time notification service integration
// - Implement push notifications for mobile
// - Add notification preferences and settings

// TODO: Phase 2 - Chat Module
// - Integrate with real chat API (Firebase/Socket.io)
// - Add group chat functionality
// - Implement message persistence and history

// TODO: Phase 2 - Mobile Wrapper
// - Add React Native wrapper for mobile deployment
// - Implement mobile-specific UI optimizations
// - Add offline functionality and sync

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  SportsSoccer,
  Schedule,
  TrendingUp,
  FitnessCenter,
  Chat,
  Send,
  PlayArrow,
  Pause,
  Stop,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { DrillDetail, DrillSchedule, PlayerProfile } from '../types';

interface CoachAssistantPanelProps {
  playerId?: string;
  onDrillSelect?: (drill: DrillDetail) => void;
  onScheduleUpdate?: (schedule: DrillSchedule[]) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`coach-tabpanel-${index}`}
      aria-labelledby={`coach-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const CoachAssistantPanel: React.FC<CoachAssistantPanelProps> = ({
  playerId,
  onDrillSelect,
  onScheduleUpdate
}) => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedDrills, setRecommendedDrills] = useState<DrillDetail[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<DrillSchedule[]>([]);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [selectedDrill, setSelectedDrill] = useState<DrillDetail | null>(null);
  const [showDrillDialog, setShowDrillDialog] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    loadInitialData();
  }, [playerId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Load recommended drills
      const drills = await fetchRecommendedDrills();
      setRecommendedDrills(drills);

      // Load weekly schedule
      const schedule = await fetchWeeklySchedule();
      setWeeklySchedule(schedule);

      // Load performance stats
      const stats = await fetchPerformanceStats();
      setPerformanceStats(stats);
    } catch (error) {
      console.error('Error loading coach assistant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendedDrills = async (): Promise<DrillDetail[]> => {
    // Mock API call - replace with actual backend integration
    return [
      {
        id: '1',
        name: 'Shooting Accuracy Drill',
        description: 'Improve shooting accuracy with focused practice',
        difficulty: 3,
        duration: 30,
        equipment: ['Basketball', 'Hoop'],
        objectives: ['Improve accuracy', 'Build confidence'],
        status: 'pending',
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Defensive Footwork',
        description: 'Enhance defensive positioning and movement',
        difficulty: 2,
        duration: 25,
        equipment: ['Cones', 'Stopwatch'],
        objectives: ['Improve footwork', 'Better positioning'],
        status: 'pending',
        updatedAt: new Date().toISOString()
      }
    ];
  };

  const fetchWeeklySchedule = async (): Promise<DrillSchedule[]> => {
    // Mock API call - replace with actual backend integration
    return [
      {
        id: '1',
        playerId: playerId || 'default',
        drillId: '1',
        scheduledDate: new Date().toISOString(),
        status: 'scheduled',
        notes: 'Focus on form and accuracy'
      }
    ];
  };

  const fetchPerformanceStats = async () => {
    // Mock API call - replace with actual backend integration
    return {
      shootingPercentage: 65,
      assists: 8,
      rebounds: 5,
      steals: 2,
      blocks: 1,
      gamesPlayed: 12,
      improvement: 15
    };
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: question,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      // Mock AI response - replace with actual backend integration
      const response = await simulateAIResponse(question);
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: response,
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (question: string): Promise<string> => {
    // Mock AI response - replace with actual coach assistant engine
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (question.toLowerCase().includes('shoot')) {
      return "To improve your shooting, focus on proper form and follow-through. Practice shooting from different distances and angles. Consider the shooting accuracy drill I recommended.";
    } else if (question.toLowerCase().includes('defense')) {
      return "For better defense, work on your footwork and positioning. Stay low, keep your hands up, and anticipate the opponent's moves. The defensive footwork drill will help.";
    } else {
      return "I'm here to help you improve your game! Ask me about specific skills, drills, or strategies you'd like to work on.";
    }
  };

  const handleDrillSelect = (drill: DrillDetail) => {
    setSelectedDrill(drill);
    setShowDrillDialog(true);
    onDrillSelect?.(drill);
  };

  const handleScheduleDrill = (drill: DrillDetail) => {
    const newSchedule: DrillSchedule = {
      id: Date.now().toString(),
      playerId: playerId || 'default',
      drillId: drill.id,
      scheduledDate: new Date().toISOString(),
      status: 'scheduled',
      notes: `Scheduled by coach assistant`
    };

    setWeeklySchedule(prev => [...prev, newSchedule]);
    onScheduleUpdate?.(weeklySchedule);
    setShowDrillDialog(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading && !chatHistory.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="coach assistant tabs">
            <Tab label="AI Assistant" icon={<Chat />} />
            <Tab label="Drill Recommendations" icon={<SportsSoccer />} />
            <Tab label="Weekly Schedule" icon={<Schedule />} />
            <Tab label="Performance Stats" icon={<TrendingUp />} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {chatHistory.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                      color: message.role === 'user' ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="body2">{message.content}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper sx={{ p: 2, bgcolor: 'white' }}>
                    <CircularProgress size={20} />
                  </Paper>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask me about drills, strategies, or performance..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                disabled={isLoading}
              />
              <IconButton
                onClick={handleAskQuestion}
                disabled={isLoading || !question.trim()}
                color="primary"
              >
                <Send />
              </IconButton>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {recommendedDrills.map((drill) => (
              <Grid item xs={12} sm={6} key={drill.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {drill.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {drill.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`Difficulty: ${drill.difficulty}/5`}
                        size="small"
                        color="primary"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`${drill.duration} min`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleDrillSelect(drill)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleScheduleDrill(drill)}
                      >
                        Schedule
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              This Week's Schedule
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={loadInitialData}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Box>
          
          <List>
            {weeklySchedule.map((schedule) => {
              const drill = recommendedDrills.find(d => d.id === schedule.drillId);
              return (
                <ListItem key={schedule.id} divider>
                  <ListItemIcon>
                    <FitnessCenter />
                  </ListItemIcon>
                  <ListItemText
                    primary={drill?.name || 'Unknown Drill'}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {new Date(schedule.scheduledDate).toLocaleDateString()} - {schedule.status}
                        </Typography>
                        {schedule.notes && (
                          <Typography component="div" variant="body2" color="text.secondary">
                            {schedule.notes}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <Chip
                    label={schedule.status}
                    color={schedule.status === 'completed' ? 'success' : 'default'}
                    size="small"
                  />
                </ListItem>
              );
            })}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {performanceStats && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Shooting Performance
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {performanceStats.shootingPercentage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {performanceStats.improvement > 0 ? '+' : ''}{performanceStats.improvement}% improvement
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Game Stats
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">Assists</Typography>
                        <Typography variant="h6">{performanceStats.assists}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Rebounds</Typography>
                        <Typography variant="h6">{performanceStats.rebounds}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Steals</Typography>
                        <Typography variant="h6">{performanceStats.steals}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Blocks</Typography>
                        <Typography variant="h6">{performanceStats.blocks}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </CardContent>

      {/* Drill Details Dialog */}
      <Dialog
        open={showDrillDialog}
        onClose={() => setShowDrillDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedDrill?.name}
        </DialogTitle>
        <DialogContent>
          {selectedDrill && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedDrill.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Objectives
              </Typography>
              <List dense>
                {selectedDrill.objectives.map((objective, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={objective} />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="h6" gutterBottom>
                Equipment Needed
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedDrill.equipment.map((item, index) => (
                  <Chip key={index} label={item} size="small" />
                ))}
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Duration: {selectedDrill.duration} minutes | Difficulty: {selectedDrill.difficulty}/5
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDrillDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => selectedDrill && handleScheduleDrill(selectedDrill)}
          >
            Schedule Drill
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}; 