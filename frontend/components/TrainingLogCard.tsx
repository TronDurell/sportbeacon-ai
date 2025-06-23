import React from 'react';
import { Card, Typography } from '@mui/material';

export default function TrainingLogCard({ log }) {
  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <Typography variant="h6">{log.title}</Typography>
      <Typography>{log.description}</Typography>
      <Typography variant="caption">{new Date(log.date).toLocaleString()}</Typography>
    </Card>
  );
} 