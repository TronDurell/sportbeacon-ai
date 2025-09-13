/**
 * Admin Dashboard with Agent Assistant Integration
 * Demonstrates the agentic interface capabilities
 */

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  BellIcon,
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { AgentAssistant } from '../components/agent/AgentAssistant';
import { useAuth } from '../hooks/useAuth';
import { useAgentClient } from '../hooks/useAgentClient';
import { isFeatureEnabled } from '../featureFlags';

interface DashboardStats {
  totalPlayers: number;
  activePlayers: number;
  pendingSubmissions: number;
  verifiedStats: number;
  teamKPIs: Record<string, any>;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const agentClient = useAgentClient();
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    activePlayers: 0,
    pendingSubmissions: 0,
    verifiedStats: 0,
    teamKPIs: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if agent features are enabled
  const agentsEnabled = isFeatureEnabled('AGENTS_ENABLED');
  const assistantEnabled = isFeatureEnabled('ASSISTANT_ENABLED');

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user || !agentsEnabled) {
      setIsLoading(false);
      return;
    }

    try {
      // Load team KPIs
      const kpiResult = await agentClient.calculateKPI(user.teamId || '', {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      });

      // Load pending submissions
      const pendingResult = await agentClient.listPendingSubmissions(user.teamId || '');

      setStats({
        totalPlayers: 25, // Mock data
        activePlayers: 20, // Mock data
        pendingSubmissions: pendingResult.submissions?.length || 0,
        verifiedStats: 150, // Mock data
        teamKPIs: kpiResult.kpis || {}
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'verify-pending':
          // Trigger verification of pending submissions
          if (stats.pendingSubmissions > 0) {
            // In a real implementation, this would trigger the verification agent
            alert(`Verifying ${stats.pendingSubmissions} pending submissions...`);
          }
          break;
        case 'generate-report':
          // Generate team report
          const result = await agentClient.exportDataset({
            teamId: user?.teamId,
            range: {
              from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              to: new Date().toISOString()
            }
          }, 'json');
          alert(`Report generation started. Job ID: ${result.jobId}`);
          break;
        case 'send-notification':
          const message = prompt('Enter notification message:');
          if (message) {
            await agentClient.sendNotification({
              group: `team_${user?.teamId}`
            }, message);
            alert('Notification sent successfully!');
          }
          break;
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {user?.displayName || 'Admin'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {agentsEnabled && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <SparklesIcon className="h-5 w-5" />
                  <span>AI Agents Active</span>
                </div>
              )}
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <CogIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Players</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPlayers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Players</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activePlayers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Verified Stats</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.verifiedStats}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleQuickAction('verify-pending')}
              disabled={stats.pendingSubmissions === 0}
              className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Verify Pending ({stats.pendingSubmissions})
            </button>
            
            <button
              onClick={() => handleQuickAction('generate-report')}
              className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Generate Report
            </button>
            
            <button
              onClick={() => handleQuickAction('send-notification')}
              className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <BellIcon className="h-5 w-5 mr-2" />
              Send Notification
            </button>
          </div>
        </div>

        {/* Team KPIs */}
        {Object.keys(stats.teamKPIs).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Performance KPIs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.teamKPIs).slice(0, 6).map(([key, value]: [string, any]) => (
                <div key={key} className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {typeof value === 'object' ? value.value : value}
                  </p>
                  {typeof value === 'object' && value.trend && (
                    <p className={`text-sm ${
                      value.trend === 'up' ? 'text-green-600' : 
                      value.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {value.trend === 'up' ? '↗' : value.trend === 'down' ? '↘' : '→'} 
                      {value.change ? ` ${value.change.toFixed(1)}%` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Status */}
        {agentsEnabled && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Agent Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${agentClient.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">MCP Server Connection</span>
                <span className={`text-sm font-medium ${agentClient.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {agentClient.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Verification Agent</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Reporting Agent</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${assistantEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">AI Assistant</span>
                <span className={`text-sm font-medium ${assistantEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {assistantEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Agent Assistant */}
      {assistantEnabled && <AgentAssistant />}
    </div>
  );
}
