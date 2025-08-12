import { useState, useCallback, useEffect } from 'react';
import { ErrorHandler, AppError } from '../utils/errorHandler';

// ============================================================================
// ERROR BOUNDARY HOOK INTERFACES
// ============================================================================

export interface UseErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  appError?: AppError;
  errorCount: number;
  lastErrorTime?: Date;
}

export interface UseErrorBoundaryOptions {
  maxErrors?: number;
  errorWindow?: number; // milliseconds
  onError?: (error: Error, appError: AppError) => void;
  context?: string;
  autoRecover?: boolean;
  recoveryDelay?: number; // milliseconds
}

export interface UseErrorBoundaryReturn extends UseErrorBoundaryState {
  handleError: (error: Error) => void;
  resetError: () => void;
  shouldRetry: () => boolean;
  isRecoverable: () => boolean;
}

// ============================================================================
// ERROR BOUNDARY HOOK
// ============================================================================

export const useErrorBoundary = (options: UseErrorBoundaryOptions = {}): UseErrorBoundaryReturn => {
  const {
    maxErrors = 3,
    errorWindow = 60000, // 1 minute
    onError,
    context = 'useErrorBoundary',
    autoRecover = false,
    recoveryDelay = 5000 // 5 seconds
  } = options;

  const [state, setState] = useState<UseErrorBoundaryState>({
    hasError: false,
    errorCount: 0
  });

  const errorHandler = ErrorHandler.getInstance();

  // Handle error with rate limiting and recovery logic
  const handleError = useCallback((error: Error): void => {
    const now = new Date();
    const timeSinceLastError = state.lastErrorTime 
      ? now.getTime() - state.lastErrorTime.getTime() 
      : errorWindow + 1;

    // Reset error count if enough time has passed
    const newErrorCount = timeSinceLastError > errorWindow ? 1 : state.errorCount + 1;

    // Create app error
    const appError = errorHandler.handleError(error, context, 'high');

    // Update state
    setState(prev => ({
      ...prev,
      hasError: true,
      error,
      appError,
      errorCount: newErrorCount,
      lastErrorTime: now
    }));

    // Call custom error handler
    if (onError) {
      onError(error, appError);
    }

    // Auto-recovery logic
    if (autoRecover && newErrorCount < maxErrors) {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          hasError: false,
          error: undefined,
          appError: undefined
        }));
      }, recoveryDelay);
    }
  }, [state.errorCount, state.lastErrorTime, errorWindow, maxErrors, onError, context, autoRecover, recoveryDelay, errorHandler]);

  // Reset error state
  const resetError = useCallback((): void => {
    setState(prev => ({
      ...prev,
      hasError: false,
      error: undefined,
      appError: undefined
    }));
  }, []);

  // Check if retry should be allowed
  const shouldRetry = useCallback((): boolean => {
    return state.errorCount < maxErrors;
  }, [state.errorCount, maxErrors]);

  // Check if error is recoverable
  const isRecoverable = useCallback((): boolean => {
    if (!state.error) return false;
    
    // Check if error is recoverable based on type
    const recoverableErrors = [
      'NetworkError',
      'TimeoutError',
      'QuotaExceededError',
      'PermissionDeniedError'
    ];

    return recoverableErrors.some(errorType => 
      state.error?.name === errorType || 
      state.error?.message.includes(errorType)
    );
  }, [state.error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset state on unmount
      setState({
        hasError: false,
        errorCount: 0
      });
    };
  }, []);

  return {
    ...state,
    handleError,
    resetError,
    shouldRetry,
    isRecoverable
  };
};

// ============================================================================
// SPECIALIZED ERROR BOUNDARY HOOKS
// ============================================================================

// Hook for API error handling
export const useApiErrorBoundary = (context?: string) => {
  return useErrorBoundary({
    maxErrors: 5,
    errorWindow: 30000, // 30 seconds
    context: context || 'API',
    autoRecover: true,
    recoveryDelay: 3000 // 3 seconds
  });
};

// Hook for component error handling
export const useComponentErrorBoundary = (context?: string) => {
  return useErrorBoundary({
    maxErrors: 3,
    errorWindow: 60000, // 1 minute
    context: context || 'Component',
    autoRecover: false
  });
};

// Hook for form error handling
export const useFormErrorBoundary = (context?: string) => {
  return useErrorBoundary({
    maxErrors: 10,
    errorWindow: 120000, // 2 minutes
    context: context || 'Form',
    autoRecover: true,
    recoveryDelay: 1000 // 1 second
  });
};

// Hook for navigation error handling
export const useNavigationErrorBoundary = (context?: string) => {
  return useErrorBoundary({
    maxErrors: 2,
    errorWindow: 30000, // 30 seconds
    context: context || 'Navigation',
    autoRecover: true,
    recoveryDelay: 2000 // 2 seconds
  });
};

// ============================================================================
// ERROR RECOVERY UTILITIES
// ============================================================================

export const createErrorRecoveryStrategy = (
  error: Error,
  retryCount: number,
  maxRetries: number = 3
): {
  shouldRetry: boolean;
  delay: number;
  strategy: 'immediate' | 'exponential' | 'linear' | 'none';
} => {
  // Don't retry if we've exceeded max retries
  if (retryCount >= maxRetries) {
    return {
      shouldRetry: false,
      delay: 0,
      strategy: 'none'
    };
  }

  // Determine retry strategy based on error type
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return {
      shouldRetry: true,
      delay: Math.min(1000 * Math.pow(2, retryCount), 10000), // Exponential backoff, max 10s
      strategy: 'exponential'
    };
  }

  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return {
      shouldRetry: true,
      delay: 2000 * (retryCount + 1), // Linear backoff
      strategy: 'linear'
    };
  }

  if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
    return {
      shouldRetry: true,
      delay: 5000, // Fixed delay for quota errors
      strategy: 'immediate'
    };
  }

  // Default: no retry for unknown errors
  return {
    shouldRetry: false,
    delay: 0,
    strategy: 'none'
  };
};

// ============================================================================
// ERROR CLASSIFICATION UTILITIES
// ============================================================================

export const classifyError = (error: Error): {
  category: 'network' | 'auth' | 'validation' | 'server' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
} => {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorName.includes('network')) {
    return {
      category: 'network',
      severity: 'medium',
      recoverable: true
    };
  }

  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return {
      category: 'auth',
      severity: 'high',
      recoverable: false
    };
  }

  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
    return {
      category: 'validation',
      severity: 'low',
      recoverable: true
    };
  }

  // Server errors
  if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('internal')) {
    return {
      category: 'server',
      severity: 'high',
      recoverable: true
    };
  }

  // Client errors
  if (errorMessage.includes('client') || errorMessage.includes('400') || errorMessage.includes('bad request')) {
    return {
      category: 'client',
      severity: 'medium',
      recoverable: true
    };
  }

  // Unknown errors
  return {
    category: 'unknown',
    severity: 'critical',
    recoverable: false
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default useErrorBoundary;