import { useState, useEffect } from 'react';

export default function useAthleteEval(athleteId: string) {
  const [evaluations, setEvaluations] = useState([]);
  useEffect(() => {
    if (!athleteId) return;
    // Logic to fetch and store evaluations for the athlete
  }, [athleteId]);
  return evaluations;
} 