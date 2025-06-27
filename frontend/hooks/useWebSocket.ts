import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

type MessageHandler = (data: any) => void;

export const useWebSocket = (options: WebSocketOptions = {}) => {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 3000,
  } = options;

  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(url, {
      autoConnect,
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      auth: {
        token: user?.id,
      },
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
    });

    socketRef.current.on('disconnect', reason => {
      console.log('WebSocket disconnected:', reason);
    });

    socketRef.current.on('error', error => {
      console.error('WebSocket error:', error);
    });

    // Handle incoming messages
    socketRef.current.on('message', data => {
      const handlers = handlersRef.current.get(data.type);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    });
  }, [
    url,
    autoConnect,
    reconnection,
    reconnectionAttempts,
    reconnectionDelay,
    user,
  ]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);

    return () => {
      const handlers = handlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(type);
        }
      }
    };
  }, []);

  const emit = useCallback((type: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(type, data);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    connect,
    disconnect,
    subscribe,
    emit,
  };
};
