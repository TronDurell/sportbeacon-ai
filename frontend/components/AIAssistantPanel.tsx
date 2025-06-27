import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Send as SendIcon,
  Assistant as AIIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface Message {
  id: string;
  role: 'ai' | 'trainer';
  content: string;
  timestamp: Date;
}

interface AIAssistantPanelProps {
  responses: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  quickReplies?: string[];
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  responses,
  isLoading,
  onSendMessage,
  onStartRecording,
  onStopRecording,
  isRecording,
  quickReplies = [],
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="rounded-xl shadow bg-white dark:bg-gray-900 p-4" role="region" aria-label="AI Assistant Panel" tabIndex={0}>
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {responses.map(msg => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent:
                msg.role === 'trainer' ? 'flex-end' : 'flex-start',
              mb: 1,
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor:
                  msg.role === 'trainer' ? 'primary.main' : 'background.paper',
                color:
                  msg.role === 'trainer'
                    ? 'primary.contrastText'
                    : 'text.primary',
                borderRadius: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                {msg.role === 'ai' ? (
                  <AIIcon fontSize="small" />
                ) : (
                  <PersonIcon fontSize="small" />
                )}
                <Typography variant="caption" fontWeight="bold">
                  {msg.role === 'ai' ? 'AI Assistant' : 'You'}
                </Typography>
              </Box>
              <Typography variant="body2">{msg.content}</Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        ))}
        {isLoading && (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={20} />
            <Typography variant="caption">AI is thinking...</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Replies */}
      {quickReplies.length > 0 && (
        <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {quickReplies.map((reply, index) => (
            <Chip
              key={index}
              label={reply}
              onClick={() => onSendMessage(reply)}
              size="small"
              clickable
            />
          ))}
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            size="small"
          />
          <IconButton
            color={isRecording ? 'error' : 'primary'}
            onClick={isRecording ? onStopRecording : onStartRecording}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </div>
  );
};
