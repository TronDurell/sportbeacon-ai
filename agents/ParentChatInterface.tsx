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
  Alert,
  Switch
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { analytics } from '../lib/ai/shared/analytics';
import { AvatarLottie } from './AvatarLottie';
import { AvatarRive } from './AvatarRive';
import TownRecAIAgent from './townRecAIAgent';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'highlight' | 'schedule' | 'injury' | 'reminder';
  messageType: 'faq' | 'live-answer' | 'push-update' | 'recommendation';
  data?: any;
}

interface ParentChatInterfaceProps {
  userId: string;
  agentId: string;
  onClose: () => void;
  avatarType?: 'static' | 'lottie' | 'rive';
  voiceEnabled?: boolean;
}

export const ParentChatInterface: React.FC<ParentChatInterfaceProps> = ({
  userId,
  agentId,
  onClose,
  avatarType = 'lottie',
  voiceEnabled = true
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatar, setShowAvatar] = useState(true);
  const [avatarAnimation, setAvatarAnimation] = useState<'idle' | 'talk' | 'alert'>('idle');
  const [aiAgent, setAiAgent] = useState<TownRecAIAgent | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Quick action suggestions
  const quickActions = [
    { text: 'When is the next game?', icon: '📅', type: 'faq' as const },
    { text: 'Show me recent highlights', icon: '🏆', type: 'faq' as const },
    { text: 'What\'s the practice schedule?', icon: '🏃', type: 'faq' as const },
    { text: 'Any coach messages?', icon: '💬', type: 'faq' as const },
    { text: 'Weather for tomorrow\'s game', icon: '🌤️', type: 'faq' as const },
    { text: 'How is my child doing?', icon: '📊', type: 'live-answer' as const }
  ];

  useEffect(() => {
    // Initialize AI Agent
    const agent = new TownRecAIAgent(userId);
    agent.init().then(() => {
      setAiAgent(agent);
    });

    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      text: 'Hi! I\'m your Town Rec AI Assistant. I\'m here to help you stay connected with your child\'s sports activities. What would you like to know?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      messageType: 'live-answer'
    };
    setMessages([welcomeMessage]);

    // Track chat session start
    analytics.track('parent_chat_session_started', {
      userId,
      agentId,
      avatarType,
      voiceEnabled,
      timestamp: new Date().toISOString()
    });

    // Cleanup on unmount
    return () => {
      if (agent) {
        agent.cleanup();
      }
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      messageType: 'live-answer'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);
    setAvatarAnimation('talk');

    try {
      let aiResponse: string;
      
      if (aiAgent) {
        // Use the unified AI agent
        aiResponse = await aiAgent.onChat(text);
      } else {
        // Fallback to local response generation
        aiResponse = await generateAIResponse(text);
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        messageType: detectMessageType(aiResponse)
      };

      setMessages(prev => [...prev, aiMessage]);

      // Track message interaction
      await analytics.track('parent_chat_message_sent', {
        userId,
        agentId,
        messageLength: text.length,
        messageType: aiMessage.messageType,
        avatarType,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        messageType: 'live-answer'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
      setAvatarAnimation('idle');
    }
  };

  const detectMessageType = (text: string): 'faq' | 'live-answer' | 'push-update' | 'recommendation' => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('schedule') || lowerText.includes('time') || lowerText.includes('date')) {
      return 'faq';
    } else if (lowerText.includes('recommend') || lowerText.includes('suggest') || lowerText.includes('alternative')) {
      return 'recommendation';
    } else if (lowerText.includes('update') || lowerText.includes('announcement') || lowerText.includes('alert')) {
      return 'push-update';
    } else {
      return 'live-answer';
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

  const handleQuickAction = (action: { text: string; icon: string; type: string }) => {
    sendMessage(action.text);
  };

  const handleVoiceCommand = () => {
    if (!voiceEnabled) {
      Alert.alert(
        'Voice Disabled',
        'Voice commands are disabled in your preferences. You can enable them in the settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Voice Command',
      'Voice commands are coming soon! For now, you can type your questions or use the quick actions below.',
      [{ text: 'OK' }]
    );
  };

  const handleAvatarToggle = () => {
    setShowAvatar(!showAvatar);
    
    // Track avatar toggle
    analytics.track('avatar_toggle', {
      userId,
      agentId,
      showAvatar: !showAvatar,
      avatarType,
      timestamp: new Date().toISOString()
    });
  };

  const renderAvatar = () => {
    if (!showAvatar) return null;

    const avatarProps = {
      animation: avatarAnimation,
      size: 80,
      style: styles.avatar
    };

    switch (avatarType) {
      case 'lottie':
        return <AvatarLottie {...avatarProps} />;
      case 'rive':
        return <AvatarRive {...avatarProps} />;
      default:
        return (
          <View style={[styles.avatar, styles.staticAvatar]}>
            <MaterialIcons name="person" size={40} color="#007AFF" />
          </View>
        );
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    const messageStyle = isUser ? styles.userMessage : styles.aiMessage;
    const textStyle = isUser ? styles.userText : styles.aiText;

    return (
      <View key={message.id} style={[styles.messageContainer, isUser ? styles.userContainer : styles.aiContainer]}>
        {!isUser && showAvatar && (
          <View style={styles.avatarContainer}>
            {renderAvatar()}
          </View>
        )}
        <View style={[styles.messageBubble, messageStyle]}>
          <Text style={textStyle}>{message.text}</Text>
          <Text style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {!isUser && (
            <View style={styles.messageTypeBadge}>
              <Text style={styles.messageTypeText}>{message.messageType}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Town Rec AI Assistant</Text>
        <View style={styles.headerControls}>
          <Switch
            value={showAvatar}
            onValueChange={handleAvatarToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showAvatar ? '#007AFF' : '#f4f3f4'}
          />
          <Text style={styles.avatarLabel}>Avatar</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.aiContainer]}>
            {showAvatar && (
              <View style={styles.avatarContainer}>
                {renderAvatar()}
              </View>
            )}
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.typingText}>AI is typing...</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
        <View style={styles.inputButtons}>
          {voiceEnabled && (
            <TouchableOpacity onPress={handleVoiceCommand} style={styles.voiceButton}>
              <MaterialIcons name="mic" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => sendMessage(inputText)}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            disabled={!inputText.trim() || isLoading}
          >
            <MaterialIcons name="send" size={24} color={inputText.trim() ? "#007AFF" : "#999"} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  staticAvatar: {
    backgroundColor: '#e1e5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    position: 'relative',
  },
  userMessage: {
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  userText: {
    color: '#fff',
    fontSize: 16,
  },
  aiText: {
    color: '#333',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  messageTypeBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  messageTypeText: {
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  quickActionsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  quickActionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  quickActionIcon: {
    fontSize: 20,
    textAlign: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 80,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  inputButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceButton: {
    padding: 8,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#f8f9fa',
  },
}); 