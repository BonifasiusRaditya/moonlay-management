import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClients, createClient, updateClient, deleteClient, type CreateClientResult } from '@/api/clients';
import { clientSchema } from '@/schemas/client';
import type { Client } from '@/types/client';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Modal } from '@/components/modal';
import { DateDisplay } from '@/components/date_display';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import { PageSkeleton } from '@/components/loading_skeleton';
import { PageTransition } from '@/components/page_transition';
import { requirePermissionBeforeLoad } from '@/utils/route_guards';
import { useNotificationStore } from '@/Session/notificationSession';
import { z } from 'zod';
import { generateRandomPassword } from '@/utils/password';
import { DataTable, type DataTableColumn, type RowAction } from '@/components/datatable';
import { Edit, Trash2 } from 'lucide-react';

function ClientsPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showAdminPasswordDialog, setShowAdminPasswordDialog] = useState(false);
  const [adminTempPassword, setAdminTempPassword] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [pendingUpdateData, setPendingUpdateData] = useState<{ id: number; data: Partial<z.infer<typeof clientSchema>> } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<z.infer<typeof clientSchema>>>({
    name: '',
    code: '',
    address: '',
    phone: '',
    country: '',
    admin_email: '',
    admin_password: '',
  });

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (result: CreateClientResult) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsCreateModalOpen(false);
      setFormErrors({});
      setFormData({ name: '', code: '', address: '', phone: '', country: '', admin_email: '', admin_password: '' });
      if (result.adminTemporaryPassword) {
        setAdminTempPassword(result.adminTemporaryPassword);
        setShowAdminPasswordDialog(true);
      }
      addNotification({
        type: 'success',
        title: 'Client created',
        message: 'The client has been created successfully.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Create failed',
        message: error?.message || 'Failed to create the client. Please try again.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<z.infer<typeof clientSchema>> }) =>
      updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditingClient(null);
      setPendingUpdateData(null);
      setShowUpdateConfirm(false);
      setFormErrors({});
      setFormData({ name: '', code: '', address: '', phone: '', country: '', admin_email: '', admin_password: '' });
      addNotification({
        type: 'success',
        title: 'Client updated',
        message: 'The client has been updated successfully.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: error?.message || 'Failed to update the client. Please try again.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowDeleteConfirm(false);
      setClientToDelete(null);
      addNotification({
        type: 'success',
        title: 'Client deleted',
        message: 'The client has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error?.message || 'Failed to delete the client. Please try again.',
      });
    },
  });

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormErrors({});
    setFormData({
      name: client.name,
      code: client.code,
      address: client.address || '',
      phone: client.phone || '',
      country: client.country || '',
      admin_email: '',
      admin_password: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for validation
    const dataToValidate = {
      name: formData.name?.trim() || '',
      code: formData.code?.trim() || '',
      address: formData.address?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      country: formData.country?.trim() || undefined,
      admin_email: formData.admin_email?.trim() || undefined,
      admin_password: formData.admin_password || undefined,
    };

    const createValidation = clientSchema.safeParse(dataToValidate);
    const updateValidation = clientSchema
      .omit({ admin_email: true, admin_password: true })
      .safeParse(dataToValidate);

    const validationResult = editingClient ? updateValidation : createValidation;

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setFormErrors(errors);
      return;
    }
    
    // Clear errors if validation passes
    setFormErrors({});
    
    if (editingClient) {
      setPendingUpdateData({ id: editingClient.id, data: validationResult.data });
      setShowUpdateConfirm(true);
    } else {
      createMutation.mutate(validationResult.data as z.infer<typeof clientSchema>);
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

  // Define table columns
  const columns: DataTableColumn<Client>[] = useMemo(() => [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (client) => <span className="font-medium text-gray-900">{client.name}</span>,
    },
    {
      id: 'code',
      header: 'Code',
      accessorKey: 'code',
      sortable: true,
      filterable: true,
      filterType: 'text',
    },
    {
      id: 'address',
      header: 'Address',
      accessorKey: 'address',
      filterable: true,
      filterType: 'text',
      cell: (client) => client.address || '-',
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      filterable: true,
      filterType: 'text',
      cell: (client) => client.phone || '-',
    },
    {
      id: 'country',
      header: 'Country',
      accessorKey: 'country',
      filterable: true,
      filterType: 'text',
      cell: (client) => client.country || '-',
    },
    {
      id: 'created_at',
      header: 'Created',
      accessorKey: 'created_at',
      sortable: true,
      filterable: true,
      filterType: 'date',
      cell: (client) => <DateDisplay date={client.created_at} format="DD MMM YYYY" />,
    },
  ], []);

  // Define row actions
  const rowActions: RowAction<Client>[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: (client) => handleEdit(client),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (client) => {
        setClientToDelete(client.id);
        setShowDeleteConfirm(true);
      },
      variant: 'danger',
    },
  ];

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div>
        <Card className="bg-red-50 border border-red-200">
          <p className="text-red-600">Failed to load clients</p>
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
              setEditingClient(null);
              setFormErrors({});
      setFormData({ name: '', code: '', address: '', phone: '', country: '', admin_email: '', admin_password: '' });
            }}
          >
            Add Client
          </Button>
        </div>

      <DataTable
        data={clients}
        columns={columns}
        rowActions={rowActions}
        isLoading={isLoading}
        rowIdAccessor="id"
        exportable
        exportFilename="clients"
        tableId="clients-table"
        emptyState={
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No clients found</p>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              Create First Client
            </Button>
          </div>
        }
      />

        <Modal
          open={isCreateModalOpen || editingClient !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false);
              setEditingClient(null);
              setFormErrors({});
              setFormData({ name: '', code: '', address: '', phone: '', country: '', admin_email: '', admin_password: '' });
            }
          }}
          title={editingClient ? 'Edit Client' : 'Create Client'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
                Phone
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            {!editingClient && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    value={formData.admin_email || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, admin_email: e.target.value });
                      clearFieldError('admin_email');
                    }}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                      formErrors.admin_email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {formErrors.admin_email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.admin_email}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Admin Password (optional)
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const generated = generateRandomPassword(12);
                        setFormData({ ...formData, admin_password: generated });
                        clearFieldError('admin_password');
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                  <input
                    type="text"
                    value={formData.admin_password || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, admin_password: e.target.value });
                      clearFieldError('admin_password');
                    }}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                      formErrors.admin_password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {formErrors.admin_password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.admin_password}</p>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingClient(null);
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
                {editingClient ? (updateMutation.isPending ? 'Updating...' : 'Update') : (createMutation.isPending ? 'Creating...' : 'Create')}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Client"
          description="Are you sure you want to delete this client? This action cannot be undone."
          confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            if (clientToDelete !== null) {
              deleteMutation.mutate(clientToDelete);
            }
          }}
        />

        <ConfirmationDialog
          open={showUpdateConfirm}
          onOpenChange={setShowUpdateConfirm}
          title="Update Client"
          description="Are you sure you want to update this client?"
          confirmLabel={updateMutation.isPending ? 'Updating...' : 'Update'}
          variant="info"
          isLoading={updateMutation.isPending}
          onConfirm={() => {
            if (pendingUpdateData) {
              updateMutation.mutate(pendingUpdateData);
            }
          }}
        />

        <Modal
          title="Temporary Admin Password"
          open={showAdminPasswordDialog}
          onOpenChange={(open) => {
            setShowAdminPasswordDialog(open);
            if (!open) {
              setAdminTempPassword(null);
            }
          }}
        >
          <p className="text-sm text-gray-600">
            Share this password securely with the client admin. It is shown only once.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              readOnly
              value={adminTempPassword || ''}
              className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-900"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (adminTempPassword) {
                  navigator.clipboard?.writeText(adminTempPassword);
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

export const Route = createFileRoute('/clients')({
  beforeLoad: requirePermissionBeforeLoad('admin.clients:read'),
  component: ClientsPage,
});
