import React from 'react';
import { Card, Typography, List, ListItem } from '@mui/material';
import TeamRadarChart from './TeamRadarChart';

export default function TeamInsightsCard({ team, teamStats, topPlayers }) {
  return (
    <Card>
      <Typography variant="h6">{team.name}</Typography>
      <TeamRadarChart stats={teamStats} />
      <List>
        {topPlayers.map(p => (
          <ListItem key={p.id}>{p.name}</ListItem>
        ))}
      </List>
    </Card>
  );
} 