import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
import { MessageSquare, Send, Bot, Search } from "lucide-react";
const Messages = () => {
    const { sendRequest } = useAgentOrchestration();
    const [messages, setMessages] = useState([
        {
            id: "1",
            sender: "Coach Smith",
            content: "Great practice today! Don't forget about the game this weekend.",
            timestamp: new Date(Date.now() - 3600000),
            type: "user",
            avatar: "CS"
        },
        {
            id: "2",
            sender: "AI Assistant",
            content: "I've updated your training schedule based on your performance metrics.",
            timestamp: new Date(Date.now() - 1800000),
            type: "ai",
            avatar: "AI"
        },
        {
            id: "3",
            sender: "Team Captain",
            content: "Team meeting tomorrow at 3 PM. Please bring your gear.",
            timestamp: new Date(Date.now() - 900000),
            type: "user",
            avatar: "TC"
        }
    ]);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const handleSendMessage = async () => {
        if (!newMessage.trim())
            return;
        const message = {
            id: Date.now().toString(),
            sender: "You",
            content: newMessage,
            timestamp: new Date(),
            type: "user",
            avatar: "U"
        };
        setMessages(prev => [...prev, message]);
        setNewMessage("");
        // Send to AI for processing
        const response = await sendRequest({
            type: "send_message",
            content: newMessage,
            context: "messaging"
        });
        if (response.success) {
            const aiResponse = {
                id: (Date.now() + 1).toString(),
                sender: "AI Assistant",
                content: response.data?.reply || "I received your message and will respond shortly.",
                timestamp: new Date(),
                type: "ai",
                avatar: "AI"
            };
            setMessages(prev => [...prev, aiResponse]);
        }
    };
    const filteredMessages = messages.filter(message => message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.sender.toLowerCase().includes(searchTerm.toLowerCase()));
    const getMessageTypeStyles = (type) => {
        switch (type) {
            case "ai":
                return "bg-blue-50 border-blue-200";
            case "system":
                return "bg-gray-50 border-gray-200";
            default:
                return "bg-white border-gray-200";
        }
    };
    const getAvatarColor = (avatar) => {
        const colors = [
            "bg-blue-500", "bg-green-500", "bg-purple-500",
            "bg-red-500", "bg-yellow-500", "bg-indigo-500"
        ];
        const index = avatar.charCodeAt(0) % colors.length;
        return colors[index];
    };
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b bg-white", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Messages" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search messages...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" })] }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: filteredMessages.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(MessageSquare, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: "No messages found" })] })) : (filteredMessages.map((message) => (_jsxs("div", { className: `flex items-start space-x-3 p-4 rounded-lg border ${getMessageTypeStyles(message.type)}`, children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(message.avatar || "U")}`, children: message.avatar }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("h4", { className: "text-sm font-medium text-gray-900", children: [message.sender, message.type === "ai" && (_jsx(Bot, { className: "inline w-3 h-3 ml-1 text-blue-500" }))] }), _jsx("span", { className: "text-xs text-gray-500", children: message.timestamp.toLocaleTimeString() })] }), _jsx("p", { className: "text-sm text-gray-700", children: message.content })] })] }, message.id)))) }), _jsx("div", { className: "p-4 border-t bg-white", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "text", placeholder: "Type your message...", value: newMessage, onChange: (e) => setNewMessage(e.target.value), onKeyPress: (e) => e.key === "Enter" && handleSendMessage(), className: "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("button", { onClick: handleSendMessage, disabled: !newMessage.trim(), className: "p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: _jsx(Send, { className: "w-4 h-4" }) })] }) })] }));
};
export default Messages;
