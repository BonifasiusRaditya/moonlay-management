import { redirect } from '@tanstack/react-router';
import { hasPermission, type Permission } from './permissions';
import { ensureAuthenticatedUser } from './auth-session';

export async function requireAuthBeforeLoad(redirectHref?: string) {
  const user = await ensureAuthenticatedUser();
  if (!user) {
    throw redirect({
      to: '/login',
      search: redirectHref
        ? {
            redirect: redirectHref,
          }
        : undefined,
      replace: true,
    });
  }

  return user;
}

/**
 * Creates a beforeLoad guard enforcing authentication and a specific permission.
 * Redirects unauthenticated users to /login and unauthorized users to /dashboard.
 */
export function requirePermissionBeforeLoad(permission: Permission) {
  return async () => {
    const user = await requireAuthBeforeLoad();

    if (!hasPermission(user, permission)) {
      throw redirect({
        to: '/dashboard',
        replace: true,
      });
    }
  };
}

