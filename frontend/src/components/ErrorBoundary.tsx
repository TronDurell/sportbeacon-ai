import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler, AppError } from '../utils/errorHandler';

// ============================================================================
// ERROR BOUNDARY INTERFACES
// ============================================================================

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<unknown>;
  context?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  appError?: AppError;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: ErrorInfo;
  appError?: AppError;
  resetError: () => void;
  context?: string;
}

// ============================================================================
// DEFAULT ERROR FALLBACK COMPONENT
// ============================================================================

export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  context = 'Application' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg border border-red-200">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {context} Error
        </h1>
        <p className="text-gray-600 mb-4">
          Something went wrong. We've been notified and are working to fix the issue.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 text-left">
            <p className="text-sm text-gray-800 font-mono break-all">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-sm text-gray-600 cursor-pointer">
                  Stack Trace
                </summary>
                <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}
        <div className="flex space-x-3">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Reload Page
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>If the problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler: ErrorHandler;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our error handling service
    const appError = this.errorHandler.handleError(error, this.props.context || 'ErrorBoundary', 'high');
    
    // Update state with error information
    this.setState({ 
      errorInfo, 
      appError 
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKeys change
    if (this.state.hasError && this.props.resetKeys !== prevProps.resetKeys) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined, 
      appError: undefined 
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          appError={this.state.appError}
          resetError={this.resetError}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// HIGHER-ORDER COMPONENT FOR ERROR BOUNDARIES
// ============================================================================

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>,
  context?: string
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} context={context}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

// Admin-specific error boundary
export const AdminErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="Admin Interface"
    fallback={({ error, resetError }) => (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-red-800 mb-2">Admin Interface Error</h3>
        <p className="text-red-700 mb-3">{error.message}</p>
        <button
          onClick={resetError}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Coach-specific error boundary
export const CoachErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="Coach Interface"
    fallback={({ error, resetError }) => (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-orange-800 mb-2">Coach Interface Error</h3>
        <p className="text-orange-700 mb-3">{error.message}</p>
        <button
          onClick={resetError}
          className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
        >
          Retry
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Player-specific error boundary
export const PlayerErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="Player Interface"
    fallback={({ error, resetError }) => (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Player Interface Error</h3>
        <p className="text-blue-700 mb-3">{error.message}</p>
        <button
          onClick={resetError}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;