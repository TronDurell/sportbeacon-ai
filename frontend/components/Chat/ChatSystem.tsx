import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Badge,
  Chip,
  Drawer,
  AppBar,
  Toolbar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Videocam as VideoIcon,
  Call as CallIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import useChat from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import type { ChatMessage, ChatRoom } from '../../types/chat';

interface ChatSystemProps {
  open?: boolean;
  onClose?: () => void;
}

/**
 * Main chat system component
 * Provides real-time messaging with room management and user interface
 */
const ChatSystem: React.FC<ChatSystemProps> = ({ open = false, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const {
    messages,
    rooms,
    currentRoom,
    unreadCounts,
    typingUsers,
    loading,
    error,
    sendMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    markAsRead,
    deleteMessage,
    editMessage,
    startTyping,
    stopTyping,
    updatePresence,
    formatMessageTime,
    isMessageFromMe,
    getUnreadCount
  } = useChat();

  // Local state
  const [messageInput, setMessageInput] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showRoomList, setShowRoomList] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomParticipants, setNewRoomParticipants] = useState<string[]>([]);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle room selection
  useEffect(() => {
    if (currentRoom && !selectedRoom) {
      setSelectedRoom(currentRoom);
    }
  }, [currentRoom, selectedRoom]);

  // Handle typing indicator
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (selectedRoom) {
      startTyping(selectedRoom.id);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (selectedRoom) {
          stopTyping(selectedRoom.id);
        }
      }, 3000);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom || !user) return;

    try {
      await sendMessage(messageInput, selectedRoom.id);
      setMessageInput('');
      setReplyToMessage(null);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (selectedRoom) {
        stopTyping(selectedRoom.id);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Create new room
  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || newRoomParticipants.length === 0) return;

    try {
      const roomId = await createRoom(newRoomParticipants, newRoomName);
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomParticipants([]);
      
      // Join the new room
      const newRoom = rooms.find(room => room.id === roomId);
      if (newRoom) {
        setSelectedRoom(newRoom);
        joinRoom(roomId);
      }
    } catch (err) {
      console.error('Error creating room:', err);
    }
  };

  // Edit message
  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      await editMessage(editingMessage, editContent);
      setEditingMessage(null);
      setEditContent('');
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(messageId);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Reply to message
  const handleReply = (message: ChatMessage) => {
    setReplyToMessage(message);
    messageInputRef.current?.focus();
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  // Render message
  const renderMessage = (message: ChatMessage) => {
    const isFromMe = isMessageFromMe(message);
    const isEditing = editingMessage === message.id;
    const isReply = replyToMessage?.id === message.id;

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isFromMe ? 'flex-end' : 'flex-start',
          mb: 2,
          px: 2
        }}
      >
        <Paper
          sx={{
            maxWidth: '70%',
            p: 2,
            backgroundColor: isFromMe ? theme.palette.primary.main : theme.palette.grey[100],
            color: isFromMe ? theme.palette.primary.contrastText : theme.palette.text.primary,
            position: 'relative',
            border: isReply ? `2px solid ${theme.palette.secondary.main}` : 'none'
          }}
        >
          {/* Reply indicator */}
          {message.replyTo && (
            <Box sx={{ mb: 1, opacity: 0.7, fontSize: '0.8rem' }}>
              <Typography variant="caption">
                Replying to: {message.replyTo}
              </Typography>
            </Box>
          )}

          {/* Message header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              src={message.senderAvatar}
              sx={{ width: 24, height: 24, mr: 1 }}
            >
              {message.senderName.charAt(0)}
            </Avatar>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {message.senderName}
            </Typography>
            <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.7 }}>
              {formatMessageTime(message.timestamp)}
            </Typography>
          </Box>

          {/* Message content */}
          {isEditing ? (
            <Box>
              <TextField
                fullWidth
                multiline
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleEditMessage()}
                autoFocus
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button size="small" onClick={handleEditMessage}>
                  Save
                </Button>
                <Button size="small" onClick={() => setEditingMessage(null)}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2">
              {message.content}
            </Typography>
          )}

          {/* Message actions */}
          {!isEditing && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, opacity: 0.7 }}>
              <IconButton size="small" onClick={() => handleReply(message)}>
                <ReplyIcon fontSize="small" />
              </IconButton>
              {isFromMe && (
                <>
                  <IconButton size="small" onClick={() => setEditingMessage(message.id)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteMessage(message.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  // Render room list item
  const renderRoomItem = (room: ChatRoom) => {
    const unreadCount = getUnreadCount(room.id);
    const isSelected = selectedRoom?.id === room.id;

    return (
      <ListItem
        key={room.id}
        button
        selected={isSelected}
        onClick={() => {
          setSelectedRoom(room);
          joinRoom(room.id);
          if (isMobile) {
            setShowRoomList(false);
          }
        }}
        sx={{
          borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : 'none',
          backgroundColor: isSelected ? theme.palette.action.selected : 'transparent'
        }}
      >
        <ListItemAvatar>
          <Badge badgeContent={unreadCount} color="error">
            <Avatar>
              {room.roomName.charAt(0)}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        <ListItemText
          primary={room.roomName}
          secondary={
            room.lastMessage ? (
              <>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {room.lastMessage.senderName}:
                </Typography>{' '}
                {room.lastMessage.content}
              </>
            ) : (
              'No messages yet'
            )
          }
          primaryTypographyProps={{
            fontWeight: unreadCount > 0 ? 'bold' : 'normal'
          }}
        />
      </ListItem>
    );
  };

  // Main chat interface
  const chatInterface = (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Room list */}
      {showRoomList && (
        <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Chats</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setShowCreateRoom(true)}
              sx={{ mt: 1 }}
            >
              New Chat
            </Button>
          </Box>
          <List sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {rooms.map(renderRoomItem)}
          </List>
        </Box>
      )}

      {/* Chat area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat header */}
        {selectedRoom && (
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              {isMobile && (
                <IconButton onClick={() => setShowRoomList(true)}>
                  <ChatIcon />
                </IconButton>
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{selectedRoom.roomName}</Typography>
                <Typography variant="caption">
                  {selectedRoom.participants.length} participants
                </Typography>
              </Box>
              <IconButton>
                <VideoIcon />
              </IconButton>
              <IconButton>
                <CallIcon />
              </IconButton>
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        {/* Messages area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: theme.palette.grey[50],
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              {messages.map(renderMessage)}
              
              {/* Typing indicators */}
              {typingUsers
                .filter(t => t.roomId === selectedRoom?.id)
                .map(typing => (
                  <Box key={typing.userId} sx={{ px: 2, mb: 1 }}>
                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                      {typing.userName} is typing...
                    </Typography>
                  </Box>
                ))}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Message input */}
        {selectedRoom && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            {/* Reply indicator */}
            {replyToMessage && (
              <Box sx={{ mb: 1, p: 1, backgroundColor: theme.palette.grey[100], borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  Replying to: {replyToMessage.senderName}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                  {replyToMessage.content}
                </Typography>
                <IconButton size="small" onClick={handleCancelReply}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <IconButton>
                <AttachFileIcon />
              </IconButton>
              <IconButton>
                <EmojiIcon />
              </IconButton>
              <TextField
                ref={messageInputRef}
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type a message..."
                value={messageInput}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                variant="outlined"
                size="small"
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Create room dialog */}
      <Dialog open={showCreateRoom} onClose={() => setShowCreateRoom(false)}>
        <DialogTitle>Create New Chat</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Room Name"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth>
            <InputLabel>Participants</InputLabel>
            <Select
              multiple
              value={newRoomParticipants}
              onChange={(e) => setNewRoomParticipants(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {/* This would be populated with actual users */}
              <MenuItem value="user1">User 1</MenuItem>
              <MenuItem value="user2">User 2</MenuItem>
              <MenuItem value="user3">User 3</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateRoom(false)}>Cancel</Button>
          <Button onClick={handleCreateRoom} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main chat interface */}
      {isMobile ? (
        <Drawer
          anchor="right"
          open={open}
          onClose={onClose}
          sx={{ '& .MuiDrawer-paper': { width: '100%', height: '100%' } }}
        >
          {chatInterface}
        </Drawer>
      ) : (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            width: 400,
            height: 600,
            zIndex: 1000,
            display: open ? 'block' : 'none'
          }}
        >
          {chatInterface}
        </Paper>
      )}

      {/* Floating action button for mobile */}
      {isMobile && !open && (
        <Fab
          color="primary"
          onClick={onClose}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
        >
          <ChatIcon />
        </Fab>
      )}
    </>
  );
};

export default ChatSystem; 