import React, { useState } from 'react';
import { Button, TextField, MenuItem, Typography, Box, Radio, RadioGroup, FormControlLabel, FormLabel, Alert } from '@mui/material';

const divisionOptions = [
  { value: '6-8', label: '6-8' },
  { value: '9-12', label: '9-12' },
  { value: '13-15', label: '13-15' },
  { value: '16-18', label: '16-18' },
  { value: 'Adult', label: 'Adult' },
];

export default function CoachIntentForm() {
  const [coachId, setCoachId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [currentDivision, setCurrentDivision] = useState('6-8');
  const [wantsToReturn, setWantsToReturn] = useState('yes');
  const [wantsToMoveUp, setWantsToMoveUp] = useState('no');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    if (!coachId || !teamId) {
      setError('Coach ID and Team ID are required.');
      return;
    }
    try {
      const res = await fetch('/submit-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: coachId,
          team_id: teamId,
          current_division: currentDivision,
          wants_to_return: wantsToReturn === 'yes',
          wants_to_move_up: wantsToMoveUp === 'yes',
          notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit intent');
      setSubmitted(true);
    } catch (err) {
      setError('Submission failed. Please try again.');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, maxWidth: 400 }}>
      <Typography variant="h6">Coach Intent Submission</Typography>
      <TextField
        label="Coach ID"
        value={coachId}
        onChange={e => setCoachId(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Team ID"
        value={teamId}
        onChange={e => setTeamId(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        select
        label="Current Division"
        value={currentDivision}
        onChange={e => setCurrentDivision(e.target.value)}
        fullWidth
        margin="normal"
      >
        {divisionOptions.map(option => (
          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
        ))}
      </TextField>
      <FormLabel sx={{ mt: 2 }}>Are you returning?</FormLabel>
      <RadioGroup
        row
        value={wantsToReturn}
        onChange={e => setWantsToReturn(e.target.value)}
      >
        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
        <FormControlLabel value="no" control={<Radio />} label="No" />
      </RadioGroup>
      <FormLabel sx={{ mt: 2 }}>Are you moving up with your players?</FormLabel>
      <RadioGroup
        row
        value={wantsToMoveUp}
        onChange={e => setWantsToMoveUp(e.target.value)}
      >
        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
        <FormControlLabel value="no" control={<Radio />} label="No" />
      </RadioGroup>
      <TextField
        label="Notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        fullWidth
        margin="normal"
        multiline
        rows={3}
      />
      <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
        Submit
      </Button>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {submitted && <Alert severity="success" sx={{ mt: 2 }}>Intent submitted!</Alert>}
    </Box>
  );
} 