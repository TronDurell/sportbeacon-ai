import React from 'react';
import { Card, Typography } from '@mui/material';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

export default function EvalSummary({ scores, aiFeedback }) {
  return (
    <Card>
      <RadarChart cx={150} cy={150} outerRadius={100} width={300} height={300} data={scores}>
        <PolarGrid />
        <PolarAngleAxis dataKey="label" />
        <Radar name="Score" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
      </RadarChart>
      <Typography>AI Feedback: {aiFeedback}</Typography>
    </Card>
  );
} 