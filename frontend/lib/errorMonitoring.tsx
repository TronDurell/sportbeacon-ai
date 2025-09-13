import React from 'react';

// Error monitoring interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  page?: string;
  action?: string;
}

// Error monitoring functions
export const captureAPIError = (error: Error, context?: ErrorContext) => {
  console.error('API Error:', error, context);
  // In production, this would send to Sentry or similar service
};

export const captureDBError = (error: Error, context?: ErrorContext) => {
  console.error('Database Error:', error, context);
  // In production, this would send to Sentry or similar service
};

export const withErrorMonitoring = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    try {
      return React.createElement(Component, { ...props, ref });
    } catch (error) {
      captureAPIError(error as Error);
      return React.createElement('div', null, 'Error occurred');
    }
  });
};

// Async function error monitoring
export const withAsyncErrorMonitoring = async (
  asyncFn: () => Promise<any>,
  context?: string
): Promise<any> => {
  try {
    return await asyncFn();
  } catch (error) {
    captureDBError(error as Error, { context });
    throw error;
  }
}; 