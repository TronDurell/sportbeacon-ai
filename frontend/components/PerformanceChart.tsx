import React from 'react';

interface PerformanceChartProps {
  data: any[];
  title?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, title }) => {
  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
      <h3>{title || 'Performance Chart'}</h3>
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Chart placeholder - {data.length} data points</p>
      </div>
    </div>
  );
}; 