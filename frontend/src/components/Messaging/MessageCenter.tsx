import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AdminAuthContext";
import { Message, MessageType, MessageStatus } from "../../types";

interface MessageCenterProps {
  className?: string;
}

const MessageCenter: React.FC<MessageCenterProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
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
      const mockMessages: Message[] = [
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
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const message: Message = {
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
    } catch (error) {
      }
  };

  const markAsRead = async (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, status: "read" as MessageStatus } : msg
      )
    );
  };

  const getMessageTypeIcon = (type: MessageType) => {
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

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else {
      return dateObj.toLocaleDateString();
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        <p className="text-sm text-gray-600">
          {messages.filter(m => m.status === "unread").length} unread messages
        </p>
      </div>

      <div className="flex h-96">
        {/* Message List */}
        <div className="w-1/3 border-r">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading messages...</div>
          ) : (
            <div className="overflow-y-auto h-full">
              {messages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No messages yet
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      message.status === "unread" ? "bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (message.status === "unread") {
                        markAsRead(message.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getMessageTypeIcon(message.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {message.senderId === user?.id ? "You" : "Coach"}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {message.content}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                    {message.status === "unread" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="flex-1 flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMessageTypeIcon(selectedMessage.type)}</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedMessage.senderId === user?.id ? "You" : "Coach"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(selectedMessage.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a message to view
            </div>
          )}

          {/* Compose Message */}
          <div className="p-4 border-t">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageCenter; 