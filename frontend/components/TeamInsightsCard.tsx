import React from 'react';
import { Card, Typography, List, ListItem } from '@mui/material';
import TeamRadarChart from './TeamRadarChart';

export default function TeamInsightsCard({ team, teamStats, topPlayers }) {
  return (
    <div className="w-full" role="region" aria-label="Team insights card" tabIndex={0}>
      <Card>
        <Typography variant="h6">{team.name}</Typography>
        <TeamRadarChart stats={teamStats} />
        <List>
          {topPlayers.map(p => (
            <ListItem key={p.id}>{p.name}</ListItem>
          ))}
        </List>
      </Card>
    </div>
  );
} 