import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Card } from '@mui/material';
import { usePlayerStats } from '../hooks/usePlayerStats';

interface ARStatOverlayProps {
  venueId: string;
}

export const ARStatOverlay: React.FC<ARStatOverlayProps> = ({ venueId }) => {
  const { data: playerStats, isLoading, error } = usePlayerStats(venueId);

  if (isLoading) return <Typography>Loading stats…</Typography>;
  if (error) return <Typography color="error">Failed to load stats</Typography>;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)' }}
    >
      <Card sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6">{playerStats.name}</Typography>
        <Typography>Win Rate: {playerStats.winRate}%</Typography>
        <Typography>Trend: {playerStats.trend}</Typography>
      </Card>
    </motion.div>
  );
}; 