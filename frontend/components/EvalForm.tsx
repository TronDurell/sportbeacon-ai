import React from 'react';
import { Typography, Slider, Button } from '@mui/material';
import useEvaluationRubric from '../hooks/useEvaluationRubric';

export default function EvalForm({ evals, setEvals, submitEvaluation }) {
  const rubric = useEvaluationRubric();

  const handleSliderChange = (label) => (event, newValue) => {
    setEvals((prevEvals) => ({ ...prevEvals, [label]: newValue }));
  };

  return (
    <div>
      {rubric.map((r) => (
        <div key={r.label}>
          <Typography>{r.label}</Typography>
          <Slider
            value={evals[r.label] || 0}
            onChange={handleSliderChange(r.label)}
            step={1}
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </div>
      ))}
      <Button onClick={submitEvaluation}>Submit</Button>
    </div>
  );
} 