import React from 'react';
import { Box, Avatar, Typography, Chip, Grid } from '@mui/material';
import { ScoutPlayer } from '../../types/player';

interface ScoutProfileOverviewProps {
  player: ScoutPlayer;
  starred: boolean;
  onStarToggle: () => void;
}

export const ScoutProfileOverview: React.FC<ScoutProfileOverviewProps> = ({
  player,
  starred,
  onStarToggle,
}) => {
  return (
    <Box p={2} display="flex" flexDirection="column" alignItems="center">
      <Avatar src={player.mediaUrls?.profileImage} sx={{ width: 96, height: 96, mb: 2 }} />
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {player.firstName} {player.lastName}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        {player.primaryPosition} | {player.currentTeam?.name}
      </Typography>
      <Grid container spacing={1} justifyContent="center" mt={1}>
        <Grid item>
          <Chip label={`Age: ${player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : 'N/A'}`} />
        </Grid>
        <Grid item>
          <Chip label={`Nationality: ${player.nationality}`} />
        </Grid>
        <Grid item>
          <Chip label={`Preferred Foot: ${player.preferredFoot}`} />
        </Grid>
        <Grid item>
          <Chip label={`Status: ${player.status}`} color={player.status === 'active' ? 'success' : 'default'} />
        </Grid>
      </Grid>
      <Box mt={2}>
        <Chip
          label={starred ? 'Starred' : 'Star Player'}
          color={starred ? 'warning' : 'default'}
          onClick={onStarToggle}
          clickable
        />
      </Box>
    </Box>
  );
}; 