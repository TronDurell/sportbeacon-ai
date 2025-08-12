import React from 'react';
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineContent } from '@mui/lab';
import { Typography } from '@mui/material';
import { useDrillLog } from '@/hooks/useDrillLog';

export default function DrillLogTimeline({ playerId }: { playerId: string }) {
  const { drills, loading, error } = useDrillLog(playerId);

  if (loading) return <Typography>Loading drill logs...</Typography>;
  if (error) return <Typography color="error">Failed to load drill logs</Typography>;

  return (
    <Timeline>
      {drills.map((drill, idx) => (
        <TimelineItem key={idx}>
          <TimelineSeparator>
            <TimelineDot color="primary" />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="body2">{drill.date}</Typography>
            <Typography variant="h6">{drill.type}</Typography>
            <Typography>{drill.description}</Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
} 