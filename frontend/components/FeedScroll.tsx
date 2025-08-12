import React from 'react';
import { Box } from '@mui/material';
import SpotlightCard from './SpotlightCard';
import useTrendingAthletes from '../hooks/useTrendingAthletes';

export default function FeedScroll() {
  const athletes = useTrendingAthletes();

  return (
    <Box display="flex" flexDirection="column" overflow="auto" height="100vh">
      {athletes.map((athlete, index) => (
        <SpotlightCard key={index} athlete={athlete} />
      ))}
    </Box>
  );
} 