import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';

export default function TeamRadarChart({ stats }) {
  return (
    <div className="w-full" role="region" aria-label="Team radar chart" tabIndex={0}>
      <RadarChart cx={150} cy={150} outerRadius={100} width={300} height={300} data={stats}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <Radar name="Team" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
      </RadarChart>
    </div>
  );
} 