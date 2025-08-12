import { useAuth } from '../src/contexts/AdminAuthContext';

export const useRoleAuth = () => {
  const { user } = useAuth();

  const hasRole = (requiredRole: string) => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (roles: string[]) => {
    return user?.role ? roles.includes(user.role) : false;
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin: hasRole('admin'),
    isCoach: hasRole('coach'),
    isPlayer: hasRole('player'),
    isParent: hasRole('parent')
  };
}; 