import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Rating,
  Tooltip,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Star as StarIcon,
  VideoLibrary as VideoIcon,
  Assessment as AssessmentIcon,
  Notes as NotesIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerProfile } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { PerformanceChart } from './PerformanceChart';
import { playerAPI } from '../services/api';

interface ScoutNote {
  id: string;
  playerId: string;
  content: string;
  rating: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PlayerEvaluation {
  technicalSkills: number;
  tacticalAwareness: number;
  physicalAttributes: number;
  mentalStrength: number;
  potential: number;
  notes: string;
}

interface ScoutDashboardProps {
  scoutId: string;
  organizationId: string;
}

export const ScoutDashboard: React.FC<ScoutDashboardProps> = ({
  scoutId,
  organizationId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('watchlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    ageRange: [] as [number, number][],
    positions: [] as string[],
    skills: [] as string[],
    minRating: 0,
  });
  const [sortBy, setSortBy] = useState<'rating' | 'potential' | 'age' | 'name'>(
    'rating'
  );
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [evaluationDialog, setEvaluationDialog] = useState(false);

  // Queries
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['scout', scoutId, 'players', activeTab],
    queryFn: () => playerAPI.getScoutPlayers(scoutId, activeTab),
  });

  const { data: notes } = useQuery({
    queryKey: ['scout', scoutId, 'notes'],
    queryFn: () => playerAPI.getScoutNotes(scoutId),
    enabled: !!players,
  });

  // Mutations
  const addNoteMutation = useMutation({
    mutationFn: (note: Omit<ScoutNote, 'id' | 'createdAt' | 'updatedAt'>) =>
      playerAPI.addScoutNote(note),
    onSuccess: () => {
      queryClient.invalidateQueries(['scout', scoutId, 'notes']);
    },
  });

  const updateEvaluationMutation = useMutation({
    mutationFn: ({
      playerId,
      evaluation,
    }: {
      playerId: string;
      evaluation: PlayerEvaluation;
    }) => playerAPI.updatePlayerEvaluation(playerId, evaluation),
    onSuccess: () => {
      queryClient.invalidateQueries(['scout', scoutId, 'players']);
      setEvaluationDialog(false);
    },
  });

  // Filtered and sorted players
  const filteredPlayers = useMemo(() => {
    if (!players) return [];

    return players
      .filter(player => {
        const matchesSearch =
          player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.team?.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilters =
          (!filters.ageRange.length ||
            filters.ageRange.some(
              ([min, max]) => player.age >= min && player.age <= max
            )) &&
          (!filters.positions.length ||
            filters.positions.includes(player.position)) &&
          (!filters.skills.length ||
            filters.skills.every(skill =>
              player.skills.some(s => s.name === skill && s.level >= 7)
            )) &&
          player.scoutRating >= filters.minRating;

        return matchesSearch && matchesFilters;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            return b.scoutRating - a.scoutRating;
          case 'potential':
            return b.potential - a.potential;
          case 'age':
            return a.age - b.age;
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [players, searchQuery, filters, sortBy]);

  const renderPlayerCard = (player: PlayerProfile) => (
    <Card
      component={motion.div}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      sx={{ p: 2, cursor: 'pointer' }}
      onClick={() => setSelectedPlayer(player.id)}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Box
            component="img"
            src={player.avatar}
            alt={player.name}
            sx={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
              borderRadius: 1,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">{player.name}</Typography>
            <Rating value={player.scoutRating / 2} readOnly precision={0.5} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {player.age} years • {player.position} • {player.team?.name}
          </Typography>
          <Box mt={1}>
            {player.skills.map(skill => (
              <Chip
                key={skill.name}
                label={`${skill.name}: ${skill.level}`}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
          <Box mt={2} display="flex" gap={1}>
            <Tooltip title="View Videos">
              <IconButton size="small">
                <VideoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Performance Analysis">
              <IconButton size="small">
                <AssessmentIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Scout Notes">
              <IconButton size="small">
                <NotesIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share Profile">
              <IconButton size="small">
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={2}
          >
            <TextField
              fullWidth
              placeholder="Search players..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                /* Show filter dialog */
              }}
            >
              Filters
            </Button>
            <Select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              startAdornment={<SortIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="rating">Rating</MenuItem>
              <MenuItem value="potential">Potential</MenuItem>
              <MenuItem value="age">Age</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons={isMobile ? 'auto' : false}
          >
            <Tab label="Watchlist" value="watchlist" />
            <Tab label="Recent Views" value="recent" />
            <Tab label="Recommendations" value="recommendations" />
            <Tab label="Reports" value="reports" />
          </Tabs>
        </Grid>

        <Grid item xs={12}>
          <AnimatePresence mode="wait">
            <Grid container spacing={2}>
              {filteredPlayers.map(player => (
                <Grid item xs={12} key={player.id}>
                  {renderPlayerCard(player)}
                </Grid>
              ))}
            </Grid>
          </AnimatePresence>
        </Grid>
      </Grid>

      {/* Player Evaluation Dialog */}
      <Dialog
        open={evaluationDialog}
        onClose={() => setEvaluationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Player Evaluation</DialogTitle>
        <DialogContent>
          {selectedPlayer && (
            <Box py={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Technical Skills
                  </Typography>
                  <Rating
                    name="technical"
                    defaultValue={0}
                    precision={0.5}
                    max={10}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tactical Awareness
                  </Typography>
                  <Rating
                    name="tactical"
                    defaultValue={0}
                    precision={0.5}
                    max={10}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Physical Attributes
                  </Typography>
                  <Rating
                    name="physical"
                    defaultValue={0}
                    precision={0.5}
                    max={10}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Mental Strength
                  </Typography>
                  <Rating
                    name="mental"
                    defaultValue={0}
                    precision={0.5}
                    max={10}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Overall Potential
                  </Typography>
                  <Rating
                    name="potential"
                    defaultValue={0}
                    precision={0.5}
                    max={10}
                    icon={<StarIcon fontSize="large" />}
                    emptyIcon={<StarIcon fontSize="large" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Evaluation Notes"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvaluationDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedPlayer) {
                updateEvaluationMutation.mutate({
                  playerId: selectedPlayer,
                  evaluation: {
                    // Get values from form
                  } as PlayerEvaluation,
                });
              }
            }}
          >
            Save Evaluation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
