import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { analytics } from '../lib/ai/shared/analytics';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'highlight' | 'schedule' | 'injury' | 'reminder';
  data?: any;
}

interface ParentChatInterfaceProps {
  userId: string;
  agentId: string;
  onClose: () => void;
}

export const ParentChatInterface: React.FC<ParentChatInterfaceProps> = ({
  userId,
  agentId,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Quick action suggestions
  const quickActions = [
    { text: 'When is the next game?', icon: '📅' },
    { text: 'Show me recent highlights', icon: '🏆' },
    { text: 'What\'s the practice schedule?', icon: '🏃' },
    { text: 'Any coach messages?', icon: '💬' },
    { text: 'Weather for tomorrow\'s game', icon: '🌤️' },
    { text: 'How is my child doing?', icon: '📊' }
  ];

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      text: 'Hi! I\'m your Town Rec AI Assistant. I\'m here to help you stay connected with your child\'s sports activities. What would you like to know?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);

    // Track chat session start
    analytics.track('parent_chat_session_started', {
      userId,
      agentId,
      timestamp: new Date().toISOString()
    });
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual AI call)
      const aiResponse = await generateAIResponse(text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMessage]);

      // Track message interaction
      await analytics.track('parent_chat_message_sent', {
        userId,
        agentId,
        messageLength: text.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = {
      game: [
        "Your child's next game is this Saturday at 2:00 PM against the Thunder Hawks at Memorial Field. Don't forget to bring water and arrive 30 minutes early!",
        "The upcoming game is scheduled for Sunday at 10:00 AM. The weather looks great, so it should be a perfect day for soccer!",
        "Next game is on Friday at 6:30 PM. The team has been practicing hard and is looking forward to the match!"
      ],
      highlights: [
        "I just uploaded a great highlight from yesterday's game! Your child made an amazing assist that led to the winning goal. You can view it in the highlights section.",
        "There are 3 new highlights available from this week's games. Your child's defensive play was particularly impressive!",
        "Check out the latest highlight reel - your child's teamwork and sportsmanship really stood out this week."
      ],
      practice: [
        "Practice is scheduled for Tuesday and Thursday this week, both at 4:00 PM. The coach mentioned they'll be working on passing drills.",
        "This week's practices are Monday and Wednesday at 5:00 PM. Don't forget to bring cleats and shin guards!",
        "Practice schedule: Tuesday at 4:30 PM and Friday at 3:30 PM. The team will be focusing on game strategy this week."
      ],
      coach: [
        "Coach Johnson sent a message about this weekend's tournament. The team needs to arrive 45 minutes early for warm-ups.",
        "There's a new message from the coach about upcoming tryouts for the advanced league. Would you like me to forward the details?",
        "Coach mentioned that the team has been showing great improvement in teamwork and communication!"
      ],
      weather: [
        "The weather forecast for tomorrow's game looks perfect - sunny with a high of 72°F. No rain in sight!",
        "There's a 30% chance of rain for Saturday's game. The coach will send an update if we need to reschedule.",
        "Weather looks great for the weekend games - clear skies and comfortable temperatures!"
      ],
      performance: [
        "Your child has been showing excellent progress this season! Their passing accuracy has improved by 15% and they're becoming a great team leader.",
        "The coach mentioned that your child's defensive skills have really developed this month. They're becoming more confident on the field.",
        "Your child is doing fantastic! They've attended all practices, shown great sportsmanship, and their skills are improving steadily."
      ]
    };

    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('game') || lowerMessage.includes('next') || lowerMessage.includes('schedule')) {
      return responses.game[Math.floor(Math.random() * responses.game.length)];
    } else if (lowerMessage.includes('highlight') || lowerMessage.includes('video') || lowerMessage.includes('moment')) {
      return responses.highlights[Math.floor(Math.random() * responses.highlights.length)];
    } else if (lowerMessage.includes('practice') || lowerMessage.includes('training')) {
      return responses.practice[Math.floor(Math.random() * responses.practice.length)];
    } else if (lowerMessage.includes('coach') || lowerMessage.includes('message')) {
      return responses.coach[Math.floor(Math.random() * responses.coach.length)];
    } else if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('sunny')) {
      return responses.weather[Math.floor(Math.random() * responses.weather.length)];
    } else if (lowerMessage.includes('doing') || lowerMessage.includes('progress') || lowerMessage.includes('performance')) {
      return responses.performance[Math.floor(Math.random() * responses.performance.length)];
    } else {
      return "I'm here to help with anything related to your child's sports activities! You can ask me about games, practices, highlights, coach messages, weather, or how your child is doing. What would you like to know?";
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const handleVoiceCommand = () => {
    Alert.alert(
      'Voice Command',
      'Voice commands are coming soon! For now, you can type your questions or use the quick actions below.',
      [{ text: 'OK' }]
    );
  };

  const handleAvatarToggle = () => {
    Alert.alert(
      'Avatar Mode',
      'Avatar mode can be enabled in your preferences. Would you like to open preferences now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Preferences', onPress: () => {
          // This would open the preferences panel
          console.log('Opening preferences...');
        }}
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>🤖</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Town Rec AI Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {isTyping ? 'Typing...' : 'Online'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleAvatarToggle} style={styles.headerButton}>
            <MaterialIcons name="face" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleVoiceCommand} style={styles.headerButton}>
            <MaterialIcons name="mic" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.sender === 'user' ? styles.userMessage : styles.aiMessage
            ]}
          >
            {message.sender === 'ai' && (
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>🤖</Text>
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userBubble : styles.aiBubble
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userText : styles.aiText
                ]}
              >
                {message.text}
              </Text>
              <Text style={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
        
        {isLoading && (
          <View style={styles.messageContainer}>
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarText}>🤖</Text>
            </View>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.typingText}>AI is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.text)}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything about your child's sports..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <MaterialIcons 
            name="send" 
            size={24} 
            color={inputText.trim() ? '#007AFF' : '#ccc'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 40,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatar: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 5,
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  quickActionsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  quickActionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 120,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
}); 