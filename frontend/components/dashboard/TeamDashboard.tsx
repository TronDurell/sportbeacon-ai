import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import { useTeamData } from '@/hooks/useTeamData';

export default function TeamDashboard() {
  const { teamId } = useParams();
  const { team, loading } = useTeamData(teamId);

  if (loading) return <Typography>Loading team...</Typography>;

  return (
    <div>
      <Typography variant="h4">{team.name}</Typography>
      <Typography variant="body2">{team.stats.summary}</Typography>
    </div>
  );
} 