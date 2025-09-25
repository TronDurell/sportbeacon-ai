import { useState, useEffect, useCallback } from 'react';
export const useWebSocket = (url) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const connect = useCallback(() => {
        try {
            const ws = new WebSocket(url);
            setSocket(ws);
        }
        catch (error) {
            console.error('WebSocket connection failed:', error);
        }
    }, [url]);
    const disconnect = useCallback(() => {
        if (socket) {
            socket.close();
            setSocket(null);
            setIsConnected(false);
        }
    }, [socket]);
    const subscribe = useCallback((type, handler) => {
        if (socket) {
            const messageHandler = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === type) {
                        handler(data.payload);
                    }
                }
                catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
            socket.addEventListener('message', messageHandler);
            return () => socket.removeEventListener('message', messageHandler);
        }
        return () => { };
    }, [socket]);
    const emit = useCallback((type, data) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            const message = { type, payload: data };
            socket.send(JSON.stringify(message));
        }
    }, [socket]);
    useEffect(() => {
        if (socket) {
            const handleOpen = () => setIsConnected(true);
            const handleClose = () => setIsConnected(false);
            const handleError = (error) => {
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
