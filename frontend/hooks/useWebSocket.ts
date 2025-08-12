import { useState, useEffect, useCallback } from 'react';

interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
}

interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
}

interface MessageHandler<T = unknown> {
  (data: T): void;
}

export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback((): void => {
    try {
      const ws = new WebSocket(url);
      setSocket(ws);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [url]);

  const disconnect = useCallback((): void => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const subscribe = useCallback(<T = unknown>(type: string, handler: MessageHandler<T>): (() => void) => {
    if (socket) {
      const messageHandler = (event: MessageEvent): void => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage<T>;
          if (data.type === type) {
            handler(data.payload);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      socket.addEventListener('message', messageHandler);
      return () => socket.removeEventListener('message', messageHandler);
    }
    return () => {};
  }, [socket]);

  const emit = useCallback(<T = unknown>(type: string, data: T): void => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage<T> = { type, payload: data };
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      const handleOpen = (): void => setIsConnected(true);
      const handleClose = (): void => setIsConnected(false);
      const handleError = (error: Event): void => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      socket.addEventListener('open', handleOpen);
      socket.addEventListener('close', handleClose);
      socket.addEventListener('error', handleError);

      return () => {
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('close', handleClose);
        socket.removeEventListener('error', handleError);
      };
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    subscribe,
    emit
  };
}; 