import React from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function MomentumChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '500px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc' }}>
      <div>Chart placeholder - {data?.length || 0} data points</div>
    </div>
  );
} 