import React, { useState } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';

export default function JoinTeamModal({ open, onClose, onSubmit }) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    onSubmit(message);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>Request to Join Team</Typography>
        <TextField
          label="Message"
          multiline
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleSubmit}>Send Request</Button>
      </Box>
    </Modal>
  );
} 