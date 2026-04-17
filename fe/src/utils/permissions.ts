import type { AuthUser } from '@/types/auth_user';

export type Permission = string;

// Default mapping is kept as a fallback for legacy sessions where permissions are missing.
const defaultRolePermissions: Record<string, Permission[]> = {
  superadmin: [
    'dashboard:read',
    'alerts:read',
    'alerts:update',
    'itam.categories:read',
    'itam.categories:create',
    'itam.categories:update',
    'itam.categories:delete',
    'itam.assets:read',
    'itam.assets:create',
    'itam.assets:update',
    'itam.assets:delete',
    'itam.licenses:read',
    'itam.licenses:create',
    'itam.licenses:update',
    'itam.licenses:delete',
    'itam.devices:read',
    'itam.devices:create',
    'itam.devices:update',
    'itam.devices:delete',
    'itam.assignments:read',
    'itam.assignments:create',
    'itam.assignments:update',
    'itam.assignments:delete',
    'itam.rentals:read',
    'itam.rentals:create',
    'itam.rentals:update',
    'itam.rentals:delete',
    'itam.vendors:read',
    'itam.vendors:manage',
    'itsm.tickets:read',
    'itsm.tickets:create',
    'itsm.tickets:update',
    'itsm.tickets:delete',
    'itsm.sla:read',
    'itsm.sla:create',
    'itsm.sla:update',
    'itsm.sla:delete',
    'itsm.asset_requests:read',
    'itsm.asset_requests:create',
    'itsm.asset_requests:update',
    'itsm.asset_requests:delete',
    'itsm.process_monitoring:read',
    'itsm.process_monitoring:update',
    'itsm.patch_status:read',
    'itsm.patch_status:update',
    'itsm.software_alerts:read',
    'itsm.software_alerts:update',
    'itsm.logs:read',
    'admin.clients:read',
    'admin.clients:create',
    'admin.clients:update',
    'admin.clients:delete',
    'admin.branches:read',
    'admin.branches:create',
    'admin.branches:update',
    'admin.branches:delete',
    'admin.users:read',
    'admin.users:create',
    'admin.users:update',
    'admin.users:delete',
    'admin.employees:read',
    'admin.employees:create',
    'admin.employees:update',
    'admin.employees:delete',
    'admin.api_keys:read',
    'admin.api_keys:create',
    'admin.api_keys:update',
    'admin.api_keys:delete',
    'admin.audit_logs:read',
    'admin.reports:read',
    'admin.rbac:manage',
    // GRC
    'grc.taxonomy:read',
    'grc.profiles:read',
    'grc.profiles:create',
    'grc.profiles:update',
    'grc.profiles:delete',
    'grc.risks:read',
    'grc.risks:create',
    'grc.risks:update',
    'grc.risks:delete',
  ],
  admin: [
    'dashboard:read',
    'alerts:read',
    'alerts:update',
    'itam.categories:read',
    'itam.categories:create',
    'itam.categories:update',
    'itam.categories:delete',
    'itam.assets:read',
    'itam.assets:create',
    'itam.assets:update',
    'itam.assets:delete',
    'itam.licenses:read',
    'itam.licenses:create',
    'itam.licenses:update',
    'itam.licenses:delete',
    'itam.devices:read',
    'itam.devices:create',
    'itam.devices:update',
    'itam.devices:delete',
    'itam.assignments:read',
    'itam.assignments:create',
    'itam.assignments:update',
    'itam.assignments:delete',
    'itam.rentals:read',
    'itam.rentals:create',
    'itam.rentals:update',
    'itam.rentals:delete',
    'itam.vendors:read',
    'itam.vendors:manage',
    'itsm.tickets:read',
    'itsm.tickets:create',
    'itsm.tickets:update',
    'itsm.tickets:delete',
    'itsm.sla:read',
    'itsm.sla:create',
    'itsm.sla:update',
    'itsm.sla:delete',
    'itsm.asset_requests:read',
    'itsm.asset_requests:create',
    'itsm.asset_requests:update',
    'itsm.asset_requests:delete',
    'itsm.process_monitoring:read',
    'itsm.process_monitoring:update',
    'itsm.patch_status:read',
    'itsm.patch_status:update',
    'itsm.software_alerts:read',
    'itsm.software_alerts:update',
    'itsm.logs:read',
    'admin.branches:read',
    'admin.branches:create',
    'admin.branches:update',
    'admin.branches:delete',
    'admin.users:read',
    'admin.users:create',
    'admin.users:update',
    'admin.users:delete',
    'admin.employees:read',
    'admin.employees:create',
    'admin.employees:update',
    'admin.employees:delete',
    'admin.api_keys:read',
    'admin.api_keys:create',
    'admin.api_keys:update',
    'admin.api_keys:delete',
    'admin.audit_logs:read',
    'admin.reports:read',
    'admin.rbac:manage',
    // GRC
    'grc.taxonomy:read',
    'grc.profiles:read',
    'grc.profiles:create',
    'grc.profiles:update',
    'grc.profiles:delete',
    'grc.risks:read',
    'grc.risks:create',
    'grc.risks:update',
    'grc.risks:delete',
  ],
  itam_admin: [
    'dashboard:read',
    'alerts:read',
    'itam.categories:read',
    'itam.categories:create',
    'itam.categories:update',
    'itam.categories:delete',
    'itam.assets:read',
    'itam.assets:create',
    'itam.assets:update',
    'itam.assets:delete',
    'itam.licenses:read',
    'itam.licenses:create',
    'itam.licenses:update',
    'itam.licenses:delete',
    'itam.devices:read',
    'itam.devices:create',
    'itam.devices:update',
    'itam.devices:delete',
    'itam.assignments:read',
    'itam.assignments:create',
    'itam.assignments:update',
    'itam.assignments:delete',
    'itam.rentals:read',
    'itam.rentals:create',
    'itam.rentals:update',
    'itam.rentals:delete',
    'itam.vendors:read',
    'itam.vendors:manage',
    'admin.employees:read',
    'admin.reports:read',
    // GRC
    'grc.taxonomy:read',
    'grc.profiles:read',
    'grc.profiles:create',
    'grc.profiles:update',
    'grc.profiles:delete',
    'grc.risks:read',
    'grc.risks:create',
    'grc.risks:update',
    'grc.risks:delete',
  ],
  itsm_admin: [
    'dashboard:read',
    'alerts:read',
    'itsm.tickets:read',
    'itsm.tickets:create',
    'itsm.tickets:update',
    'itsm.tickets:delete',
    'itsm.sla:read',
    'itsm.sla:create',
    'itsm.sla:update',
    'itsm.sla:delete',
    'itsm.asset_requests:read',
    'itsm.asset_requests:create',
    'itsm.asset_requests:update',
    'itsm.asset_requests:delete',
    'itsm.process_monitoring:read',
    'itsm.process_monitoring:update',
    'itsm.patch_status:read',
    'itsm.patch_status:update',
    'itsm.software_alerts:read',
    'itsm.software_alerts:update',
    'itsm.logs:read',
    'itam.devices:read',
    'admin.employees:read',
    'admin.reports:read',
  ],
  auditor: [
    'dashboard:read',
    'alerts:read',
    'itam.categories:read',
    'itam.assets:read',
    'itam.licenses:read',
    'itam.devices:read',
    'itam.assignments:read',
    'itam.rentals:read',
    'itam.vendors:read',
    'itsm.tickets:read',
    'itsm.sla:read',
    'itsm.asset_requests:read',
    'itsm.process_monitoring:read',
    'itsm.patch_status:read',
    'itsm.software_alerts:read',
    'itsm.logs:read',
    'admin.audit_logs:read',
    'admin.reports:read',
    // GRC (read-only)
    'grc.taxonomy:read',
    'grc.profiles:read',
    'grc.risks:read',
  ],
  staff: [
    'dashboard:read',
    'alerts:read',
    'itam.assets:read',
    'itam.assets:create',
    'itam.assets:update',
    'itam.assignments:read',
    'itam.assignments:create',
    'itam.assignments:update',
    'admin.employees:read',
    'itam.devices:read',
  ],
  viewer: [
    'dashboard:read',
    'alerts:read',
    'itam.assets:read',
    'itam.assignments:read',
    'admin.employees:read',
    'itam.devices:read',
  ],
};

/**
 * Get all permissions for a user based on their role
 */
export function getUserPermissions(user: AuthUser | null): Permission[] {
  if (!user) {
    return [];
  }
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions;
  }
  return defaultRolePermissions[user.role] || [];
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) {
    return false;
  }
  const userPermissions = getUserPermissions(user);
  return userPermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthUser | null, permissions: Permission[]): boolean {
  if (!user || permissions.length === 0) {
    return false;
  }
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthUser | null, permissions: Permission[]): boolean {
  if (!user || permissions.length === 0) {
    return false;
  }
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Convenience helper for client-dimension visibility
 * Used to gate client filters/columns and /clients access.
 */
export function canSeeClientDimension(user: AuthUser | null): boolean {
  return hasPermission(user, 'admin.clients:read');
}

