import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/init';
import type { ChatMessage, ChatRoom, UserPresence } from '../types/chat';

/**
 * Chat service for real-time messaging
 * Handles WebSocket connections, message persistence, and user presence
 */
export class ChatService {
  private static ws: WebSocket | null = null;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectDelay = 1000; // Start with 1 second

  /**
   * Initialize WebSocket connection
   */
  static initializeWebSocket(userId: string, onMessage?: (message: ChatMessage) => void) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${process.env.REACT_APP_WS_URL || 'wss://api.sportbeacon.ai'}/chat?userId=${userId}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && onMessage) {
          onMessage(data.message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(userId, onMessage);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private static attemptReconnect(userId: string, onMessage?: (message: ChatMessage) => void) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay *= 2; // Exponential backoff
      this.initializeWebSocket(userId, onMessage);
    }, this.reconnectDelay);
  }

  /**
   * Send message via WebSocket
   */
  static sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        message
      }));
    } else {
      console.warn('WebSocket not connected, falling back to Firestore');
      this.sendMessageViaFirestore(message);
    }
  }

  /**
   * Send message via Firestore (fallback)
   */
  private static async sendMessageViaFirestore(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    try {
      const messageData = {
        ...message,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'chatMessages'), messageData);
    } catch (error) {
      console.error('Error sending message via Firestore:', error);
      throw error;
    }
  }

  /**
   * Get chat messages for a room
   */
  static async getChatMessages(
    roomId: string,
    limitCount: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const messagesQuery = query(
        collection(db, 'chatMessages'),
        where('roomId', '==', roomId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      return messagesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ChatMessage))
        .reverse(); // Show oldest first
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time chat messages
   */
  static listenToMessages(
    roomId: string,
    onMessage: (message: ChatMessage) => void,
    onError?: (error: Error) => void
  ): () => void {
    const messagesQuery = query(
      collection(db, 'chatMessages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const message = {
            id: change.doc.id,
            ...change.doc.data()
          } as ChatMessage;
          onMessage(message);
        }
      });
    }, (error) => {
      console.error('Error listening to messages:', error);
      if (onError) onError(error);
    });

    return unsubscribe;
  }

  /**
   * Create or get chat room
   */
  static async createChatRoom(
    participants: string[],
    roomName?: string,
    roomType: 'direct' | 'group' = 'direct'
  ): Promise<string> {
    try {
      // Check if room already exists for direct messages
      if (roomType === 'direct' && participants.length === 2) {
        const existingRoom = await this.findExistingDirectRoom(participants);
        if (existingRoom) {
          return existingRoom.id;
        }
      }

      const roomData = {
        participants,
        roomName: roomName || `Chat with ${participants.join(', ')}`,
        roomType,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: null
      };

      const roomRef = await addDoc(collection(db, 'chatRooms'), roomData);
      return roomRef.id;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  /**
   * Find existing direct chat room
   */
  private static async findExistingDirectRoom(participants: string[]): Promise<any> {
    try {
      const roomsQuery = query(
        collection(db, 'chatRooms'),
        where('roomType', '==', 'direct'),
        where('participants', 'array-contains', participants[0])
      );

      const roomsSnapshot = await getDocs(roomsQuery);
      
      for (const roomDoc of roomsSnapshot.docs) {
        const roomData = roomDoc.data();
        if (roomData.participants.length === 2 && 
            roomData.participants.includes(participants[1])) {
          return { id: roomDoc.id, ...roomData };
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding existing direct room:', error);
      return null;
    }
  }

  /**
   * Get user's chat rooms
   */
  static async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const roomsQuery = query(
        collection(db, 'chatRooms'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      );

      const roomsSnapshot = await getDocs(roomsQuery);
      return roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRoom));
    } catch (error) {
      console.error('Error getting user chat rooms:', error);
      throw error;
    }
  }

  /**
   * Listen to user's chat rooms in real-time
   */
  static listenToUserRooms(
    userId: string,
    onRoomsUpdate: (rooms: ChatRoom[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const roomsQuery = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRoom));
      onRoomsUpdate(rooms);
    }, (error) => {
      console.error('Error listening to user rooms:', error);
      if (onError) onError(error);
    });

    return unsubscribe;
  }

  /**
   * Update user presence
   */
  static async updateUserPresence(
    userId: string,
    status: 'online' | 'offline' | 'away',
    roomId?: string
  ): Promise<void> {
    try {
      const presenceData = {
        userId,
        status,
        lastSeen: serverTimestamp(),
        roomId: roomId || null
      };

      await updateDoc(doc(db, 'userPresence', userId), presenceData);
    } catch (error) {
      console.error('Error updating user presence:', error);
      throw error;
    }
  }

  /**
   * Get user presence
   */
  static async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const presenceDoc = await getDocs(
        query(
          collection(db, 'userPresence'),
          where('userId', '==', userId)
        )
      );

      if (presenceDoc.empty) {
        return null;
      }

      return {
        id: presenceDoc.docs[0].id,
        ...presenceDoc.docs[0].data()
      } as UserPresence;
    } catch (error) {
      console.error('Error getting user presence:', error);
      return null;
    }
  }

  /**
   * Listen to user presence in real-time
   */
  static listenToUserPresence(
    userId: string,
    onPresenceUpdate: (presence: UserPresence | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    const presenceQuery = query(
      collection(db, 'userPresence'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      if (snapshot.empty) {
        onPresenceUpdate(null);
      } else {
        const presence = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        } as UserPresence;
        onPresenceUpdate(presence);
      }
    }, (error) => {
      console.error('Error listening to user presence:', error);
      if (onError) onError(error);
    });

    return unsubscribe;
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'chatMessages', messageId), {
        readBy: [...(await this.getMessageReadBy(messageId)), userId],
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Get message read status
   */
  private static async getMessageReadBy(messageId: string): Promise<string[]> {
    try {
      const messageDoc = await getDocs(
        query(
          collection(db, 'chatMessages'),
          where('id', '==', messageId)
        )
      );

      if (messageDoc.empty) {
        return [];
      }

      return messageDoc.docs[0].data().readBy || [];
    } catch (error) {
      console.error('Error getting message read status:', error);
      return [];
    }
  }

  /**
   * Get unread message count for a room
   */
  static async getUnreadCount(roomId: string, userId: string): Promise<number> {
    try {
      const unreadQuery = query(
        collection(db, 'chatMessages'),
        where('roomId', '==', roomId),
        where('senderId', '!=', userId),
        where('readBy', 'not-in', [userId])
      );

      const unreadSnapshot = await getDocs(unreadQuery);
      return unreadSnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Close WebSocket connection
   */
  static closeConnection(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  static isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export default ChatService; 