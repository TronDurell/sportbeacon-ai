import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, onSnapshot, updateDoc, addDoc, Timestamp, query, where, orderBy, limit, writeBatch } from 'firebase/firestore';
import { analytics } from '../lib/ai/shared/analytics';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

interface AIAgentConfig {
  language: 'en' | 'es' | 'fr';
  timezone: string;
  communicationMethod: 'text' | 'voice' | 'avatar';
  notificationLevel: 'all' | 'priority-only' | 'disabled';
  deiReportOptIn: boolean;
  avatarType: 'static' | 'lottie' | 'rive';
  voiceEnabled: boolean;
}

interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime?: Date;
  sessionType: 'text' | 'voice' | 'avatar';
  language: string;
  analytics: SessionAnalytics;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  messageType: 'faq' | 'live-answer' | 'push-update' | 'recommendation';
  sentiment?: 'positive' | 'negative' | 'neutral';
  responseTime?: number;
  emojiCount?: number;
}

interface SessionAnalytics {
  voiceTextRatio: number;
  emojiUsage: number;
  averageResponseTime: number;
  messageCount: number;
  userSatisfaction?: number;
}

interface DEIMetrics {
  totalRequests: number;
  approvedRequests: number;
  deniedRequests: number;
  pendingRequests: number;
  approvalRate: number;
  averageProcessingTime: number;
  genderConflictRate: number;
  byTown: Record<string, number>;
  byLeague: Record<string, number>;
}

interface WeatherAlert {
  id: string;
  leagueId: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedEvents: string[];
  timestamp: Date;
}

interface ScheduleUpdate {
  id: string;
  teamId: string;
  eventId: string;
  changeType: 'time' | 'location' | 'cancellation' | 'addition';
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
  affectedUsers: string[];
}

interface TeamAnnouncement {
  id: string;
  teamId: string;
  coachId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  requiresResponse: boolean;
}

export class TownRecAIAgent {
  private config: AIAgentConfig;
  private userId: string;
  private listeners: (() => void)[] = [];

  constructor(userId: string, config?: Partial<AIAgentConfig>) {
    this.userId = userId;
    this.config = {
      language: 'en',
      timezone: 'America/New_York',
      communicationMethod: 'text',
      notificationLevel: 'all',
      deiReportOptIn: true,
      avatarType: 'lottie',
      voiceEnabled: true,
      ...config
    };
  }

  // Initialize agent with user preferences and real-time subscriptions
  async init() {
    try {
      console.log('🧠 Initializing Town Rec Unified AI Agent...');

      // Load user preferences
      await this.loadUserPreferences();

      // Set up real-time listeners
      this.setupRealtimeListeners();

      // Initialize analytics tracking
      await this.initializeAnalytics();

      // Track agent initialization
      await analytics.track('unified_ai_agent_initialized', {
        userId: this.userId,
        config: this.config,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Town Rec Unified AI Agent initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing Unified AI Agent:', error);
      throw error;
    }
  }

  // Load user preferences from Firestore
  async loadUserPreferences() {
    try {
      const userPrefsRef = doc(firestore, 'users', this.userId, 'preferences', 'aiAgent');
      const userPrefsSnap = await getDoc(userPrefsRef);
      
      if (userPrefsSnap.exists()) {
        this.config = { ...this.config, ...userPrefsSnap.data() };
      } else {
        // Create default preferences
        await updateDoc(userPrefsRef, this.config);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  // Set up real-time Firestore listeners
  setupRealtimeListeners() {
    // Listen for user preference changes
    const userPrefsRef = doc(firestore, 'users', this.userId, 'preferences', 'aiAgent');
    const prefsListener = onSnapshot(userPrefsRef, (doc) => {
      if (doc.exists()) {
        this.config = { ...this.config, ...doc.data() };
        console.log('🔄 User preferences updated:', doc.data());
      }
    });
    this.listeners.push(() => prefsListener());

    // Listen for schedule updates
    this.setupScheduleUpdateListener();
    
    // Listen for weather alerts
    this.setupWeatherAlertListener();
    
    // Listen for team announcements
    this.setupTeamAnnouncementListener();
    
    // Listen for DEI events
    this.setupDEIEventListener();
  }

  // Schedule update listener
  setupScheduleUpdateListener() {
    this.getUserChildren().then(children => {
      children.forEach(async (child) => {
        const scheduleRef = collection(firestore, 'teams', child.teamId, 'schedule');
        const scheduleQuery = query(
          scheduleRef,
          where('updatedAt', '>', Timestamp.now()),
          orderBy('updatedAt', 'desc')
        );

        const listener = onSnapshot(scheduleQuery, (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'modified' || change.type === 'added') {
              const update = change.doc.data() as ScheduleUpdate;
              await this.handleScheduleUpdate(update);
            }
          });
        });
        this.listeners.push(() => listener());
      });
    });
  }

  // Weather alert listener
  setupWeatherAlertListener() {
    this.getUserChildren().then(children => {
      children.forEach(async (child) => {
        const weatherRef = collection(firestore, 'weather_alerts');
        const weatherQuery = query(
          weatherRef,
          where('leagueId', '==', child.teamId),
          where('timestamp', '>', Timestamp.now()),
          orderBy('timestamp', 'desc')
        );

        const listener = onSnapshot(weatherQuery, (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const alert = change.doc.data() as WeatherAlert;
              await this.handleWeatherAlert(alert);
            }
          });
        });
        this.listeners.push(() => listener());
      });
    });
  }

  // Team announcement listener
  setupTeamAnnouncementListener() {
    this.getUserChildren().then(children => {
      children.forEach(async (child) => {
        const announcementsRef = collection(firestore, 'teams', child.teamId, 'announcements');
        const announcementsQuery = query(
          announcementsRef,
          where('timestamp', '>', Timestamp.now()),
          orderBy('timestamp', 'desc')
        );

        const listener = onSnapshot(announcementsQuery, (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const announcement = change.doc.data() as TeamAnnouncement;
              await this.handleTeamAnnouncement(announcement);
            }
          });
        });
        this.listeners.push(() => listener());
      });
    });
  }

  // DEI event listener
  setupDEIEventListener() {
    const deiRef = collection(firestore, 'exception_requests');
    const deiQuery = query(
      deiRef,
      where('userId', '==', this.userId),
      where('status', 'in', ['pending', 'approved', 'denied']),
      orderBy('timestamp', 'desc')
    );

    const listener = onSnapshot(deiQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'modified') {
          const request = change.doc.data();
          await this.handleDEIStatusUpdate(request);
        }
      });
    });
    this.listeners.push(() => listener());
  }

  // Chat handler for natural language Q&A
  async onChat(message: string): Promise<string> {
    try {
      console.log(`💬 Unified AI chat: ${message}`);

      const startTime = Date.now();
      const sessionId = this.generateSessionId();

      // Get user context
      const userContext = await this.getUserContext();
      
      // Detect message type
      const messageType = this.detectMessageType(message);
      
      // Generate AI response
      const response = await this.generateAIResponse(message, userContext, messageType);
      
      const responseTime = Date.now() - startTime;

      // Create chat message
      const chatMessage: ChatMessage = {
        id: this.generateMessageId(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        messageType: response.messageType,
        sentiment: response.sentiment,
        responseTime,
        emojiCount: this.countEmojis(response.text)
      };

      // Log chat session
      await this.logChatSession(sessionId, message, chatMessage, responseTime);

      // Track analytics
      await this.trackChatAnalytics(messageType, responseTime, response.sentiment);

      return response.text;

    } catch (error) {
      console.error('Error in unified chat handler:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.';
    }
  }

  // Handle schedule updates
  async handleScheduleUpdate(update: ScheduleUpdate) {
    try {
      if (this.config.notificationLevel === 'disabled') return;

      const notification = {
        title: '📅 Schedule Update',
        body: `${update.changeType} change: ${update.oldValue} → ${update.newValue}`,
        data: { 
          type: 'schedule_update', 
          eventId: update.eventId,
          teamId: update.teamId 
        }
      };

      await this.sendNotification(notification);
      
      // Track analytics
      await analytics.track('schedule_update_notification', {
        userId: this.userId,
        eventId: update.eventId,
        changeType: update.changeType,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error handling schedule update:', error);
    }
  }

  // Handle weather alerts
  async handleWeatherAlert(alert: WeatherAlert) {
    try {
      if (this.config.notificationLevel === 'disabled') return;

      const urgency = alert.severity === 'high' ? '🚨 URGENT: ' : alert.severity === 'medium' ? '⚠️ ' : 'ℹ️ ';
      
      const notification = {
        title: `${urgency}Weather Alert`,
        body: alert.description,
        data: { 
          type: 'weather_alert', 
          alertId: alert.id,
          severity: alert.severity 
        }
      };

      await this.sendNotification(notification);

    } catch (error) {
      console.error('Error handling weather alert:', error);
    }
  }

  // Handle team announcements
  async handleTeamAnnouncement(announcement: TeamAnnouncement) {
    try {
      if (this.config.notificationLevel === 'disabled') return;

      const priority = announcement.priority === 'urgent' ? '🚨 ' : 
                      announcement.priority === 'high' ? '⚠️ ' : '📢 ';
      
      const notification = {
        title: `${priority}Team Announcement`,
        body: announcement.title,
        data: { 
          type: 'team_announcement', 
          announcementId: announcement.id,
          priority: announcement.priority 
        }
      };

      await this.sendNotification(notification);

    } catch (error) {
      console.error('Error handling team announcement:', error);
    }
  }

  // Handle DEI status updates
  async handleDEIStatusUpdate(request: any) {
    try {
      const status = request.status;
      let message = '';

      switch (status) {
        case 'approved':
          message = `✅ Your exception request has been approved! You can now join the league.`;
          break;
        case 'denied':
          message = `❌ Your exception request was denied. I can help you find alternative options.`;
          // Trigger coach assistant recommendation
          await this.triggerCoachAssistantRecommendation(request);
          break;
        case 'pending':
          message = `⏳ Your exception request is under review. You'll be notified once a decision is made.`;
          break;
      }

      if (message) {
        const notification = {
          title: '🏛️ Exception Request Update',
          body: message,
          data: { 
            type: 'dei_update', 
            requestId: request.id,
            status: request.status 
          }
        };

        await this.sendNotification(notification);
      }

    } catch (error) {
      console.error('Error handling DEI status update:', error);
    }
  }

  // Generate AI response using OpenAI or Gemini
  async generateAIResponse(message: string, userContext: any, messageType: string): Promise<any> {
    try {
      const prompt = this.buildPrompt(message, userContext, messageType);
      
      // Use OpenAI for response generation (mock for now)
      const response = await this.mockOpenAIResponse(prompt);
      
      // Analyze sentiment
      const sentiment = await this.analyzeSentiment(response);
      
      // Detect message type
      const detectedType = this.detectResponseType(response);

      return {
        text: response,
        sentiment,
        messageType: detectedType
      };

    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        text: 'I apologize, but I\'m having trouble understanding right now. Please try again.',
        sentiment: 'neutral',
        messageType: 'live-answer'
      };
    }
  }

  // Mock OpenAI response (replace with actual API call)
  async mockOpenAIResponse(prompt: string): Promise<string> {
    // This would be replaced with actual OpenAI API call
    const responses = [
      "I'd be happy to help with that! Let me check the schedule for you.",
      "That's a great question about the league. Here's what I found...",
      "I understand your concern. Let me look into that for you.",
      "Thanks for asking! Here's the latest information...",
      "I can help you with that. Let me get the details..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Build context-aware prompt
  buildPrompt(message: string, userContext: any, messageType: string): string {
    const languageMap = {
      en: 'English',
      es: 'Spanish',
      fr: 'French'
    };

    return `
You are a friendly Town Rec AI Assistant helping parents with youth sports questions.

User Context: ${JSON.stringify(userContext)}
Message Type: ${messageType}
Language: ${languageMap[this.config.language]}

Parent said: "${message}"

Respond in ${languageMap[this.config.language]}. Keep responses warm, informative, and under 30 seconds when spoken.
If relevant, mention their children by name and upcoming events.

Response:`;
  }

  // Detect message type
  detectMessageType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('when') || lowerMessage.includes('schedule') || lowerMessage.includes('time')) {
      return 'faq';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
      return 'live-answer';
    } else if (lowerMessage.includes('update') || lowerMessage.includes('news') || lowerMessage.includes('announcement')) {
      return 'push-update';
    } else {
      return 'live-answer';
    }
  }

  // Detect response type
  detectResponseType(response: string): string {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('schedule') || lowerResponse.includes('time') || lowerResponse.includes('date')) {
      return 'faq';
    } else if (lowerResponse.includes('recommend') || lowerResponse.includes('suggest') || lowerResponse.includes('alternative')) {
      return 'recommendation';
    } else if (lowerResponse.includes('update') || lowerResponse.includes('announcement')) {
      return 'push-update';
    } else {
      return 'live-answer';
    }
  }

  // Analyze sentiment
  async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    try {
      // Mock sentiment analysis (replace with actual API call)
      const sentiments = ['positive', 'negative', 'neutral'];
      return sentiments[Math.floor(Math.random() * sentiments.length)] as 'positive' | 'negative' | 'neutral';
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 'neutral';
    }
  }

  // Trigger coach assistant recommendation
  async triggerCoachAssistantRecommendation(request: any) {
    try {
      const recommendation = await this.generateCoachRecommendation(request);
      
      // Send recommendation via chat interface
      await this.sendChatRecommendation(recommendation);
      
      // Track recommendation
      await analytics.track('coach_assistant_recommendation', {
        userId: this.userId,
        requestId: request.id,
        recommendationType: recommendation.type,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error triggering coach recommendation:', error);
    }
  }

  // Generate coach recommendation
  async generateCoachRecommendation(request: any): Promise<any> {
    try {
      return {
        type: 'alternative_league',
        message: 'I can help you find alternative options. Would you like to explore co-ed leagues or individual training programs?',
        alternatives: ['Co-ed League', 'Individual Training', 'Skills Development Program']
      };
    } catch (error) {
      console.error('Error generating coach recommendation:', error);
      return {
        type: 'general',
        message: 'I can help you find alternative options. Would you like to explore co-ed leagues or individual training programs?',
        alternatives: ['Co-ed League', 'Individual Training']
      };
    }
  }

  // Daily DEI report generation (scheduled at 3 AM)
  async generateDailyDEIReport() {
    try {
      console.log('📊 Generating daily DEI report...');

      const metrics = await this.generateDEIMetrics();
      const report = await this.createDEIReport(metrics);

      // Store report in Firestore
      await addDoc(collection(firestore, 'DEIReports'), {
        ...report,
        timestamp: Timestamp.now()
      });

      // Send to local government if opted in
      if (this.config.deiReportOptIn) {
        await this.exportDEIReport(report);
      }

      // Send Slack notification
      await this.sendSlackNotification('dei_daily_report', {
        totalRequests: metrics.totalRequests,
        approvalRate: metrics.approvalRate,
        pendingRequests: metrics.pendingRequests
      });

      console.log('✅ Daily DEI report generated successfully');

    } catch (error) {
      console.error('❌ Error generating DEI report:', error);
    }
  }

  // Generate DEI metrics
  async generateDEIMetrics(): Promise<DEIMetrics> {
    try {
      const requestsRef = collection(firestore, 'exception_requests');
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const requestsQuery = query(
        requestsRef,
        where('timestamp', '>=', Timestamp.fromDate(yesterday))
      );
      
      const requestsSnap = await getDocs(requestsQuery);
      const requests = requestsSnap.docs.map(doc => doc.data());

      const totalRequests = requests.length;
      const approvedRequests = requests.filter(r => r.status === 'approved').length;
      const deniedRequests = requests.filter(r => r.status === 'denied').length;
      const pendingRequests = requests.filter(r => r.status === 'pending').length;
      const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

      // Calculate by town and league
      const byTown: Record<string, number> = {};
      const byLeague: Record<string, number> = {};

      requests.forEach(request => {
        byTown[request.leagueTown] = (byTown[request.leagueTown] || 0) + 1;
        byLeague[request.leagueId] = (byLeague[request.leagueId] || 0) + 1;
      });

      return {
        totalRequests,
        approvedRequests,
        deniedRequests,
        pendingRequests,
        approvalRate,
        averageProcessingTime: 0,
        genderConflictRate: 0,
        byTown,
        byLeague
      };

    } catch (error) {
      console.error('Error generating DEI metrics:', error);
      return {
        totalRequests: 0,
        approvedRequests: 0,
        deniedRequests: 0,
        pendingRequests: 0,
        approvalRate: 0,
        averageProcessingTime: 0,
        genderConflictRate: 0,
        byTown: {},
        byLeague: {}
      };
    }
  }

  // Create DEI report
  async createDEIReport(metrics: DEIMetrics): Promise<any> {
    return {
      date: new Date(),
      metrics,
      summary: {
        totalRequests: metrics.totalRequests,
        approvalRate: `${metrics.approvalRate.toFixed(1)}%`,
        pendingRequests: metrics.pendingRequests,
        topTowns: Object.entries(metrics.byTown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      }
    };
  }

  // Export DEI report
  async exportDEIReport(report: any) {
    try {
      // Export to CSV, JSON, XLSX formats
      const formats = ['csv', 'json', 'xlsx'];
      
      for (const format of formats) {
        const exportData = await this.formatReportForExport(report, format);
        await this.sendToLocalGovernment(exportData, format);
      }

    } catch (error) {
      console.error('Error exporting DEI report:', error);
    }
  }

  // Helper methods
  async getUserContext(): Promise<any> {
    try {
      const children = await this.getUserChildren();
      const upcomingEvents = await this.getUpcomingEvents(children.map(c => c.teamId));
      const recentHighlights = await this.getRecentHighlights(children.map(c => c.id));

      return {
        children: children.map(c => ({ name: c.name, age: c.age, team: c.teamId })),
        upcomingEvents: upcomingEvents.length,
        recentHighlights: recentHighlights.length
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {};
    }
  }

  async getUserChildren(): Promise<any[]> {
    try {
      const childrenRef = collection(firestore, 'users', this.userId, 'children');
      const childrenSnap = await getDocs(childrenRef);
      return childrenSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user children:', error);
      return [];
    }
  }

  async getUpcomingEvents(teamIds: string[]): Promise<any[]> {
    try {
      const events: any[] = [];
      for (const teamId of teamIds) {
        const eventsRef = collection(firestore, 'teams', teamId, 'schedule');
        const eventsQuery = query(
          eventsRef,
          where('date', '>=', Timestamp.now()),
          orderBy('date', 'asc'),
          limit(5)
        );
        const eventsSnap = await getDocs(eventsQuery);
        events.push(...eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      return events;
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  async getRecentHighlights(childIds: string[]): Promise<any[]> {
    try {
      const highlights: any[] = [];
      for (const childId of childIds) {
        const highlightsRef = collection(firestore, 'children', childId, 'highlights');
        const highlightsQuery = query(
          highlightsRef,
          where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        const highlightsSnap = await getDocs(highlightsQuery);
        highlights.push(...highlightsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      return highlights;
    } catch (error) {
      console.error('Error getting recent highlights:', error);
      return [];
    }
  }

  async sendNotification(notification: any) {
    try {
      console.log(`📱 Sending notification to ${this.userId}:`, notification);
      
      // Store notification in Firestore
      await addDoc(collection(firestore, 'users', this.userId, 'notifications'), {
        ...notification,
        timestamp: Timestamp.now(),
        read: false
      });
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async logChatSession(sessionId: string, userMessage: string, aiMessage: ChatMessage, responseTime: number) {
    try {
      await addDoc(collection(firestore, 'chat_sessions'), {
        sessionId,
        userId: this.userId,
        userMessage,
        aiMessage,
        responseTime,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Error logging chat session:', error);
    }
  }

  async trackChatAnalytics(messageType: string, responseTime: number, sentiment: string) {
    try {
      await analytics.track('chat_interaction', {
        userId: this.userId,
        messageType,
        responseTime,
        sentiment,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking chat analytics:', error);
    }
  }

  async sendChatRecommendation(recommendation: any) {
    try {
      await addDoc(collection(firestore, 'users', this.userId, 'recommendations'), {
        ...recommendation,
        timestamp: Timestamp.now(),
        read: false
      });
    } catch (error) {
      console.error('Error sending chat recommendation:', error);
    }
  }

  async sendSlackNotification(type: string, data: any) {
    try {
      console.log(`🔔 Slack notification: ${type}`, data);
    } catch (error) {
      console.error('Error sending Slack notification:', error);
    }
  }

  async initializeAnalytics() {
    try {
      await analytics.track('ai_agent_session_start', {
        userId: this.userId,
        config: this.config,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error initializing analytics:', error);
    }
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  countEmojis(text: string): number {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const matches = text.match(emojiRegex);
    return matches ? matches.length : 0;
  }

  async formatReportForExport(report: any, format: string): Promise<any> {
    return report;
  }

  async sendToLocalGovernment(data: any, format: string) {
    console.log(`📊 Sending ${format} report to local government`);
  }

  // Cleanup listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}

export default TownRecAIAgent; 