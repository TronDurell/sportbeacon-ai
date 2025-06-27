import React from 'react';
import { Card, Typography } from '@mui/material';

export default function TrainingLogCard({ log }) {
  return (
    <div className="w-full" role="region" aria-label="Training log card" tabIndex={0}>
      <Card sx={{ mb: 2, p: 2 }}>
        <Typography variant="h6">{log.title}</Typography>
        <Typography>{log.description}</Typography>
        <Typography variant="caption">{new Date(log.date).toLocaleString()}</Typography>
      </Card>
    </div>
  );
} 