// Performance Optimization Utilities
export class PerformanceOptimizer {
    static instance;
    metrics = new Map();
    static getInstance() {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
        }
        return PerformanceOptimizer.instance;
    }
    /**
     * Measure performance of a function
     */
    measure(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        const duration = end - start;
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push(duration);
        // Log slow operations
        if (duration > 100) {
            console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
        }
        return result;
    }
    /**
     * Debounce a function
     */
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    /**
     * Throttle a function
     */
    throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }
    /**
     * Get performance statistics
     */
    getStats() {
        const stats = {};
        this.metrics.forEach((values, name) => {
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            stats[name] = { avg, min, max, count: values.length };
        });
        return stats;
    }
    /**
     * Clear performance metrics
     */
    clearMetrics() {
        this.metrics.clear();
    }
}
export const performanceOptimizer = PerformanceOptimizer.getInstance();
/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(componentName) {
    const measure = (name, fn) => {
        performanceOptimizer.measure(`${componentName}.${name}`, fn);
    };
    return { measure };
}
