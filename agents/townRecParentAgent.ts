import { createAgent } from 'cursor-runtime';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, onSnapshot, updateDoc, addDoc, Timestamp, query, where, orderBy, limit } from 'firebase/firestore';
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

interface ParentPreferences {
  alerts: {
    gameTimeChanges: boolean;
    injuryNotifications: boolean;
    highlightClips: boolean;
    newPhotos: boolean;
    coachMessages: boolean;
    practiceReminders: boolean;
    weatherAlerts: boolean;
    teamAnnouncements: boolean;
  };
  avatarChat: boolean;
  voiceMode: boolean;
  language: 'en' | 'es' | 'fr';
  timezone: string;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
  privacyLevel: 'standard' | 'enhanced' | 'minimal';
}

interface Child {
  id: string;
  name: string;
  age: number;
  teamId: string;
  position: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  medicalInfo?: {
    allergies: string[];
    conditions: string[];
    emergencyContact: string;
  };
}

interface GameEvent {
  id: string;
  teamId: string;
  opponent: string;
  date: Date;
  time: string;
  location: string;
  type: 'game' | 'practice' | 'tournament';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'postponed';
}

interface Highlight {
  id: string;
  childId: string;
  teamId: string;
  gameId: string;
  type: 'goal' | 'assist' | 'defense' | 'sportsmanship';
  description: string;
  videoUrl?: string;
  photoUrl?: string;
  timestamp: Date;
  coachNotes?: string;
}

interface InjuryReport {
  id: string;
  childId: string;
  teamId: string;
  severity: 'minor' | 'moderate' | 'serious';
  description: string;
  reportedBy: string;
  timestamp: Date;
  followUpRequired: boolean;
}

interface CoachMessage {
  id: string;
  teamId: string;
  coachId: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  requiresResponse: boolean;
}

export default createAgent({
  id: 'town-rec-parent-agent',
  name: 'Town Rec AI Assistant',
  persona: {
    voice: 'warm',
    avatar: 'rec_league_coach',
    style: 'friendly and informative',
    expertise: ['youth sports', 'parent communication', 'safety', 'development']
  },

  settings: {
    toggles: {
      alerts: {
        gameTimeChanges: true,
        injuryNotifications: true,
        highlightClips: true,
        newPhotos: false,
        coachMessages: true,
        practiceReminders: true,
        weatherAlerts: true,
        teamAnnouncements: true
      },
      avatarChat: true,
      voiceMode: false,
      language: 'en' as const,
      timezone: 'America/New_York',
      notificationFrequency: 'immediate' as const,
      privacyLevel: 'standard' as const
    }
  },

  // Initialize agent with user preferences and real-time subscriptions
  async init(ctx) {
    try {
      console.log('🏠 Initializing Town Rec Parent AI Agent...');

      // Load user preferences
      const userPrefsRef = doc(firestore, 'users', ctx.userId, 'preferences', 'agentToggles');
      const userPrefsSnap = await getDoc(userPrefsRef);
      
      if (userPrefsSnap.exists()) {
        ctx.settings.toggles = { ...ctx.settings.toggles, ...userPrefsSnap.data() };
      } else {
        // Create default preferences
        await updateDoc(userPrefsRef, ctx.settings.toggles);
      }

      // Set up real-time listeners
      this.setupRealtimeListeners(ctx);

      // Track agent initialization
      await analytics.track('parent_agent_initialized', {
        userId: ctx.userId,
        preferences: ctx.settings.toggles,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Town Rec Parent AI Agent initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing Parent AI Agent:', error);
      throw error;
    }
  },

  // Set up real-time Firestore subscriptions
  setupRealtimeListeners(ctx: any) {
    // Listen for preference changes
    const userPrefsRef = doc(firestore, 'users', ctx.userId, 'preferences', 'agentToggles');
    onSnapshot(userPrefsRef, (doc) => {
      if (doc.exists()) {
        ctx.settings.toggles = { ...ctx.settings.toggles, ...doc.data() };
        console.log('🔄 Parent preferences updated:', doc.data());
      }
    });

    // Listen for team announcements
    this.setupTeamAnnouncementListener(ctx);
    
    // Listen for coach messages
    this.setupCoachMessageListener(ctx);
    
    // Listen for schedule changes
    this.setupScheduleChangeListener(ctx);
  },

  // Team announcement listener
  setupTeamAnnouncementListener(ctx: any) {
    const children = this.getUserChildren(ctx.userId);
    children.forEach(async (child) => {
      const announcementsRef = collection(firestore, 'teams', child.teamId, 'announcements');
      const announcementsQuery = query(
        announcementsRef,
        where('timestamp', '>', Timestamp.now()),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      onSnapshot(announcementsQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' && ctx.settings.toggles.alerts.teamAnnouncements) {
            const announcement = change.doc.data();
            await this.sendNotification(ctx.userId, {
              title: `📢 Team Announcement`,
              body: announcement.title,
              data: { type: 'announcement', id: change.doc.id, teamId: child.teamId }
            });
          }
        });
      });
    });
  },

  // Coach message listener
  setupCoachMessageListener(ctx: any) {
    const children = this.getUserChildren(ctx.userId);
    children.forEach(async (child) => {
      const messagesRef = collection(firestore, 'teams', child.teamId, 'coachMessages');
      const messagesQuery = query(
        messagesRef,
        where('timestamp', '>', Timestamp.now()),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      onSnapshot(messagesQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' && ctx.settings.toggles.alerts.coachMessages) {
            const message = change.doc.data() as CoachMessage;
            await this.sendNotification(ctx.userId, {
              title: `💬 Coach Message`,
              body: message.subject,
              data: { 
                type: 'coach_message', 
                id: change.doc.id, 
                teamId: child.teamId,
                priority: message.priority 
              }
            });
          }
        });
      });
    });
  },

  // Schedule change listener
  setupScheduleChangeListener(ctx: any) {
    const children = this.getUserChildren(ctx.userId);
    children.forEach(async (child) => {
      const scheduleRef = collection(firestore, 'teams', child.teamId, 'schedule');
      const scheduleQuery = query(
        scheduleRef,
        where('status', 'in', ['confirmed', 'cancelled', 'postponed']),
        orderBy('date', 'desc')
      );

      onSnapshot(scheduleQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'modified' && ctx.settings.toggles.alerts.gameTimeChanges) {
            const event = change.doc.data() as GameEvent;
            await this.sendNotification(ctx.userId, {
              title: `📅 Schedule Update`,
              body: `${event.type} ${event.status}: ${event.opponent} on ${event.date.toLocaleDateString()}`,
              data: { 
                type: 'schedule_update', 
                id: change.doc.id, 
                teamId: child.teamId,
                status: event.status 
              }
            });
          }
        });
      });
    });
  },

  // Chat handler for natural language Q&A
  async onChat({ message, ctx }: { message: string; ctx: any }) {
    try {
      console.log(`💬 Parent chat: ${message}`);

      // Get user context
      const children = await this.getUserChildren(ctx.userId);
      const upcomingEvents = await this.getUpcomingEvents(children.map(c => c.teamId));
      const recentHighlights = await this.getRecentHighlights(children.map(c => c.id));

      // Create context-aware prompt
      const contextPrompt = `
        You are a friendly Town Rec AI Assistant helping parents with youth sports questions.
        
        Parent's children: ${children.map(c => `${c.name} (${c.age}, ${c.position})`).join(', ')}
        Upcoming events: ${upcomingEvents.length} events in next 7 days
        Recent highlights: ${recentHighlights.length} highlights this week
        
        Parent question: ${message}
        
        Respond in a warm, helpful tone. If relevant, mention their children by name and upcoming events.
        Keep responses concise but informative.
      `;

      const response = await ctx.askOpenAI(contextPrompt);
      
      // Track chat interaction
      await analytics.track('parent_chat_interaction', {
        userId: ctx.userId,
        message: message.substring(0, 100), // Truncate for privacy
        responseLength: response.length,
        timestamp: new Date().toISOString()
      });

      return ctx.reply(response);

    } catch (error) {
      console.error('Error in chat handler:', error);
      return ctx.reply('I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.');
    }
  },

  // Live update broadcaster for schedule changes
  async onEvent('league.schedule.update', async ({ data, ctx }: { data: any; ctx: any }) => {
    try {
      const { teamId, changeType, newTime, eventId } = data;
      
      // Get team parents
      const teamParentsRef = collection(firestore, 'teams', teamId, 'parents');
      const teamParentsSnap = await getDocs(teamParentsRef);

      for (const parent of teamParentsSnap.docs) {
        const parentData = parent.data();
        const toggles = parentData.alertPrefs || ctx.settings.toggles.alerts;
        
        if (toggles.gameTimeChanges) {
          await this.sendNotification(parent.id, {
            title: `📅 Schedule Update`,
            body: `Game time changed to ${newTime}`,
            data: { 
              type: 'schedule_update', 
              teamId, 
              eventId, 
              changeType 
            }
          });
        }
      }

      // Track schedule update
      await analytics.track('schedule_update_broadcast', {
        teamId,
        changeType,
        affectedParents: teamParentsSnap.size,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error broadcasting schedule update:', error);
    }
  },

  // Injury notification handler
  async onEvent('injury.report', async ({ data, ctx }: { data: any; ctx: any }) => {
    try {
      const { childId, teamId, severity, description, reportedBy } = data;
      
      // Get child's parent
      const childRef = doc(firestore, 'children', childId);
      const childSnap = await getDoc(childRef);
      
      if (childSnap.exists()) {
        const childData = childSnap.data() as Child;
        const parentId = childData.parentId;

        // Check parent preferences
        const parentPrefsRef = doc(firestore, 'users', parentId, 'preferences', 'agentToggles');
        const parentPrefsSnap = await getDoc(parentPrefsRef);
        const toggles = parentPrefsSnap.exists() ? parentPrefsSnap.data() : ctx.settings.toggles.alerts;

        if (toggles.injuryNotifications) {
          const urgency = severity === 'serious' ? '🚨 URGENT: ' : severity === 'moderate' ? '⚠️ ' : 'ℹ️ ';
          
          await this.sendNotification(parentId, {
            title: `${urgency}Injury Report`,
            body: `${childData.name}: ${description}`,
            data: { 
              type: 'injury_report', 
              childId, 
              teamId, 
              severity,
              reportedBy 
            }
          });
        }
      }

    } catch (error) {
      console.error('Error handling injury report:', error);
    }
  },

  // Voice or avatar delivery command
  async onCommand('/parentAgent speak', async ({ args, ctx }: { args: string[]; ctx: any }) => {
    try {
      const [prompt] = args;
      
      if (!prompt) {
        return ctx.reply('Please provide a prompt for the voice message.');
      }

      // Get context for the prompt
      const children = await this.getUserChildren(ctx.userId);
      const contextPrompt = `
        Create a brief, friendly message for a parent about: ${prompt}
        
        Parent has ${children.length} child(ren) in sports.
        Keep it warm, informative, and under 30 seconds when spoken.
      `;

      const summary = await ctx.askOpenAI(contextPrompt);

      if (ctx.settings.toggles.voiceMode) {
        await ctx.speak(summary);
        await analytics.track('parent_agent_voice_message', {
          userId: ctx.userId,
          prompt: prompt.substring(0, 50),
          timestamp: new Date().toISOString()
        });
      } else {
        ctx.reply(`🎙️ ${summary}`);
      }

    } catch (error) {
      console.error('Error in speak command:', error);
      ctx.reply('Sorry, I couldn\'t process that voice request right now.');
    }
  },

  // Customizable data delivery - check for highlights every 15 minutes
  async onSchedule('*/15 * * * *', async ({ ctx }: { ctx: any }) => {
    try {
      const children = await this.getUserChildren(ctx.userId);
      
      for (const child of children) {
        const highlights = await this.getRecentHighlights([child.id]);
        
        for (const highlight of highlights) {
          const settings = await this.getUserPreferences(ctx.userId);
          
          if (settings?.alerts?.highlightClips) {
            await this.sendNotification(ctx.userId, {
              title: '🏆 New Highlight Available',
              body: `${child.name}'s ${highlight.type} moment was just uploaded!`,
              data: { 
                type: 'highlight', 
                highlightId: highlight.id, 
                childId: child.id,
                teamId: child.teamId 
              }
            });
          }
        }
      }

    } catch (error) {
      console.error('Error in highlight check:', error);
    }
  },

  // Weather alert handler
  async onSchedule('0 */2 * * *', async ({ ctx }: { ctx: any }) => {
    try {
      const children = await this.getUserChildren(ctx.userId);
      const upcomingEvents = await this.getUpcomingEvents(children.map(c => c.teamId));
      
      // Check for outdoor events in next 24 hours
      const outdoorEvents = upcomingEvents.filter(event => 
        event.type === 'game' && 
        event.date > new Date() && 
        event.date < new Date(Date.now() + 24 * 60 * 60 * 1000)
      );

      if (outdoorEvents.length > 0 && ctx.settings.toggles.alerts.weatherAlerts) {
        // This would integrate with a weather API
        const weatherCheck = await this.checkWeatherForEvents(outdoorEvents);
        
        if (weatherCheck.hasWarnings) {
          await this.sendNotification(ctx.userId, {
            title: '🌤️ Weather Alert',
            body: `Weather may affect ${outdoorEvents.length} upcoming outdoor event(s)`,
            data: { 
              type: 'weather_alert', 
              events: outdoorEvents.map(e => e.id),
              warnings: weatherCheck.warnings 
            }
          });
        }
      }

    } catch (error) {
      console.error('Error in weather check:', error);
    }
  },

  // Practice reminder handler
  async onSchedule('0 8 * * *', async ({ ctx }: { ctx: any }) => {
    try {
      const children = await this.getUserChildren(ctx.userId);
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      for (const child of children) {
        const practices = await this.getPracticesForChild(child.id, dayOfWeek);
        
        if (practices.length > 0 && ctx.settings.toggles.alerts.practiceReminders) {
          await this.sendNotification(ctx.userId, {
            title: '🏃 Practice Reminder',
            body: `${child.name} has practice today at ${practices[0].time}`,
            data: { 
              type: 'practice_reminder', 
              childId: child.id,
              teamId: child.teamId,
              practiceId: practices[0].id 
            }
          });
        }
      }

    } catch (error) {
      console.error('Error in practice reminder:', error);
    }
  },

  // Helper methods
  async getUserChildren(userId: string): Promise<Child[]> {
    try {
      const childrenRef = collection(firestore, 'users', userId, 'children');
      const childrenSnap = await getDocs(childrenRef);
      
      return childrenSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Child[];
    } catch (error) {
      console.error('Error getting user children:', error);
      return [];
    }
  },

  async getUserPreferences(userId: string): Promise<ParentPreferences | null> {
    try {
      const prefsRef = doc(firestore, 'users', userId, 'preferences', 'agentToggles');
      const prefsSnap = await getDoc(prefsRef);
      
      return prefsSnap.exists() ? prefsSnap.data() as ParentPreferences : null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  },

  async getUpcomingEvents(teamIds: string[]): Promise<GameEvent[]> {
    try {
      const events: GameEvent[] = [];
      
      for (const teamId of teamIds) {
        const eventsRef = collection(firestore, 'teams', teamId, 'schedule');
        const eventsQuery = query(
          eventsRef,
          where('date', '>=', Timestamp.now()),
          orderBy('date', 'asc'),
          limit(10)
        );
        
        const eventsSnap = await getDocs(eventsQuery);
        events.push(...eventsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        })) as GameEvent[]);
      }
      
      return events;
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  },

  async getRecentHighlights(childIds: string[]): Promise<Highlight[]> {
    try {
      const highlights: Highlight[] = [];
      
      for (const childId of childIds) {
        const highlightsRef = collection(firestore, 'children', childId, 'highlights');
        const highlightsQuery = query(
          highlightsRef,
          where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        
        const highlightsSnap = await getDocs(highlightsQuery);
        highlights.push(...highlightsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        })) as Highlight[]);
      }
      
      return highlights;
    } catch (error) {
      console.error('Error getting recent highlights:', error);
      return [];
    }
  },

  async getPracticesForChild(childId: string, dayOfWeek: number): Promise<GameEvent[]> {
    try {
      const childRef = doc(firestore, 'children', childId);
      const childSnap = await getDoc(childRef);
      
      if (childSnap.exists()) {
        const childData = childSnap.data() as Child;
        const practicesRef = collection(firestore, 'teams', childData.teamId, 'practices');
        const practicesQuery = query(
          practicesRef,
          where('dayOfWeek', '==', dayOfWeek),
          where('active', '==', true)
        );
        
        const practicesSnap = await getDocs(practicesQuery);
        return practicesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GameEvent[];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting practices for child:', error);
      return [];
    }
  },

  async checkWeatherForEvents(events: GameEvent[]): Promise<{ hasWarnings: boolean; warnings: string[] }> {
    // This would integrate with a weather API
    // For now, return mock data
    return {
      hasWarnings: false,
      warnings: []
    };
  },

  async sendNotification(userId: string, notification: {
    title: string;
    body: string;
    data?: any;
  }) {
    try {
      // This would integrate with your notification system
      console.log(`📱 Sending notification to ${userId}:`, notification);
      
      // Track notification
      await analytics.track('parent_notification_sent', {
        userId,
        notificationType: notification.data?.type || 'general',
        timestamp: new Date().toISOString()
      });
      
      // Store notification in Firestore for history
      await addDoc(collection(firestore, 'users', userId, 'notifications'), {
        ...notification,
        timestamp: Timestamp.now(),
        read: false
      });
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}); 