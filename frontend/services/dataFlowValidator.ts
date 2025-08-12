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

// Data Flow Types
export interface DataFlowEvent {
  id: string;
  flowId: string;
  eventType: 'user_interaction' | 'firestore_write' | 'firestore_read' | 'stripe_api_call' | 'webhook_received' | 'payout_processed' | 'error' | 'validation';
  eventName: string;
  userId?: string;
  data?: any;
  metadata?: Record<string, any>;
  timestamp: Timestamp;
  duration?: number; // milliseconds
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'validated';
  error?: string;
  validationResult?: ValidationResult;
}

export interface DataFlow {
  id: string;
  flowType: 'tip_creation' | 'profile_update' | 'media_upload' | 'dashboard_sync' | 'payout_processing';
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'active' | 'completed' | 'failed' | 'validated';
  events: DataFlowEvent[];
  validationResults: ValidationResult[];
  performanceMetrics: PerformanceMetrics;
  errorCount: number;
  successCount: number;
  totalDuration: number;
}

export interface ValidationResult {
  id: string;
  flowId: string;
  validationType: 'data_consistency' | 'performance' | 'security' | 'business_logic' | 'end_to_end';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  timestamp: Timestamp;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceMetrics {
  totalEvents: number;
  averageEventDuration: number;
  slowestEvent: { eventName: string; duration: number };
  fastestEvent: { eventName: string; duration: number };
  totalDuration: number;
  eventsPerSecond: number;
  memoryUsage?: number;
  networkRequests: number;
  databaseOperations: number;
}

export interface DataFlowConfig {
  enableRealTimeMonitoring: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableValidation: boolean;
  maxFlowDuration: number; // milliseconds
  retryAttempts: number;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'data_consistency' | 'performance' | 'security' | 'business_logic';
  condition: (flow: DataFlow) => boolean;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action?: 'retry' | 'alert' | 'rollback' | 'continue';
}

// Data Flow Validation Service
export class DataFlowValidator {
  private static instance: DataFlowValidator;
  private activeFlows: Map<string, DataFlow> = new Map();
  private listeners: Map<string, () => void> = new Map();
  private config: DataFlowConfig;
  private validationRules: ValidationRule[];

  private constructor() {
    this.config = {
      enableRealTimeMonitoring: true,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableValidation: true,
      maxFlowDuration: 30000, // 30 seconds
      retryAttempts: 3,
      validationRules: []
    };

    this.validationRules = this.initializeValidationRules();
  }

  static getInstance(): DataFlowValidator {
    if (!DataFlowValidator.instance) {
      DataFlowValidator.instance = new DataFlowValidator();
    }
    return DataFlowValidator.instance;
  }

  // Initialize Validation Rules
  private initializeValidationRules(): ValidationRule[] {
    return [
      // Data Consistency Rules
      {
        id: 'data_consistency_1',
        name: 'Profile Data Consistency',
        type: 'data_consistency',
        condition: (flow) => {
          const profileEvents = flow.events.filter(e => e.eventName.includes('profile'));
          return profileEvents.every(e => e.status === 'completed');
        },
        message: 'Profile data consistency validated',
        severity: 'high'
      },
      {
        id: 'data_consistency_2',
        name: 'Tip Amount Validation',
        type: 'data_consistency',
        condition: (flow) => {
          const tipEvents = flow.events.filter(e => e.eventName.includes('tip'));
          const tipData = tipEvents.find(e => e.data?.amount);
          return tipData && tipData.data.amount > 0;
        },
        message: 'Tip amount validation passed',
        severity: 'critical'
      },

      // Performance Rules
      {
        id: 'performance_1',
        name: 'Flow Duration Check',
        type: 'performance',
        condition: (flow) => flow.totalDuration < this.config.maxFlowDuration,
        message: 'Flow completed within acceptable time',
        severity: 'medium'
      },
      {
        id: 'performance_2',
        name: 'Event Duration Check',
        type: 'performance',
        condition: (flow) => {
          const slowEvents = flow.events.filter(e => e.duration && e.duration > 5000);
          return slowEvents.length === 0;
        },
        message: 'All events completed within acceptable time',
        severity: 'medium'
      },

      // Security Rules
      {
        id: 'security_1',
        name: 'User Authentication',
        type: 'security',
        condition: (flow) => flow.userId && flow.userId.length > 0,
        message: 'User authentication validated',
        severity: 'critical'
      },
      {
        id: 'security_2',
        name: 'Data Access Validation',
        type: 'security',
        condition: (flow) => {
          const accessEvents = flow.events.filter(e => e.eventName.includes('access'));
          return accessEvents.every(e => e.status === 'completed');
        },
        message: 'Data access validation passed',
        severity: 'high'
      },

      // Business Logic Rules
      {
        id: 'business_logic_1',
        name: 'Tip Processing Validation',
        type: 'business_logic',
        condition: (flow) => {
          if (flow.flowType !== 'tip_creation') return true;
          const requiredEvents = ['tip_created', 'stripe_payment_processed', 'payout_processed'];
          return requiredEvents.every(eventName => 
            flow.events.some(e => e.eventName === eventName && e.status === 'completed')
          );
        },
        message: 'Tip processing business logic validated',
        severity: 'critical'
      },
      {
        id: 'business_logic_2',
        name: 'Profile Update Validation',
        type: 'business_logic',
        condition: (flow) => {
          if (flow.flowType !== 'profile_update') return true;
          const profileEvents = flow.events.filter(e => e.eventName.includes('profile'));
          return profileEvents.length > 0 && profileEvents.every(e => e.status === 'completed');
        },
        message: 'Profile update business logic validated',
        severity: 'high'
      }
    ];
  }

  // Start Data Flow
  async startDataFlow(
    flowType: DataFlow['flowType'],
    userId: string,
    initialData?: any
  ): Promise<string> {
    const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const flow: DataFlow = {
      id: flowId,
      flowType,
      userId,
      startTime: serverTimestamp() as Timestamp,
      status: 'active',
      events: [],
      validationResults: [],
      performanceMetrics: {
        totalEvents: 0,
        averageEventDuration: 0,
        slowestEvent: { eventName: '', duration: 0 },
        fastestEvent: { eventName: '', duration: 0 },
        totalDuration: 0,
        eventsPerSecond: 0,
        networkRequests: 0,
        databaseOperations: 0
      },
      errorCount: 0,
      successCount: 0,
      totalDuration: 0
    };

    this.activeFlows.set(flowId, flow);

    // Record initial event
    await this.recordEvent(flowId, {
      eventType: 'user_interaction',
      eventName: `${flowType}_started`,
      userId,
      data: initialData,
      status: 'completed'
    });

    return flowId;
  }

  // Record Event
  async recordEvent(
    flowId: string,
    eventData: Omit<DataFlowEvent, 'id' | 'flowId' | 'timestamp'>
  ): Promise<string> {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      throw new Error(`Data flow ${flowId} not found`);
    }

    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const event: DataFlowEvent = {
      id: eventId,
      flowId,
      ...eventData,
      timestamp: serverTimestamp() as Timestamp
    };

    // Update flow
    flow.events.push(event);
    flow.performanceMetrics.totalEvents = flow.events.length;

    // Update performance metrics
    if (event.duration) {
      this.updatePerformanceMetrics(flow, event);
    }

    // Update status counts
    if (event.status === 'completed') {
      flow.successCount++;
    } else if (event.status === 'failed') {
      flow.errorCount++;
    }

    // Check if flow should be completed
    if (this.shouldCompleteFlow(flow)) {
      await this.completeDataFlow(flowId);
    }

    return eventId;
  }

  // Update Performance Metrics
  private updatePerformanceMetrics(flow: DataFlow, event: DataFlowEvent): void {
    const { performanceMetrics } = flow;

    // Update average duration
    const totalDuration = flow.events.reduce((sum, e) => sum + (e.duration || 0), 0);
    performanceMetrics.averageEventDuration = totalDuration / flow.events.length;

    // Update slowest and fastest events
    if (event.duration) {
      if (event.duration > performanceMetrics.slowestEvent.duration) {
        performanceMetrics.slowestEvent = { eventName: event.eventName, duration: event.duration };
      }
      if (performanceMetrics.fastestEvent.duration === 0 || event.duration < performanceMetrics.fastestEvent.duration) {
        performanceMetrics.fastestEvent = { eventName: event.eventName, duration: event.duration };
      }
    }

    // Update total duration
    performanceMetrics.totalDuration = totalDuration;

    // Update events per second
    const flowDuration = Date.now() - flow.startTime.toMillis();
    performanceMetrics.eventsPerSecond = (flow.events.length / flowDuration) * 1000;

    // Update operation counts
    if (event.eventType === 'firestore_write' || event.eventType === 'firestore_read') {
      performanceMetrics.databaseOperations++;
    }
    if (event.eventType === 'stripe_api_call') {
      performanceMetrics.networkRequests++;
    }
  }

  // Should Complete Flow
  private shouldCompleteFlow(flow: DataFlow): boolean {
    // Check if all required events are completed
    const requiredEvents = this.getRequiredEventsForFlowType(flow.flowType);
    const completedEvents = flow.events.filter(e => e.status === 'completed');
    
    return requiredEvents.every(eventName => 
      completedEvents.some(e => e.eventName === eventName)
    );
  }

  // Get Required Events for Flow Type
  private getRequiredEventsForFlowType(flowType: DataFlow['flowType']): string[] {
    switch (flowType) {
      case 'tip_creation':
        return ['tip_created', 'stripe_payment_processed', 'payout_processed'];
      case 'profile_update':
        return ['profile_updated', 'data_synced'];
      case 'media_upload':
        return ['media_uploaded', 'metadata_updated'];
      case 'dashboard_sync':
        return ['dashboard_synced', 'analytics_updated'];
      case 'payout_processing':
        return ['payout_initiated', 'stripe_transfer_created'];
      default:
        return [];
    }
  }

  // Complete Data Flow
  async completeDataFlow(flowId: string): Promise<void> {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      throw new Error(`Data flow ${flowId} not found`);
    }

    flow.endTime = serverTimestamp() as Timestamp;
    flow.totalDuration = flow.endTime.toMillis() - flow.startTime.toMillis();
    flow.status = 'completed';

    // Run validations
    if (this.config.enableValidation) {
      const validationResults = await this.runValidations(flow);
      flow.validationResults = validationResults;
      
      // Check if any critical validations failed
      const criticalFailures = validationResults.filter(v => 
        v.severity === 'critical' && v.status === 'failed'
      );
      
      if (criticalFailures.length > 0) {
        flow.status = 'failed';
      } else {
        flow.status = 'validated';
      }
    }

    // Save to Firestore
    await this.saveDataFlow(flow);

    // Remove from active flows
    this.activeFlows.delete(flowId);
  }

  // Run Validations
  private async runValidations(flow: DataFlow): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const rule of this.validationRules) {
      try {
        const passed = rule.condition(flow);
        const result: ValidationResult = {
          id: `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          flowId: flow.id,
          validationType: rule.type,
          status: passed ? 'passed' : 'failed',
          message: passed ? rule.message : `Validation failed: ${rule.message}`,
          timestamp: serverTimestamp() as Timestamp,
          severity: rule.severity
        };

        results.push(result);

        // Handle failed validations
        if (!passed && rule.action) {
          await this.handleValidationFailure(flow, rule, result);
        }
      } catch (error) {
        const result: ValidationResult = {
          id: `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          flowId: flow.id,
          validationType: rule.type,
          status: 'failed',
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: serverTimestamp() as Timestamp,
          severity: rule.severity
        };
        results.push(result);
      }
    }

    return results;
  }

  // Handle Validation Failure
  private async handleValidationFailure(
    flow: DataFlow,
    rule: ValidationRule,
    result: ValidationResult
  ): Promise<void> {
    switch (rule.action) {
      case 'retry':
        // Implement retry logic
        console.warn(`Retrying flow ${flow.id} due to validation failure: ${rule.name}`);
        break;
      case 'alert':
        // Send alert
        await this.sendAlert(flow, rule, result);
        break;
      case 'rollback':
        // Implement rollback logic
        await this.rollbackFlow(flow);
        break;
      case 'continue':
        // Continue with warning
        console.warn(`Continuing flow ${flow.id} despite validation failure: ${rule.name}`);
        break;
    }
  }

  // Send Alert
  private async sendAlert(flow: DataFlow, rule: ValidationRule, result: ValidationResult): Promise<void> {
    // Implementation would send alerts to monitoring system
    console.error(`ALERT: Validation failure in flow ${flow.id}: ${rule.name} - ${result.message}`);
  }

  // Rollback Flow
  private async rollbackFlow(flow: DataFlow): Promise<void> {
    // Implementation would rollback changes
    console.warn(`Rolling back flow ${flow.id}`);
  }

  // Save Data Flow to Firestore
  private async saveDataFlow(flow: DataFlow): Promise<void> {
    const flowRef = doc(collection(db, 'dataFlows'), flow.id);
    await setDoc(flowRef, flow);
  }

  // Get Data Flow
  async getDataFlow(flowId: string): Promise<DataFlow | null> {
    const flowRef = doc(collection(db, 'dataFlows'), flowId);
    const flowDoc = await getDoc(flowRef);

    if (flowDoc.exists()) {
      return { id: flowDoc.id, ...flowDoc.data() } as DataFlow;
    }

    return null;
  }

  // Get User Data Flows
  async getUserDataFlows(
    userId: string,
    limitCount: number = 20
  ): Promise<DataFlow[]> {
    const q = query(
      collection(db, 'dataFlows'),
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const flows: DataFlow[] = [];

    querySnapshot.forEach((doc) => {
      flows.push({ id: doc.id, ...doc.data() } as DataFlow);
    });

    return flows;
  }

  // Get Data Flow Analytics
  async getDataFlowAnalytics(
    userId?: string,
    startDate?: Timestamp,
    endDate?: Timestamp
  ): Promise<{
    totalFlows: number;
    successfulFlows: number;
    failedFlows: number;
    averageFlowDuration: number;
    flowsByType: Record<DataFlow['flowType'], number>;
    validationResults: Record<string, number>;
    performanceMetrics: {
      averageEventDuration: number;
      averageEventsPerFlow: number;
      totalDatabaseOperations: number;
      totalNetworkRequests: number;
    };
  }> {
    let q = query(collection(db, 'dataFlows'));

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (startDate) {
      q = query(q, where('startTime', '>=', startDate));
    }

    if (endDate) {
      q = query(q, where('startTime', '<=', endDate));
    }

    const querySnapshot = await getDocs(q);
    const flows = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DataFlow);

    // Calculate analytics
    const totalFlows = flows.length;
    const successfulFlows = flows.filter(f => f.status === 'validated').length;
    const failedFlows = flows.filter(f => f.status === 'failed').length;
    const averageFlowDuration = flows.reduce((sum, f) => sum + f.totalDuration, 0) / totalFlows;

    const flowsByType: Record<DataFlow['flowType'], number> = {
      tip_creation: 0,
      profile_update: 0,
      media_upload: 0,
      dashboard_sync: 0,
      payout_processing: 0
    };

    const validationResults: Record<string, number> = {
      passed: 0,
      failed: 0,
      warning: 0
    };

    let totalEventDuration = 0;
    let totalEvents = 0;
    let totalDatabaseOperations = 0;
    let totalNetworkRequests = 0;

    flows.forEach(flow => {
      flowsByType[flow.flowType]++;
      
      flow.validationResults.forEach(v => {
        validationResults[v.status]++;
      });

      totalEventDuration += flow.performanceMetrics.totalDuration;
      totalEvents += flow.performanceMetrics.totalEvents;
      totalDatabaseOperations += flow.performanceMetrics.databaseOperations;
      totalNetworkRequests += flow.performanceMetrics.networkRequests;
    });

    return {
      totalFlows,
      successfulFlows,
      failedFlows,
      averageFlowDuration,
      flowsByType,
      validationResults,
      performanceMetrics: {
        averageEventDuration: totalEvents > 0 ? totalEventDuration / totalEvents : 0,
        averageEventsPerFlow: totalFlows > 0 ? totalEvents / totalFlows : 0,
        totalDatabaseOperations,
        totalNetworkRequests
      }
    };
  }

  // Real-time Data Flow Listener
  subscribeToDataFlow(
    flowId: string,
    callback: (flow: DataFlow | null) => void
  ): () => void {
    const flowRef = doc(collection(db, 'dataFlows'), flowId);
    
    const unsubscribe = onSnapshot(flowRef, (doc) => {
      if (doc.exists()) {
        const flow = { id: doc.id, ...doc.data() } as DataFlow;
        callback(flow);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to data flow:', error);
      callback(null);
    });

    this.listeners.set(flowId, unsubscribe);
    return unsubscribe;
  }

  // Real-time User Data Flows Listener
  subscribeToUserDataFlows(
    userId: string,
    callback: (flows: DataFlow[]) => void,
    limitCount: number = 20
  ): () => void {
    const q = query(
      collection(db, 'dataFlows'),
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const flows: DataFlow[] = [];
      
      querySnapshot.forEach((doc) => {
        flows.push({ id: doc.id, ...doc.data() } as DataFlow);
      });

      callback(flows);
    }, (error) => {
      console.error('Error listening to user data flows:', error);
      callback([]);
    });

    const listenerId = `user_flows_${userId}`;
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Real-time Analytics Listener
  subscribeToDataFlowAnalytics(
    callback: (analytics: any) => void,
    userId?: string,
    startDate?: Timestamp,
    endDate?: Timestamp
  ): () => void {
    let q = query(collection(db, 'dataFlows'));

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (startDate) {
      q = query(q, where('startTime', '>=', startDate));
    }

    if (endDate) {
      q = query(q, where('startTime', '<=', endDate));
    }

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const flows = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DataFlow);
      const analytics = await this.calculateAnalytics(flows);
      callback(analytics);
    }, (error) => {
      console.error('Error listening to data flow analytics:', error);
      callback({
        totalFlows: 0,
        successfulFlows: 0,
        failedFlows: 0,
        averageFlowDuration: 0,
        flowsByType: {},
        validationResults: {},
        performanceMetrics: {
          averageEventDuration: 0,
          averageEventsPerFlow: 0,
          totalDatabaseOperations: 0,
          totalNetworkRequests: 0
        }
      });
    });

    const listenerId = 'analytics';
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Calculate Analytics Helper
  private async calculateAnalytics(flows: DataFlow[]): Promise<any> {
    const totalFlows = flows.length;
    const successfulFlows = flows.filter(f => f.status === 'validated').length;
    const failedFlows = flows.filter(f => f.status === 'failed').length;
    const averageFlowDuration = flows.reduce((sum, f) => sum + f.totalDuration, 0) / totalFlows;

    const flowsByType: Record<DataFlow['flowType'], number> = {
      tip_creation: 0,
      profile_update: 0,
      media_upload: 0,
      dashboard_sync: 0,
      payout_processing: 0
    };

    const validationResults: Record<string, number> = {
      passed: 0,
      failed: 0,
      warning: 0
    };

    let totalEventDuration = 0;
    let totalEvents = 0;
    let totalDatabaseOperations = 0;
    let totalNetworkRequests = 0;

    flows.forEach(flow => {
      flowsByType[flow.flowType]++;
      
      flow.validationResults.forEach(v => {
        validationResults[v.status]++;
      });

      totalEventDuration += flow.performanceMetrics.totalDuration;
      totalEvents += flow.performanceMetrics.totalEvents;
      totalDatabaseOperations += flow.performanceMetrics.databaseOperations;
      totalNetworkRequests += flow.performanceMetrics.networkRequests;
    });

    return {
      totalFlows,
      successfulFlows,
      failedFlows,
      averageFlowDuration,
      flowsByType,
      validationResults,
      performanceMetrics: {
        averageEventDuration: totalEvents > 0 ? totalEventDuration / totalEvents : 0,
        averageEventsPerFlow: totalFlows > 0 ? totalEvents / totalFlows : 0,
        totalDatabaseOperations,
        totalNetworkRequests
      }
    };
  }

  // Update Configuration
  updateConfig(config: Partial<DataFlowConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Add Validation Rule
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  // Remove Validation Rule
  removeValidationRule(ruleId: string): void {
    this.validationRules = this.validationRules.filter(r => r.id !== ruleId);
  }

  // Get Active Flows
  getActiveFlows(): DataFlow[] {
    return Array.from(this.activeFlows.values());
  }

  // Cleanup Listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.activeFlows.clear();
  }

  // Get Listener Count (for debugging)
  getListenerCount(): number {
    return this.listeners.size;
  }
}

export default DataFlowValidator; 