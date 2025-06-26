import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Avatar, IconButton } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import AvatarPreview from './AvatarPreview';

const WAKE_COMMAND = 'Hey Sport Director';

const SportDirectorChat: React.FC = () => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am Coach Jordan, your Sports Director AI. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);

  // Stub: Simulate voice recognition
  const handleVoiceInput = () => {
    setListening(true);
    setTimeout(() => {
      setInput(WAKE_COMMAND + ' what is my schedule?');
      setListening(false);
    }, 2000);
  };

  // Stub: Simulate AI response and voice playback
  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    let aiText = '';
    if (input.toLowerCase().includes('schedule')) {
      aiText = 'Let me check your schedule. You have practice at 5pm today.';
    } else if (input.toLowerCase().includes('reschedule')) {
      aiText = 'Suggesting next available slots: Tomorrow 6pm, Friday 4pm.';
    } else if (input.toLowerCase().includes('hello')) {
      aiText = 'Hello! How can I assist you today?';
    } else {
      aiText = 'Sorry, I did not understand that command.';
    }
    setMessages([...messages, userMsg, { sender: 'ai', text: aiText }]);
    setInput('');
    // Stub: Play voice (would use TTS in real app)
  };

  return (
    <Box maxWidth={400} mx="auto" mt={4} p={2} borderRadius={2} boxShadow={2} bgcolor="#fff">
      <Box display="flex" alignItems="center" mb={2}>
        <AvatarPreview preset="coach" style={{ width: 48, height: 48, marginRight: 12 }} />
        <Typography variant="h6">Coach Jordan</Typography>
        <IconButton onClick={handleVoiceInput} sx={{ ml: 'auto' }} title="Activate Voice">
          <VolumeUpIcon color={listening ? 'primary' : 'action'} />
        </IconButton>
      </Box>
      <Box minHeight={200} maxHeight={300} overflow="auto" mb={2} p={1} bgcolor="#f9f9f9" borderRadius={1}>
        {messages.map((msg, idx) => (
          <Box key={idx} mb={1} textAlign={msg.sender === 'ai' ? 'left' : 'right'}>
            <Typography variant="body2" color={msg.sender === 'ai' ? 'primary' : 'secondary'}>
              {msg.text}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message or use voice..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <Button variant="contained" onClick={handleSend} disabled={!input.trim()}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default SportDirectorChat; 