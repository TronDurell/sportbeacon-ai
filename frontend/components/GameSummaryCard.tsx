import React from 'react';
import { Card, Typography } from '@mui/material';
import MatchTimeline from './MatchTimeline';
import MomentumChart from './MomentumChart';

export default function GameSummaryCard({ timeline, momentumData, aiCommentary }) {
  return (
    <Card role="region" aria-label="Game summary card" tabIndex={0} sx={{ p: 2, mb: 2, outline: 'none', ':focus': { boxShadow: 3 } }}>
      <MatchTimeline events={timeline} />
      <MomentumChart data={momentumData} />
      <Typography>{aiCommentary}</Typography>
    </Card>
  );
} 