// Mock Sentry implementation
export default {
  captureException: (error: Error) => {
    console.error('Sentry captured exception:', error);
  },
  captureMessage: (message: string) => {
    console.log('Sentry captured message:', message);
  },
  setUser: (user: any) => {
    console.log('Sentry set user:', user);
  },
  setContext: (key: string, context: any) => {
    console.log('Sentry set context:', key, context);
  }
};
