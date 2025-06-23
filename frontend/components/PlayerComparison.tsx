import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export default function PlayerComparison({ player1, player2 }: { player1: any, player2: any }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Player Comparison</Typography>
        <Typography variant="body1">{player1.name} vs {player2.name}</Typography>
        <Typography variant="body2">Points: {player1.points} vs {player2.points}</Typography>
        <Typography variant="body2">Assists: {player1.assists} vs {player2.assists}</Typography>
        <Typography variant="body2">Rebounds: {player1.rebounds} vs {player2.rebounds}</Typography>
      </CardContent>
    </Card>
  );
} 