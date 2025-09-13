/**
 * Agent Client Hook
 * Provides MCP client functionality for React components
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';
import { isFeatureEnabled } from '../featureFlags';

export interface MCPRequest {
  method: string;
  params: any;
  id?: string | number;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number | null;
}

export interface AgentClientState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastResponse: MCPResponse | null;
}

export interface AgentClientActions {
  callTool: (method: string, params: any) => Promise<MCPResponse>;
  getPlayerStats: (playerId: string, range: { from: string; to: string }) => Promise<any>;
  listPendingSubmissions: (teamId: string, range?: { from: string; to: string }) => Promise<any>;
  submitStat: (playerId: string, payload: any) => Promise<any>;
  verifyStat: (submissionId: string) => Promise<any>;
  calculateKPI: (target: string, range: { from: string; to: string }) => Promise<any>;
  exportDataset: (filter: any, format: 'csv' | 'json') => Promise<any>;
  sendNotification: (target: any, message: string) => Promise<any>;
  updateMemory: (context: any) => Promise<any>;
  reset: () => void;
}

export function useAgentClient(): AgentClientState & AgentClientActions {
  const { user } = useAuth();
  const [state, setState] = useState<AgentClientState>({
    isConnected: false,
    isLoading: false,
    error: null,
    lastResponse: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if agent features are enabled
  const agentsEnabled = isFeatureEnabled('ASSISTANT_ENABLED');
  const mcpEnabled = isFeatureEnabled('MCP_ENABLED');

  // MCP server configuration
  const MCP_SERVER_URL = process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:8787';

  /**
   * Make a request to the MCP server
   */
  const callTool = useCallback(async (method: string, params: any): Promise<MCPResponse> => {
    if (!agentsEnabled || !mcpEnabled) {
      throw new Error('Agent features are not enabled');
    }

    if (!user) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Get Firebase ID token
      const token = await user.getIdToken();

      // Prepare MCP request
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      };

      // Make request to MCP server
      const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const mcpResponse: MCPResponse = await response.json();

      if (mcpResponse.error) {
        throw new Error(mcpResponse.error.message);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: true,
        lastResponse: mcpResponse,
        error: null
      }));

      return mcpResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        error: errorMessage
      }));

      throw error;
    }
  }, [user, agentsEnabled, mcpEnabled, MCP_SERVER_URL]);

  /**
   * Get player statistics
   */
  const getPlayerStats = useCallback(async (playerId: string, range: { from: string; to: string }) => {
    const response = await callTool('getPlayerStats', { playerId, range });
    return response.result;
  }, [callTool]);

  /**
   * List pending submissions
   */
  const listPendingSubmissions = useCallback(async (teamId: string, range?: { from: string; to: string }) => {
    const response = await callTool('listPendingSubmissions', { teamId, range });
    return response.result;
  }, [callTool]);

  /**
   * Submit stat
   */
  const submitStat = useCallback(async (playerId: string, payload: any) => {
    const response = await callTool('submitStat', { playerId, payload });
    return response.result;
  }, [callTool]);

  /**
   * Verify stat
   */
  const verifyStat = useCallback(async (submissionId: string) => {
    const response = await callTool('verifyStat', { submissionId });
    return response.result;
  }, [callTool]);

  /**
   * Calculate KPI
   */
  const calculateKPI = useCallback(async (target: string, range: { from: string; to: string }) => {
    const response = await callTool('calculateKPI', { target, range });
    return response.result;
  }, [callTool]);

  /**
   * Export dataset
   */
  const exportDataset = useCallback(async (filter: any, format: 'csv' | 'json') => {
    const response = await callTool('exportDataset', { filter, format });
    return response.result;
  }, [callTool]);

  /**
   * Send notification
   */
  const sendNotification = useCallback(async (target: any, message: string) => {
    const response = await callTool('sendNotification', { target, message });
    return response.result;
  }, [callTool]);

  /**
   * Update memory
   */
  const updateMemory = useCallback(async (context: any) => {
    const response = await callTool('updateMemory', { context });
    return response.result;
  }, [callTool]);

  /**
   * Reset client state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      isConnected: false,
      isLoading: false,
      error: null,
      lastResponse: null
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Test connection on mount
  useEffect(() => {
    if (agentsEnabled && mcpEnabled && user) {
      // Test connection with a simple health check
      fetch(`${MCP_SERVER_URL}/health`)
        .then(response => response.json())
        .then(data => {
          if (data.status === 'healthy') {
            setState(prev => ({ ...prev, isConnected: true }));
          }
        })
        .catch(error => {
          console.warn('MCP server health check failed:', error);
          setState(prev => ({ ...prev, isConnected: false }));
        });
    }
  }, [agentsEnabled, mcpEnabled, user, MCP_SERVER_URL]);

  return {
    ...state,
    callTool,
    getPlayerStats,
    listPendingSubmissions,
    submitStat,
    verifyStat,
    calculateKPI,
    exportDataset,
    sendNotification,
    updateMemory,
    reset
  };
}
