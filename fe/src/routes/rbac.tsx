import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPermissions,
  fetchRoles,
  fetchRolePermissions,
  createRole,
  updateRole,
  deleteRole,
  setRolePermissions,
  type Role,
} from '@/api/rbac';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import { PageSkeleton } from '@/components/loading_skeleton';
import { PageTransition } from '@/components/page_transition';
import { useNotificationStore } from '@/stores/notificationStore';
import { ShieldCheck, ShieldOff, Plus, Trash, Edit, RefreshCw } from 'lucide-react';
import { z } from 'zod';

const roleFormSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const Route = createFileRoute('/rbac')({
  component: RBACPage,
});

function RBACPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<{ key: string; name: string; description?: string }>({
    key: '',
    name: '',
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    data: permissions = [],
    isLoading: permissionsLoading,
    isFetching: permissionsFetching,
    error: permissionsError,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: fetchPermissions,
  });

  const {
    data: roles = [],
    isLoading: rolesLoading,
    isFetching: rolesFetching,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: fetchRoles,
  });

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) || null, [roles, selectedRoleId]);

  const {
    data: rolePermissions = [],
    isFetching: rolePermissionsFetching,
    error: rolePermissionsError,
    refetch: refetchRolePermissions,
  } = useQuery({
    queryKey: ['rbac', 'role_permissions', selectedRoleId],
    queryFn: () => fetchRolePermissions(selectedRoleId as number),
    enabled: selectedRoleId !== null,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (rolesError) {
      addNotification({
        type: 'error',
        title: 'Failed to load roles',
        message: rolesError instanceof Error ? rolesError.message : 'Unable to load roles.',
      });
    }
  }, [rolesError, addNotification]);

  useEffect(() => {
    if (permissionsError) {
      addNotification({
        type: 'error',
        title: 'Failed to load permissions',
        message: permissionsError instanceof Error ? permissionsError.message : 'Unable to load permissions.',
      });
    }
  }, [permissionsError, addNotification]);

  useEffect(() => {
    if (rolePermissionsError) {
      addNotification({
        type: 'error',
        title: 'Failed to load role permissions',
        message: rolePermissionsError instanceof Error ? rolePermissionsError.message : 'Unable to load role permissions.',
      });
    }
  }, [rolePermissionsError, addNotification]);

  useEffect(() => {
    if (selectedRoleId === null) return;
    setSelectedPermissions(rolePermissions);
  }, [selectedRoleId, rolePermissions]);

  const createRoleMutation = useMutation({
    mutationFn: () => {
      const parsed = roleFormSchema.safeParse(formData);
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        parsed.error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        setFormErrors(errors);
        return Promise.reject(new Error('Validation failed'));
      }
      return createRole(parsed.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
      setShowCreateModal(false);
      setFormData({ key: '', name: '', description: '' });
      setFormErrors({});
      addNotification({
        type: 'success',
        title: 'Role created',
      });
    },
    onError: (err: unknown) => {
      addNotification({
        type: 'error',
        title: 'Create failed',
        message: err instanceof Error ? err.message : 'Unable to create role.',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: () => {
      if (!selectedRole) return Promise.reject(new Error('No role selected'));
      const parsed = roleFormSchema.safeParse(formData);
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        parsed.error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        setFormErrors(errors);
        return Promise.reject(new Error('Validation failed'));
      }
      return updateRole(selectedRole.id, parsed.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
      addNotification({
        type: 'success',
        title: 'Role updated',
      });
    },
    onError: (err: unknown) => {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: err instanceof Error ? err.message : 'Unable to update role.',
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: () => {
      if (!selectedRole) return Promise.reject(new Error('No role selected'));
      return deleteRole(selectedRole.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
      setSelectedRoleId(null);
      setSelectedPermissions([]);
      addNotification({
        type: 'success',
        title: 'Role deleted',
      });
      setShowDeleteConfirm(false);
    },
    onError: (err: unknown) => {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: err instanceof Error ? err.message : 'Unable to delete role.',
      });
    },
  });

  const setPermissionsMutation = useMutation({
    mutationFn: (permissionsToSet: string[]) => {
      if (!selectedRole) return Promise.reject(new Error('No role selected'));
      return setRolePermissions(selectedRole.id, permissionsToSet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['rbac', 'role_permissions', selectedRoleId] });
      addNotification({
        type: 'success',
        title: 'Permissions updated',
      });
    },
    onError: (err: unknown) => {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: err instanceof Error ? err.message : 'Unable to update permissions.',
      });
    },
  });

  const handleSelectRole = (role: Role) => {
    setSelectedRoleId(role.id);
    setFormData({
      key: role.key,
      name: role.name,
      description: role.description ?? '',
    });
    setSelectedPermissions([]);
    setFormErrors({});
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  if (rolesLoading || permissionsLoading) {
    return <PageSkeleton />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-600">Roles & permissions</p>
            <h1 className="text-2xl font-bold text-gray-900">RBAC</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage roles and permission sets for the application.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                refetchRoles();
                refetchPermissions();
                if (selectedRoleId !== null) refetchRolePermissions();
              }}
              isLoading={rolesFetching || permissionsFetching || rolePermissionsFetching}
              disabled={rolesFetching || permissionsFetching || rolePermissionsFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              New role
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Roles</p>
                <p className="text-base font-semibold text-gray-900">Available roles</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-primary-600" />
            </div>

            {roles.length === 0 ? (
              <p className="text-sm text-gray-600">No roles found.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`w-full text-left rounded border px-3 py-2 transition-colors ${
                      selectedRoleId === role.id
                        ? 'border-primary-200 bg-primary-50 text-primary-900'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-semibold">{role.name}</p>
                    <p className="text-xs text-gray-600">Key: {role.key}</p>
                    {role.description && <p className="text-xs text-gray-500 mt-1">{role.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Role detail</p>
                <p className="text-base font-semibold text-gray-900">
                  {selectedRole ? selectedRole.name : 'Select a role to edit'}
                </p>
              </div>
              {selectedRole && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteRoleMutation.isPending}
                    isLoading={deleteRoleMutation.isPending}
                  >
                    <Trash className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {!selectedRole ? (
              <div className="text-sm text-gray-600">Choose a role from the list to edit.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => {
                        setFormData({ ...formData, key: e.target.value });
                        if (formErrors.key) setFormErrors({ ...formErrors, key: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        formErrors.key ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.key && <p className="mt-1 text-sm text-red-600">{formErrors.key}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                      }}
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldOff className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-900">
                    Permissions {selectedRole ? `(${selectedPermissions.length})` : ''}
                  </p>
                  </div>
                  {permissions.length === 0 ? (
                    <p className="text-sm text-gray-600">No permissions available.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded p-3">
                      {permissions.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 text-sm text-gray-800">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                            disabled={rolePermissionsFetching || setPermissionsMutation.isPending}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                          <span>{perm}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setPermissionsMutation.mutate(selectedPermissions)}
                      isLoading={setPermissionsMutation.isPending}
                      disabled={setPermissionsMutation.isPending || rolePermissionsFetching}
                    >
                      Save permissions
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectRole(selectedRole)}
                    disabled={updateRoleMutation.isPending}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateRoleMutation.mutate()}
                    isLoading={updateRoleMutation.isPending}
                    disabled={updateRoleMutation.isPending}
                  >
                    <Edit className="h-4 w-4" />
                    Save role
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Modal
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) {
              setFormData({ key: '', name: '', description: '' });
              setFormErrors({});
            }
          }}
          title="Create role"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.key ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.key && <p className="mt-1 text-sm text-red-600">{formErrors.key}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => createRoleMutation.mutate()}
                isLoading={createRoleMutation.isPending}
                disabled={createRoleMutation.isPending}
              >
                Create
              </Button>
            </div>
          </div>
        </Modal>

        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete role"
          description="Are you sure you want to delete this role?"
          confirmLabel={deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
          variant="danger"
          isLoading={deleteRoleMutation.isPending}
          onConfirm={() => deleteRoleMutation.mutate()}
        />
      </div>
    </PageTransition>
  );
}

