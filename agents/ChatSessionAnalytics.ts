import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { analytics } from '../lib/ai/shared/analytics';

const firestore = getFirestore();

interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  sessionType: 'text' | 'voice' | 'avatar';
  language: string;
  messageCount: number;
  userMessageCount: number;
  aiMessageCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  emojiUsage: {
    userEmojis: number;
    aiEmojis: number;
    totalEmojis: number;
    emojiRatio: number;
  };
  voiceMetrics: {
    voiceMessages: number;
    textMessages: number;
    voiceTextRatio: number;
    averageVoiceDuration?: number;
  };
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    dominantSentiment: 'positive' | 'negative' | 'neutral';
  };
  messageTypes: {
    faq: number;
    liveAnswer: number;
    pushUpdate: number;
    recommendation: number;
  };
  userSatisfaction?: number;
  sessionDuration: number;
  completionRate: number;
}

interface MessageAnalytics {
  id: string;
  sessionId: string;
  userId: string;
  messageType: 'user' | 'ai';
  inputMethod: 'text' | 'voice' | 'avatar';
  text: string;
  timestamp: Date;
  responseTime?: number;
  emojiCount: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  messageCategory: 'faq' | 'live-answer' | 'push-update' | 'recommendation';
  wordCount: number;
  characterCount: number;
}

interface NotificationAnalytics {
  id: string;
  userId: string;
  notificationType: 'schedule_update' | 'weather_alert' | 'team_announcement' | 'dei_update' | 'recommendation';
  sentAt: Date;
  viewedAt?: Date;
  dismissedAt?: Date;
  actedOnAt?: Date;
  actionType?: 'clicked' | 'responded' | 'ignored';
  effectiveness: 'viewed' | 'dismissed' | 'acted_on' | 'ignored';
  responseTime?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface AnalyticsSummary {
  userId: string;
  date: Date;
  totalSessions: number;
  averageSessionDuration: number;
  averageResponseTime: number;
  averageEmojiUsage: number;
  averageVoiceTextRatio: number;
  dominantSentiment: 'positive' | 'negative' | 'neutral';
  mostUsedMessageType: string;
  notificationEffectiveness: {
    viewed: number;
    dismissed: number;
    actedOn: number;
    ignored: number;
  };
  userSatisfaction: number;
}

export class ChatSessionAnalytics {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Start a new chat session
   */
  async startSession(sessionType: 'text' | 'voice' | 'avatar', language: string = 'en'): Promise<string> {
    try {
      const sessionId = this.generateSessionId();
      
      const session: ChatSession = {
        id: sessionId,
        userId: this.userId,
        startTime: new Date(),
        sessionType,
        language,
        messageCount: 0,
        userMessageCount: 0,
        aiMessageCount: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        emojiUsage: {
          userEmojis: 0,
          aiEmojis: 0,
          totalEmojis: 0,
          emojiRatio: 0
        },
        voiceMetrics: {
          voiceMessages: 0,
          textMessages: 0,
          voiceTextRatio: 0
        },
        sentiment: {
          positive: 0,
          negative: 0,
          neutral: 0,
          dominantSentiment: 'neutral'
        },
        messageTypes: {
          faq: 0,
          liveAnswer: 0,
          pushUpdate: 0,
          recommendation: 0
        },
        sessionDuration: 0,
        completionRate: 0
      };

      await addDoc(collection(firestore, 'chat_sessions'), {
        ...session,
        timestamp: Timestamp.now()
      });

      // Track session start
      await analytics.track('chat_session_started', {
        userId: this.userId,
        sessionId,
        sessionType,
        language,
        timestamp: new Date().toISOString()
      });

      return sessionId;

    } catch (error) {
      console.error('Error starting chat session:', error);
      throw error;
    }
  }

  /**
   * Log a message in the session
   */
  async logMessage(
    sessionId: string,
    messageType: 'user' | 'ai',
    inputMethod: 'text' | 'voice' | 'avatar',
    text: string,
    responseTime?: number,
    sentiment?: 'positive' | 'negative' | 'neutral',
    messageCategory: 'faq' | 'live-answer' | 'push-update' | 'recommendation' = 'live-answer'
  ): Promise<void> {
    try {
      const messageAnalytics: MessageAnalytics = {
        id: this.generateMessageId(),
        sessionId,
        userId: this.userId,
        messageType,
        inputMethod,
        text,
        timestamp: new Date(),
        responseTime,
        emojiCount: this.countEmojis(text),
        sentiment,
        messageCategory,
        wordCount: this.countWords(text),
        characterCount: text.length
      };

      // Store message analytics
      await addDoc(collection(firestore, 'message_analytics'), {
        ...messageAnalytics,
        timestamp: Timestamp.now()
      });

      // Update session analytics
      await this.updateSessionAnalytics(sessionId, messageAnalytics);

      // Track message
      await analytics.track('chat_message_logged', {
        userId: this.userId,
        sessionId,
        messageType,
        inputMethod,
        messageCategory,
        emojiCount: messageAnalytics.emojiCount,
        wordCount: messageAnalytics.wordCount,
        responseTime,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error logging message:', error);
    }
  }

  /**
   * End a chat session
   */
  async endSession(sessionId: string, userSatisfaction?: number): Promise<void> {
    try {
      const endTime = new Date();
      
      // Get session data
      const sessionRef = doc(firestore, 'chat_sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const session = sessionSnap.data() as ChatSession;
        const sessionDuration = endTime.getTime() - session.startTime.getTime();
        const completionRate = session.messageCount > 0 ? (session.aiMessageCount / session.messageCount) * 100 : 0;

        // Update session with end data
        await updateDoc(sessionRef, {
          endTime: Timestamp.fromDate(endTime),
          sessionDuration,
          completionRate,
          userSatisfaction: userSatisfaction || session.userSatisfaction
        });

        // Track session end
        await analytics.track('chat_session_ended', {
          userId: this.userId,
          sessionId,
          sessionDuration,
          messageCount: session.messageCount,
          completionRate,
          userSatisfaction,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error ending chat session:', error);
    }
  }

  /**
   * Log notification interaction
   */
  async logNotificationInteraction(
    notificationType: string,
    actionType: 'viewed' | 'dismissed' | 'acted_on' | 'ignored',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    responseTime?: number
  ): Promise<void> {
    try {
      const notificationAnalytics: NotificationAnalytics = {
        id: this.generateNotificationId(),
        userId: this.userId,
        notificationType: notificationType as any,
        sentAt: new Date(),
        effectiveness: actionType,
        responseTime,
        priority
      };

      // Set timestamps based on action
      switch (actionType) {
        case 'viewed':
          notificationAnalytics.viewedAt = new Date();
          break;
        case 'dismissed':
          notificationAnalytics.dismissedAt = new Date();
          break;
        case 'acted_on':
          notificationAnalytics.actedOnAt = new Date();
          break;
        case 'ignored':
          // No additional timestamp needed
          break;
      }

      // Store notification analytics
      await addDoc(collection(firestore, 'notification_analytics'), {
        ...notificationAnalytics,
        timestamp: Timestamp.now()
      });

      // Track notification interaction
      await analytics.track('notification_interaction', {
        userId: this.userId,
        notificationType,
        actionType,
        priority,
        responseTime,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error logging notification interaction:', error);
    }
  }

  /**
   * Generate daily analytics summary
   */
  async generateDailySummary(date: Date = new Date()): Promise<AnalyticsSummary> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get sessions for the day
      const sessionsRef = collection(firestore, 'chat_sessions');
      const sessionsQuery = query(
        sessionsRef,
        where('userId', '==', this.userId),
        where('startTime', '>=', Timestamp.fromDate(startOfDay)),
        where('startTime', '<=', Timestamp.fromDate(endOfDay))
      );
      
      const sessionsSnap = await getDocs(sessionsQuery);
      const sessions = sessionsSnap.docs.map(doc => doc.data() as ChatSession);

      // Get notifications for the day
      const notificationsRef = collection(firestore, 'notification_analytics');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', this.userId),
        where('sentAt', '>=', Timestamp.fromDate(startOfDay)),
        where('sentAt', '<=', Timestamp.fromDate(endOfDay))
      );
      
      const notificationsSnap = await getDocs(notificationsQuery);
      const notifications = notificationsSnap.docs.map(doc => doc.data() as NotificationAnalytics);

      // Calculate summary metrics
      const totalSessions = sessions.length;
      const averageSessionDuration = sessions.length > 0 
        ? sessions.reduce((sum, session) => sum + session.sessionDuration, 0) / sessions.length 
        : 0;
      
      const averageResponseTime = sessions.length > 0
        ? sessions.reduce((sum, session) => sum + session.averageResponseTime, 0) / sessions.length
        : 0;

      const averageEmojiUsage = sessions.length > 0
        ? sessions.reduce((sum, session) => sum + session.emojiUsage.emojiRatio, 0) / sessions.length
        : 0;

      const averageVoiceTextRatio = sessions.length > 0
        ? sessions.reduce((sum, session) => sum + session.voiceMetrics.voiceTextRatio, 0) / sessions.length
        : 0;

      // Calculate dominant sentiment
      const totalPositive = sessions.reduce((sum, session) => sum + session.sentiment.positive, 0);
      const totalNegative = sessions.reduce((sum, session) => sum + session.sentiment.negative, 0);
      const totalNeutral = sessions.reduce((sum, session) => sum + session.sentiment.neutral, 0);
      
      let dominantSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (totalPositive > totalNegative && totalPositive > totalNeutral) {
        dominantSentiment = 'positive';
      } else if (totalNegative > totalPositive && totalNegative > totalNeutral) {
        dominantSentiment = 'negative';
      }

      // Calculate most used message type
      const messageTypeCounts = sessions.reduce((counts, session) => {
        counts.faq += session.messageTypes.faq;
        counts.liveAnswer += session.messageTypes.liveAnswer;
        counts.pushUpdate += session.messageTypes.pushUpdate;
        counts.recommendation += session.messageTypes.recommendation;
        return counts;
      }, { faq: 0, liveAnswer: 0, pushUpdate: 0, recommendation: 0 });

      const mostUsedMessageType = Object.entries(messageTypeCounts)
        .sort(([,a], [,b]) => b - a)[0][0];

      // Calculate notification effectiveness
      const notificationEffectiveness = {
        viewed: notifications.filter(n => n.effectiveness === 'viewed').length,
        dismissed: notifications.filter(n => n.effectiveness === 'dismissed').length,
        actedOn: notifications.filter(n => n.effectiveness === 'acted_on').length,
        ignored: notifications.filter(n => n.effectiveness === 'ignored').length
      };

      // Calculate average user satisfaction
      const satisfactionSessions = sessions.filter(s => s.userSatisfaction !== undefined);
      const userSatisfaction = satisfactionSessions.length > 0
        ? satisfactionSessions.reduce((sum, session) => sum + (session.userSatisfaction || 0), 0) / satisfactionSessions.length
        : 0;

      const summary: AnalyticsSummary = {
        userId: this.userId,
        date,
        totalSessions,
        averageSessionDuration,
        averageResponseTime,
        averageEmojiUsage,
        averageVoiceTextRatio,
        dominantSentiment,
        mostUsedMessageType,
        notificationEffectiveness,
        userSatisfaction
      };

      // Store summary
      await addDoc(collection(firestore, 'analytics_summaries'), {
        ...summary,
        timestamp: Timestamp.now()
      });

      // Track summary generation
      await analytics.track('analytics_summary_generated', {
        userId: this.userId,
        date: date.toISOString(),
        totalSessions,
        averageSessionDuration,
        averageResponseTime,
        dominantSentiment,
        timestamp: new Date().toISOString()
      });

      return summary;

    } catch (error) {
      console.error('Error generating daily summary:', error);
      throw error;
    }
  }

  /**
   * Update session analytics with new message data
   */
  private async updateSessionAnalytics(sessionId: string, messageAnalytics: MessageAnalytics): Promise<void> {
    try {
      const sessionRef = doc(firestore, 'chat_sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const session = sessionSnap.data() as ChatSession;
        
        // Update message counts
        const newMessageCount = session.messageCount + 1;
        const newUserMessageCount = messageAnalytics.messageType === 'user' 
          ? session.userMessageCount + 1 
          : session.userMessageCount;
        const newAiMessageCount = messageAnalytics.messageType === 'ai' 
          ? session.aiMessageCount + 1 
          : session.aiMessageCount;

        // Update response time metrics
        const newTotalResponseTime = session.totalResponseTime + (messageAnalytics.responseTime || 0);
        const newAverageResponseTime = newAiMessageCount > 0 
          ? newTotalResponseTime / newAiMessageCount 
          : 0;

        // Update emoji usage
        const newUserEmojis = messageAnalytics.messageType === 'user' 
          ? session.emojiUsage.userEmojis + messageAnalytics.emojiCount 
          : session.emojiUsage.userEmojis;
        const newAiEmojis = messageAnalytics.messageType === 'ai' 
          ? session.emojiUsage.aiEmojis + messageAnalytics.emojiCount 
          : session.emojiUsage.aiEmojis;
        const newTotalEmojis = newUserEmojis + newAiEmojis;
        const newEmojiRatio = newMessageCount > 0 ? newTotalEmojis / newMessageCount : 0;

        // Update voice metrics
        const newVoiceMessages = messageAnalytics.inputMethod === 'voice' 
          ? session.voiceMetrics.voiceMessages + 1 
          : session.voiceMetrics.voiceMessages;
        const newTextMessages = messageAnalytics.inputMethod === 'text' 
          ? session.voiceMetrics.textMessages + 1 
          : session.voiceMetrics.textMessages;
        const newVoiceTextRatio = newTextMessages > 0 ? newVoiceMessages / newTextMessages : 0;

        // Update sentiment
        const newSentiment = { ...session.sentiment };
        if (messageAnalytics.sentiment) {
          newSentiment[messageAnalytics.sentiment]++;
          
          // Update dominant sentiment
          const maxSentiment = Math.max(newSentiment.positive, newSentiment.negative, newSentiment.neutral);
          if (maxSentiment === newSentiment.positive) {
            newSentiment.dominantSentiment = 'positive';
          } else if (maxSentiment === newSentiment.negative) {
            newSentiment.dominantSentiment = 'negative';
          } else {
            newSentiment.dominantSentiment = 'neutral';
          }
        }

        // Update message types
        const newMessageTypes = { ...session.messageTypes };
        newMessageTypes[messageAnalytics.messageCategory]++;

        // Update session
        await updateDoc(sessionRef, {
          messageCount: newMessageCount,
          userMessageCount: newUserMessageCount,
          aiMessageCount: newAiMessageCount,
          totalResponseTime: newTotalResponseTime,
          averageResponseTime: newAverageResponseTime,
          emojiUsage: {
            userEmojis: newUserEmojis,
            aiEmojis: newAiEmojis,
            totalEmojis: newTotalEmojis,
            emojiRatio: newEmojiRatio
          },
          voiceMetrics: {
            voiceMessages: newVoiceMessages,
            textMessages: newTextMessages,
            voiceTextRatio: newVoiceTextRatio
          },
          sentiment: newSentiment,
          messageTypes: newMessageTypes
        });
      }

    } catch (error) {
      console.error('Error updating session analytics:', error);
    }
  }

  /**
   * Count emojis in text
   */
  private countEmojis(text: string): number {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const matches = text.match(emojiRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Generate unique IDs
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ChatSessionAnalytics; 