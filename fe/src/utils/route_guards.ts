import { redirect } from '@tanstack/react-router';
import { useUserStore } from '@/stores/userStore';
import { hasPermission, type Permission } from './permissions';

/**
 * Creates a beforeLoad guard enforcing authentication and a specific permission.
 * Redirects unauthenticated users to /login and unauthorized users to /dashboard.
 */
export function requirePermissionBeforeLoad(permission: Permission) {
  return () => {
    const { token, user } = useUserStore.getState();

    if (!token || !user) {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }

    if (!hasPermission(user, permission)) {
      throw redirect({
        to: '/dashboard',
        replace: true,
      });
    }
  };
}

