import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, Paper, CircularProgress, Chip } from '@mui/material';
import { Mic as MicIcon, Stop as StopIcon, Send as SendIcon, Assistant as AIIcon, Person as PersonIcon } from '@mui/icons-material';
export const AIAssistantPanel = ({ responses, isLoading, onSendMessage, onStartRecording, onStopRecording, isRecording, quickReplies = [] }) => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);
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
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    return (_jsxs(Box, { sx: { height: '100%', display: 'flex', flexDirection: 'column' }, children: [_jsxs(Box, { sx: {
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }, children: [responses.map((msg) => (_jsx(Box, { sx: {
                            display: 'flex',
                            justifyContent: (msg.role === 'trainer' || msg.role === 'user') ? 'flex-end' : 'flex-start',
                            mb: 1
                        }, children: _jsxs(Paper, { sx: {
                                p: 2,
                                maxWidth: '70%',
                                bgcolor: (msg.role === 'trainer' || msg.role === 'user') ? 'primary.main' : 'background.paper',
                                color: (msg.role === 'trainer' || msg.role === 'user') ? 'primary.contrastText' : 'text.primary',
                                borderRadius: 2
                            }, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, mb: 0.5, children: [msg.role === 'ai' ? _jsx(AIIcon, { fontSize: "small" }) : _jsx(PersonIcon, { fontSize: "small" }), _jsx(Typography, { variant: "caption", fontWeight: "bold", children: msg.role === 'ai' ? 'AI Assistant' : 'You' })] }), _jsx(Typography, { variant: "body2", children: msg.content }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { mt: 0.5, display: 'block' }, children: new Date(typeof msg.timestamp === 'string' ? msg.timestamp : msg.timestamp).toLocaleTimeString() })] }) }, msg.id))), isLoading && (_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(CircularProgress, { size: 20 }), _jsx(Typography, { variant: "caption", children: "AI is thinking..." })] })), _jsx("div", { ref: messagesEndRef })] }), quickReplies.length > 0 && (_jsx(Box, { sx: { p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }, children: quickReplies.map((reply, index) => (_jsx(Chip, { label: reply, onClick: () => onSendMessage(reply), size: "small", clickable: true }, index))) })), _jsx(Box, { sx: { p: 2, borderTop: 1, borderColor: 'divider' }, children: _jsxs(Box, { display: "flex", gap: 1, children: [_jsx(TextField, { fullWidth: true, multiline: true, maxRows: 4, value: message, onChange: (e) => setMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Ask me anything...", size: "small" }), _jsx(IconButton, { color: isRecording ? 'error' : 'primary', onClick: isRecording ? onStopRecording : onStartRecording, children: isRecording ? _jsx(StopIcon, {}) : _jsx(MicIcon, {}) }), _jsx(IconButton, { color: "primary", onClick: handleSend, disabled: !message.trim(), children: _jsx(SendIcon, {}) })] }) })] }));
};
