import React from 'react';
// import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineContent } from '@mui/lab';
import { Typography } from '@mui/material';
import { useDrillLog } from '@/hooks/useDrillLog';

export default function DrillLogTimeline({ playerId }: { playerId: string }) {
  const { drills, loading, error } = useDrillLog(playerId);

  if (loading) return <Typography>Loading drill logs...</Typography>;
  if (error) return <Typography color="error">Failed to load drill logs</Typography>;

  return (
    <div>
      {drills.map((drill: any, idx: number) => (
        <div key={idx} style={{ marginBottom: '16px', padding: '8px', border: '1px solid #ccc' }}>
          <Typography variant="body2">{drill.date || 'No date'}</Typography>
          <Typography variant="h6">{drill.type || 'No type'}</Typography>
          <Typography>{drill.description || 'No description'}</Typography>
        </div>
      ))}
    </div>
  );
} 