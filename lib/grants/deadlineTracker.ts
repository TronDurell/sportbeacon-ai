import { DeadlineAlert, GrantOpportunity } from './types';
import { analytics } from '../ai/shared/analytics';

export class DeadlineTracker {
  private subscriptions: Map<string, string[]> = new Map(); // grantId -> userIds
  private alerts: Map<string, DeadlineAlert[]> = new Map(); // userId -> alerts

  async getUpcomingDeadlines(): Promise<DeadlineAlert[]> {
    try {
      const allAlerts: DeadlineAlert[] = [];
      
      for (const [userId, userAlerts] of this.alerts) {
        allAlerts.push(...userAlerts);
      }

      const upcoming = allAlerts
        .filter(alert => alert.daysRemaining > 0)
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

      await analytics.track('deadlines_accessed', {
        totalDeadlines: upcoming.length,
        timestamp: new Date().toISOString()
      });

      return upcoming;
    } catch (error) {
      await analytics.track('deadlines_access_failed', {
        error: error.message
      });
      throw error;
    }
  }

  async subscribe(grantId: string, userId: string): Promise<void> {
    try {
      if (!this.subscriptions.has(grantId)) {
        this.subscriptions.set(grantId, []);
      }

      const subscribers = this.subscriptions.get(grantId)!;
      if (!subscribers.includes(userId)) {
        subscribers.push(userId);
      }

      // Create initial alert
      await this.createAlert(grantId, userId);

      await analytics.track('grant_subscription_created', {
        grantId,
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await analytics.track('grant_subscription_failed', {
        grantId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async unsubscribe(grantId: string, userId: string): Promise<void> {
    try {
      const subscribers = this.subscriptions.get(grantId);
      if (subscribers) {
        const index = subscribers.indexOf(userId);
        if (index > -1) {
          subscribers.splice(index, 1);
        }
      }

      // Remove alerts for this user and grant
      const userAlerts = this.alerts.get(userId) || [];
      const filteredAlerts = userAlerts.filter(alert => alert.grantId !== grantId);
      this.alerts.set(userId, filteredAlerts);

      await analytics.track('grant_subscription_removed', {
        grantId,
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await analytics.track('grant_unsubscription_failed', {
        grantId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async createAlert(grantId: string, userId: string): Promise<void> {
    // Mock grant data - in real implementation, this would come from the grant database
    const mockGrant = {
      id: grantId,
      title: `Grant ${grantId}`,
      deadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within 30 days
    };

    const daysRemaining = Math.ceil((mockGrant.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const priority: 'high' | 'medium' | 'low' = 
      daysRemaining <= 7 ? 'high' : 
      daysRemaining <= 14 ? 'medium' : 'low';

    const alert: DeadlineAlert = {
      grantId,
      grantTitle: mockGrant.title,
      deadline: mockGrant.deadline,
      daysRemaining,
      priority,
      userId
    };

    if (!this.alerts.has(userId)) {
      this.alerts.set(userId, []);
    }

    this.alerts.get(userId)!.push(alert);

    await analytics.track('deadline_alert_created', {
      grantId,
      userId,
      daysRemaining,
      priority,
      timestamp: new Date().toISOString()
    });
  }

  async getAlertsForUser(userId: string): Promise<DeadlineAlert[]> {
    const userAlerts = this.alerts.get(userId) || [];
    
    // Update days remaining
    const updatedAlerts = userAlerts.map(alert => ({
      ...alert,
      daysRemaining: Math.ceil((alert.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }));

    // Filter out expired alerts
    const activeAlerts = updatedAlerts.filter(alert => alert.daysRemaining > 0);
    this.alerts.set(userId, activeAlerts);

    return activeAlerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  async sendReminders(): Promise<void> {
    const now = new Date();
    const remindersSent: string[] = [];

    for (const [userId, alerts] of this.alerts) {
      for (const alert of alerts) {
        if (alert.daysRemaining <= 7 && alert.daysRemaining > 0) {
          // Send reminder
          await this.sendReminder(userId, alert);
          remindersSent.push(`${userId}-${alert.grantId}`);
        }
      }
    }

    await analytics.track('deadline_reminders_sent', {
      remindersCount: remindersSent.length,
      timestamp: new Date().toISOString()
    });
  }

  private async sendReminder(userId: string, alert: DeadlineAlert): Promise<void> {
    // In a real implementation, this would send email/SMS notifications
    console.log(`Sending reminder to user ${userId} for grant ${alert.grantId} - ${alert.daysRemaining} days remaining`);
    
    await analytics.track('deadline_reminder_sent', {
      userId,
      grantId: alert.grantId,
      daysRemaining: alert.daysRemaining,
      timestamp: new Date().toISOString()
    });
  }

  async getSubscriptionStats(): Promise<any> {
    const stats = {
      totalSubscriptions: 0,
      activeAlerts: 0,
      highPriorityAlerts: 0,
      usersWithAlerts: 0
    };

    for (const [grantId, subscribers] of this.subscriptions) {
      stats.totalSubscriptions += subscribers.length;
    }

    for (const [userId, alerts] of this.alerts) {
      stats.activeAlerts += alerts.length;
      stats.highPriorityAlerts += alerts.filter(a => a.priority === 'high').length;
      if (alerts.length > 0) {
        stats.usersWithAlerts++;
      }
    }

    return stats;
  }
} 