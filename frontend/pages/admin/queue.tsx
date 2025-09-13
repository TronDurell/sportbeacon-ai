/* SportBeaconAI - Admin Queue Interface
   Secure admin interface for triage, verification, and dispute resolution
*/

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMemory } from '../../hooks/useMemory';
import { useAnalytics } from '../../analytics/events';
import { AdminQueueItem, QueueType, Priority, Status } from '../../domain/types';

// ============================================================================
// INTERFACES
// ============================================================================

interface AdminQueueState {
  pendingStats: AdminQueueItem[];
  disputes: AdminQueueItem[];
  duplicates: AdminQueueItem[];
  outliers: AdminQueueItem[];
  mergeRequests: AdminQueueItem[];
  loading: boolean;
  error: string | null;
  selectedItem: AdminQueueItem | null;
  showDetails: boolean;
}

interface QueueStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  averageResolutionTime: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminQueuePage() {
  const { user } = useAuth();
  const { captureEvent } = useMemory({ enabled: true, autoCapture: false });
  const analytics = useAnalytics();

  const [state, setState] = useState<AdminQueueState>({
    pendingStats: [],
    disputes: [],
    duplicates: [],
    outliers: [],
    mergeRequests: [],
    loading: true,
    error: null,
    selectedItem: null,
    showDetails: false
  });

  const [activeTab, setActiveTab] = useState<QueueType>('verification');
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    averageResolutionTime: 0
  });

  // ============================================================================
  // AUTHENTICATION & AUTHORIZATION
  // ============================================================================

  useEffect(() => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return;
    }

    // Check if user has admin privileges
    if (!user.roles?.includes('admin')) {
      setState(prev => ({ ...prev, error: 'Admin privileges required' }));
      return;
    }

    loadQueueData();
  }, [user]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadQueueData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // TODO: Implement actual data loading from Firestore
      // This is a placeholder implementation
      const mockData = {
        pendingStats: [
          {
            id: 'queue_1',
            queueType: 'verification' as QueueType,
            priority: 'medium' as Priority,
            status: 'pending' as Status,
            targetType: 'statLine',
            targetId: 'stat_123',
            athleteId: 'athlete_456',
            title: 'Basketball Stats Verification',
            description: 'Coach submitted basketball stats for John Doe vs Lincoln High',
            submittedBy: 'coach_789',
            submittedAt: new Date(),
            tags: ['basketball', 'stats', 'verification'],
            metadata: {
              sport: 'basketball',
              statType: 'game_stats',
              submittedBy: 'coach_789'
            }
          }
        ],
        disputes: [
          {
            id: 'queue_2',
            queueType: 'dispute' as QueueType,
            priority: 'high' as Priority,
            status: 'pending' as Status,
            targetType: 'statLine',
            targetId: 'stat_124',
            athleteId: 'athlete_457',
            title: 'Points Dispute',
            description: 'Parent disputes the points recorded for their child',
            submittedBy: 'parent_101',
            submittedAt: new Date(),
            tags: ['basketball', 'dispute', 'points'],
            metadata: {
              sport: 'basketball',
              disputeType: 'stat_accuracy',
              disputedValue: 25,
              recordedValue: 20
            }
          }
        ],
        duplicates: [],
        outliers: [],
        mergeRequests: []
      };

      setState(prev => ({
        ...prev,
        ...mockData,
        loading: false
      }));

      // Calculate stats
      calculateQueueStats(mockData);

      // Capture admin page view
      await analytics.emitAdminActionPerformed({
        action: 'verify_stat',
        targetId: 'admin_queue',
        targetType: 'page',
        adminId: user?.uid || 'unknown',
        success: true
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load queue data',
        loading: false
      }));
    }
  };

  const calculateQueueStats = (data: any) => {
    const allItems = [
      ...data.pendingStats,
      ...data.disputes,
      ...data.duplicates,
      ...data.outliers,
      ...data.mergeRequests
    ];

    const newStats: QueueStats = {
      total: allItems.length,
      pending: allItems.filter((item: AdminQueueItem) => item.status === 'pending').length,
      inProgress: allItems.filter((item: AdminQueueItem) => item.status === 'in_progress').length,
      resolved: allItems.filter((item: AdminQueueItem) => item.status === 'resolved').length,
      rejected: allItems.filter((item: AdminQueueItem) => item.status === 'rejected').length,
      averageResolutionTime: 0 // TODO: Calculate from actual data
    };

    setStats(newStats);
  };

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleApprove = async (item: AdminQueueItem) => {
    try {
      // TODO: Call cloud function to approve item
      console.log('Approving item:', item.id);

      // Capture admin action
      await analytics.emitAdminActionPerformed({
        action: item.queueType === 'verification' ? 'verify_stat' : 'resolve_dispute',
        targetId: item.targetId,
        targetType: item.targetType,
        adminId: user?.uid || 'unknown',
        success: true
      });

      // Capture memory feedback
      await captureEvent('observation', {
        action: 'admin_approve',
        queueItemId: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        adminId: user?.uid
      }, ['admin', 'approve', item.queueType], 'admin-approve');

      // Refresh data
      await loadQueueData();

    } catch (error) {
      console.error('Failed to approve item:', error);
      
      await analytics.emitAdminActionPerformed({
        action: item.queueType === 'verification' ? 'verify_stat' : 'resolve_dispute',
        targetId: item.targetId,
        targetType: item.targetType,
        adminId: user?.uid || 'unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleReject = async (item: AdminQueueItem, reason: string) => {
    try {
      // TODO: Call cloud function to reject item
      console.log('Rejecting item:', item.id, 'Reason:', reason);

      // Capture admin action
      await analytics.emitAdminActionPerformed({
        action: item.queueType === 'verification' ? 'verify_stat' : 'resolve_dispute',
        targetId: item.targetId,
        targetType: item.targetType,
        adminId: user?.uid || 'unknown',
        success: true
      });

      // Capture memory feedback
      await captureEvent('observation', {
        action: 'admin_reject',
        queueItemId: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        reason: reason,
        adminId: user?.uid
      }, ['admin', 'reject', item.queueType], 'admin-reject');

      // Refresh data
      await loadQueueData();

    } catch (error) {
      console.error('Failed to reject item:', error);
      
      await analytics.emitAdminActionPerformed({
        action: item.queueType === 'verification' ? 'verify_stat' : 'resolve_dispute',
        targetId: item.targetId,
        targetType: item.targetType,
        adminId: user?.uid || 'unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleRequestClarification = async (item: AdminQueueItem, message: string) => {
    try {
      // TODO: Call cloud function to request clarification
      console.log('Requesting clarification for item:', item.id, 'Message:', message);

      // Capture admin action
      await analytics.emitAdminActionPerformed({
        action: 'verify_stat',
        targetId: item.targetId,
        targetType: item.targetType,
        adminId: user?.uid || 'unknown',
        success: true
      });

      // Capture memory feedback
      await captureEvent('observation', {
        action: 'admin_clarification_request',
        queueItemId: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        message: message,
        adminId: user?.uid
      }, ['admin', 'clarification', item.queueType], 'admin-clarification');

      // Refresh data
      await loadQueueData();

    } catch (error) {
      console.error('Failed to request clarification:', error);
    }
  };

  const handleViewDetails = (item: AdminQueueItem) => {
    setState(prev => ({
      ...prev,
      selectedItem: item,
      showDetails: true
    }));
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getQueueItems = (): AdminQueueItem[] => {
    switch (activeTab) {
      case 'verification':
        return state.pendingStats;
      case 'dispute':
        return state.disputes;
      case 'duplicate':
        return state.duplicates;
      case 'outlier':
        return state.outliers;
      case 'merge':
        return state.mergeRequests;
      default:
        return [];
    }
  };

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Status): string => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (state.error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {state.error}
        </div>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Queue</h1>
        <p className="text-gray-600">Manage verification requests, disputes, and data quality issues</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Items</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">In Progress</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Resolved</h3>
          <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Rejected</h3>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'verification', label: 'Verification', count: state.pendingStats.length },
            { id: 'dispute', label: 'Disputes', count: state.disputes.length },
            { id: 'duplicate', label: 'Duplicates', count: state.duplicates.length },
            { id: 'outlier', label: 'Outliers', count: state.outliers.length },
            { id: 'merge', label: 'Merge Requests', count: state.mergeRequests.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as QueueType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Queue Items Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getQueueItems().map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                    <div className="text-xs text-gray-400">ID: {item.targetId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.submittedAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(item)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(item, 'Rejected by admin')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleRequestClarification(item, 'Please provide additional information')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Request Info
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {getQueueItems().length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No items in this queue</p>
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {state.showDetails && state.selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {state.selectedItem.title}
                </h3>
                <button
                  onClick={() => setState(prev => ({ ...prev, showDetails: false, selectedItem: null }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{state.selectedItem.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <span className={`mt-1 px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(state.selectedItem.priority)}`}>
                      {state.selectedItem.priority}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(state.selectedItem.status)}`}>
                      {state.selectedItem.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Metadata</label>
                  <pre className="mt-1 text-sm text-gray-900 bg-gray-100 p-2 rounded">
                    {JSON.stringify(state.selectedItem.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setState(prev => ({ ...prev, showDetails: false, selectedItem: null }))}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {state.selectedItem.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(state.selectedItem!)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(state.selectedItem!, 'Rejected by admin')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
