import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, List, ListItem, ListItemText } from '@mui/material';
import useMessages from '../hooks/useMessages';

export default function MessageModal({ open, onClose, conversationId, senderId }) {
  const { messages, sendMessage } = useMessages(conversationId);
  const [text, setText] = useState('');
  const modalRef = React.useRef(null);

  const handleSend = () => {
    if (text.trim()) {
      sendMessage(text, senderId);
      setText('');
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="message-modal-title" aria-describedby="message-modal-desc" aria-modal="true" role="dialog">
      <Box ref={modalRef} tabIndex={-1} sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 500, bgcolor: 'background.paper', boxShadow: 24, p: 4, maxHeight: '90vh', overflow: 'auto', outline: 'none' }} role="document" aria-label="Message modal">
        <Typography variant="h6" gutterBottom>Chat</Typography>
        <List sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
          {messages.map((msg) => (
            <ListItem key={msg.id}>
              <ListItemText primary={msg.text} secondary={msg.senderId} />
            </ListItem>
          ))}
        </List>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleSend}>Send</Button>
      </Box>
    </Modal>
  );
} 