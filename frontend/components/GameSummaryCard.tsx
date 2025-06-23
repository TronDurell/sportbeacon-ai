import React from 'react';
import { Card, Typography } from '@mui/material';
import MatchTimeline from './MatchTimeline';
import MomentumChart from './MomentumChart';

export default function GameSummaryCard({ timeline, momentumData, aiCommentary }) {
  return (
    <Card>
      <MatchTimeline events={timeline} />
      <MomentumChart data={momentumData} />
      <Typography>{aiCommentary}</Typography>
    </Card>
  );
} 