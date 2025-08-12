import { useEffect, useState } from 'react';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AgentOrchestrationProvider } from './contexts/AgentOrchestrationContext';
import { SmartLayerProvider } from './contexts/SmartLayerContext';
import RoleRouter from './components/routing/RoleRouter';
import SmartAlerts from './components/SmartAlerts';
import { validateEnvironment, logValidationResults } from './utils/environmentValidation';
import { ToastContainer } from 'react-toastify';
import ErrorBoundary from './components/ErrorBoundary';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [environmentValid, setEnvironmentValid] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    // Validate environment on app startup
    try {
      const validation = validateEnvironment();
      setEnvironmentValid(validation.isValid);
      
      if (!validation.isValid) {
        setValidationError(`Environment validation failed: ${validation.errors.join(', ')}`);
        }
      
      // Log validation results in development
      if (import.meta.env.DEV) {
        logValidationResults();
      }
    } catch (error) {
      setEnvironmentValid(false);
      setValidationError(`Environment validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
  }, []);

  // Show loading state while validating environment
  if (environmentValid === null) {
    return (
      <ErrorBoundary context="Environment Validation">
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing SportBeaconAI...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show error state if environment validation failed
  if (!environmentValid) {
    return (
      <ErrorBoundary context="Environment Configuration">
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg border border-red-200">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h1>
            <p className="text-gray-600 mb-4">
              SportBeaconAI cannot start due to missing or invalid configuration.
            </p>
            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800">{validationError}</p>
              </div>
            )}
            <div className="text-sm text-gray-500">
              <p>Please check your environment configuration and try again.</p>
              <p className="mt-2">Contact support if the problem persists.</p>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Main application with error boundary
  return (
    <ErrorBoundary context="SportBeaconAI Application">
      <AdminAuthProvider>
        <AgentOrchestrationProvider>
          <SmartLayerProvider>
            <div className="App">
              <RoleRouter />
              <SmartAlerts />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </SmartLayerProvider>
        </AgentOrchestrationProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}

export default App; 