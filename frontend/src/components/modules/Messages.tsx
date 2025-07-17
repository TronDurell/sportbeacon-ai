import React, { useState } from 'react';
import { useAgentOrchestration } from '../../contexts/AgentOrchestrationContext';
import { MessageSquare, Send, Bot, Search } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'ai' | 'system';
  avatar?: string;
}

const Messages: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Coach Smith',
      content: 'Great practice today! Don\'t forget about the game this weekend.',
      timestamp: new Date(Date.now() - 3600000),
      type: 'user',
      avatar: 'CS'
    },
    {
      id: '2',
      sender: 'AI Assistant',
      content: 'I\'ve updated your training schedule based on your performance metrics.',
      timestamp: new Date(Date.now() - 1800000),
      type: 'ai',
      avatar: 'AI'
    },
    {
      id: '3',
      sender: 'Team Captain',
      content: 'Team meeting tomorrow at 3 PM. Please bring your gear.',
      timestamp: new Date(Date.now() - 900000),
      type: 'user',
      avatar: 'TC'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: newMessage,
      timestamp: new Date(),
      type: 'user',
      avatar: 'U'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Send to AI for processing
    const response = await sendRequest({
      type: 'send_message',
      content: newMessage,
      context: 'messaging'
    });

    if (response.success) {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'AI Assistant',
        content: response.data?.reply || 'I received your message and will respond shortly.',
        timestamp: new Date(),
        type: 'ai',
        avatar: 'AI'
      };
      setMessages(prev => [...prev, aiResponse]);
    }
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMessageTypeStyles = (type: Message['type']) => {
    switch (type) {
      case 'ai':
        return 'bg-blue-50 border-blue-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getAvatarColor = (avatar: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'
    ];
    const index = avatar.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No messages found</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 p-4 rounded-lg border ${getMessageTypeStyles(message.type)}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(message.avatar || 'U')}`}>
                {message.avatar}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {message.sender}
                    {message.type === 'ai' && (
                      <Bot className="inline w-3 h-3 ml-1 text-blue-500" />
                    )}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{message.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messages; 