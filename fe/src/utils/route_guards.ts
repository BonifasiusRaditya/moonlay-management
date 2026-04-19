import { redirect } from '@tanstack/react-router';
import { hasPermission, type Permission } from './permissions';
import { ensureAuthenticatedUser } from '@/Session/userSession';

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

