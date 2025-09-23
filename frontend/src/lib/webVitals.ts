import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from "web-vitals";

interface WebVitalsConfig {
  enabled: boolean;
  endpoint?: string;
  debug?: boolean;
}

class WebVitalsReporter {
  private config: WebVitalsConfig;
  private metrics: Metric[] = [];

  constructor(config: WebVitalsConfig) {
    this.config = config;
  }

  private sendMetric(metric: Metric) {
    if (!this.config.enabled) return;

    this.metrics.push(metric);

    if (this.config.debug) {
      console.log("Web Vital:", metric);
    }

    // Send to analytics endpoint if configured
    if (this.config.endpoint) {
      this.sendToEndpoint(metric);
    }

    // Send to console for development
    if (import.meta.env.DEV) {
      console.log(`[Web Vitals] ${metric.name}: ${metric.value}ms`);
    }
  }

  private async sendToEndpoint(metric: Metric) {
    try {
      await fetch(this.config.endpoint!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error("Failed to send Web Vitals metric:", error);
    }
  }

  public initialize() {
    if (!this.config.enabled) return;

    // Core Web Vitals
    onCLS(this.sendMetric.bind(this));
    onFID(this.sendMetric.bind(this));
    onLCP(this.sendMetric.bind(this));

    // Additional metrics
    onFCP(this.sendMetric.bind(this));
    onTTFB(this.sendMetric.bind(this));

    // Performance observer for custom metrics
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "measure") {
            this.sendMetric({
              name: entry.name,
              value: entry.duration,
              delta: entry.duration,
              id: `custom-${Date.now()}`,
              navigationType: "navigate",
            } as Metric);
          }
        }
      });

      observer.observe({ entryTypes: ["measure"] });
    }
  }

  public getMetrics(): Metric[] {
    return [...this.metrics];
  }

  public getReport(): {
    coreWebVitals: {
      CLS: number | null;
      FID: number | null;
      LCP: number | null;
    };
    additionalMetrics: {
      FCP: number | null;
      TTFB: number | null;
    };
    customMetrics: Metric[];
  } {
    const coreWebVitals = {
      CLS: this.metrics.find(m => m.name === "CLS")?.value || null,
      INP: this.metrics.find(m => m.name === "INP")?.value || null,
      LCP: this.metrics.find(m => m.name === "LCP")?.value || null,
    };

    const additionalMetrics = {
      FCP: this.metrics.find(m => m.name === "FCP")?.value || null,
      TTFB: this.metrics.find(m => m.name === "TTFB")?.value || null,
    };

    const customMetrics = this.metrics.filter(m => 
      !["CLS", "FID", "LCP", "FCP", "TTFB"].includes(m.name)
    );

    return {
      coreWebVitals,
      additionalMetrics,
      customMetrics,
    };
  }
}

// Initialize Web Vitals reporter
const webVitalsReporter = new WebVitalsReporter({
  enabled: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
  endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT,
  debug: import.meta.env.DEV,
});

export default webVitalsReporter;

// Export individual functions for manual measurement
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  performance.measure(name, { start, end });
};

export const measureAsyncPerformance = async (name: string, fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  performance.measure(name, { start, end });
  return result;
};
