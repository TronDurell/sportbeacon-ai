import React from 'react';
import { Card, Typography, Button } from '@mui/material';

export default function EventCard({ event, onRsvp }) {
  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <Typography variant="h6">{event.name}</Typography>
      <Typography>{event.description}</Typography>
      <Typography variant="caption">{new Date(event.date).toLocaleString()}</Typography>
      <Button variant="contained" onClick={() => onRsvp(event.id)}>RSVP</Button>
    </Card>
  );
} 