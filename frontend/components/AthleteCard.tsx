import React from 'react';
import { Card, Avatar, Typography, Button } from '@mui/material';

export default function AthleteCard({ user }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-2" role="region" aria-label="Athlete card" tabIndex={0}>
      <Avatar src={user.avatarUrl} sx={{ width: 56, height: 56, mb: 1 }} />
      <Typography variant="h6">{user.name}</Typography>
      <Typography>{user.sport}</Typography>
      <Button variant="contained">View Profile</Button>
    </div>
  );
} 