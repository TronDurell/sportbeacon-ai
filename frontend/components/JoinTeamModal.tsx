import React, { useState } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';

export default function JoinTeamModal({ open, onClose, onSubmit }) {
  const [message, setMessage] = useState('');
  const modalRef = React.useRef(null);

  const handleSubmit = () => {
    onSubmit(message);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="join-team-title" aria-describedby="join-team-desc" aria-modal="true" role="dialog">
      <Box ref={modalRef} tabIndex={-1} sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 500, bgcolor: 'background.paper', boxShadow: 24, p: 4, maxHeight: '90vh', overflow: 'auto', outline: 'none' }} role="document" aria-label="Join team modal">
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