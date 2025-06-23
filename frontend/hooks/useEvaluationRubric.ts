import { useState, useEffect } from 'react';

export default function useEvaluationRubric() {
  const [rubric, setRubric] = useState([]);
  useEffect(() => {
    // Load categories and weightings
    const loadedRubric = [
      { label: 'Agility', weight: 0.3 },
      { label: 'Awareness', weight: 0.2 },
      // Add more categories as needed
    ];
    setRubric(loadedRubric);
  }, []);
  return rubric;
} 