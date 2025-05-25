import React from 'react';
import { Card, Avatar, Typography, Button } from '@mui/material';

export default function AthleteCard({ user }) {
  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <Avatar src={user.avatarUrl} sx={{ width: 56, height: 56, mb: 1 }} />
      <Typography variant="h6">{user.name}</Typography>
      <Typography>{user.sport}</Typography>
      <Button variant="contained">View Profile</Button>
    </Card>
  );
} 