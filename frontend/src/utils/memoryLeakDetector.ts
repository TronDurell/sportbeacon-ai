// Memory Leak Detection and Prevention Utilities

export class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private subscriptions: Set<() => void> = new Set();
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  trackSubscription(unsubscribe: () => void): () => void {
    this.subscriptions.add(unsubscribe);
    return () => {
      unsubscribe();
      this.subscriptions.delete(unsubscribe);
    };
  }

  trackTimer(timer: NodeJS.Timeout): NodeJS.Timeout {
    this.timers.add(timer);
    return timer;
  }

  trackInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    this.intervals.add(interval);
    return interval;
  }

  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error cleaning up subscription:', error);
      }
    });

    this.timers.forEach(timer => {
      try {
        clearTimeout(timer);
      } catch (error) {
        console.warn('Error cleaning up timer:', error);
      }
    });

    this.intervals.forEach(interval => {
      try {
        clearInterval(interval);
      } catch (error) {
        console.warn('Error cleaning up interval:', error);
      }
    });

    this.subscriptions.clear();
    this.timers.clear();
    this.intervals.clear();
  }
}

export const memoryLeakDetector = MemoryLeakDetector.getInstance();