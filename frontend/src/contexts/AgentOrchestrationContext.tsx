import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AgentOrchestrationState {
  isActive: boolean;
  currentAgent: string | null;
  agentStatus: 'idle' | 'processing' | 'error';
}

interface AgentOrchestrationContextType extends AgentOrchestrationState {
  startAgent: (agentId: string) => Promise<void>;
  stopAgent: () => Promise<void>;
  getAgentStatus: (agentId: string) => Promise<string>;
  sendRequest: (request: any) => Promise<any>;
  triggerScheduleOptimization: () => Promise<void>;
  getSystemHealth: () => Promise<any>;
}

const AgentOrchestrationContext = createContext<AgentOrchestrationContextType | undefined>(undefined);

export const useAgentOrchestration = () => {
  const context = useContext(AgentOrchestrationContext);
  if (context === undefined) {
    throw new Error('useAgentOrchestration must be used within an AgentOrchestrationProvider');
  }
  return context;
};

interface AgentOrchestrationProviderProps {
  children: ReactNode;
}

export const AgentOrchestrationProvider: React.FC<AgentOrchestrationProviderProps> = ({ children }) => {
  const [state, setState] = useState<AgentOrchestrationState>({
    isActive: false,
    currentAgent: null,
    agentStatus: 'idle'
  });

  const startAgent = async (agentId: string) => {
    setState(prev => ({
      ...prev,
      isActive: true,
      currentAgent: agentId,
      agentStatus: 'processing'
    }));
    
    // Simulate agent processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setState(prev => ({
      ...prev,
      agentStatus: 'idle'
    }));
  };

  const stopAgent = async () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      currentAgent: null,
      agentStatus: 'idle'
    }));
  };

  const getAgentStatus = async (_agentId: string): Promise<string> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return state.agentStatus;
  };

  const sendRequest = async (request: any): Promise<any> => {
    // Simulate AI agent request
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, data: request };
  };

  const triggerScheduleOptimization = async (): Promise<void> => {
    // Simulate schedule optimization
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const getSystemHealth = async (): Promise<any> => {
    // Simulate system health check
    await new Promise(resolve => setTimeout(resolve, 500));
    return { status: 'healthy', agents: ['scheduler', 'notifier'] };
  };

  const value: AgentOrchestrationContextType = {
    ...state,
    startAgent,
    stopAgent,
    getAgentStatus,
    sendRequest,
    triggerScheduleOptimization,
    getSystemHealth
  };

  return (
    <AgentOrchestrationContext.Provider value={value}>
      {children}
    </AgentOrchestrationContext.Provider>
  );
}; 