import { Platform } from 'react-native';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { initializePushNotifications, onMessageListener } from '../firebase';

export interface RecurringEvent {
  id: string;
  title: string;
  description: string;
  sportType: string;
  venueId: string;
  town: string;
  creatorId: string;
  pattern: RecurringPattern;
  nextOccurrence: Date;
  lastOccurrence?: Date;
  isActive: boolean;
  notificationSettings: NotificationSettings;
  calendarSync: CalendarSyncSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  customCron?: string; // Custom CRON expression
  startDate: Date;
  endDate?: Date;
  exceptions?: Date[]; // Dates to skip
}

export interface NotificationSettings {
  enabled: boolean;
  reminderMinutes: number[]; // [60, 1440] = 1 hour and 1 day before
  messageTemplate: string;
  includeLocation: boolean;
  includeWeather: boolean;
}

export interface CalendarSyncSettings {
  enabled: boolean;
  calendarType: 'google' | 'ical' | 'outlook';
  calendarId?: string;
  autoSync: boolean;
}

export interface EventOccurrence {
  id: string;
  recurringEventId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  venueId: string;
  town: string;
  participants: string[];
  maxParticipants?: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  weather?: WeatherInfo;
  notificationsSent: boolean;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export class RecurringEventEngine {
  private static instance: RecurringEventEngine;
  private eventListeners: Map<string, () => void> = new Map();
  private notificationTimer?: NodeJS.Timeout;

  static getInstance(): RecurringEventEngine {
    if (!RecurringEventEngine.instance) {
      RecurringEventEngine.instance = new RecurringEventEngine();
    }
    return RecurringEventEngine.instance;
  }

  // Create a new recurring event
  async createRecurringEvent(eventData: Omit<RecurringEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const event: Omit<RecurringEvent, 'id'> = {
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'recurringEvents'), event);
      
      // Generate first occurrence
      await this.generateNextOccurrence(docRef.id, eventData.pattern);
      
      // Set up calendar sync if enabled
      if (eventData.calendarSync.enabled) {
        await this.syncToCalendar(docRef.id, eventData);
      }

      return docRef.id;
    } catch (error) {
      console.error('Failed to create recurring event:', error);
      throw error;
    }
  }

  // Generate next occurrence based on pattern
  async generateNextOccurrence(eventId: string, pattern: RecurringPattern): Promise<Date> {
    const nextDate = this.calculateNextOccurrence(pattern);
    
    if (nextDate) {
      const occurrence: Omit<EventOccurrence, 'id'> = {
        recurringEventId: eventId,
        title: '', // Will be filled from parent event
        startTime: nextDate,
        endTime: new Date(nextDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours default
        venueId: '', // Will be filled from parent event
        town: '', // Will be filled from parent event
        participants: [],
        status: 'scheduled',
        notificationsSent: false,
      };

      await addDoc(collection(db, 'eventOccurrences'), occurrence);
      
      // Update recurring event with next occurrence
      await updateDoc(doc(db, 'recurringEvents', eventId), {
        nextOccurrence: nextDate,
        updatedAt: new Date(),
      });
    }

    return nextDate;
  }

  // Calculate next occurrence date based on pattern
  private calculateNextOccurrence(pattern: RecurringPattern): Date | null {
    const now = new Date();
    let nextDate = new Date(pattern.startDate);

    // Skip if end date has passed
    if (pattern.endDate && now > pattern.endDate) {
      return null;
    }

    // Adjust to next occurrence based on pattern type
    switch (pattern.type) {
      case 'daily':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + pattern.interval);
        }
        break;

      case 'weekly':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + (7 * pattern.interval));
        }
        // Adjust to specific days of week if specified
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          const targetDays = pattern.daysOfWeek;
          while (!targetDays.includes(nextDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
        }
        break;

      case 'monthly':
        while (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        }
        // Adjust to specific day of month if specified
        if (pattern.dayOfMonth) {
          nextDate.setDate(pattern.dayOfMonth);
        }
        break;

      case 'custom':
        if (pattern.customCron) {
          nextDate = this.parseCronExpression(pattern.customCron, now);
        }
        break;
    }

    // Check for exceptions
    if (pattern.exceptions && pattern.exceptions.some(date => 
      date.toDateString() === nextDate.toDateString()
    )) {
      return this.calculateNextOccurrence({
        ...pattern,
        startDate: new Date(nextDate.getTime() + 24 * 60 * 60 * 1000)
      });
    }

    return nextDate;
  }

  // Parse custom CRON expression
  private parseCronExpression(cron: string, fromDate: Date): Date {
    // Simplified CRON parser - supports basic patterns
    const parts = cron.split(' ');
    const [minute, hour, day, month, dayOfWeek] = parts;

    const nextDate = new Date(fromDate);
    
    // This is a simplified implementation
    // In production, use a proper CRON library
    if (day !== '*') {
      nextDate.setDate(parseInt(day));
    }
    if (hour !== '*') {
      nextDate.setHours(parseInt(hour));
    }
    if (minute !== '*') {
      nextDate.setMinutes(parseInt(minute));
    }

    return nextDate;
  }

  // Send notifications for upcoming events
  async sendEventNotifications(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'eventOccurrences'),
        where('status', '==', 'scheduled'),
        where('startTime', '>', now),
        where('notificationsSent', '==', false)
      );

      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        const occurrence = doc.data() as EventOccurrence;
        const timeUntilEvent = occurrence.startTime.getTime() - now.getTime();
        
        // Check if it's time to send notifications
        const reminderMinutes = [60, 1440]; // 1 hour and 1 day
        for (const minutes of reminderMinutes) {
          if (timeUntilEvent <= minutes * 60 * 1000 && timeUntilEvent > (minutes - 1) * 60 * 1000) {
            await this.sendNotification(occurrence, minutes);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send event notifications:', error);
    }
  }

  // Send individual notification
  private async sendNotification(occurrence: EventOccurrence, minutesUntil: number): Promise<void> {
    try {
      // Get recurring event details
      const eventDoc = await getDocs(query(
        collection(db, 'recurringEvents'),
        where('id', '==', occurrence.recurringEventId)
      ));

      if (!eventDoc.empty) {
        const event = eventDoc.docs[0].data() as RecurringEvent;
        
        // Prepare notification message
        const timeText = minutesUntil >= 60 ? 
          `${Math.floor(minutesUntil / 60)} hour${Math.floor(minutesUntil / 60) > 1 ? 's' : ''}` : 
          `${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`;

        const message = event.notificationSettings.messageTemplate
          .replace('{title}', event.title)
          .replace('{time}', timeText)
          .replace('{venue}', occurrence.venueId) // Would need venue lookup
          .replace('{town}', occurrence.town);

        // Send via Firebase Cloud Messaging
        await this.sendFCMNotification(occurrence.participants, {
          title: `Upcoming: ${event.title}`,
          body: message,
          data: {
            eventId: occurrence.id,
            type: 'event_reminder',
            minutesUntil: minutesUntil.toString(),
          },
        });

        // Mark notification as sent
        await updateDoc(doc(db, 'eventOccurrences', occurrence.id), {
          notificationsSent: true,
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Send FCM notification
  private async sendFCMNotification(userIds: string[], notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    try {
      // Get FCM tokens for users
      const tokens: string[] = [];
      for (const userId of userIds) {
        const userDoc = await getDocs(query(
          collection(db, 'users'),
          where('id', '==', userId)
        ));
        
        if (!userDoc.empty) {
          const user = userDoc.docs[0].data();
          if (user.fcmToken) {
            tokens.push(user.fcmToken);
          }
        }
      }

      // Send to Firebase Cloud Functions (would need backend implementation)
      if (tokens.length > 0) {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens,
            notification,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to send FCM notification:', error);
    }
  }

  // Sync event to calendar
  private async syncToCalendar(eventId: string, event: RecurringEvent): Promise<void> {
    try {
      switch (event.calendarSync.calendarType) {
        case 'google':
          await this.syncToGoogleCalendar(event);
          break;
        case 'ical':
          await this.syncToICalendar(event);
          break;
        case 'outlook':
          await this.syncToOutlookCalendar(event);
          break;
      }
    } catch (error) {
      console.error('Failed to sync to calendar:', error);
    }
  }

  // Google Calendar sync
  private async syncToGoogleCalendar(event: RecurringEvent): Promise<void> {
    // Implementation would require Google Calendar API
    console.log('Syncing to Google Calendar:', event.title);
  }

  // iCalendar sync
  private async syncToICalendar(event: RecurringEvent): Promise<void> {
    // Generate iCal format
    const icalEvent = this.generateICalEvent(event);
    // Save to file or send via email
    console.log('Generated iCal event:', icalEvent);
  }

  // Outlook Calendar sync
  private async syncToOutlookCalendar(event: RecurringEvent): Promise<void> {
    // Implementation would require Microsoft Graph API
    console.log('Syncing to Outlook Calendar:', event.title);
  }

  // Generate iCal event
  private generateICalEvent(event: RecurringEvent): string {
    const startDate = event.nextOccurrence.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(event.nextOccurrence.getTime() + 2 * 60 * 60 * 1000)
      .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SportBeaconAI//RecurringEvent//EN
BEGIN:VEVENT
UID:${event.id}@sportbeacon.ai
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.venueId}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
  }

  // Start notification scheduler
  startNotificationScheduler(): void {
    // Check for notifications every minute
    this.notificationTimer = setInterval(() => {
      this.sendEventNotifications();
    }, 60 * 1000);
  }

  // Stop notification scheduler
  stopNotificationScheduler(): void {
    if (this.notificationTimer) {
      clearInterval(this.notificationTimer);
    }
  }

  // Listen to recurring events for a town
  listenToTownEvents(town: string, callback: (events: RecurringEvent[]) => void): () => void {
    const q = query(
      collection(db, 'recurringEvents'),
      where('town', '==', town),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RecurringEvent));
      callback(events);
    });

    this.eventListeners.set(town, unsubscribe);
    return unsubscribe;
  }

  // Cleanup all listeners
  cleanup(): void {
    this.stopNotificationScheduler();
    this.eventListeners.forEach(unsubscribe => unsubscribe());
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const recurringEventEngine = RecurringEventEngine.getInstance(); 