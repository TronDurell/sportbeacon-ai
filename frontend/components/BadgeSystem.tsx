import React, { useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tooltip,
  CircularProgress,
  Theme,
} from '@mui/material';
import { styled } from '@mui/system';
import { ScoutReportExport } from './ScoutReportExport';
import { VideoOverlay } from './VideoOverlay';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  earned: boolean;
  earnedDate?: string;
  category: 'achievement' | 'skill' | 'social' | 'challenge';
}

const BadgeContainer = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  position: 'relative',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const BadgeIcon = styled('img')({
  width: 64,
  height: 64,
  marginBottom: 8,
});

interface BadgeSystemProps {
  badges: Badge[];
  onBadgeClick?: (badge: Badge) => void;
}

export const BadgeSystem: React.FC<BadgeSystemProps> = ({
  badges,
  onBadgeClick,
}: BadgeSystemProps) => {
  const renderBadge = (badge: Badge) => (
    <Grid item xs={6} sm={4} md={3} key={badge.id}>
      <Tooltip
        title={
          <Box>
            <Typography variant="subtitle1">{badge.name}</Typography>
            <Typography variant="body2">{badge.description}</Typography>
            {!badge.earned && (
              <Typography variant="body2" color="text.secondary">
                Progress: {badge.progress}/{badge.maxProgress}
              </Typography>
            )}
            {badge.earnedDate && (
              <Typography variant="body2" color="text.secondary">
                Earned: {new Date(badge.earnedDate).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        }
      >
        <BadgeContainer
          onClick={() => onBadgeClick?.(badge)}
          sx={{
            cursor: onBadgeClick ? 'pointer' : 'default',
            opacity: badge.earned ? 1 : 0.6,
          }}
        >
          <Box position="relative" display="inline-block">
            <BadgeIcon
              src={badge.icon}
              alt={badge.name}
              style={{
                filter: badge.earned ? 'none' : 'grayscale(100%)',
              }}
            />
            {!badge.earned && (
              <CircularProgress
                variant="determinate"
                value={(badge.progress / badge.maxProgress) * 100}
                size={72}
                thickness={2}
                sx={{
                  position: 'absolute',
                  top: -4,
                  left: -4,
                  color: 'primary.main',
                }}
              />
            )}
          </Box>
          <Typography variant="subtitle2" noWrap>
            {badge.name}
          </Typography>
        </BadgeContainer>
      </Tooltip>
    </Grid>
  );

  const categorizedBadges = badges.reduce(
    (acc: Record<Badge['category'], Badge[]>, badge: Badge) => {
      if (!acc[badge.category]) {
        acc[badge.category] = [];
      }
      acc[badge.category].push(badge);
      return acc;
    },
    {} as Record<Badge['category'], Badge[]>
  );

  return (
    <Box role="region" aria-label="Badge system" tabIndex={0} sx={{ outline: 'none', ':focus': { boxShadow: 3 }, mb: 2 }}>
      <Grid container spacing={2}>
        {badges.map(badge => (
          <Grid item xs={12} sm={6} md={4} key={badge.id}>
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src={badge.icon} alt={badge.name} style={{ width: 40, height: 40 }} />
              <Box>
                <Typography variant="subtitle1">{badge.name}</Typography>
                <Typography variant="body2">{badge.description}</Typography>
                <Typography variant="caption">{badge.earned ? `Earned: ${badge.earnedDate}` : `Progress: ${badge.progress}/${badge.maxProgress}`}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

interface ScoutDashboardProps {
  organizationId: string;
  scoutId: string;
}

const handleClipExport = async (clip: VideoClip): Promise<string> => {
  // Implement FFmpeg clip generation here
  // This is a placeholder that would be replaced with actual implementation
  const formData = new FormData();
  formData.append('videoUrl', videoUrl);
  formData.append('startTime', clip.startTime.toString());
  formData.append('endTime', clip.endTime.toString());

  const response = await fetch('/api/clips/generate', {
    method: 'POST',
    body: formData,
  });

  const { url } = await response.json();
  return url;
};

const ScoutDashboard: React.FC<ScoutDashboardProps> = ({
  organizationId,
  scoutId,
}: ScoutDashboardProps) => {
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(
    null
  );
  const [videoUrl, setVideoUrl] = React.useState<string>('');
  const [markers, setMarkers] = React.useState<Marker[]>([]);
  const [aiAnalysis, setAiAnalysis] = React.useState<AiAnalysis | null>(null);
  const [videoSnapshots, setVideoSnapshots] = React.useState<VideoSnapshot[]>(
    []
  );
  const [drillHistory, setDrillHistory] = React.useState<DrillHistory[]>([]);

  const handleMarkerClick = (marker: Marker) => {
    // Handle marker click
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <VideoOverlay
          player={selectedPlayer}
          videoUrl={videoUrl}
          markers={markers}
          onMarkerClick={handleMarkerClick}
          onClipExport={handleClipExport}
        />
      </Grid>

      <Grid item xs={12}>
        <ScoutReportExport
          player={selectedPlayer}
          badges={badges}
          aiAnalysis={aiAnalysis}
          videoSnapshots={videoSnapshots}
          drillHistory={drillHistory}
          organizationLogo="/path/to/logo.png"
        />
      </Grid>
    </Grid>
  );
};

export default ScoutDashboard;
