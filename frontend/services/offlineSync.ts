import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { apiService } from './api';

// Database schema for IndexedDB
interface SportBeaconDB extends DBSchema {
  arStats: {
    key: string;
    value: {
      id: string;
      userId: string;
      sport: string;
      stats: any;
      timestamp: number;
      synced: boolean;
    };
  };
  highlights: {
    key: string;
    value: {
      id: string;
      userId: string;
      title: string;
      description: string;
      videoUrl: string;
      thumbnailUrl: string;
      sport: string;
      stats: any;
      timestamp: number;
      synced: boolean;
      localPath?: string;
    };
  };
  rewards: {
    key: string;
    value: {
      id: string;
      userId: string;
      type: string;
      amount: number;
      description: string;
      timestamp: number;
      synced: boolean;
    };
  };
  userData: {
    key: string;
    value: {
      userId: string;
      profile: any;
      preferences: any;
      lastSync: number;
    };
  };
  drillLogs: {
    key: string;
    value: {
      id: string;
      userId: string;
      drillType: string;
      sport: string;
      performance: any;
      timestamp: number;
      synced: boolean;
    };
  };
  notifications: {
    key: string;
    value: {
      id: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      data: any;
      timestamp: number;
      read: boolean;
    };
  };
}

class OfflineSyncService {
  private db: IDBPDatabase<SportBeaconDB> | null = null;
  private syncQueue: Array<{ type: string; data: any; timestamp: number }> = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  constructor() {
    this.initializeDatabase();
    this.setupNetworkListeners();
    this.setupPeriodicSync();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      this.db = await openDB<SportBeaconDB>('SportBeaconDB', 1, {
        upgrade(db) {
          // AR Stats store
          if (!db.objectStoreNames.contains('arStats')) {
            const arStatsStore = db.createObjectStore('arStats', { keyPath: 'id' });
            arStatsStore.createIndex('userId', 'userId');
            arStatsStore.createIndex('timestamp', 'timestamp');
            arStatsStore.createIndex('synced', 'synced');
          }

          // Highlights store
          if (!db.objectStoreNames.contains('highlights')) {
            const highlightsStore = db.createObjectStore('highlights', { keyPath: 'id' });
            highlightsStore.createIndex('userId', 'userId');
            highlightsStore.createIndex('timestamp', 'timestamp');
            highlightsStore.createIndex('synced', 'synced');
          }

          // Rewards store
          if (!db.objectStoreNames.contains('rewards')) {
            const rewardsStore = db.createObjectStore('rewards', { keyPath: 'id' });
            rewardsStore.createIndex('userId', 'userId');
            rewardsStore.createIndex('timestamp', 'timestamp');
            rewardsStore.createIndex('synced', 'synced');
          }

          // User data store
          if (!db.objectStoreNames.contains('userData')) {
            const userDataStore = db.createObjectStore('userData', { keyPath: 'userId' });
            userDataStore.createIndex('lastSync', 'lastSync');
          }

          // Drill logs store
          if (!db.objectStoreNames.contains('drillLogs')) {
            const drillLogsStore = db.createObjectStore('drillLogs', { keyPath: 'id' });
            drillLogsStore.createIndex('userId', 'userId');
            drillLogsStore.createIndex('timestamp', 'timestamp');
            drillLogsStore.createIndex('synced', 'synced');
          }

          // Notifications store
          if (!db.objectStoreNames.contains('notifications')) {
            const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id' });
            notificationsStore.createIndex('userId', 'userId');
            notificationsStore.createIndex('timestamp', 'timestamp');
            notificationsStore.createIndex('read', 'read');
          }
        },
      });

      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private setupPeriodicSync(): void {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingData();
      }
    }, 5 * 60 * 1000);
  }

  // AR Stats Management
  async cacheARStats(userId: string, sport: string, stats: any): Promise<void> {
    if (!this.db) return;

    try {
      const arStatsData = {
        id: `${userId}_${sport}_${Date.now()}`,
        userId,
        sport,
        stats,
        timestamp: Date.now(),
        synced: this.isOnline
      };

      await this.db.add('arStats', arStatsData);

      // Try to sync immediately if online
      if (this.isOnline) {
        await this.syncARStats(arStatsData);
      }

      // Update Home Screen Widget
      await this.updateHomeScreenWidget('arStats', arStatsData);
    } catch (error) {
      console.error('Error caching AR stats:', error);
    }
  }

  async getCachedARStats(userId: string, sport?: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      let stats: any[] = [];
      
      if (sport) {
        const tx = this.db.transaction('arStats', 'readonly');
        const store = tx.objectStore('arStats');
        const index = store.index('userId');
        const userStats = await index.getAll(userId);
        stats = userStats.filter(stat => stat.sport === sport);
      } else {
        const tx = this.db.transaction('arStats', 'readonly');
        const store = tx.objectStore('arStats');
        const index = store.index('userId');
        stats = await index.getAll(userId);
      }

      return stats.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting cached AR stats:', error);
      return [];
    }
  }

  // Highlights Management
  async cacheHighlight(userId: string, highlight: any): Promise<void> {
    if (!this.db) return;

    try {
      const highlightData = {
        id: highlight.id || `highlight_${Date.now()}`,
        userId,
        title: highlight.title,
        description: highlight.description,
        videoUrl: highlight.videoUrl,
        thumbnailUrl: highlight.thumbnailUrl,
        sport: highlight.sport,
        stats: highlight.stats,
        timestamp: Date.now(),
        synced: this.isOnline,
        localPath: highlight.localPath
      };

      await this.db.add('highlights', highlightData);

      // Try to sync immediately if online
      if (this.isOnline) {
        await this.syncHighlight(highlightData);
      }

      // Update Home Screen Widget
      await this.updateHomeScreenWidget('highlights', highlightData);
    } catch (error) {
      console.error('Error caching highlight:', error);
    }
  }

  async getCachedHighlights(userId: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction('highlights', 'readonly');
      const store = tx.objectStore('highlights');
      const index = store.index('userId');
      const highlights = await index.getAll(userId);
      
      return highlights.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting cached highlights:', error);
      return [];
    }
  }

  // Rewards Management
  async cacheReward(userId: string, reward: any): Promise<void> {
    if (!this.db) return;

    try {
      const rewardData = {
        id: reward.id || `reward_${Date.now()}`,
        userId,
        type: reward.type,
        amount: reward.amount,
        description: reward.description,
        timestamp: Date.now(),
        synced: this.isOnline
      };

      await this.db.add('rewards', rewardData);

      // Try to sync immediately if online
      if (this.isOnline) {
        await this.syncReward(rewardData);
      }

      // Update Home Screen Widget
      await this.updateHomeScreenWidget('rewards', rewardData);
    } catch (error) {
      console.error('Error caching reward:', error);
    }
  }

  async getCachedRewards(userId: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction('rewards', 'readonly');
      const store = tx.objectStore('rewards');
      const index = store.index('userId');
      const rewards = await index.getAll(userId);
      
      return rewards.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting cached rewards:', error);
      return [];
    }
  }

  // Drill Logs Management
  async cacheDrillLog(userId: string, drillLog: any): Promise<void> {
    if (!this.db) return;

    try {
      const drillLogData = {
        id: drillLog.id || `drill_${Date.now()}`,
        userId,
        drillType: drillLog.drillType,
        sport: drillLog.sport,
        performance: drillLog.performance,
        timestamp: Date.now(),
        synced: this.isOnline
      };

      await this.db.add('drillLogs', drillLogData);

      // Try to sync immediately if online
      if (this.isOnline) {
        await this.syncDrillLog(drillLogData);
      }

      // Update Home Screen Widget
      await this.updateHomeScreenWidget('drillLogs', drillLogData);
    } catch (error) {
      console.error('Error caching drill log:', error);
    }
  }

  async getCachedDrillLogs(userId: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction('drillLogs', 'readonly');
      const store = tx.objectStore('drillLogs');
      const index = store.index('userId');
      const drillLogs = await index.getAll(userId);
      
      return drillLogs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting cached drill logs:', error);
      return [];
    }
  }

  // User Data Management
  async cacheUserData(userId: string, profile: any, preferences: any): Promise<void> {
    if (!this.db) return;

    try {
      const userData = {
        userId,
        profile,
        preferences,
        lastSync: Date.now()
      };

      await this.db.put('userData', userData);
    } catch (error) {
      console.error('Error caching user data:', error);
    }
  }

  async getCachedUserData(userId: string): Promise<any | null> {
    if (!this.db) return null;

    try {
      return await this.db.get('userData', userId);
    } catch (error) {
      console.error('Error getting cached user data:', error);
      return null;
    }
  }

  // Notifications Management
  async cacheNotification(userId: string, notification: any): Promise<void> {
    if (!this.db) return;

    try {
      const notificationData = {
        id: notification.id || `notification_${Date.now()}`,
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: Date.now(),
        read: false
      };

      await this.db.add('notifications', notificationData);

      // Update Home Screen Widget
      await this.updateHomeScreenWidget('notifications', notificationData);
    } catch (error) {
      console.error('Error caching notification:', error);
    }
  }

  async getCachedNotifications(userId: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction('notifications', 'readonly');
      const store = tx.objectStore('notifications');
      const index = store.index('userId');
      const notifications = await index.getAll(userId);
      
      return notifications.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting cached notifications:', error);
      return [];
    }
  }

  // Sync Methods
  private async syncPendingData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;

    try {
      await this.syncARStats();
      await this.syncHighlights();
      await this.syncRewards();
      await this.syncDrillLogs();
      await this.syncUserData();
    } catch (error) {
      console.error('Error syncing pending data:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncARStats(specificStats?: any): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('arStats', 'readwrite');
      const store = tx.objectStore('arStats');
      const index = store.index('synced');

      const unsyncedStats = specificStats ? [specificStats] : await index.getAll(false);

      for (const stats of unsyncedStats) {
        try {
          await apiService.post('/api/ar-stats', stats.stats);
          await store.put({ ...stats, synced: true });
        } catch (error) {
          console.error('Error syncing AR stats:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing AR stats:', error);
    }
  }

  private async syncHighlight(specificHighlight?: any): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('highlights', 'readwrite');
      const store = tx.objectStore('highlights');
      const index = store.index('synced');

      const unsyncedHighlights = specificHighlight ? [specificHighlight] : await index.getAll(false);

      for (const highlight of unsyncedHighlights) {
        try {
          await apiService.post('/api/highlights', highlight);
          await store.put({ ...highlight, synced: true });
        } catch (error) {
          console.error('Error syncing highlight:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing highlights:', error);
    }
  }

  private async syncReward(specificReward?: any): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('rewards', 'readwrite');
      const store = tx.objectStore('rewards');
      const index = store.index('synced');

      const unsyncedRewards = specificReward ? [specificReward] : await index.getAll(false);

      for (const reward of unsyncedRewards) {
        try {
          await apiService.post('/api/rewards', reward);
          await store.put({ ...reward, synced: true });
        } catch (error) {
          console.error('Error syncing reward:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing rewards:', error);
    }
  }

  private async syncDrillLog(specificDrillLog?: any): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('drillLogs', 'readwrite');
      const store = tx.objectStore('drillLogs');
      const index = store.index('synced');

      const unsyncedDrillLogs = specificDrillLog ? [specificDrillLog] : await index.getAll(false);

      for (const drillLog of unsyncedDrillLogs) {
        try {
          await apiService.post('/api/drill-logs', drillLog);
          await store.put({ ...drillLog, synced: true });
        } catch (error) {
          console.error('Error syncing drill log:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing drill logs:', error);
    }
  }

  private async syncUserData(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('userData', 'readonly');
      const store = tx.objectStore('userData');
      const userData = await store.getAll();

      for (const data of userData) {
        try {
          await apiService.put(`/api/users/${data.userId}`, data);
          await store.put({ ...data, lastSync: Date.now() });
        } catch (error) {
          console.error('Error syncing user data:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }

  // Home Screen Widget Support
  private async updateHomeScreenWidget(type: string, data: any): Promise<void> {
    try {
      // Check if Home Screen Widgets are supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // Update widget data
        await registration.sync.register(`update-widget-${type}`);
        
        // Store widget data
        const widgetData = {
          type,
          data,
          timestamp: Date.now()
        };
        
        localStorage.setItem(`widget_${type}`, JSON.stringify(widgetData));
      }
    } catch (error) {
      console.error('Error updating Home Screen Widget:', error);
    }
  }

  // Utility Methods
  async clearCache(userId?: string): Promise<void> {
    if (!this.db) return;

    try {
      if (userId) {
        // Clear specific user data
        const stores = ['arStats', 'highlights', 'rewards', 'drillLogs', 'notifications'];
        
        for (const storeName of stores) {
          const tx = this.db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const index = store.index('userId');
          const userData = await index.getAll(userId);
          
          for (const item of userData) {
            await store.delete(item.id);
          }
        }
      } else {
        // Clear all data
        const stores = ['arStats', 'highlights', 'rewards', 'userData', 'drillLogs', 'notifications'];
        
        for (const storeName of stores) {
          const tx = this.db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          await store.clear();
        }
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheSize(): Promise<{ [key: string]: number }> {
    if (!this.db) return {};

    try {
      const sizes: { [key: string]: number } = {};
      const stores = ['arStats', 'highlights', 'rewards', 'userData', 'drillLogs', 'notifications'];
      
      for (const storeName of stores) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const count = await store.count();
        sizes[storeName] = count;
      }
      
      return sizes;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return {};
    }
  }

  async isOnline(): Promise<boolean> {
    return this.isOnline;
  }

  async forceSync(): Promise<void> {
    await this.syncPendingData();
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();

// Export types for use in other modules
export type { SportBeaconDB }; 