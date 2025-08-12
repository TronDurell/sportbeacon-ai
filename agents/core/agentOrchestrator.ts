import { UserContext, UserRole, validateUserContext } from '../../backend/middleware/auth.guard';
import { AgentFactory, BaseAgent, FirestoreAdapter, AgentResponse } from './agentFactory';

// Logging interface
export interface AgentLog {
  timestamp: Date;
  agentType: string;
  userId: string;
  userRole: UserRole;
  command: string;
  payload?: any;
  response?: AgentResponse;
  error?: string;
  duration: number;
}

// Orchestrator configuration
export interface OrchestratorConfig {
  enableLogging: boolean;
  logFilePath?: string;
  maxRetries: number;
  timeoutMs: number;
}

// Agent operation result
export interface AgentOperationResult {
  success: boolean;
  agentType: string;
  response?: AgentResponse;
  error?: string;
  logs: AgentLog[];
  duration: number;
}

/**
 * AgentOrchestrator - Centralized agent management with RBAC and logging
 */
export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private logs: AgentLog[] = [];
  private config: OrchestratorConfig;

  constructor(
    private firestoreAdapter: FirestoreAdapter,
    config: Partial<OrchestratorConfig> = {}
  ) {
    this.config = {
      enableLogging: true,
      maxRetries: 3,
      timeoutMs: 30000,
      ...config
    };
  }

  /**
   * Execute agent command with full RBAC validation and logging
   */
  async executeAgentCommand(
    agentType: string,
    command: string,
    userContext: UserContext,
    payload?: any
  ): Promise<AgentOperationResult> {
    const startTime = Date.now();
    const operationLogs: AgentLog[] = [];

    try {
      // Validate user context
      if (!validateUserContext(userContext)) {
        throw new Error('Invalid user context provided');
      }

      // Log operation start
      const startLog: AgentLog = {
        timestamp: new Date(),
        agentType,
        userId: userContext.id,
        userRole: userContext.role,
        command,
        payload,
        duration: 0
      };
      operationLogs.push(startLog);

      // Get or create agent
      const agent = await this.getOrCreateAgent(agentType, userContext);

      // Execute command with retry logic
      const response = await this.executeWithRetry(
        () => agent.execute(command, payload),
        this.config.maxRetries
      );

      // Log successful operation
      const endLog: AgentLog = {
        timestamp: new Date(),
        agentType,
        userId: userContext.id,
        userRole: userContext.role,
        command,
        payload,
        response,
        duration: Date.now() - startTime
      };
      operationLogs.push(endLog);

      // Save logs
      if (this.config.enableLogging) {
        this.logs.push(...operationLogs);
        await this.saveLogs();
      }

      return {
        success: true,
        agentType,
        response,
        logs: operationLogs,
        duration: Date.now() - startTime
      };

    } catch (error) {
      const errorLog: AgentLog = {
        timestamp: new Date(),
        agentType,
        userId: userContext.id,
        userRole: userContext.role,
        command,
        payload,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
      operationLogs.push(errorLog);

      // Save error logs
      if (this.config.enableLogging) {
        this.logs.push(...operationLogs);
        await this.saveLogs();
      }

      return {
        success: false,
        agentType,
        error: error instanceof Error ? error.message : String(error),
        logs: operationLogs,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Get existing agent or create new one
   */
  private async getOrCreateAgent(agentType: string, userContext: UserContext): Promise<BaseAgent> {
    const agentKey = `${agentType}-${userContext.id}`;
    
    if (this.agents.has(agentKey)) {
      return this.agents.get(agentKey)!;
    }

    // Create new agent
    const agent = AgentFactory.createAgent(agentType, userContext, this.firestoreAdapter);
    
    // Initialize agent
    await agent.initialize();
    
    // Store agent
    this.agents.set(agentKey, agent);
    
    return agent;
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await Promise.race([
          fn(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), this.config.timeoutMs)
          )
        ]);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError!;
  }

  /**
   * Save logs to Firestore
   */
  private async saveLogs(): Promise<void> {
    if (!this.config.enableLogging || this.logs.length === 0) {
      return;
    }

    try {
      const logsRef = this.firestoreAdapter.collection('agent_logs');
      
      // Save logs in batches
      const batchSize = 100;
      for (let i = 0; i < this.logs.length; i += batchSize) {
        const batch = this.logs.slice(i, i + batchSize);
        await Promise.all(
          batch.map(log => logsRef.add(log))
        );
      }
      
      // Clear processed logs
      this.logs = [];
      
    } catch (error) {
      }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(): Promise<any> {
    const stats = {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(agent => 
        agent.userContext && validateUserContext(agent.userContext)
      ).length,
      totalLogs: this.logs.length,
      agentTypes: new Set(Array.from(this.agents.keys()).map(key => key.split('-')[0])).size
    };

    return stats;
  }

  /**
   * Cleanup all agents
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.agents.values()).map(agent => agent.cleanup());
    await Promise.allSettled(cleanupPromises);
    this.agents.clear();
    
    // Save any remaining logs
    if (this.config.enableLogging) {
      await this.saveLogs();
    }
  }

  /**
   * Get logs for specific user or agent
   */
  async getLogs(filters?: {
    userId?: string;
    agentType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AgentLog[]> {
    let filteredLogs = [...this.logs];

    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters?.agentType) {
      filteredLogs = filteredLogs.filter(log => log.agentType === filters.agentType);
    }

    if (filters?.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    return filteredLogs;
  }

  /**
   * Validate agent permissions for specific operation
   */
  validateAgentPermissions(
    agentType: string,
    userContext: UserContext,
    command: string
  ): boolean {
    // Define command permissions per agent type
    const commandPermissions = {
      coachAgent: {
        allowedRoles: [UserRole.COACH, UserRole.ADMIN],
        commands: ['getPerformanceReports', 'generateWorkoutPlan', 'updateUserMetrics']
      },
      playerAgent: {
        allowedRoles: [UserRole.PLAYER, UserRole.COACH, UserRole.ADMIN],
        commands: ['getWorkoutPlan', 'submitProgress', 'getAchievements']
      },
      parentAgent: {
        allowedRoles: [UserRole.PARENT, UserRole.ADMIN],
        commands: ['getChildProgress', 'setPreferences']
      },
      scoutAgent: {
        allowedRoles: [UserRole.SCOUT, UserRole.ADMIN],
        commands: ['analyzePlayer', 'generateReport']
      },
      adminAgent: {
        allowedRoles: [UserRole.ADMIN],
        commands: ['getSystemStats', 'manageUsers']
      }
    };

    const permissions = commandPermissions[agentType as keyof typeof commandPermissions];
    if (!permissions) {
      return false;
    }

    // Check role permissions
    if (!permissions.allowedRoles.includes(userContext.role)) {
      return false;
    }

    // Check command permissions
    if (!permissions.commands.includes(command)) {
      return false;
    }

    return true;
  }

  /**
   * Health check for orchestrator
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    try {
      const stats = await this.getAgentStats();
      const hasActiveAgents = stats.activeAgents > 0;
      const hasValidLogging = this.config.enableLogging;

      if (hasActiveAgents && hasValidLogging) {
        return {
          status: 'healthy',
          details: { stats, config: this.config }
        };
      } else if (hasActiveAgents || hasValidLogging) {
        return {
          status: 'degraded',
          details: { stats, config: this.config, issues: ['Some components not functioning optimally'] }
        };
      } else {
        return {
          status: 'unhealthy',
          details: { stats, config: this.config, issues: ['No active agents and logging disabled'] }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }
} 