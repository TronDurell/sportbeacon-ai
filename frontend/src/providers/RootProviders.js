import { jsx as _jsx } from "react/jsx-runtime";
import { AdminAuthProvider } from "../contexts/AdminAuthContext";
import { AgentOrchestrationProvider } from "../contexts/AgentOrchestrationContext";
import { ToastProvider } from "../components/ui/toast";
export const Providers = ({ children }) => {
    return (_jsx(AdminAuthProvider, { children: _jsx(AgentOrchestrationProvider, { children: _jsx(ToastProvider, { children: children }) }) }));
};
