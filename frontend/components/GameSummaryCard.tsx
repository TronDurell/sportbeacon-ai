import React from 'react';
import { Card, Typography } from '@mui/material';
import MatchTimeline from './MatchTimeline';
import MomentumChart from './MomentumChart';

export default function GameSummaryCard({ timeline, momentumData, aiCommentary }: { timeline: any, momentumData: any, aiCommentary: any }) {
  return (
    <Card>
      <MatchTimeline events={timeline} />
      <MomentumChart data={momentumData} />
      <Typography>{aiCommentary}</Typography>
    </Card>
  );
} 