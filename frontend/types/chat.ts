import type { Timestamp } from 'firebase/firestore';

// Chat message interface
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  timestamp: Timestamp;
  readBy: string[];
  readAt?: Timestamp;
  editedAt?: Timestamp;
  replyTo?: string; // ID of message being replied to
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
  };
  reactions?: {
    [userId: string]: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  };
}

// Chat room interface
export interface ChatRoom {
  id: string;
  roomName: string;
  roomType: 'direct' | 'group';
  participants: string[];
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp;
  };
  unreadCount?: { [userId: string]: number };
  settings?: {
    notifications: boolean;
    muted: boolean;
    pinned: boolean;
  };
  metadata?: {
    description?: string;
    avatar?: string;
    createdBy?: string;
    isActive?: boolean;
  };
}

// User presence interface
export interface UserPresence {
  id: string;
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Timestamp;
  roomId?: string;
  isTyping?: boolean;
  typingIn?: string; // Room ID where user is typing
  metadata?: {
    device?: string;
    browser?: string;
    location?: string;
  };
}

// Chat notification interface
export interface ChatNotification {
  id: string;
  userId: string;
  roomId: string;
  messageId: string;
  type: 'new_message' | 'mention' | 'reaction' | 'reply';
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  read: boolean;
  metadata?: {
    mentionedUsers?: string[];
    reactionType?: string;
    replyToContent?: string;
  };
}

// Chat settings interface
export interface ChatSettings {
  userId: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    desktop: boolean;
    mobile: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowDirectMessages: boolean;
    allowGroupInvites: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  autoReply?: {
    enabled: boolean;
    message: string;
  };
}

// Typing indicator interface
export interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
  isTyping: boolean;
  timestamp: Timestamp;
}

// Chat search result interface
export interface ChatSearchResult {
  messageId: string;
  roomId: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  highlight: {
    start: number;
    end: number;
  };
}

// Chat statistics interface
export interface ChatStats {
  totalMessages: number;
  totalRooms: number;
  activeRooms: number;
  unreadMessages: number;
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  topContacts: Array<{
    userId: string;
    userName: string;
    messageCount: number;
    lastMessageAt: Timestamp;
  }>;
  activityByHour: Array<{
    hour: number;
    messageCount: number;
  }>;
  activityByDay: Array<{
    day: string;
    messageCount: number;
  }>;
}

// Chat export interface
export interface ChatExport {
  id: string;
  userId: string;
  roomId: string;
  format: 'json' | 'csv' | 'txt';
  dateRange: {
    start: Timestamp;
    end: Timestamp;
  };
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  messageCount: number;
  error?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'presence' | 'notification' | 'error';
  data: any;
  timestamp: number;
  userId?: string;
}

// Chat hook return types
export interface UseChatReturn {
  // State
  messages: ChatMessage[];
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  unreadCounts: { [roomId: string]: number };
  typingUsers: TypingIndicator[];
  loading: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (content: string, roomId: string) => Promise<void>;
  createRoom: (participants: string[], roomName?: string) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  
  // Real-time
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  updatePresence: (status: UserPresence['status']) => void;
  
  // Utilities
  formatMessageTime: (timestamp: Timestamp) => string;
  isMessageFromMe: (message: ChatMessage) => boolean;
  getUnreadCount: (roomId: string) => number;
}

// Chat service method types
export interface ChatServiceInterface {
  initializeWebSocket: (userId: string, onMessage?: (message: ChatMessage) => void) => void;
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  getChatMessages: (roomId: string, limit?: number) => Promise<ChatMessage[]>;
  listenToMessages: (roomId: string, onMessage: (message: ChatMessage) => void) => () => void;
  createChatRoom: (participants: string[], roomName?: string) => Promise<string>;
  getUserChatRooms: (userId: string) => Promise<ChatRoom[]>;
  listenToUserRooms: (userId: string, onRoomsUpdate: (rooms: ChatRoom[]) => void) => () => void;
  updateUserPresence: (userId: string, status: UserPresence['status']) => Promise<void>;
  getUserPresence: (userId: string) => Promise<UserPresence | null>;
  listenToUserPresence: (userId: string, onPresenceUpdate: (presence: UserPresence | null) => void) => () => void;
  markMessageAsRead: (messageId: string, userId: string) => Promise<void>;
  getUnreadCount: (roomId: string, userId: string) => Promise<number>;
  closeConnection: () => void;
  isConnected: () => boolean;
}

// All types are already exported inline above 