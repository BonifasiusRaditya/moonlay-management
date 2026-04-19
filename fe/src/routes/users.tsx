import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, createUser, updateUser, deleteUser, type CreateUserResult } from '@/api/users';
import { fetchClients } from '@/api/clients';
import { fetchBranches } from '@/api/branches';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { DateDisplay } from '@/components/date_display';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import { PageSkeleton } from '@/components/loading_skeleton';
import { PageTransition } from '@/components/page_transition';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUserStore } from '@/stores/userStore';
import { z } from 'zod';
import type { User } from '@/api/users';
import { createUserSchema, updateUserSchema } from '@/api/users';
import { generateRandomPassword } from '@/utils/password';
import { canSeeClientDimension } from '@/utils/permissions';
import { requireAuthBeforeLoad } from '@/utils/route_guards';
import { DataTable, type DataTableColumn, type RowAction } from '@/components/datatable';
import { Edit, Trash2 } from 'lucide-react';

function UsersPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { user: currentUser } = useUserStore();
  const canSeeClients = canSeeClientDimension(currentUser);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showTempPasswordDialog, setShowTempPasswordDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<z.infer<typeof createUserSchema>>>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    client_id: currentUser?.client_id || 0,
    branch_id: currentUser?.branch_id || undefined,
    must_change_password: false,
  });
  const [editFormData, setEditFormData] = useState<Partial<z.infer<typeof updateUserSchema>>>({
    name: '',
    email: '',
    password: '',
    role: undefined,
    branch_id: undefined,
    must_change_password: undefined,
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    enabled: canSeeClients,
  });

  const { data: allBranches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetchBranches(),
  });

  // Filter branches based on selected client in create form
  const availableBranches = useMemo(() => {
    if (formData.client_id) {
      return allBranches.filter((branch) => branch.client_id === formData.client_id);
    }
    return [];
  }, [allBranches, formData.client_id]);

  // Filter branches based on selected client in edit form
  const availableEditBranches = useMemo(() => {
    if (selectedUser?.client_id) {
      return allBranches.filter((branch) => branch.client_id === selectedUser.client_id);
    }
    return [];
  }, [allBranches, selectedUser?.client_id]);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (result: CreateUserResult) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      setFormErrors({});
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        client_id: currentUser?.client_id || 0,
        branch_id: currentUser?.branch_id || undefined,
      });
      setShowCreateConfirm(false);
      if (result.temporaryPassword) {
        setTempPassword(result.temporaryPassword);
        setShowTempPasswordDialog(true);
      }
      addNotification({
        type: 'success',
        title: 'User created',
        message: 'The user has been created successfully.',
      });
    },
    onError: (error: any) => {
      console.log(error)
      addNotification({
        type: 'error',
        title: 'Create failed',
        message: error?.message || 'Failed to create the user. Please try again.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof updateUserSchema> }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditModalOpen(false);
      setShowUpdateConfirm(false);
      setSelectedUser(null);
      setEditFormData({
        name: '',
        email: '',
        password: '',
        role: undefined,
        branch_id: undefined,
      });
      setFormErrors({});
      addNotification({
        type: 'success',
        title: 'User updated',
        message: 'The user has been updated successfully.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: error?.message || 'Failed to update the user. Please try again.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      addNotification({
        type: 'success',
        title: 'User deleted',
        message: 'The user has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error?.message || 'Failed to delete the user. Please try again.',
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = createUserSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setFormErrors(errors);
      return;
    }

    setShowCreateConfirm(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormErrors({});

    const result = updateUserSchema.safeParse(editFormData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setFormErrors(errors);
      return;
    }

    setShowUpdateConfirm(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: (user.role as z.infer<typeof updateUserSchema>['role']) || undefined,
      branch_id: user.branch_id || undefined,
      must_change_password: user.must_change_password,
    });
    setIsEditModalOpen(true);
    setFormErrors({});
  };

  // Define table columns
  const columns: DataTableColumn<User>[] = useMemo(() => {
    const baseColumns: DataTableColumn<User>[] = [
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        sortable: true,
        filterable: true,
        filterType: 'text',
        cell: (user) => <span className="font-medium text-gray-900">{user.name}</span>,
      },
      {
        id: 'email',
        header: 'Email',
        accessorKey: 'email',
        sortable: true,
        filterable: true,
        filterType: 'text',
      },
      {
        id: 'role',
        header: 'Role',
        accessorKey: 'role',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'Admin', value: 'admin' },
          { label: 'Staff', value: 'staff' },
        ],
        cell: (user) => (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {user.role || 'N/A'}
          </span>
        ),
      },
    ];

    if (canSeeClients) {
      baseColumns.push({
        id: 'client',
        header: 'Client',
        accessorFn: (user) => clients.find((c) => c.id === user.client_id)?.name || '-',
        filterable: true,
        filterType: 'select',
        filterOptions: clients.map((c) => ({ label: c.name, value: c.name })),
      });
    }

    baseColumns.push(
      {
        id: 'branch',
        header: 'Branch',
        accessorFn: (user) => allBranches.find((b) => b.id === user.branch_id)?.name || '-',
        filterable: true,
        filterType: 'text',
      },
      {
        id: 'created_at',
        header: 'Created At',
        accessorKey: 'createdAt',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (user) => <DateDisplay date={user.createdAt} />,
      },
      {
        id: 'updated_at',
        header: 'Updated At',
        accessorKey: 'updatedAt',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (user) => <DateDisplay date={user.updatedAt} />,
      }
    );

    return baseColumns;
  }, [canSeeClients, clients, allBranches]);

  // Define row actions
  const rowActions: RowAction<User>[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: (user) => handleEditClick(user),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (user) => {
        setUserToDelete(user.id);
        setShowDeleteConfirm(true);
      },
      variant: 'danger',
    },
  ];

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <Button
            variant="primary"
            onClick={() => {
              setIsCreateModalOpen(true);
              setFormData({
                name: '',
                email: '',
                password: '',
                role: 'staff',
                client_id: currentUser?.client_id || 0,
                branch_id: currentUser?.branch_id || undefined,
              });
              setFormErrors({});
            }}
            disabled={createMutation.isPending}
          >
            Create User
          </Button>
        </div>

        {/* Users DataTable */}
        <DataTable
          data={users}
          columns={columns}
          rowActions={rowActions}
          isLoading={isLoading}
          rowIdAccessor="id"
          exportable
          exportFilename="users"
          tableId="users-table"
          emptyState={
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No users found</p>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Create First User
              </Button>
            </div>
          }
        />

        {/* Create User Modal */}
        <Modal
          open={isCreateModalOpen}
          onOpenChange={(open) => {
            setIsCreateModalOpen(open);
            if (!open) {
              setFormErrors({});
              setFormData({
                name: '',
                email: '',
                password: '',
                role: 'staff',
                client_id: currentUser?.client_id || 0,
                branch_id: currentUser?.branch_id || undefined,
              });
            }
          }}
          className='max-w-2xl'
          title="Create User"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter user name"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) {
                    setFormErrors({ ...formErrors, email: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter user email"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Password (optional)</label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const generated = generateRandomPassword(12);
                    setFormData({ ...formData, password: generated });
                    if (formErrors.password) {
                      setFormErrors({ ...formErrors, password: '' });
                    }
                  }}
                >
                  Generate
                </Button>
              </div>
              <input
                type="text"
                value={formData.password || ''}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (formErrors.password) {
                    setFormErrors({ ...formErrors, password: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter password (min 6 characters) or leave blank to auto-generate"
              />
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="must_change_password"
                type="checkbox"
                checked={!!formData.must_change_password}
                onChange={(e) => setFormData({ ...formData, must_change_password: e.target.checked })}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="must_change_password" className="text-sm text-gray-700">
                Require password change on next login
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={formData.role || 'staff'}
                onChange={(e) => {
                  setFormData({ ...formData, role: e.target.value as z.infer<typeof createUserSchema>['role'] });
                  if (formErrors.role) {
                    setFormErrors({ ...formErrors, role: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
              {formErrors.role && (
                <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select
                value={formData.client_id || 0}
                onChange={(e) => {
                  const clientId = parseInt(e.target.value, 10);
                  setFormData({ 
                    ...formData, 
                    client_id: clientId,
                    branch_id: undefined, // Reset branch when client changes
                  });
                  if (formErrors.client_id) {
                    setFormErrors({ ...formErrors, client_id: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.client_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value={0}>Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.code})
                  </option>
                ))}
              </select>
              {formErrors.client_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.client_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                value={formData.branch_id || ''}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    branch_id: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  });
                  if (formErrors.branch_id) {
                    setFormErrors({ ...formErrors, branch_id: '' });
                  }
                }}
                disabled={!formData.client_id || formData.client_id === 0}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.branch_id ? 'border-red-500' : 'border-gray-300'
                } ${!formData.client_id || formData.client_id === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">No branch (optional)</option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
              {formErrors.branch_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.branch_id}</p>
              )}
              {(!formData.client_id || formData.client_id === 0) && (
                <p className="mt-1 text-xs text-gray-500">Please select a client first</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setFormErrors({});
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      role: 'staff',
                      client_id: currentUser?.client_id || 0,
                      branch_id: currentUser?.branch_id || undefined,
                      must_change_password: false,
                    });
                  }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createMutation.isPending}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) {
              setSelectedUser(null);
              setEditFormData({ name: '', email: '', password: '', role: undefined, branch_id: undefined, must_change_password: undefined });
              setFormErrors({});
            }
          }}
          className='max-w-2xl'
          title="Edit User"
        >
          {selectedUser && (
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, name: e.target.value });
                    if (formErrors.name) {
                      setFormErrors({ ...formErrors, name: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter user name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors({ ...formErrors, email: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter user email"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={editFormData.password || ''}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, password: e.target.value });
                    if (formErrors.password) {
                      setFormErrors({ ...formErrors, password: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Leave blank to keep current password"
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Leave blank to keep current password</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="must_change_password_edit"
                  type="checkbox"
                  checked={!!editFormData.must_change_password}
                  onChange={(e) => setEditFormData({ ...editFormData, must_change_password: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="must_change_password_edit" className="text-sm text-gray-700">
                  Require password change on next login
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editFormData.role || selectedUser?.role || 'staff'}
                  onChange={(e) => {
                    setEditFormData({
                      ...editFormData,
                      role: e.target.value as z.infer<typeof updateUserSchema>['role'],
                    });
                    if (formErrors.role) {
                      setFormErrors({ ...formErrors, role: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={selectedUser?.role === 'superadmin'}
                >
                  {selectedUser?.role === 'superadmin' ? (
                    <option value="superadmin">Super Admin (cannot be changed)</option>
                  ) : (
                    <>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="viewer">Viewer</option>
                    </>
                  )}
                </select>
                {formErrors.role && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <input
                  type="text"
                  value={selectedUser?.client?.name || 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Client cannot be changed after user creation</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  value={editFormData.branch_id || ''}
                  onChange={(e) => {
                    setEditFormData({ 
                      ...editFormData, 
                      branch_id: e.target.value ? parseInt(e.target.value, 10) : null,
                    });
                    if (formErrors.branch_id) {
                      setFormErrors({ ...formErrors, branch_id: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formErrors.branch_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">No branch (optional)</option>
                  {availableEditBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
                {formErrors.branch_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.branch_id}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  setEditFormData({ name: '', email: '', password: '', role: undefined, branch_id: undefined, must_change_password: undefined });
                    setFormErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={updateMutation.isPending}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          open={showCreateConfirm}
          onOpenChange={setShowCreateConfirm}
          title="Create User"
          description="Are you sure you want to create this user?"
          confirmLabel={createMutation.isPending ? 'Creating...' : 'Create'}
          variant="info"
          isLoading={createMutation.isPending}
          onConfirm={() => {
            const createData = {
              ...formData,
              client_id: currentUser?.role === 'superadmin' ? formData.client_id : currentUser?.client_id || 0,
            } as z.infer<typeof createUserSchema>;

            createMutation.mutate(createData);
          }}
        />

        <ConfirmationDialog
          open={showUpdateConfirm}
          onOpenChange={setShowUpdateConfirm}
          title="Update User"
          description="Are you sure you want to update this user?"
          confirmLabel={updateMutation.isPending ? 'Updating...' : 'Update'}
          variant="info"
          isLoading={updateMutation.isPending}
          onConfirm={() => {
            if (selectedUser) {
              // Remove password from data if it's empty
              const updateData = { ...editFormData };
              if (!updateData.password || updateData.password.trim() === '') {
                delete updateData.password;
              }
              updateMutation.mutate({
                id: selectedUser.id,
                data: updateData as z.infer<typeof updateUserSchema>,
              });
            }
          }}
        />

        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete User"
          description="Are you sure you want to delete this user? This action cannot be undone."
          confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            if (userToDelete) {
              deleteMutation.mutate(userToDelete);
            }
          }}
        />

        <Modal
          title="Temporary Password"
          open={showTempPasswordDialog}
          onOpenChange={(open) => {
            setShowTempPasswordDialog(open);
            if (!open) {
              setTempPassword(null);
            }
          }}
        >
          <p className="text-sm text-gray-600">
            Copy and share this password securely. It will not be shown again.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              readOnly
              value={tempPassword || ''}
              className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-900"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (tempPassword) {
                  navigator.clipboard?.writeText(tempPassword);
                  addNotification({
                    type: 'success',
                    title: 'Copied',
                    message: 'Temporary password copied to clipboard.',
                  });
                }
              }}
            >
              Copy
            </Button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/users')({
  beforeLoad: async ({ location }) => {
    await requireAuthBeforeLoad(location.href);
  },
  component: UsersPage,
});
