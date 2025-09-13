import admin from 'firebase-admin';

export interface AgentMetrics {
  timestamp: Date;
  agentId: string;
  operation: string;
  duration: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  timestamp: Date;
  activeAgents: number;
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

class MetricsCollector {
  private firestore: FirebaseFirestore.Firestore;
  private metricsBuffer: AgentMetrics[] = [];
  private systemMetricsBuffer: SystemMetrics[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.firestore = admin.firestore();
    this.startFlushTimer();
  }

  /**
   * Record agent operation metrics
   */
  recordAgentMetric(metric: AgentMetrics): void {
    this.metricsBuffer.push(metric);
    
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      this.flushAgentMetrics();
    }
  }

  /**
   * Record system metrics
   */
  recordSystemMetric(metric: SystemMetrics): void {
    this.systemMetricsBuffer.push(metric);
    
    if (this.systemMetricsBuffer.length >= this.BATCH_SIZE) {
      this.flushSystemMetrics();
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(
    agentId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AgentMetrics[]> {
    let query = this.firestore
      .collection('agent_metrics')
      .orderBy('timestamp', 'desc')
      .limit(1000);

    if (agentId) {
      query = query.where('agentId', '==', agentId);
    }

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }

    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as AgentMetrics);
  }

  /**
   * Get system performance metrics
   */
  async getSystemMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<SystemMetrics[]> {
    let query = this.firestore
      .collection('system_metrics')
      .orderBy('timestamp', 'desc')
      .limit(1000);

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }

    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as SystemMetrics);
  }

  /**
   * Get agent performance summary
   */
  async getAgentPerformanceSummary(
    agentId: string,
    hours: number = 24
  ): Promise<{
    totalOperations: number;
    successRate: number;
    averageResponseTime: number;
    errorRate: number;
    topErrors: Array<{ errorCode: string; count: number }>;
  }> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const metrics = await this.getAgentMetrics(agentId, startDate);

    const totalOperations = metrics.length;
    const successfulOperations = metrics.filter(m => m.success).length;
    const successRate = totalOperations > 0 ? successfulOperations / totalOperations : 0;
    const averageResponseTime = totalOperations > 0 
      ? metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0;

    // Count errors
    const errorCounts: Record<string, number> = {};
    metrics.forEach(m => {
      if (!m.success && m.errorCode) {
        errorCounts[m.errorCode] = (errorCounts[m.errorCode] || 0) + 1;
      }
    });

    const topErrors = Object.entries(errorCounts)
      .map(([errorCode, count]) => ({ errorCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOperations,
      successRate,
      averageResponseTime,
      errorRate: 1 - successRate,
      topErrors,
    };
  }

  /**
   * Flush agent metrics to Firestore
   */
  private async flushAgentMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const batch = this.firestore.batch();
    const metricsToFlush = this.metricsBuffer.splice(0, this.BATCH_SIZE);

    metricsToFlush.forEach(metric => {
      const docRef = this.firestore.collection('agent_metrics').doc();
      batch.set(docRef, metric);
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('Failed to flush agent metrics:', error);
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Flush system metrics to Firestore
   */
  private async flushSystemMetrics(): Promise<void> {
    if (this.systemMetricsBuffer.length === 0) return;

    const batch = this.firestore.batch();
    const metricsToFlush = this.systemMetricsBuffer.splice(0, this.BATCH_SIZE);

    metricsToFlush.forEach(metric => {
      const docRef = this.firestore.collection('system_metrics').doc();
      batch.set(docRef, metric);
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('Failed to flush system metrics:', error);
      // Re-add metrics to buffer for retry
      this.systemMetricsBuffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushAgentMetrics();
      }
      if (this.systemMetricsBuffer.length > 0) {
        this.flushSystemMetrics();
      }
    }, this.FLUSH_INTERVAL);
  }
}

export const metricsCollector = new MetricsCollector();
