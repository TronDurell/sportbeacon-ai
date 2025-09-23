import admin from 'firebase-admin';
import { metricsCollector } from './metrics';
import { healthMonitor } from './health';

export interface DashboardData {
  systemHealth: any;
  agentMetrics: {
    verificationAgent: any;
    reportingAgent: any;
    mcpServer: any;
  };
  systemMetrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeAgents: number;
  };
  recentActivity: Array<{
    timestamp: Date;
    agentId: string;
    operation: string;
    status: 'success' | 'error';
    duration: number;
  }>;
  alerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

class ObservabilityDashboard {
  private firestore: FirebaseFirestore.Firestore;

  constructor() {
    this.firestore = admin.firestore();
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    const [systemHealth, agentMetrics, systemMetrics, recentActivity, alerts] = await Promise.all([
      this.getSystemHealth(),
      this.getAgentMetrics(),
      this.getSystemMetrics(),
      this.getRecentActivity(),
      this.getActiveAlerts(),
    ]);

    return {
      systemHealth,
      agentMetrics,
      systemMetrics,
      recentActivity,
      alerts,
    };
  }

  /**
   * Get system health status
   */
  private async getSystemHealth(): Promise<any> {
    return await healthMonitor.performHealthCheck();
  }

  /**
   * Get agent performance metrics
   */
  private async getAgentMetrics(): Promise<any> {
    const [verificationAgent, reportingAgent, mcpServer] = await Promise.all([
      metricsCollector.getAgentPerformanceSummary('verification-agent', 24),
      metricsCollector.getAgentPerformanceSummary('reporting-agent', 24),
      metricsCollector.getAgentPerformanceSummary('mcp-server', 24),
    ]);

    return {
      verificationAgent,
      reportingAgent,
      mcpServer,
    };
  }

  /**
   * Get system-wide metrics
   */
  private async getSystemMetrics(): Promise<any> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get recent metrics
    const recentMetrics = await metricsCollector.getAgentMetrics(undefined, oneHourAgo, now);
    
    const totalRequests = recentMetrics.length;
    const errorCount = recentMetrics.filter(m => !m.success).length;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
    const averageResponseTime = totalRequests > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;

    // Count active agents (agents that have performed operations in the last hour)
    const activeAgentIds = new Set(recentMetrics.map(m => m.agentId));
    const activeAgents = activeAgentIds.size;

    return {
      totalRequests,
      errorRate,
      averageResponseTime,
      activeAgents,
    };
  }

  /**
   * Get recent agent activity
   */
  private async getRecentActivity(): Promise<any[]> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentMetrics = await metricsCollector.getAgentMetrics(undefined, oneHourAgo, now);
    
    return recentMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50)
      .map(metric => ({
        timestamp: metric.timestamp,
        agentId: metric.agentId,
        operation: metric.operation,
        status: metric.success ? 'success' : 'error',
        duration: metric.duration,
      }));
  }

  /**
   * Get active alerts
   */
  private async getActiveAlerts(): Promise<any[]> {
    const alertsSnapshot = await this.firestore
      .collection('alerts')
      .where('resolved', '==', false)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    return alertsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Create alert for system issues
   */
  async createAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const alert = {
      severity,
      message,
      metadata,
      timestamp: new Date(),
      resolved: false,
    };

    await this.firestore.collection('alerts').add(alert);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    await this.firestore.collection('alerts').doc(alertId).update({
      resolved: true,
      resolvedAt: new Date(),
      resolution,
    });
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(hours: number = 24): Promise<{
    timestamps: Date[];
    successRates: number[];
    responseTimes: number[];
    errorRates: number[];
  }> {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    // Get metrics in hourly buckets
    const hourlyData: Array<{
      timestamp: Date;
      totalRequests: number;
      successfulRequests: number;
      totalResponseTime: number;
    }> = [];

    for (let i = 0; i < hours; i++) {
      const hourStart = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourMetrics = await metricsCollector.getAgentMetrics(
        undefined,
        hourStart,
        hourEnd
      );

      const totalRequests = hourMetrics.length;
      const successfulRequests = hourMetrics.filter(m => m.success).length;
      const totalResponseTime = hourMetrics.reduce((sum, m) => sum + m.duration, 0);

      hourlyData.push({
        timestamp: hourStart,
        totalRequests,
        successfulRequests,
        totalResponseTime,
      });
    }

    const timestamps = hourlyData.map(d => d.timestamp);
    const successRates = hourlyData.map(d => 
      d.totalRequests > 0 ? d.successfulRequests / d.totalRequests : 0
    );
    const responseTimes = hourlyData.map(d => 
      d.totalRequests > 0 ? d.totalResponseTime / d.totalRequests : 0
    );
    const errorRates = successRates.map(rate => 1 - rate);

    return {
      timestamps,
      successRates,
      responseTimes,
      errorRates,
    };
  }

  /**
   * Get agent utilization metrics
   */
  async getAgentUtilization(): Promise<{
    agentId: string;
    totalOperations: number;
    successRate: number;
    averageResponseTime: number;
    lastActivity: Date;
  }[]> {
    const agentIds = ['verification-agent', 'reporting-agent', 'mcp-server'];
    const utilization = [];

    for (const agentId of agentIds) {
      const summary = await metricsCollector.getAgentPerformanceSummary(agentId, 24);
      const recentMetrics = await metricsCollector.getAgentMetrics(agentId, new Date(Date.now() - 24 * 60 * 60 * 1000));
      
      const lastActivity = recentMetrics.length > 0 
        ? recentMetrics[0]?.timestamp || new Date(0)
        : new Date(0);

      utilization.push({
        agentId,
        totalOperations: summary.totalOperations,
        successRate: summary.successRate,
        averageResponseTime: summary.averageResponseTime,
        lastActivity,
      });
    }

    return utilization;
  }
}

export const observabilityDashboard = new ObservabilityDashboard();
