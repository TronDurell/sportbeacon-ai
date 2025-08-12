import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, List, ListItem, ListItemText } from '@mui/material';
import useMessages from '../hooks/useMessages';

export default function MessageModal({ open, onClose, conversationId, senderId }) {
  const { messages, sendMessage } = useMessages(conversationId);
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      sendMessage(text, senderId);
      setText('');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1, width: 400 }}>
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