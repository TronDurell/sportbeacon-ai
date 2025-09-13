import React, { useState, useEffect, useCallback } from 'react';
import { useBackendIntegration } from '../../contexts/BackendIntegrationContext';
import DataFlowValidator from '../../services/dataFlowValidator';
import PerformanceMonitor from '../../services/performanceMonitor';
import {
  LoadingSpinner,
  ErrorState,
  SuccessState,
  WarningState,
  NetworkStatus,
  SyncStatus,
  ProgressBar,
  StatusIndicator
} from './LoadingStates';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Database,
  Wifi,
  Cpu,
  // Memory, // Icon not found in lucide-react
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  Square
} from 'lucide-react';
import type { DataFlow, PerformanceMetrics, ValidationResult } from '../../services/dataFlowValidator';

// Data Flow Monitor Props
interface DataFlowMonitorProps {
  userId?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  className?: string;
}

// Data Flow Monitor Component
export const DataFlowMonitor: React.FC<DataFlowMonitorProps> = ({
  userId,
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 5000,
  className = ''
}) => {
  const { state } = useBackendIntegration();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeFlows, setActiveFlows] = useState<DataFlow[]>([]);
  const [recentFlows, setRecentFlows] = useState<DataFlow[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const dataFlowValidator = DataFlowValidator.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Start Monitoring
  const startMonitoring = useCallback(async () => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    setIsLoading(true);
    setError(null);

    try {
      // Get active flows
      const flows = dataFlowValidator.getActiveFlows();
      setActiveFlows(flows);

      // Get recent flows
      if (userId) {
        const recent = await dataFlowValidator.getUserDataFlows(userId, 10);
        setRecentFlows(recent);
      }

      // Get performance metrics
      const metrics = await performanceMonitor.getPerformanceMetrics(userId);
      setPerformanceMetrics(metrics);

      // Get analytics
      const analyticsData = await performanceMonitor.getPerformanceAnalytics(userId);
      setAnalytics(analyticsData);

      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start monitoring');
    } finally {
      setIsLoading(false);
    }
  }, [isMonitoring, userId, dataFlowValidator, performanceMonitor]);

  // Stop Monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Refresh Data
  const refreshData = useCallback(async () => {
    if (!isMonitoring) return;

    try {
      const flows = dataFlowValidator.getActiveFlows();
      setActiveFlows(flows);

      if (userId) {
        const recent = await dataFlowValidator.getUserDataFlows(userId, 10);
        setRecentFlows(recent);
      }

      const metrics = await performanceMonitor.getPerformanceMetrics(userId);
      setPerformanceMetrics(metrics);

      const analyticsData = await performanceMonitor.getPerformanceAnalytics(userId);
      setAnalytics(analyticsData);

      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    }
  }, [isMonitoring, userId, dataFlowValidator, performanceMonitor]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isMonitoring) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isMonitoring, refreshData, refreshInterval]);

  // Start monitoring on mount
  useEffect(() => {
    startMonitoring();
  }, [startMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Calculate Flow Status
  const getFlowStatus = (flow: DataFlow) => {
    if (flow.status === 'active') return 'processing';
    if (flow.status === 'validated') return 'success';
    if (flow.status === 'failed') return 'error';
    return 'idle';
  };

  // Calculate Flow Progress
  const getFlowProgress = (flow: DataFlow) => {
    const requiredEvents = getRequiredEventsForFlowType(flow.flowType);
    const completedEvents = flow.events.filter(e => e.status === 'completed');
    const progress = (completedEvents.length / requiredEvents.length) * 100;
    return Math.min(progress, 100);
  };

  // Get Required Events for Flow Type
  const getRequiredEventsForFlowType = (flowType: DataFlow['flowType']): string[] => {
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
  };

  // Format Duration
  const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    if (milliseconds < 60000) return `${Math.round(milliseconds / 1000)}s`;
    return `${Math.round(milliseconds / 60000)}m`;
  };

  // Get Validation Status
  const getValidationStatus = (flow: DataFlow) => {
    const criticalFailures = flow.validationResults.filter(v => 
      v.severity === 'critical' && v.status === 'failed'
    );
    
    if (criticalFailures.length > 0) return 'error';
    
    const warnings = flow.validationResults.filter(v => v.status === 'warning');
    if (warnings.length > 0) return 'warning';
    
    return 'success';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Data Flow Monitor</h2>
          <StatusIndicator 
            status={isMonitoring ? 'success' : 'idle'} 
            text={isMonitoring ? 'Monitoring' : 'Stopped'}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <NetworkStatus isOnline={state.isOnline} />
          <SyncStatus lastSync={lastUpdate} isSyncing={isLoading} />
          
          <div className="flex items-center space-x-2">
            {isMonitoring ? (
              <button
                onClick={stopMonitoring}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </button>
            ) : (
              <button
                onClick={startMonitoring}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </button>
            )}
            
            <button
              onClick={refreshData}
              disabled={!isMonitoring || isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      <ErrorState error={error} onRetry={refreshData} className="mb-4" />

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4">
          <LoadingSpinner text="Updating data flow monitor..." />
        </div>
      )}

      {/* Performance Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-700">Response Time</p>
                <p className="text-lg font-semibold text-blue-900">
                  {formatDuration(analytics.averageResponseTime)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-700">Success Rate</p>
                <p className="text-lg font-semibold text-green-900">
                  {Math.round((1 - analytics.errorRate) * 100)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-purple-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-700">Operations</p>
                <p className="text-lg font-semibold text-purple-900">
                  {analytics.totalOperations}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Memory className="w-5 h-5 text-orange-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-700">Memory</p>
                <p className="text-lg font-semibold text-orange-900">
                  {Math.round(analytics.memoryUsage)}MB
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Flows */}
      {activeFlows.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
            Active Data Flows ({activeFlows.length})
          </h3>
          
          <div className="space-y-3">
            {activeFlows.map((flow) => (
              <div key={flow.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <StatusIndicator 
                      status={getFlowStatus(flow)} 
                      text={flow.flowType.replace('_', ' ')}
                    />
                    <span className="text-sm text-gray-600">
                      Started {formatDuration(Date.now() - flow.startTime.toMillis())} ago
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {flow.events.length} events
                    </span>
                    <span className="text-sm text-gray-600">
                      {flow.errorCount} errors
                    </span>
                  </div>
                </div>
                
                <ProgressBar 
                  progress={getFlowProgress(flow)} 
                  text="Flow Progress"
                  className="mb-2"
                />
                
                {showDetails && (
                  <div className="mt-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {flow.events.slice(-4).map((event) => (
                        <div key={event.id} className="flex items-center space-x-1">
                          <StatusIndicator 
                            status={event.status === 'completed' ? 'success' : event.status === 'failed' ? 'error' : 'loading'} 
                            text=""
                          />
                          <span className="text-gray-600 truncate">{event.eventName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Flows */}
      {recentFlows.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 text-blue-500 mr-2" />
            Recent Data Flows
          </h3>
          
          <div className="space-y-2">
            {recentFlows.slice(0, 5).map((flow) => (
              <div key={flow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <StatusIndicator 
                    status={getFlowStatus(flow)} 
                    text=""
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {flow.flowType.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {Math.round(flow.totalDuration)}ms • {flow.events.length} events
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {flow.validationResults.length > 0 && (
                    <StatusIndicator 
                      status={getValidationStatus(flow)} 
                      text={`${flow.validationResults.length} validations`}
                    />
                  )}
                  <span className="text-xs text-gray-500">
                    {flow.endTime ? formatDuration(Date.now() - flow.endTime.toMillis()) : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceMetrics.length > 0 && showDetails && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 text-purple-500 mr-2" />
            Recent Performance Metrics
          </h3>
          
          <div className="space-y-2">
            {performanceMetrics.slice(0, 10).map((metric) => (
              <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <StatusIndicator 
                    status={metric.severity === 'critical' ? 'error' : metric.severity === 'high' ? 'warning' : 'success'} 
                    text=""
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{metric.metricName}</p>
                    <p className="text-xs text-gray-600">{metric.metricType}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {metric.value} {metric.unit}
                  </p>
                  <p className="text-xs text-gray-500">
                    {metric.timestamp.toDate().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && activeFlows.length === 0 && recentFlows.length === 0 && (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Flows</h3>
          <p className="text-gray-600">
            No active or recent data flows found. Start monitoring to see real-time data flow activity.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Cpu className="w-4 h-4" />
            <span>{analytics?.totalOperations || 0} ops</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Wifi className="w-4 h-4" />
            <span>{analytics?.networkRequests || 0} requests</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Database className="w-4 h-4" />
            <span>{analytics?.activeListeners || 0} listeners</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Data Flow Chart Component
export const DataFlowChart: React.FC<{
  flows: DataFlow[];
  className?: string;
}> = ({ flows, className = '' }) => {
  const getFlowTypeColor = (flowType: DataFlow['flowType']) => {
    switch (flowType) {
      case 'tip_creation': return 'bg-green-500';
      case 'profile_update': return 'bg-blue-500';
      case 'media_upload': return 'bg-purple-500';
      case 'dashboard_sync': return 'bg-orange-500';
      case 'payout_processing': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Data Flow Timeline</h3>
      
      <div className="space-y-2">
        {flows.map((flow) => (
          <div key={flow.id} className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getFlowTypeColor(flow.flowType)}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {flow.flowType.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.round(flow.totalDuration)}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className={`h-1 rounded-full ${getFlowTypeColor(flow.flowType)}`}
                  style={{ width: `${(flow.events.length / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Validation Results Component
export const ValidationResults: React.FC<{
  validations: ValidationResult[];
  className?: string;
}> = ({ validations, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Validation Results</h3>
      
      <div className="space-y-2">
        {validations.map((validation) => (
          <div key={validation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <StatusIndicator 
                status={validation.status === 'passed' ? 'success' : validation.status === 'failed' ? 'error' : 'warning'} 
                text=""
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{validation.validationType}</p>
                <p className="text-xs text-gray-600">{validation.message}</p>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                validation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                validation.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                validation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {validation.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataFlowMonitor; 