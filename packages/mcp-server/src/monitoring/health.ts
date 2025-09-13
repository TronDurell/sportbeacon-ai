import admin from 'firebase-admin';
import { metricsCollector } from './metrics';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheck[];
  timestamp: Date;
  uptime: number;
  version: string;
}

class HealthMonitor {
  private firestore: FirebaseFirestore.Firestore;
  private startTime: Date;
  private readonly version: string;

  constructor() {
    this.firestore = admin.firestore();
    this.startTime = new Date();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const checks: HealthCheck[] = [];
    
    // Check Firestore connectivity
    checks.push(await this.checkFirestore());
    
    // Check authentication service
    checks.push(await this.checkAuthentication());
    
    // Check MCP server performance
    checks.push(await this.checkMCPServer());
    
    // Check agent performance
    checks.push(await this.checkAgentPerformance());
    
    // Check memory usage
    checks.push(await this.checkMemoryUsage());
    
    // Check rate limiting
    checks.push(await this.checkRateLimiting());

    // Determine overall health
    const overall = this.determineOverallHealth(checks);
    
    return {
      overall,
      checks,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: this.version,
    };
  }

  /**
   * Check Firestore connectivity
   */
  private async checkFirestore(): Promise<HealthCheck> {
    try {
      const startTime = Date.now();
      await this.firestore.collection('health_check').doc('test').get();
      const responseTime = Date.now() - startTime;

      if (responseTime > 5000) {
        return {
          name: 'firestore',
          status: 'degraded',
          message: `Firestore response time is slow: ${responseTime}ms`,
          timestamp: new Date(),
          metadata: { responseTime },
        };
      }

      return {
        name: 'firestore',
        status: 'healthy',
        message: 'Firestore is responding normally',
        timestamp: new Date(),
        metadata: { responseTime },
      };
    } catch (error) {
      return {
        name: 'firestore',
        status: 'unhealthy',
        message: `Firestore connection failed: ${error}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  /**
   * Check authentication service
   */
  private async checkAuthentication(): Promise<HealthCheck> {
    try {
      // Test Firebase Auth service
      const auth = admin.auth();
      await auth.listUsers(1); // Just check if we can list users

      return {
        name: 'authentication',
        status: 'healthy',
        message: 'Authentication service is working',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'authentication',
        status: 'unhealthy',
        message: `Authentication service failed: ${error}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  /**
   * Check MCP server performance
   */
  private async checkMCPServer(): Promise<HealthCheck> {
    try {
      // Get recent MCP server metrics
      const recentMetrics = await metricsCollector.getAgentMetrics(
        'mcp-server',
        new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      );

      if (recentMetrics.length === 0) {
        return {
          name: 'mcp-server',
          status: 'degraded',
          message: 'No recent MCP server activity',
          timestamp: new Date(),
        };
      }

      const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;
      const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;

      if (successRate < 0.95) {
        return {
          name: 'mcp-server',
          status: 'unhealthy',
          message: `MCP server success rate is low: ${(successRate * 100).toFixed(1)}%`,
          timestamp: new Date(),
          metadata: { successRate, averageResponseTime },
        };
      }

      if (averageResponseTime > 2000) {
        return {
          name: 'mcp-server',
          status: 'degraded',
          message: `MCP server response time is slow: ${averageResponseTime.toFixed(0)}ms`,
          timestamp: new Date(),
          metadata: { successRate, averageResponseTime },
        };
      }

      return {
        name: 'mcp-server',
        status: 'healthy',
        message: 'MCP server is performing well',
        timestamp: new Date(),
        metadata: { successRate, averageResponseTime },
      };
    } catch (error) {
      return {
        name: 'mcp-server',
        status: 'unhealthy',
        message: `MCP server check failed: ${error}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  /**
   * Check agent performance
   */
  private async checkAgentPerformance(): Promise<HealthCheck> {
    try {
      const agentIds = ['verification-agent', 'reporting-agent'];
      let totalOperations = 0;
      let totalSuccesses = 0;
      let totalResponseTime = 0;

      for (const agentId of agentIds) {
        const summary = await metricsCollector.getAgentPerformanceSummary(agentId, 1); // Last hour
        totalOperations += summary.totalOperations;
        totalSuccesses += summary.totalOperations * summary.successRate;
        totalResponseTime += summary.averageResponseTime * summary.totalOperations;
      }

      if (totalOperations === 0) {
        return {
          name: 'agents',
          status: 'degraded',
          message: 'No recent agent activity',
          timestamp: new Date(),
        };
      }

      const overallSuccessRate = totalSuccesses / totalOperations;
      const overallResponseTime = totalResponseTime / totalOperations;

      if (overallSuccessRate < 0.9) {
        return {
          name: 'agents',
          status: 'unhealthy',
          message: `Agent success rate is low: ${(overallSuccessRate * 100).toFixed(1)}%`,
          timestamp: new Date(),
          metadata: { successRate: overallSuccessRate, responseTime: overallResponseTime },
        };
      }

      return {
        name: 'agents',
        status: 'healthy',
        message: 'Agents are performing well',
        timestamp: new Date(),
        metadata: { successRate: overallSuccessRate, responseTime: overallResponseTime },
      };
    } catch (error) {
      return {
        name: 'agents',
        status: 'unhealthy',
        message: `Agent performance check failed: ${error}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<HealthCheck> {
    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;

      if (memoryUsagePercent > 90) {
        return {
          name: 'memory',
          status: 'unhealthy',
          message: `Memory usage is critical: ${memoryUsagePercent.toFixed(1)}%`,
          timestamp: new Date(),
          metadata: { heapUsedMB, heapTotalMB, memoryUsagePercent },
        };
      }

      if (memoryUsagePercent > 75) {
        return {
          name: 'memory',
          status: 'degraded',
          message: `Memory usage is high: ${memoryUsagePercent.toFixed(1)}%`,
          timestamp: new Date(),
          metadata: { heapUsedMB, heapTotalMB, memoryUsagePercent },
        };
      }

      return {
        name: 'memory',
        status: 'healthy',
        message: `Memory usage is normal: ${memoryUsagePercent.toFixed(1)}%`,
        timestamp: new Date(),
        metadata: { heapUsedMB, heapTotalMB, memoryUsagePercent },
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'unhealthy',
        message: `Memory check failed: ${error}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimiting(): Promise<HealthCheck> {
    try {
      // Check if rate limiting is working by looking at recent rate limit events
      const recentRateLimits = await this.firestore
        .collection('rate_limits')
        .where('windowStart', '>=', new Date(Date.now() - 5 * 60 * 1000))
        .get();

      const rateLimitCount = recentRateLimits.size;

      if (rateLimitCount > 100) {
        return {
          name: 'rate-limiting',
          status: 'degraded',
          message: `High rate limiting activity: ${rateLimitCount} events in last 5 minutes`,
          timestamp: new Date(),
          metadata: { rateLimitCount },
        };
      }

      return {
        name: 'rate-limiting',
        status: 'healthy',
        message: 'Rate limiting is working normally',
        timestamp: new Date(),
        metadata: { rateLimitCount },
      };
    } catch (error) {
      return {
        name: 'rate-limiting',
        status: 'unhealthy',
        message: `Rate limiting check failed: ${error}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  /**
   * Determine overall system health
   */
  private determineOverallHealth(checks: HealthCheck[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    }

    if (degradedCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }
}

export const healthMonitor = new HealthMonitor();
