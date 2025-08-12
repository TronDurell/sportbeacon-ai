import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './useAuth';
import ChatService from '../services/chatService';
import type {
  ChatMessage,
  ChatRoom,
  UserPresence,
  TypingIndicator,
  UseChatReturn
} from '../types/chat';

/**
 * Custom hook for chat functionality
 * Provides real-time messaging, room management, and user presence
 */
export const useChat = (): UseChatReturn => {
  const { user } = useAuth();
  const userId = user?.uid;

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ [roomId: string]: number }>({});
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const messageListeners = useRef<{ [roomId: string]: () => void }>({});
  const roomListeners = useRef<{ [userId: string]: () => void }>({});
  const presenceListeners = useRef<{ [userId: string]: () => void }>({});
  const typingTimeouts = useRef<{ [roomId: string]: NodeJS.Timeout }>({});

  // Initialize WebSocket connection
  useEffect(() => {
    if (!userId) return;

    ChatService.initializeWebSocket(userId, (message) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    return () => {
      ChatService.closeConnection();
    };
  }, [userId]);

  // Load user's chat rooms
  useEffect(() => {
    if (!userId) return;

    const loadRooms = async () => {
      setLoading(true);
      setError(null);

      try {
        const userRooms = await ChatService.getUserChatRooms(userId);
        setRooms(userRooms);

        // Set first room as current if none selected
        if (userRooms.length > 0 && !currentRoom) {
          setCurrentRoom(userRooms[0]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load chat rooms';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [userId, currentRoom]);

  // Listen to real-time room updates
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = ChatService.listenToUserRooms(
      userId,
      (updatedRooms) => {
        setRooms(updatedRooms);
        
        // Update current room if it changed
        if (currentRoom) {
          const updatedCurrentRoom = updatedRooms.find(room => room.id === currentRoom.id);
          if (updatedCurrentRoom) {
            setCurrentRoom(updatedCurrentRoom);
          }
        }
      },
      (error) => {
        console.error('Error listening to rooms:', error);
        setError('Failed to load real-time room updates');
      }
    );

    roomListeners.current[userId] = unsubscribe;

    return () => {
      if (roomListeners.current[userId]) {
        roomListeners.current[userId]();
        delete roomListeners.current[userId];
      }
    };
  }, [userId, currentRoom]);

  // Listen to messages for current room
  useEffect(() => {
    if (!currentRoom || !userId) return;

    // Cleanup previous listener
    if (messageListeners.current[currentRoom.id]) {
      messageListeners.current[currentRoom.id]();
    }

    const unsubscribe = ChatService.listenToMessages(
      currentRoom.id,
      (message) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Mark message as read if it's not from current user
        if (message.senderId !== userId) {
          ChatService.markMessageAsRead(message.id, userId);
        }
      },
      (error) => {
        console.error('Error listening to messages:', error);
        setError('Failed to load real-time messages');
      }
    );

    messageListeners.current[currentRoom.id] = unsubscribe;

    // Load initial messages
    const loadMessages = async () => {
      try {
        const initialMessages = await ChatService.getChatMessages(currentRoom.id, 50);
        setMessages(initialMessages);
      } catch (err) {
        console.error('Error loading initial messages:', err);
      }
    };

    loadMessages();

    return () => {
      if (messageListeners.current[currentRoom.id]) {
        messageListeners.current[currentRoom.id]();
        delete messageListeners.current[currentRoom.id];
      }
    };
  }, [currentRoom, userId]);

  // Update unread counts
  useEffect(() => {
    if (!userId || !rooms.length) return;

    const updateUnreadCounts = async () => {
      const counts: { [roomId: string]: number } = {};
      
      for (const room of rooms) {
        try {
          const count = await ChatService.getUnreadCount(room.id, userId);
          counts[room.id] = count;
        } catch (err) {
          console.error(`Error getting unread count for room ${room.id}:`, err);
          counts[room.id] = 0;
        }
      }
      
      setUnreadCounts(counts);
    };

    updateUnreadCounts();
  }, [userId, rooms]);

  // Send message
  const sendMessage = useCallback(async (content: string, roomId: string) => {
    if (!userId || !content.trim()) return;

    try {
      const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
        roomId,
        senderId: userId,
        senderName: user?.displayName || 'Unknown User',
        senderAvatar: user?.photoURL,
        content: content.trim(),
        messageType: 'text',
        readBy: [userId],
        reactions: {}
      };

      ChatService.sendMessage(message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    }
  }, [userId, user]);

  // Create chat room
  const createRoom = useCallback(async (participants: string[], roomName?: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const roomId = await ChatService.createChatRoom(participants, roomName);
      return roomId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chat room';
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  // Join room
  const joinRoom = useCallback(async (roomId: string) => {
    if (!userId) return;

    try {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setCurrentRoom(room);
        setMessages([]); // Clear messages when switching rooms
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMessage);
    }
  }, [userId, rooms]);

  // Leave room
  const leaveRoom = useCallback(async (roomId: string) => {
    if (!userId) return;

    try {
      // Remove room from user's rooms (this would typically be handled by backend)
      setRooms(prev => prev.filter(room => room.id !== roomId));
      
      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
        setMessages([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave room';
      setError(errorMessage);
    }
  }, [userId, currentRoom]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!userId) return;

    try {
      await ChatService.markMessageAsRead(messageId, userId);
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, [userId]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!userId) return;

    try {
      // This would typically be handled by backend
      setMessages(prev => prev.filter(message => message.id !== messageId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
    }
  }, [userId]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!userId || !newContent.trim()) return;

    try {
      setMessages(prev => prev.map(message => 
        message.id === messageId 
          ? { ...message, content: newContent.trim(), editedAt: new Date() as any }
          : message
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit message';
      setError(errorMessage);
    }
  }, [userId]);

  // Start typing indicator
  const startTyping = useCallback((roomId: string) => {
    if (!userId) return;

    // Clear existing timeout
    if (typingTimeouts.current[roomId]) {
      clearTimeout(typingTimeouts.current[roomId]);
    }

    // Add typing indicator
    setTypingUsers(prev => {
      const existing = prev.find(t => t.userId === userId && t.roomId === roomId);
      if (existing) return prev;
      
      return [...prev, {
        userId,
        userName: user?.displayName || 'Unknown User',
        roomId,
        isTyping: true,
        timestamp: new Date() as any
      }];
    });

    // Set timeout to stop typing indicator
    typingTimeouts.current[roomId] = setTimeout(() => {
      stopTyping(roomId);
    }, 3000);
  }, [userId, user]);

  // Stop typing indicator
  const stopTyping = useCallback((roomId: string) => {
    if (!userId) return;

    setTypingUsers(prev => prev.filter(t => !(t.userId === userId && t.roomId === roomId)));

    if (typingTimeouts.current[roomId]) {
      clearTimeout(typingTimeouts.current[roomId]);
      delete typingTimeouts.current[roomId];
    }
  }, [userId]);

  // Update presence
  const updatePresence = useCallback(async (status: UserPresence['status']) => {
    if (!userId) return;

    try {
      await ChatService.updateUserPresence(userId, status, currentRoom?.id);
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  }, [userId, currentRoom]);

  // Utility functions
  const formatMessageTime = useCallback((timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }, []);

  const isMessageFromMe = useCallback((message: ChatMessage) => {
    return message.senderId === userId;
  }, [userId]);

  const getUnreadCount = useCallback((roomId: string) => {
    return unreadCounts[roomId] || 0;
  }, [unreadCounts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup message listeners
      Object.values(messageListeners.current).forEach(unsubscribe => unsubscribe());
      
      // Cleanup room listeners
      Object.values(roomListeners.current).forEach(unsubscribe => unsubscribe());
      
      // Cleanup presence listeners
      Object.values(presenceListeners.current).forEach(unsubscribe => unsubscribe());
      
      // Cleanup typing timeouts
      Object.values(typingTimeouts.current).forEach(timeout => clearTimeout(timeout));
      
      // Close WebSocket connection
      ChatService.closeConnection();
    };
  }, []);

  return {
    // State
    messages,
    rooms,
    currentRoom,
    unreadCounts,
    typingUsers,
    loading,
    error,
    
    // Actions
    sendMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    markAsRead,
    deleteMessage,
    editMessage,
    
    // Real-time
    startTyping,
    stopTyping,
    updatePresence,
    
    // Utilities
    formatMessageTime,
    isMessageFromMe,
    getUnreadCount
  };
};

export default useChat; 