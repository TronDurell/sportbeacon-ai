import { getCLS, getINP, getFCP, getLCP, getTTFB, onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface VitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface VitalReport {
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: string;
  metrics: VitalMetric[];
}

class WebVitalsReporter {
  private static instance: WebVitalsReporter;
  private metrics: VitalMetric[] = [];
  private isEnabled: boolean = false;
  private endpoint: string = '/api/vitals';

  private constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' || 
                     process.env.ENABLE_VITALS === 'true' ||
                     localStorage.getItem('enableVitals') === 'true';
  }

  static getInstance(): WebVitalsReporter {
    if (!WebVitalsReporter.instance) {
      WebVitalsReporter.instance = new WebVitalsReporter();
    }
    return WebVitalsReporter.instance;
  }

  private logMetric(metric: VitalMetric): void {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value}ms (${metric.rating})`);
    this.metrics.push(metric);
  }

  private async reportMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const report: VitalReport = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType,
      metrics: [...this.metrics]
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (response.ok) {
        console.log('[Web Vitals] Metrics reported successfully');
        this.metrics = []; // Clear reported metrics
      } else {
        console.warn('[Web Vitals] Failed to report metrics:', response.status);
      }
    } catch (error) {
      console.warn('[Web Vitals] Error reporting metrics:', error);
    }
  }

  public initialize(): void {
    if (!this.isEnabled) {
      console.log('[Web Vitals] Reporting disabled');
      return;
    }

    console.log('[Web Vitals] Initializing performance monitoring');

    // Core Web Vitals
    onCLS((metric) => {
      this.logMetric(metric);
    });

    onINP((metric) => {
      this.logMetric(metric);
    });

    onLCP((metric) => {
      this.logMetric(metric);
    });

    // Additional metrics
    onFCP((metric) => {
      this.logMetric(metric);
    });

    onTTFB((metric) => {
      this.logMetric(metric);
    });

    // Report metrics every 30 seconds or on page unload
    setInterval(() => {
      this.reportMetrics();
    }, 30000);

    window.addEventListener('beforeunload', () => {
      this.reportMetrics();
    });

    // Report immediately if page is being unloaded
    if (document.visibilityState === 'hidden') {
      this.reportMetrics();
    }
  }

  public enable(): void {
    this.isEnabled = true;
    localStorage.setItem('enableVitals', 'true');
    this.initialize();
  }

  public disable(): void {
    this.isEnabled = false;
    localStorage.removeItem('enableVitals');
  }

  public getMetrics(): VitalMetric[] {
    return [...this.metrics];
  }
}

// Export singleton instance
export const webVitalsReporter = WebVitalsReporter.getInstance();

// Auto-initialize if enabled
if (typeof window !== 'undefined') {
  webVitalsReporter.initialize();
}

// Export individual metric functions for manual use
export {
  getCLS,
  getINP,
  getFCP,
  getLCP,
  getTTFB,
  onCLS,
  onINP,
  onFCP,
  onLCP,
  onTTFB
};

export type { VitalMetric, VitalReport };
