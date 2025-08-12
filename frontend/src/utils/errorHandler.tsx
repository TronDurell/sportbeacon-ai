/**
 * Centralized Error Handling Utilities
 * 
 * This module provides consistent error handling patterns across the application
 * to improve user experience and debugging capabilities.
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  context?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
  
  // Validation Errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_PASSWORD: 'VALIDATION_INVALID_PASSWORD',
  VALIDATION_INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  
  // Network Errors
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
  NETWORK_SERVER_ERROR: 'NETWORK_SERVER_ERROR',
  
  // Firebase Errors
  FIREBASE_PERMISSION_DENIED: 'FIREBASE_PERMISSION_DENIED',
  FIREBASE_DOCUMENT_NOT_FOUND: 'FIREBASE_DOCUMENT_NOT_FOUND',
  FIREBASE_QUOTA_EXCEEDED: 'FIREBASE_QUOTA_EXCEEDED',
  
  // Business Logic Errors
  BUSINESS_INVALID_OPERATION: 'BUSINESS_INVALID_OPERATION',
  BUSINESS_RESOURCE_NOT_FOUND: 'BUSINESS_RESOURCE_NOT_FOUND',
  BUSINESS_CONFLICT: 'BUSINESS_CONFLICT',
  
  // System Errors
  SYSTEM_UNKNOWN_ERROR: 'SYSTEM_UNKNOWN_ERROR',
  SYSTEM_CONFIGURATION_ERROR: 'SYSTEM_CONFIGURATION_ERROR',
} as const;

// ============================================================================
// ERROR HANDLER CLASS
// ============================================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * Handle and process an error
   */
  handleError(
    error: unknown, 
    context?: string, 
    severity: AppError['severity'] = 'medium'
  ): AppError {
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: this.extractErrorDetails(error),
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      context,
      severity
    };

    this.logError(appError);
    this.sendToMonitoring(appError);
    this.addToQueue(appError);

    return appError;
  }

  /**
   * Create a standardized error response
   */
  createErrorResponse(error: AppError): ErrorResponse {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
  }

  /**
   * Handle Firebase-specific errors
   */
  handleFirebaseError(error: unknown, context?: string): AppError {
    const firebaseError = error as { code?: string; message?: string };
    
    let code = ERROR_CODES.FIREBASE_PERMISSION_DENIED;
    let message = 'Firebase operation failed';

    if (firebaseError.code) {
      switch (firebaseError.code) {
        case 'permission-denied':
          code = ERROR_CODES.FIREBASE_PERMISSION_DENIED;
          message = 'Access denied. You do not have permission to perform this operation.';
          break;
        case 'not-found':
          code = ERROR_CODES.FIREBASE_DOCUMENT_NOT_FOUND;
          message = 'The requested resource was not found.';
          break;
        case 'quota-exceeded':
          code = ERROR_CODES.FIREBASE_QUOTA_EXCEEDED;
          message = 'Service quota exceeded. Please try again later.';
          break;
        default:
          code = ERROR_CODES.SYSTEM_UNKNOWN_ERROR;
          message = firebaseError.message || 'An unexpected Firebase error occurred.';
      }
    }

    return this.handleError(error, context, 'high');
  }

  /**
   * Handle network-related errors
   */
  handleNetworkError(error: unknown, context?: string): AppError {
    const networkError = error as { status?: number; message?: string };
    
    let code = ERROR_CODES.NETWORK_SERVER_ERROR;
    let message = 'Network request failed';

    if (networkError.status) {
      switch (networkError.status) {
        case 408:
          code = ERROR_CODES.NETWORK_TIMEOUT;
          message = 'Request timed out. Please try again.';
          break;
        case 500:
          code = ERROR_CODES.NETWORK_SERVER_ERROR;
          message = 'Server error. Please try again later.';
          break;
        default:
          code = ERROR_CODES.NETWORK_CONNECTION_FAILED;
          message = networkError.message || 'Network connection failed.';
      }
    }

    return this.handleError(error, context, 'medium');
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors: ValidationError[], context?: string): AppError {
    const error: AppError = {
      code: ERROR_CODES.VALIDATION_FAILED,
      message: 'Validation failed',
      details: { errors },
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      context,
      severity: 'low'
    };

    this.logError(error);
    return error;
  }

  /**
   * Extract error code from various error types
   */
  private getErrorCode(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as { code?: string; name?: string };
      return errorObj.code || errorObj.name || ERROR_CODES.SYSTEM_UNKNOWN_ERROR;
    }
    return ERROR_CODES.SYSTEM_UNKNOWN_ERROR;
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as { message?: string; toString?: () => string };
      return errorObj.message || errorObj.toString?.() || 'An unknown error occurred';
    }
    return 'An unknown error occurred';
  }

  /**
   * Extract additional error details
   */
  private extractErrorDetails(error: unknown): Record<string, unknown> {
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      const details: Record<string, unknown> = {};
      
      // Extract common error properties
      ['stack', 'cause', 'status', 'statusText', 'url'].forEach(key => {
        if (errorObj[key] !== undefined) {
          details[key] = errorObj[key];
        }
      });
      
      return details;
    }
    return {};
  }

  /**
   * Get current user ID for error tracking
   */
  private getCurrentUserId(): string | undefined {
    // TODO: Implement user ID retrieval from auth context
    return undefined;
  }

  /**
   * Log error to console and external services
   */
  private logError(error: AppError): void {
    // Console logging
    console.error('Application Error:', {
      code: error.code,
      message: error.message,
      context: error.context,
      severity: error.severity,
      timestamp: error.timestamp,
      userId: error.userId
    });

    // TODO: Send to external logging service (Sentry, LogRocket, etc.)
    if (error.severity === 'critical' || error.severity === 'high') {
      this.sendToMonitoring(error);
    }
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoring(error: AppError): void {
    // TODO: Implement monitoring service integration
    // Example: Sentry.captureException(error);
    console.warn('Error monitoring not implemented:', error);
  }

  /**
   * Add error to queue for batch processing
   */
  private addToQueue(error: AppError): void {
    this.errorQueue.push(error);
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }
  }

  /**
   * Get all queued errors
   */
  getQueuedErrors(): AppError[] {
    return [...this.errorQueue];
  }

  /**
   * Clear error queue
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getErrorHandler = (): ErrorHandler => ErrorHandler.getInstance();

/**
 * Convenience function to handle errors
 */
export const handleError = (error: unknown, context?: string): AppError => {
  return getErrorHandler().handleError(error, context);
};

/**
 * Convenience function to create error responses
 */
export const createErrorResponse = (error: AppError): ErrorResponse => {
  return getErrorHandler().createErrorResponse(error);
};

/**
 * Convenience function to handle Firebase errors
 */
export const handleFirebaseError = (error: unknown, context?: string): AppError => {
  return getErrorHandler().handleFirebaseError(error, context);
};

/**
 * Convenience function to handle network errors
 */
export const handleNetworkError = (error: unknown, context?: string): AppError => {
  return getErrorHandler().handleNetworkError(error, context);
};

/**
 * Convenience function to handle validation errors
 */
export const handleValidationError = (errors: ValidationError[], context?: string): AppError => {
  return getErrorHandler().handleValidationError(errors, context);
};

// ============================================================================
// REACT ERROR BOUNDARY
// ============================================================================

import React from 'react';

export interface ErrorFallbackProps {
  error: AppError;
  resetError: () => void;
}

/**
 * Default error fallback component
 */
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>Try again</button>
    </div>
  );
};

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  FallbackComponent: React.ComponentType<ErrorFallbackProps> = DefaultErrorFallback
) => {
  return class ErrorBoundary extends React.Component<P, { hasError: boolean; error?: AppError }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: unknown) {
      const appError = handleError(error, 'ErrorBoundary');
      return { hasError: true, error: appError };
    }

    componentDidCatch(error: unknown, errorInfo: unknown) {
      handleError(error, 'ErrorBoundary');
    }

    resetError = () => {
      this.setState({ hasError: false, error: undefined });
    };

    render() {
      if (this.state.hasError && this.state.error) {
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <Component {...this.props} />;
    }
  };
}; 