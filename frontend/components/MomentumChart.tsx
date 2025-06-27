import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function MomentumChart({ data }) {
  return (
    <div className="w-full" role="region" aria-label="Momentum chart" tabIndex={0}>
      <LineChart width={500} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interval" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="momentum" stroke="#ff7300" />
      </LineChart>
    </div>
  );
} 