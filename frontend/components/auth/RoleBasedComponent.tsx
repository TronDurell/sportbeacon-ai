import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { RoleBasedComponentProps } from '../../types/auth';

/**
 * Role-Based Component Wrapper
 * Conditionally renders content based on user roles and permissions
 */
const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  children,
  role,
  roles,
  permission,
  permissions,
  fallback,
  show = true
}) => {
  const { hasPermission, hasRole, hasAnyRole, hasAllRoles } = useAuth();

  // If show is false, don't render anything
  if (!show) {
    return null;
  }

  // Check single role
  if (role && !hasRole(role)) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check multiple roles (any of)
  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check multiple permissions (all of)
  if (permissions && permissions.length > 0) {
    const hasAllPermissions = permissions.every(perm => hasPermission(perm));
    if (!hasAllPermissions) {
      return fallback ? <>{fallback}</> : null;
    }
  }

  // If no conditions specified or all conditions met, render children
  return <>{children}</>;
};

export default RoleBasedComponent; 