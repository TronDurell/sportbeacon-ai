import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDrop } from 'react-dnd';
import AthleteCard from './AthleteCard';

export default function TeamBuilder({ players, onAssignPlayer }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PLAYER',
    drop: (item) => onAssignPlayer(item.id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div className="w-full" role="region" aria-label="Team builder" tabIndex={0}>
      <Box ref={drop} sx={{ p: 2, border: '1px dashed gray', minHeight: '200px', bgcolor: isOver ? 'lightgreen' : 'white' }}>
        <Typography variant="h6">Team Roster</Typography>
        {players.map((player) => (
          <AthleteCard key={player.id} user={player} />
        ))}
      </Box>
    </div>
  );
} 