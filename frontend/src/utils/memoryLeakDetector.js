// Memory Leak Detection and Prevention Utilities
export class MemoryLeakDetector {
    static instance;
    subscriptions = new Set();
    timers = new Set();
    intervals = new Set();
    static getInstance() {
        if (!MemoryLeakDetector.instance) {
            MemoryLeakDetector.instance = new MemoryLeakDetector();
        }
        return MemoryLeakDetector.instance;
    }
    trackSubscription(unsubscribe) {
        this.subscriptions.add(unsubscribe);
        return () => {
            unsubscribe();
            this.subscriptions.delete(unsubscribe);
        };
    }
    trackTimer(timer) {
        this.timers.add(timer);
        return timer;
    }
    trackInterval(interval) {
        this.intervals.add(interval);
        return interval;
    }
    cleanup() {
        this.subscriptions.forEach(unsubscribe => {
            try {
                unsubscribe();
            }
            catch (error) {
                console.warn('Error cleaning up subscription:', error);
            }
        });
        this.timers.forEach(timer => {
            try {
                clearTimeout(timer);
            }
            catch (error) {
                console.warn('Error cleaning up timer:', error);
            }
        });
        this.intervals.forEach(interval => {
            try {
                clearInterval(interval);
            }
            catch (error) {
                console.warn('Error cleaning up interval:', error);
            }
        });
        this.subscriptions.clear();
        this.timers.clear();
        this.intervals.clear();
    }
}
export const memoryLeakDetector = MemoryLeakDetector.getInstance();
