import React from 'react';
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Button,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Visibility as ViewsIcon,
  Share as ShareIcon,
  TrendingUp as TrendingIcon,
  WorkspacePremium as BadgeIcon,
} from '@mui/icons-material';
import Link from 'next/link';

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'player' | 'coach';
  stats: {
    weeklyTips: number;
    viewCount: number;
    shareCount: number;
    streakScore: number;
    badge: {
      tier: string;
      percentile: number;
    };
  };
}

interface ScoutLeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  activeTab: TabValue;
  roleFilter: RoleFilter;
  currentUserId?: string;
  onTabChange: (tab: TabValue) => void;
  onRoleFilterChange: (filter: RoleFilter) => void;
}

export type TabValue = 'weekly' | 'views' | 'shares' | 'improved' | 'badges';
export type RoleFilter = 'all' | 'coach' | 'player';

export const ScoutLeaderboard: React.FC<ScoutLeaderboardProps> = ({
  entries,
  loading,
  activeTab,
  roleFilter,
  currentUserId,
  onTabChange,
  onRoleFilterChange,
}) => {
  const theme = useTheme();

  const getBadgeColor = (tier: string) => {
    switch (tier) {
      case 'Gold':
        return theme.palette.warning.main;
      case 'Silver':
        return theme.palette.grey[400];
      default:
        return theme.palette.warning.dark;
    }
  };

  const renderStatValue = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case 'weekly':
        return `$${entry.stats.weeklyTips.toFixed(2)}`;
      case 'views':
        return `${entry.stats.viewCount} views`;
      case 'shares':
        return `${entry.stats.shareCount} shares`;
      case 'improved':
        return `${entry.stats.streakScore} streak`;
      case 'badges':
        return (
          <Chip
            label={`${entry.stats.badge.tier} (Top ${entry.stats.badge.percentile}%)`}
            sx={{ backgroundColor: getBadgeColor(entry.stats.badge.tier) }}
          />
        );
      default:
        return '';
    }
  };

  const renderSkeletons = () =>
    Array(5)
      .fill(0)
      .map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton variant="text" width={30} />
          </TableCell>
          <TableCell>
            <Box display="flex" alignItems="center" gap={2}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width={120} />
            </Box>
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={80} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={100} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rectangular" width={100} height={36} />
          </TableCell>
        </TableRow>
      ));

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={roleFilter}
          exclusive
          onChange={(_, value) => value && onRoleFilterChange(value)}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="player">Players Only</ToggleButton>
          <ToggleButton value="coach">Coaches Only</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, value) => onTabChange(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<TrophyIcon />} label="Weekly Tips" value="weekly" />
        <Tab icon={<ViewsIcon />} label="Views" value="views" />
        <Tab icon={<ShareIcon />} label="Shares" value="shares" />
        <Tab
          icon={<TrendingIcon />}
          label="Most Improved"
          value="improved"
        />
        <Tab
          icon={<BadgeIcon />}
          label="Top Badge Holders"
          value="badges"
        />
      </Tabs>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Player</TableCell>
              <TableCell>Stats</TableCell>
              <TableCell>Badge</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? renderSkeletons()
              : entries.map((entry, index) => (
                  <TableRow
                    key={entry.id}
                    sx={{
                      backgroundColor:
                        entry.id === currentUserId
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="h6">#{index + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar src={entry.avatarUrl} alt={entry.name} />
                        <Box>
                          <Typography variant="subtitle1">
                            {entry.name}
                          </Typography>
                          <Chip
                            label={entry.role}
                            size="small"
                            color={
                              entry.role === 'coach' ? 'primary' : 'secondary'
                            }
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{renderStatValue(entry)}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.stats.badge.tier}
                        sx={{
                          backgroundColor: getBadgeColor(
                            entry.stats.badge.tier
                          ),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Link href={`/scout/${entry.id}`} passHref>
                        <Button variant="outlined" size="small">
                          View Profile
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 