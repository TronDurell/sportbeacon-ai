import React from "react";
import { AdminAuthProvider } from "../contexts/AdminAuthContext";
import { AgentOrchestrationProvider } from "../contexts/AgentOrchestrationContext";
import { ToastProvider } from "../components/ui/toast";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AdminAuthProvider>
      <AgentOrchestrationProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AgentOrchestrationProvider>
    </AdminAuthProvider>
  );
}; 