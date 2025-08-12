import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { ProtectedRouteProps } from '../../types/auth';

/**
 * Protected Route Component
 * Provides role-based and permission-based route protection
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  requiredPermissions,
  fallback,
  redirectTo = '/login'
}) => {
  const { authState, hasPermission, hasRole, hasAnyRole, hasAllRoles } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!authState.isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user is still loading
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check required role
  if (requiredRole && !hasRole(requiredRole)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }

  // Check required roles (any of)
  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }

  // Check required roles (all of)
  if (requiredRoles && requiredRoles.length > 0 && !hasAllRoles(requiredRoles)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }

  // Check required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }

  // Check required permissions (all of)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    
    if (!hasAllPermissions) {
      if (fallback) return <>{fallback}</>;
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 