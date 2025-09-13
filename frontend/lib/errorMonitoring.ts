import React from 'react';
import type { ApiError } from '../src/types';

// Error monitoring interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  page?: string;
  action?: string;
  context?: string;
  collectionName?: string;
  id?: string;
  documentId?: string;
}

// Error monitoring functions
export const captureAPIError = (error: Error, context?: ErrorContext) => {
  console.error('API Error:', error, context);
  // In production, this would send to Sentry or similar service
};

/**
 * Lightweight error reporter. Replace internals with Sentry/LogRocket/etc. as needed.
 */
export function captureDBError(
  error: unknown,
  context: string | Record<string, unknown>,
  extra?: Record<string, unknown>
): void {
  const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
  const payload: ApiError = {
    code: (error as any)?.code ?? "UNKNOWN",
    message: (error as any)?.message ?? "Unknown error",
  };
  // eslint-disable-next-line no-console
  console.error(`[${contextStr}]`, payload, extra);
}

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    try {
      return React.createElement(Component, { ...props, ref } as any);
    } catch (error) {
      captureAPIError(error as Error);
      return React.createElement('div', null, 'Error occurred');
    }
  });
};

// Async function error monitoring
type AsyncFn<TArgs extends any[], TReturn> = (...args: TArgs) => Promise<TReturn>;

/**
 * Wraps an async function with error monitoring. Preserves parameter and return types.
 * Usage: const safeFetch = withErrorMonitoring(fetchUser, "fetchUser");
 */
export function withErrorMonitoring<TArgs extends any[], TReturn>(
  fn: AsyncFn<TArgs, TReturn>,
  context: string = "unknown"
): AsyncFn<TArgs, TReturn> {
  return (async (...args: TArgs): Promise<TReturn> => {
    try {
      return await fn(...args);
    } catch (err) {
      captureDBError(err, context, { argsCount: args.length });
      throw err; // rethrow so callers can handle
    }
  }) as AsyncFn<TArgs, TReturn>;
}

// Alias for backward compatibility
export const withAsyncErrorMonitoring = withErrorMonitoring; 