import React from 'react';
import { Card, Avatar, Typography, Button } from '@mui/material';

export default function LeagueCard({ league }) {
  return (
    <div className="w-full" role="region" aria-label="League card" tabIndex={0}>
      <Card sx={{ mb: 2, p: 2 }}>
        <Avatar src={league.logo} sx={{ width: 56, height: 56, mb: 1 }} />
        <Typography variant="h6">{league.name}</Typography>
        <Typography>{league.sport} - {league.level}</Typography>
        <Button variant="contained">View Roster</Button>
      </Card>
    </div>
  );
} 