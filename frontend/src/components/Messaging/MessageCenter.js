import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AdminAuthContext";
const MessageCenter = ({ className = "" }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        // Load messages
        loadMessages();
    }, []);
    const loadMessages = async () => {
        setLoading(true);
        try {
            // Mock data for now
            const mockMessages = [
                {
                    id: "1",
                    senderId: "coach-1",
                    recipientId: user?.id || "",
                    content: "Great game yesterday! Your performance was outstanding.",
                    type: "text",
                    status: "read",
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    updatedAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: "2",
                    senderId: "admin-1",
                    recipientId: user?.id || "",
                    content: "Practice is cancelled tomorrow due to weather.",
                    type: "system",
                    status: "unread",
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    updatedAt: new Date(Date.now() - 3600000).toISOString()
                }
            ];
            setMessages(mockMessages);
        }
        catch (error) {
        }
        finally {
            setLoading(false);
        }
    };
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim())
            return;
        try {
            const message = {
                id: Date.now().toString(),
                senderId: user?.id || "",
                recipientId: "recipient-id",
                content: newMessage,
                type: "text",
                status: "sent",
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setMessages(prev => [message, ...prev]);
            setNewMessage("");
        }
        catch (error) {
        }
    };
    const markAsRead = async (messageId) => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status: "read" } : msg));
    };
    const getMessageTypeIcon = (type) => {
        switch (type) {
            case "system":
                return "🔔";
            case "image":
                return "📷";
            case "file":
                return "📎";
            default:
                return "💬";
        }
    };
    const formatDate = (date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diff = now.getTime() - dateObj.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) {
            return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        else if (days === 1) {
            return "Yesterday";
        }
        else {
            return dateObj.toLocaleDateString();
        }
    };
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-sm border ${className}`, children: [_jsxs("div", { className: "p-4 border-b", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Messages" }), _jsxs("p", { className: "text-sm text-gray-600", children: [messages.filter(m => m.status === "unread").length, " unread messages"] })] }), _jsxs("div", { className: "flex h-96", children: [_jsx("div", { className: "w-1/3 border-r", children: loading ? (_jsx("div", { className: "p-4 text-center text-gray-500", children: "Loading messages..." })) : (_jsx("div", { className: "overflow-y-auto h-full", children: messages.length === 0 ? (_jsx("div", { className: "p-4 text-center text-gray-500", children: "No messages yet" })) : (messages.map((message) => (_jsxs("div", { className: `p-4 border-b cursor-pointer hover:bg-gray-50 ${message.status === "unread" ? "bg-blue-50" : ""}`, onClick: () => {
                                    setSelectedMessage(message);
                                    if (message.status === "unread") {
                                        markAsRead(message.id);
                                    }
                                }, children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: getMessageTypeIcon(message.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: message.senderId === user?.id ? "You" : "Coach" }), _jsx("p", { className: "text-sm text-gray-600 truncate", children: message.content })] })] }), _jsx("div", { className: "text-xs text-gray-500", children: formatDate(message.createdAt) })] }), message.status === "unread" && (_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full mt-2" }))] }, message.id)))) })) }), _jsxs("div", { className: "flex-1 flex flex-col", children: [selectedMessage ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "p-4 border-b", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: getMessageTypeIcon(selectedMessage.type) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: selectedMessage.senderId === user?.id ? "You" : "Coach" }), _jsx("p", { className: "text-sm text-gray-500", children: formatDate(selectedMessage.createdAt) })] })] }) }) }), _jsx("div", { className: "flex-1 p-4 overflow-y-auto", children: _jsx("p", { className: "text-gray-900 whitespace-pre-wrap", children: selectedMessage.content }) })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center text-gray-500", children: "Select a message to view" })), _jsx("div", { className: "p-4 border-t", children: _jsxs("form", { onSubmit: sendMessage, className: "flex gap-2", children: [_jsx("input", { type: "text", value: newMessage, onChange: (e) => setNewMessage(e.target.value), placeholder: "Type a message...", className: "flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), _jsx("button", { type: "submit", disabled: !newMessage.trim(), className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed", children: "Send" })] }) })] })] })] }));
};
export default MessageCenter;
