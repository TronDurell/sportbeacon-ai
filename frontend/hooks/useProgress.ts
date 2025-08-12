import { useState, useEffect } from 'react';

interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

export const useProgress = (initialTotal: number = 0) => {
  const [progress, setProgress] = useState<ProgressData>({
    completed: 0,
    total: initialTotal,
    percentage: 0
  });

  const updateProgress = (completed: number, total?: number) => {
    const newTotal = total || progress.total;
    setProgress({
      completed,
      total: newTotal,
      percentage: newTotal > 0 ? (completed / newTotal) * 100 : 0
    });
  };

  return {
    progress,
    updateProgress
  };
}; 