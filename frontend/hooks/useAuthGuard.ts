import { useEffect } from 'react';
import { useAuth } from '../src/contexts/AdminAuthContext';

export const useAuthGuard = (requiredRole?: string) => {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login or show auth modal
      console.log('Authentication required');
    }
  }, [isAuthenticated, loading]);

  return {
    user,
    isAuthenticated,
    loading,
    hasRequiredRole: requiredRole ? user?.role === requiredRole : true
  };
}; 