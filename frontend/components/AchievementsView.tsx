import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Card,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Badge } from './BadgeSystem';
import { useQuery } from '@tanstack/react-query';
import { playerAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

type SortOption = 'newest' | 'oldest' | 'progress' | 'alphabetical';

interface AchievementsViewProps {
  playerId: string;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  playerId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState<Badge['category']>('achievement');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const { data: badges, isLoading } = useQuery({
    queryKey: ['player', playerId, 'badges'],
    queryFn: () => playerAPI.getPlayerBadges(playerId),
  });

  const filteredBadges = useMemo(() => {
    if (!badges) return [];

    return badges
      .filter(
        badge =>
          badge.category === activeTab &&
          (badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            badge.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return (
              (b.earnedDate ? new Date(b.earnedDate).getTime() : 0) -
              (a.earnedDate ? new Date(a.earnedDate).getTime() : 0)
            );
          case 'oldest':
            return (
              (a.earnedDate ? new Date(a.earnedDate).getTime() : 0) -
              (b.earnedDate ? new Date(b.earnedDate).getTime() : 0)
            );
          case 'progress':
            const aProgress = a.progress / a.maxProgress;
            const bProgress = b.progress / b.maxProgress;
            return bProgress - aProgress;
          case 'alphabetical':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [badges, activeTab, searchQuery, sortBy]);

  const stats = useMemo(() => {
    if (!badges) return null;

    const totalBadges = badges.length;
    const earnedBadges = badges.filter(b => b.earned).length;
    const progressSum = badges.reduce(
      (sum, b) => sum + b.progress / b.maxProgress,
      0
    );
    const averageProgress = (progressSum / totalBadges) * 100;

    return {
      total: totalBadges,
      earned: earnedBadges,
      progress: averageProgress.toFixed(1),
    };
  }, [badges]);

  return (
    <div className="w-full" role="region" aria-label="Achievements view" tabIndex={0}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Achievements
          </Typography>
          {stats && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{stats.earned}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Badges Earned
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {stats.total - stats.earned}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Badges Remaining
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{stats.progress}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>

        <Box mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search badges..."
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
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  label="Sort By"
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="progress">Progress</MenuItem>
                  <MenuItem value="alphabetical">Alphabetical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{ mb: 3 }}
        >
          <Tab label="Achievements" value="achievement" />
          <Tab label="Skills" value="skill" />
          <Tab label="Social" value="social" />
          <Tab label="Challenges" value="challenge" />
        </Tabs>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Grid container spacing={2}>
              {filteredBadges.map(badge => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card
                      sx={{
                        p: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        opacity: badge.earned ? 1 : 0.6,
                      }}
                    >
                      <Box
                        component="img"
                        src={badge.icon}
                        alt={badge.name}
                        sx={{
                          width: 80,
                          height: 80,
                          mb: 2,
                          filter: badge.earned ? 'none' : 'grayscale(100%)',
                        }}
                      />
                      <Typography variant="h6" align="center" gutterBottom>
                        {badge.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                        sx={{ mb: 2 }}
                      >
                        {badge.description}
                      </Typography>
                      {!badge.earned && (
                        <Typography
                          variant="body2"
                          color="primary"
                          sx={{ mt: 'auto' }}
                        >
                          Progress:{' '}
                          {Math.round((badge.progress / badge.maxProgress) * 100)}
                          %
                        </Typography>
                      )}
                      {badge.earnedDate && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 'auto' }}
                        >
                          Earned:{' '}
                          {new Date(badge.earnedDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </AnimatePresence>
      </Container>
    </div>
  );
};
