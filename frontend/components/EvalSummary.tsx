import React from 'react';
import { Card, Typography } from '@mui/material';
// import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

export default function EvalSummary({ scores, aiFeedback }: { scores: any[], aiFeedback: string }) {
  return (
    <Card>
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Chart placeholder - {scores?.length || 0} scores</Typography>
      </div>
      <Typography>AI Feedback: {aiFeedback}</Typography>
    </Card>
  );
} 