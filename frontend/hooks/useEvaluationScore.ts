import { useState, useEffect } from 'react';
import useEvaluationRubric from './useEvaluationRubric';

export default function useEvaluationScore(evals) {
  const [score, setScore] = useState(0);
  const rubric = useEvaluationRubric();

  useEffect(() => {
    if (!evals) return;
    const totalScore = rubric.reduce((acc, { label, weight }) => {
      return acc + (evals[label] || 0) * weight;
    }, 0);
    setScore(totalScore);
  }, [evals, rubric]);

  return score;
} 