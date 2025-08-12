import React from 'react';
import { Card, Typography } from '@mui/material';
import { useDrillSuggestions } from '../hooks/useDrillSuggestions';

export default function DrillSuggestCard({ stats }) {
  const drills = useDrillSuggestions(stats);

  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <Typography variant="h6">Try These Drills:</Typography>
      <ul>
        {drills.map((drill, index) => (
          <li key={index}>{drill.name}</li>
        ))}
      </ul>
    </Card>
  );
} 