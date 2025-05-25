import React from 'react';
import { Radar } from 'react-chartjs-2';

export default function ChartRadarStats({ data }: { data: any }) {
  const radarData = {
    labels: ['Power', 'Speed', 'Consistency', 'Accuracy', 'Endurance'],
    datasets: [
      {
        label: 'Player Stats',
        data: data,
        backgroundColor: 'rgba(34, 202, 236, 0.2)',
        borderColor: 'rgba(34, 202, 236, 1)',
        borderWidth: 1,
      },
    ],
  };

  return <Radar data={radarData} />;
} 