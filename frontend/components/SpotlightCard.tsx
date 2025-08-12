import React from 'react';
import { Card, Avatar, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function SpotlightCard({ athlete }) {
  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <Avatar src={athlete.img} sx={{ width: 56, height: 56, mb: 1 }} />
      <Typography variant="h6">{athlete.name}</Typography>
      <Typography>🔥 Trending: +{athlete.statIncrease} in {athlete.timeFrame}</Typography>
      <LineChart width={300} height={200} data={athlete.statsData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#ff7300" />
      </LineChart>
    </Card>
  );
} 