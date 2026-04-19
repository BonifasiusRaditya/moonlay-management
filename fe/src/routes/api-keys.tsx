import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiKey, getApiKeys, invalidateApiKey, deleteApiKey } from '@/api/api-keys';
import { fetchClients } from '@/api/clients';
import type { ApiKey, ApiKeyWithToken, CreateApiKeyDTO } from '@/types/api-key';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Modal } from '@/components/modal';
import { DateDisplay } from '@/components/date_display';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import { PageSkeleton } from '@/components/loading_skeleton';
import { PageTransition } from '@/components/page_transition';
import { DataTable, type DataTableColumn, type RowAction } from '@/components/datatable';
import { useUserStore } from '@/Session/userSession';
import { useNotificationStore } from '@/Session/notificationSession';
import { canSeeClientDimension } from '@/utils/permissions';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Key, Copy, Trash2, X, AlertCircle } from 'lucide-react';

const createApiKeySchema = z.object({
  client_id: z.number().int().positive('Please select a client'),
  name: z.string().max(255, 'Name must be less than 255 characters').optional(),
  expires_at: z.string().datetime().optional().nullable(),
  last_used_at: z.string().datetime().optional().nullable(),
});

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { user } = useUserStore();
  const canSeeClients = canSeeClientDimension(user);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInvalidateConfirm, setShowInvalidateConfirm] = useState(false);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<number | null>(null);
  const [apiKeyToInvalidate, setApiKeyToInvalidate] = useState<number | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyWithToken | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<CreateApiKeyDTO>>({
    client_id: canSeeClients ? 0 : user?.client_id || 0,
    name: '',
    expires_at: null,
    last_used_at: null,
  });
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(
    canSeeClients ? undefined : user?.client_id
  );

  // Fetch clients (for superadmin to select)
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    enabled: canSeeClients,
  });

  // Fetch API keys
  const { data: apiKeys = [], isLoading, error } = useQuery({
    queryKey: ['api-keys', selectedClientId],
    queryFn: () => getApiKeys(selectedClientId),
    enabled: !!selectedClientId || canSeeClients,
  });

  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setIsCreateModalOpen(false);
      setFormErrors({});
      setFormData({ client_id: user?.client_id || 0, name: '', expires_at: null });
      setNewlyCreatedKey(data);
      addNotification({
        type: 'success',
        title: 'API key created',
        message: 'API key created successfully. Make sure to copy it now - it will not be shown again.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to create API key',
        message: error.response?.data?.error || 'An error occurred while creating the API key.',
      });
    },
  });


  const invalidateMutation = useMutation({
    mutationFn: invalidateApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setShowInvalidateConfirm(false);
      setApiKeyToInvalidate(null);
      addNotification({
        type: 'success',
        title: 'API key invalidated',
        message: 'API key has been invalidated successfully.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to invalidate API key',
        message: error.response?.data?.error || 'An error occurred while invalidating the API key.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setShowDeleteConfirm(false);
      setApiKeyToDelete(null);
      addNotification({
        type: 'success',
        title: 'API key deleted',
        message: 'API key has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to delete API key',
        message: error.response?.data?.error || 'An error occurred while deleting the API key.',
      });
    },
  });

  const clearFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createApiKeySchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setFormErrors(errors);
      return;
    }
    createMutation.mutate(result.data as CreateApiKeyDTO);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification({
      type: 'success',
      title: 'Copied',
      message: 'API key copied to clipboard.',
    });
  };

  const getStatusBadge = (apiKey: ApiKey) => {
    if (!apiKey.is_active) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Inactive</span>;
    }
    if (apiKey.expires_at && dayjs(apiKey.expires_at).isBefore(dayjs())) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Expired</span>;
    }
    if (apiKey.expires_in_days !== null && apiKey.expires_in_days <= 7) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Expiring Soon</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Active</span>;
  };

  const columns: DataTableColumn<ApiKey>[] = useMemo(() => {
    const base: DataTableColumn<ApiKey>[] = [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (k) => k.name || `API Key ${k.key_prefix}...`,
        sortable: true,
        filterable: true,
        filterType: 'text',
        cell: (k) => <span className="font-medium text-gray-900">{k.name || `API Key ${k.key_prefix}...`}</span>,
      },
      {
        id: 'key_prefix',
        header: 'Key Prefix',
        accessorFn: (k) => `${k.key_prefix}...`,
        sortable: true,
        filterable: true,
        filterType: 'text',
        cell: (k) => <span className="font-mono text-sm text-gray-700">{k.key_prefix}...</span>,
      },
    ];

    if (canSeeClients) {
      base.push({
        id: 'client',
        header: 'Client',
        accessorFn: (k) => String(k.client_id),
        filterable: true,
        filterType: 'select',
        filterOptions: clients.map((c) => ({ label: c.name, value: String(c.id) })),
        cell: (k) => {
          const clientName = clients.find((c) => c.id === k.client_id)?.name;
          return <span className="text-sm text-gray-700">{clientName || k.client_id}</span>;
        },
      });
    }

    base.push(
      {
        id: 'status',
        header: 'Status',
        accessorFn: (k) => (k.is_active ? 'active' : 'inactive'),
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Expired', value: 'expired' },
        ],
        cell: (k) => getStatusBadge(k),
      },
      {
        id: 'expires_at',
        header: 'Expires',
        accessorKey: 'expires_at',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (k) =>
          k.expires_at ? (
            <span className="text-sm text-gray-700">
              <DateDisplay date={k.expires_at} /> ({k.expires_in_days} days)
            </span>
          ) : (
            <span className="text-sm text-gray-500">Never</span>
          ),
      },
      {
        id: 'last_used_at',
        header: 'Last Used',
        accessorKey: 'last_used_at',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (k) => (k.last_used_at ? <DateDisplay date={k.last_used_at} /> : <span className="text-sm text-gray-500">—</span>),
      },
      {
        id: 'created_at',
        header: 'Created',
        accessorKey: 'created_at',
        sortable: true,
        filterable: true,
        filterType: 'date',
        cell: (k) => <DateDisplay date={k.created_at} />,
      },
    );

    return base;
  }, [canSeeClients, clients]);

  const rowActions: RowAction<ApiKey>[] = useMemo(() => {
    return [
      {
        id: 'invalidate',
        label: 'Invalidate',
        icon: <X className="h-4 w-4" />,
        show: (k) => k.is_active,
        onClick: (k) => {
          setApiKeyToInvalidate(k.id);
          setShowInvalidateConfirm(true);
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'danger',
        onClick: (k) => {
          setApiKeyToDelete(k.id);
          setShowDeleteConfirm(true);
        },
      },
    ];
  }, []);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <PageTransition>
        <Card>
          <div className="text-red-600">Error loading API keys. Please try again.</div>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={createMutation.isPending}
            className="flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            Create API Key
          </Button>
        </div>

        {/* Client filter (for permitted users) */}
        {canSeeClients && (
          <Card>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Client:</label>
              <select
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        )}

        <DataTable
          data={apiKeys}
          columns={columns}
          rowActions={rowActions}
          isLoading={isLoading}
          rowIdAccessor="id"
          exportable
          exportFilename="api-keys"
          tableId="api-keys-table"
          emptyState={
            <div className="text-center py-8 text-gray-500">
              <Key className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No API keys found. Create your first API key to get started.</p>
            </div>
          }
        />

        {/* Create Modal */}
        <Modal
          open={isCreateModalOpen}
          onOpenChange={(open) => {
            setIsCreateModalOpen(open);
            if (!open) {
              setFormErrors({});
              setFormData({ client_id: canSeeClients ? 0 : user?.client_id || 0, name: '', expires_at: null });
            }
          }}
          title="Create API Key"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {!canSeeClients && <input type="hidden" value={formData.client_id || 0} readOnly />}
            {canSeeClients && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.client_id || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, client_id: parseInt(e.target.value, 10) });
                    clearFieldError('client_id');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.client_id
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select a client</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Optional)</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  clearFieldError('name');
                }}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="e.g., Production API Key"
              />
              {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (Optional)</label>
              <input
                type="datetime-local"
                value={formData.expires_at ? dayjs(formData.expires_at).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    expires_at: e.target.value ? dayjs(e.target.value).toISOString() : null,
                  });
                  clearFieldError('expires_at');
                }}
                min={dayjs().format('YYYY-MM-DDTHH:mm')}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.expires_at
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {formErrors.expires_at && <p className="mt-1 text-sm text-red-600">{formErrors.expires_at}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormErrors({});
                  setFormData({ client_id: user?.client_id || 0, name: '', expires_at: null });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create API Key'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Newly Created Key Modal */}
        {newlyCreatedKey && (
          <Modal
            open={!!newlyCreatedKey}
            onOpenChange={(open) => {
              if (!open) setNewlyCreatedKey(null);
            }}
            title="API Key Created Successfully"
          >
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important: Save this key now!</p>
                  <p>This is the only time you will see the full API key. Make sure to copy it to a secure location.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newlyCreatedKey.key}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => copyToClipboard(newlyCreatedKey.key)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setNewlyCreatedKey(null)}>I've Saved the Key</Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation */}
        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete API Key"
          description="Are you sure you want to delete this API key? This action cannot be undone and will immediately invalidate the key."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            if (apiKeyToDelete) {
              deleteMutation.mutate(apiKeyToDelete);
            }
          }}
        />

        {/* Invalidate Confirmation */}
        <ConfirmationDialog
          open={showInvalidateConfirm}
          onOpenChange={setShowInvalidateConfirm}
          title="Invalidate API Key"
          description="Are you sure you want to invalidate this API key? It will no longer be usable but can be reactivated later."
          confirmLabel="Invalidate"
          variant="warning"
          onConfirm={() => {
            if (apiKeyToInvalidate) {
              invalidateMutation.mutate(apiKeyToInvalidate);
            }
          }}
        />
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/api-keys')({
  component: ApiKeysPage,
});

