import { createFileRoute, redirect } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBranches, createBranch, updateBranch, deleteBranch } from '@/api/branches';
import { fetchClients } from '@/api/clients';
import { branchSchema } from '@/schemas/branch';
import type { Branch } from '@/types/branch';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Modal } from '@/components/modal';
import { DateDisplay } from '@/components/date_display';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import { PageSkeleton } from '@/components/loading_skeleton';
import { PageTransition } from '@/components/page_transition';
import { DataTable, type DataTableColumn, type RowAction } from '@/components/datatable';
import { useUserStore } from '@/stores/userStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { canSeeClientDimension } from '@/utils/permissions';
import { Edit, Trash2 } from 'lucide-react';
import { z } from 'zod';

function BranchesPage() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const canSeeClients = canSeeClientDimension(user);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(canSeeClients ? undefined : user?.client_id || undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<number | null>(null);
  const [pendingUpdateData, setPendingUpdateData] = useState<{ id: number; data: Partial<z.infer<typeof branchSchema>> } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<z.infer<typeof branchSchema>>>({
    client_id: canSeeClients ? 0 : user?.client_id || 0,
    name: '',
    code: '',
    address: '',
    city: '',
    country: '',
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    enabled: canSeeClients,
  });

  const { data: branches = [], isLoading, error } = useQuery({
    queryKey: ['branches', selectedClientId],
    queryFn: () => fetchBranches(selectedClientId),
  });

  const handleEdit = useCallback((branch: Branch) => {
    setEditingBranch(branch);
    setFormErrors({});
    setFormData({
      client_id: branch.client_id,
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      city: branch.city || '',
      country: branch.country || '',
    });
  }, []);

  const clientNameById = useMemo(() => {
    return new Map<number, string>(clients.map((c) => [c.id, c.name]));
  }, [clients]);

  const columns: DataTableColumn<Branch>[] = useMemo(() => {
    const base: DataTableColumn<Branch>[] = [
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        sortable: true,
        filterable: true,
        filterType: 'text',
        cell: (branch) => <span className="font-medium text-gray-900">{branch.name}</span>,
      },
      {
        id: 'code',
        header: 'Code',
        accessorKey: 'code',
        sortable: true,
        filterable: true,
        filterType: 'text',
      },
    ];

    if (canSeeClients) {
      base.push({
        id: 'client',
        header: 'Client',
        accessorFn: (branch) => clientNameById.get(branch.client_id) || '-',
        filterable: true,
        filterType: 'select',
        filterOptions: clients.map((c) => ({ label: c.name, value: c.name })),
      });
    }

    base.push(
      {
        id: 'address',
        header: 'Address',
        accessorFn: (branch) => branch.address || '-',
        filterable: true,
        filterType: 'text',
      },
      {
        id: 'city',
        header: 'City',
        accessorFn: (branch) => branch.city || '-',
        filterable: true,
        filterType: 'text',
      },
      {
        id: 'country',
        header: 'Country',
        accessorFn: (branch) => branch.country || '-',
        filterable: true,
        filterType: 'text',
      },
      {
        id: 'created_at',
        header: 'Created',
        accessorKey: 'created_at',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (branch) => <DateDisplay date={branch.created_at} format="DD MMM YYYY" />,
      },
    );

    return base;
  }, [canSeeClients, clientNameById, clients]);

  const createMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsCreateModalOpen(false);
      setFormErrors({});
      setFormData({ client_id: canSeeClients ? 0 : user?.client_id || 0, name: '', code: '', address: '', city: '', country: '' });
      addNotification({
        type: 'success',
        title: 'Branch created',
        message: 'The branch has been created successfully.',
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create the branch. Please try again.';
      addNotification({
        type: 'error',
        title: 'Create failed',
        message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<z.infer<typeof branchSchema>> }) =>
      updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setEditingBranch(null);
      setPendingUpdateData(null);
      setShowUpdateConfirm(false);
      setFormErrors({});
      setFormData({ client_id: canSeeClients ? 0 : user?.client_id || 0, name: '', code: '', address: '', city: '', country: '' });
      addNotification({
        type: 'success',
        title: 'Branch updated',
        message: 'The branch has been updated successfully.',
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update the branch. Please try again.';
      addNotification({
        type: 'error',
        title: 'Update failed',
        message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowDeleteConfirm(false);
      setBranchToDelete(null);
      addNotification({
        type: 'success',
        title: 'Branch deleted',
        message: 'The branch has been deleted successfully.',
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to delete the branch. Please try again.';
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message,
      });
    },
  });

  const rowActions: RowAction<Branch>[] = useMemo(() => {
    return [
      {
        id: 'edit',
        label: 'Edit',
        icon: <Edit className="h-4 w-4" />,
        onClick: (branch) => {
          if (updateMutation.isPending || deleteMutation.isPending) return;
          handleEdit(branch);
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'danger',
        onClick: (branch) => {
          if (updateMutation.isPending || deleteMutation.isPending) return;
          setBranchToDelete(branch.id);
          setShowDeleteConfirm(true);
        },
      },
    ];
  }, [deleteMutation.isPending, handleEdit, updateMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for validation
    const dataToValidate = {
      client_id: canSeeClients ? formData.client_id : user?.client_id || 0,
      name: formData.name?.trim() || '',
      code: formData.code?.trim() || '',
      address: formData.address?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      country: formData.country?.trim() || undefined,
    };
    
    // Validate using Zod
    const result = branchSchema.safeParse(dataToValidate);
    
    if (!result.success) {
      // Map Zod errors to form errors
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setFormErrors(errors);
      return;
    }
    
    // Clear errors if validation passes
    setFormErrors({});
    
    if (editingBranch) {
      setPendingUpdateData({ id: editingBranch.id, data: result.data });
      setShowUpdateConfirm(true);
    } else {
      createMutation.mutate(result.data);
    }
  };
  
  const clearFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div>
        <Card className="bg-red-50 border border-red-200">
          <p className="text-red-600">Failed to load branches</p>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button
            variant="primary"
            onClick={() => {
              setIsCreateModalOpen(true);
              setEditingBranch(null);
              setFormErrors({});
              setFormData({ client_id: canSeeClients ? 0 : user?.client_id || 0, name: '', code: '', address: '', city: '', country: '' });
            }}
          >
            Add Branch
          </Button>
        </div>

      {canSeeClients && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Client
          </label>
          <select
            value={selectedClientId || ''}
            onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <DataTable
        data={branches}
        columns={columns}
        rowActions={rowActions}
        isLoading={isLoading}
        rowIdAccessor="id"
        exportable
        exportFilename="branches"
        tableId="branches-table"
        emptyState={
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No branches found</p>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              Create First Branch
            </Button>
          </div>
        }
      />

        <Modal
          open={isCreateModalOpen || editingBranch !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false);
              setEditingBranch(null);
              setFormErrors({});
              setFormData({ client_id: canSeeClients ? 0 : user?.client_id || 0, name: '', code: '', address: '', city: '', country: '' });
            }
          }}
          title={editingBranch ? 'Edit Branch' : 'Create Branch'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {!canSeeClients && <input type="hidden" value={formData.client_id} readOnly />}
            {canSeeClients && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <select
                  value={formData.client_id || 0}
                  onChange={(e) => {
                    setFormData({ ...formData, client_id: Number(e.target.value) });
                    clearFieldError('client_id');
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                    formErrors.client_id
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  required
                >
                  <option value={0}>Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {formErrors.client_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.client_id}</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  clearFieldError('name');
                }}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                  formErrors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                }`}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  clearFieldError('code');
                }}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                  formErrors.code
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                }`}
              />
              {formErrors.code && (
                <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingBranch(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingBranch ? (updateMutation.isPending ? 'Updating...' : 'Update') : (createMutation.isPending ? 'Creating...' : 'Create')}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Branch"
          description="Are you sure you want to delete this branch? This action cannot be undone."
          confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            if (branchToDelete !== null) {
              deleteMutation.mutate(branchToDelete);
            }
          }}
        />

        <ConfirmationDialog
          open={showUpdateConfirm}
          onOpenChange={setShowUpdateConfirm}
          title="Update Branch"
          description="Are you sure you want to update this branch?"
          confirmLabel={updateMutation.isPending ? 'Updating...' : 'Update'}
          variant="info"
          isLoading={updateMutation.isPending}
          onConfirm={() => {
            if (pendingUpdateData) {
              updateMutation.mutate(pendingUpdateData);
            }
          }}
        />
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/branches')({
  beforeLoad: () => {
    const { token, user } = useUserStore.getState();
    if (!token || !user) {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }
  },
  component: BranchesPage,
});
