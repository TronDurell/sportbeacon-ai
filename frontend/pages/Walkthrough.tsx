import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const mockPlayerData = {
  name: 'John Doe',
  drills: [
    { name: 'Dribbling Basics', completed: false },
    { name: 'Shooting Form', completed: false },
    { name: 'Defense Drills', completed: false },
  ],
  evaluation: 'Beginner',
};

const Walkthrough: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Welcome to SportBeaconAI!</Typography>
      <Typography variant="body1" gutterBottom>
        Let's get started with a quick walkthrough of your dashboard.
      </Typography>
      <Typography variant="h6">Player: {mockPlayerData.name}</Typography>
      <Typography variant="body1">Evaluation: {mockPlayerData.evaluation}</Typography>
      <Typography variant="body1" gutterBottom>Drills:</Typography>
      <ul>
        {mockPlayerData.drills.map((drill, index) => (
          <li key={index}>{drill.name} - {drill.completed ? 'Completed' : 'Pending'}</li>
        ))}
      </ul>
      <Button variant="contained" color="primary">Start Your First Drill</Button>
    </Box>
  );
};

export default Walkthrough; 