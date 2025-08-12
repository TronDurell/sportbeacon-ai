import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Timestamp } from 'firebase/firestore';

// Performance Types
export interface PerformanceMetric {
  id: string;
  metricType: 'operation' | 'query' | 'listener' | 'network' | 'memory' | 'error';
  metricName: string;
  userId?: string;
  value: number;
  unit: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
  tags?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceSnapshot {
  id: string;
  timestamp: Timestamp;
  metrics: PerformanceMetric[];
  summary: {
    totalOperations: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    networkRequests: number;
    activeListeners: number;
  };
  alerts: PerformanceAlert[];
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold_exceeded' | 'error_rate_high' | 'memory_leak' | 'slow_operation' | 'network_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metricName: string;
  currentValue: number;
  threshold: number;
  timestamp: Timestamp;
  resolved: boolean;
  resolvedAt?: Timestamp;
}

export interface PerformanceConfig {
  enableRealTimeMonitoring: boolean;
  enableMemoryTracking: boolean;
  enableNetworkTracking: boolean;
  enableErrorTracking: boolean;
  samplingRate: number; // 0-1, percentage of operations to track
  alertThresholds: {
    responseTime: number; // milliseconds
    errorRate: number; // percentage
    memoryUsage: number; // MB
    networkLatency: number; // milliseconds
  };
  retentionPeriod: number; // days
  maxMetricsPerSnapshot: number;
}

export interface PerformanceOptimization {
  id: string;
  type: 'query_optimization' | 'caching' | 'batching' | 'indexing' | 'memory_cleanup';
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation: string;
  estimatedImprovement: number; // percentage
  timestamp: Timestamp;
  applied: boolean;
  appliedAt?: Timestamp;
}

// Performance Monitor Service
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private listeners: Map<string, () => void> = new Map();
  private config: PerformanceConfig;
  private alertThresholds: Map<string, number> = new Map();
  private optimizationQueue: PerformanceOptimization[] = [];
  private memoryUsage: number = 0;
  private networkRequests: number = 0;
  private activeListeners: number = 0;
  private errorCount: number = 0;
  private totalOperations: number = 0;

  private constructor() {
    this.config = {
      enableRealTimeMonitoring: true,
      enableMemoryTracking: true,
      enableNetworkTracking: true,
      enableErrorTracking: true,
      samplingRate: 0.1, // Track 10% of operations
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.05, // 5%
        memoryUsage: 100, // 100 MB
        networkLatency: 2000 // 2 seconds
      },
      retentionPeriod: 30, // 30 days
      maxMetricsPerSnapshot: 1000
    };

    this.initializeAlertThresholds();
    this.startPeriodicMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize Alert Thresholds
  private initializeAlertThresholds(): void {
    this.alertThresholds.set('response_time', this.config.alertThresholds.responseTime);
    this.alertThresholds.set('error_rate', this.config.alertThresholds.errorRate);
    this.alertThresholds.set('memory_usage', this.config.alertThresholds.memoryUsage);
    this.alertThresholds.set('network_latency', this.config.alertThresholds.networkLatency);
  }

  // Start Periodic Monitoring
  private startPeriodicMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Monitor memory usage
      if (this.config.enableMemoryTracking) {
        setInterval(() => {
          this.trackMemoryUsage();
        }, 30000); // Every 30 seconds
      }

      // Monitor network performance
      if (this.config.enableNetworkTracking) {
        this.monitorNetworkPerformance();
      }

      // Create performance snapshots
      setInterval(() => {
        this.createPerformanceSnapshot();
      }, 60000); // Every minute
    }
  }

  // Track Operation Performance
  async trackOperation(
    operationName: string,
    startTime: number,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Apply sampling
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metricType: 'operation',
      metricName: operationName,
      userId,
      value: duration,
      unit: 'milliseconds',
      timestamp: serverTimestamp() as Timestamp,
      metadata,
      tags: ['operation', 'performance'],
      severity: this.getSeverity(duration, 'response_time')
    };

    this.metrics.set(metric.id, metric);
    this.totalOperations++;

    // Check for alerts
    await this.checkAlertThresholds(metric);

    // Save to Firestore
    await this.saveMetric(metric);
  }

  // Track Query Performance
  async trackQuery(
    queryName: string,
    startTime: number,
    resultCount: number,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metricType: 'query',
      metricName: queryName,
      userId,
      value: duration,
      unit: 'milliseconds',
      timestamp: serverTimestamp() as Timestamp,
      metadata: { ...metadata, resultCount },
      tags: ['query', 'database'],
      severity: this.getSeverity(duration, 'response_time')
    };

    this.metrics.set(metric.id, metric);

    // Check for alerts
    await this.checkAlertThresholds(metric);

    // Save to Firestore
    await this.saveMetric(metric);
  }

  // Track Listener Performance
  async trackListener(
    listenerName: string,
    startTime: number,
    eventCount: number,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metricType: 'listener',
      metricName: listenerName,
      userId,
      value: duration,
      unit: 'milliseconds',
      timestamp: serverTimestamp() as Timestamp,
      metadata: { ...metadata, eventCount },
      tags: ['listener', 'realtime'],
      severity: this.getSeverity(duration, 'response_time')
    };

    this.metrics.set(metric.id, metric);
    this.activeListeners++;

    // Check for alerts
    await this.checkAlertThresholds(metric);

    // Save to Firestore
    await this.saveMetric(metric);
  }

  // Track Network Performance
  async trackNetworkRequest(
    url: string,
    method: string,
    startTime: number,
    statusCode: number,
    responseSize: number,
    userId?: string
  ): Promise<void> {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metricType: 'network',
      metricName: `${method} ${url}`,
      userId,
      value: duration,
      unit: 'milliseconds',
      timestamp: serverTimestamp() as Timestamp,
      metadata: { url, method, statusCode, responseSize },
      tags: ['network', 'api'],
      severity: this.getSeverity(duration, 'network_latency')
    };

    this.metrics.set(metric.id, metric);
    this.networkRequests++;

    // Check for alerts
    await this.checkAlertThresholds(metric);

    // Save to Firestore
    await this.saveMetric(metric);
  }

  // Track Memory Usage
  private trackMemoryUsage(): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB

      const metric: PerformanceMetric = {
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metricType: 'memory',
        metricName: 'memory_usage',
        value: this.memoryUsage,
        unit: 'MB',
        timestamp: serverTimestamp() as Timestamp,
        metadata: {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        },
        tags: ['memory', 'system'],
        severity: this.getSeverity(this.memoryUsage, 'memory_usage')
      };

      this.metrics.set(metric.id, metric);

      // Check for alerts
      this.checkAlertThresholds(metric);
    }
  }

  // Track Error
  async trackError(
    errorType: string,
    errorMessage: string,
    stackTrace?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    this.errorCount++;

    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metricType: 'error',
      metricName: errorType,
      userId,
      value: 1,
      unit: 'count',
      timestamp: serverTimestamp() as Timestamp,
      metadata: { ...metadata, errorMessage, stackTrace },
      tags: ['error', 'system'],
      severity: 'high'
    };

    this.metrics.set(metric.id, metric);

    // Check error rate
    const errorRate = this.errorCount / this.totalOperations;
    if (errorRate > this.config.alertThresholds.errorRate) {
      await this.createAlert('error_rate_high', 'High error rate detected', errorRate, this.config.alertThresholds.errorRate);
    }

    // Save to Firestore
    await this.saveMetric(metric);
  }

  // Monitor Network Performance
  private monitorNetworkPerformance(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      connection.addEventListener('change', () => {
        const metric: PerformanceMetric = {
          id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metricType: 'network',
          metricName: 'network_connection',
          value: connection.downlink || 0,
          unit: 'Mbps',
          timestamp: serverTimestamp() as Timestamp,
          metadata: {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          },
          tags: ['network', 'connection'],
          severity: 'medium'
        };

        this.metrics.set(metric.id, metric);
        this.saveMetric(metric);
      });
    }
  }

  // Get Severity Level
  private getSeverity(value: number, thresholdType: string): 'low' | 'medium' | 'high' | 'critical' {
    const threshold = this.alertThresholds.get(thresholdType) || 0;
    
    if (value <= threshold * 0.5) return 'low';
    if (value <= threshold * 0.8) return 'medium';
    if (value <= threshold) return 'high';
    return 'critical';
  }

  // Check Alert Thresholds
  private async checkAlertThresholds(metric: PerformanceMetric): Promise<void> {
    const threshold = this.alertThresholds.get(metric.metricName) || this.alertThresholds.get('response_time') || 0;
    
    if (metric.value > threshold) {
      await this.createAlert(
        'threshold_exceeded',
        `${metric.metricName} exceeded threshold`,
        metric.value,
        threshold
      );
    }
  }

  // Create Alert
  private async createAlert(
    type: PerformanceAlert['type'],
    message: string,
    currentValue: number,
    threshold: number
  ): Promise<void> {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: this.getSeverity(currentValue, 'response_time'),
      message,
      metricName: 'performance_threshold',
      currentValue,
      threshold,
      timestamp: serverTimestamp() as Timestamp,
      resolved: false
    };

    // Save alert to Firestore
    const alertRef = doc(collection(db, 'performanceAlerts'), alert.id);
    await setDoc(alertRef, alert);

    // Log alert
    console.warn(`Performance Alert: ${message} (${currentValue} > ${threshold})`);
  }

  // Create Performance Snapshot
  private async createPerformanceSnapshot(): Promise<void> {
    const snapshot: PerformanceSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: serverTimestamp() as Timestamp,
      metrics: Array.from(this.metrics.values()).slice(-this.config.maxMetricsPerSnapshot),
      summary: {
        totalOperations: this.totalOperations,
        averageResponseTime: this.calculateAverageResponseTime(),
        errorRate: this.calculateErrorRate(),
        memoryUsage: this.memoryUsage,
        networkRequests: this.networkRequests,
        activeListeners: this.activeListeners
      },
      alerts: []
    };

    // Save snapshot to Firestore
    const snapshotRef = doc(collection(db, 'performanceSnapshots'), snapshot.id);
    await setDoc(snapshotRef, snapshot);

    // Clear old metrics
    this.metrics.clear();
  }

  // Calculate Average Response Time
  private calculateAverageResponseTime(): number {
    const responseTimeMetrics = Array.from(this.metrics.values())
      .filter(m => m.metricType === 'operation' && m.unit === 'milliseconds');
    
    if (responseTimeMetrics.length === 0) return 0;
    
    const totalTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0);
    return totalTime / responseTimeMetrics.length;
  }

  // Calculate Error Rate
  private calculateErrorRate(): number {
    if (this.totalOperations === 0) return 0;
    return this.errorCount / this.totalOperations;
  }

  // Save Metric to Firestore
  private async saveMetric(metric: PerformanceMetric): Promise<void> {
    const metricRef = doc(collection(db, 'performanceMetrics'), metric.id);
    await setDoc(metricRef, metric);
  }

  // Get Performance Metrics
  async getPerformanceMetrics(
    userId?: string,
    startDate?: Timestamp,
    endDate?: Timestamp,
    metricType?: PerformanceMetric['metricType']
  ): Promise<PerformanceMetric[]> {
    let q = query(collection(db, 'performanceMetrics'));

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (startDate) {
      q = query(q, where('timestamp', '>=', startDate));
    }

    if (endDate) {
      q = query(q, where('timestamp', '<=', endDate));
    }

    if (metricType) {
      q = query(q, where('metricType', '==', metricType));
    }

    q = query(q, orderBy('timestamp', 'desc'), limit(100));

    const querySnapshot = await getDocs(q);
    const metrics: PerformanceMetric[] = [];

    querySnapshot.forEach((doc) => {
      metrics.push({ id: doc.id, ...doc.data() } as PerformanceMetric);
    });

    return metrics;
  }

  // Get Performance Analytics
  async getPerformanceAnalytics(
    userId?: string,
    startDate?: Timestamp,
    endDate?: Timestamp
  ): Promise<{
    totalOperations: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    networkRequests: number;
    activeListeners: number;
    metricsByType: Record<PerformanceMetric['metricType'], number>;
    topSlowOperations: Array<{ name: string; averageTime: number }>;
    errorBreakdown: Record<string, number>;
  }> {
    const metrics = await this.getPerformanceMetrics(userId, startDate, endDate);

    const totalOperations = metrics.filter(m => m.metricType === 'operation').length;
    const errorCount = metrics.filter(m => m.metricType === 'error').length;
    const errorRate = totalOperations > 0 ? errorCount / totalOperations : 0;

    const responseTimeMetrics = metrics.filter(m => m.metricType === 'operation' && m.unit === 'milliseconds');
    const averageResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length 
      : 0;

    const metricsByType: Record<PerformanceMetric['metricType'], number> = {
      operation: 0,
      query: 0,
      listener: 0,
      network: 0,
      memory: 0,
      error: 0
    };

    metrics.forEach(m => {
      metricsByType[m.metricType]++;
    });

    // Calculate top slow operations
    const operationMetrics = metrics.filter(m => m.metricType === 'operation');
    const operationTimes: Record<string, number[]> = {};
    
    operationMetrics.forEach(m => {
      if (!operationTimes[m.metricName]) {
        operationTimes[m.metricName] = [];
      }
      operationTimes[m.metricName].push(m.value);
    });

    const topSlowOperations = Object.entries(operationTimes)
      .map(([name, times]) => ({
        name,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Calculate error breakdown
    const errorBreakdown: Record<string, number> = {};
    metrics.filter(m => m.metricType === 'error').forEach(m => {
      errorBreakdown[m.metricName] = (errorBreakdown[m.metricName] || 0) + 1;
    });

    return {
      totalOperations,
      averageResponseTime,
      errorRate,
      memoryUsage: this.memoryUsage,
      networkRequests: this.networkRequests,
      activeListeners: this.activeListeners,
      metricsByType,
      topSlowOperations,
      errorBreakdown
    };
  }

  // Get Performance Optimizations
  async getPerformanceOptimizations(): Promise<PerformanceOptimization[]> {
    const q = query(
      collection(db, 'performanceOptimizations'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const optimizations: PerformanceOptimization[] = [];

    querySnapshot.forEach((doc) => {
      optimizations.push({ id: doc.id, ...doc.data() } as PerformanceOptimization);
    });

    return optimizations;
  }

  // Add Performance Optimization
  async addPerformanceOptimization(optimization: Omit<PerformanceOptimization, 'id' | 'timestamp'>): Promise<string> {
    const optimizationId = `optimization_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newOptimization: PerformanceOptimization = {
      id: optimizationId,
      ...optimization,
      timestamp: serverTimestamp() as Timestamp
    };

    const optimizationRef = doc(collection(db, 'performanceOptimizations'), optimizationId);
    await setDoc(optimizationRef, newOptimization);

    this.optimizationQueue.push(newOptimization);
    return optimizationId;
  }

  // Apply Performance Optimization
  async applyPerformanceOptimization(optimizationId: string): Promise<void> {
    const optimizationRef = doc(collection(db, 'performanceOptimizations'), optimizationId);
    
    await updateDoc(optimizationRef, {
      applied: true,
      appliedAt: serverTimestamp()
    });

    // Remove from queue
    this.optimizationQueue = this.optimizationQueue.filter(o => o.id !== optimizationId);
  }

  // Real-time Performance Metrics Listener
  subscribeToPerformanceMetrics(
    callback: (metrics: PerformanceMetric[]) => void,
    userId?: string,
    metricType?: PerformanceMetric['metricType']
  ): () => void {
    let q = query(collection(db, 'performanceMetrics'));

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (metricType) {
      q = query(q, where('metricType', '==', metricType));
    }

    q = query(q, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const metrics: PerformanceMetric[] = [];
      
      querySnapshot.forEach((doc) => {
        metrics.push({ id: doc.id, ...doc.data() } as PerformanceMetric);
      });

      callback(metrics);
    }, (error) => {
      console.error('Error listening to performance metrics:', error);
      callback([]);
    });

    const listenerId = `metrics_${userId || 'all'}_${metricType || 'all'}`;
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Real-time Performance Analytics Listener
  subscribeToPerformanceAnalytics(
    callback: (analytics: any) => void,
    userId?: string,
    startDate?: Timestamp,
    endDate?: Timestamp
  ): () => void {
    let q = query(collection(db, 'performanceMetrics'));

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (startDate) {
      q = query(q, where('timestamp', '>=', startDate));
    }

    if (endDate) {
      q = query(q, where('timestamp', '<=', endDate));
    }

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const metrics = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PerformanceMetric);
      const analytics = await this.calculateAnalytics(metrics);
      callback(analytics);
    }, (error) => {
      console.error('Error listening to performance analytics:', error);
      callback({
        totalOperations: 0,
        averageResponseTime: 0,
        errorRate: 0,
        memoryUsage: 0,
        networkRequests: 0,
        activeListeners: 0,
        metricsByType: {},
        topSlowOperations: [],
        errorBreakdown: {}
      });
    });

    const listenerId = 'analytics';
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Calculate Analytics Helper
  private async calculateAnalytics(metrics: PerformanceMetric[]): Promise<any> {
    const totalOperations = metrics.filter(m => m.metricType === 'operation').length;
    const errorCount = metrics.filter(m => m.metricType === 'error').length;
    const errorRate = totalOperations > 0 ? errorCount / totalOperations : 0;

    const responseTimeMetrics = metrics.filter(m => m.metricType === 'operation' && m.unit === 'milliseconds');
    const averageResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length 
      : 0;

    const metricsByType: Record<PerformanceMetric['metricType'], number> = {
      operation: 0,
      query: 0,
      listener: 0,
      network: 0,
      memory: 0,
      error: 0
    };

    metrics.forEach(m => {
      metricsByType[m.metricType]++;
    });

    const operationMetrics = metrics.filter(m => m.metricType === 'operation');
    const operationTimes: Record<string, number[]> = {};
    
    operationMetrics.forEach(m => {
      if (!operationTimes[m.metricName]) {
        operationTimes[m.metricName] = [];
      }
      operationTimes[m.metricName].push(m.value);
    });

    const topSlowOperations = Object.entries(operationTimes)
      .map(([name, times]) => ({
        name,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    const errorBreakdown: Record<string, number> = {};
    metrics.filter(m => m.metricType === 'error').forEach(m => {
      errorBreakdown[m.metricName] = (errorBreakdown[m.metricName] || 0) + 1;
    });

    return {
      totalOperations,
      averageResponseTime,
      errorRate,
      memoryUsage: this.memoryUsage,
      networkRequests: this.networkRequests,
      activeListeners: this.activeListeners,
      metricsByType,
      topSlowOperations,
      errorBreakdown
    };
  }

  // Update Configuration
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeAlertThresholds();
  }

  // Get Current Performance Stats
  getCurrentStats(): {
    memoryUsage: number;
    networkRequests: number;
    activeListeners: number;
    errorCount: number;
    totalOperations: number;
  } {
    return {
      memoryUsage: this.memoryUsage,
      networkRequests: this.networkRequests,
      activeListeners: this.activeListeners,
      errorCount: this.errorCount,
      totalOperations: this.totalOperations
    };
  }

  // Cleanup Listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.metrics.clear();
  }

  // Get Listener Count (for debugging)
  getListenerCount(): number {
    return this.listeners.size;
  }
}

export default PerformanceMonitor; 