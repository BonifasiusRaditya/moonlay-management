import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs, fetchAuditLogsByTable, type AuditLog } from '@/api/audit-logs';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { PageSkeleton } from '@/components/loading_skeleton';
import { PageTransition } from '@/components/page_transition';
import { useNotificationStore } from '@/Session/notificationSession';
import dayjs from '@/utils/dayjs';
import { FileText, RefreshCw, Search, Filter, Eye } from 'lucide-react';
import { DataTable, type DataTableColumn, type RowAction } from '@/components/datatable';

export const Route = createFileRoute('/audit-logs')({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [tableFilter, setTableFilter] = useState('');
  const [limit, setLimit] = useState(50);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const {
    data: logs = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['audit-logs', tableFilter, limit],
    queryFn: () =>
      tableFilter.trim()
        ? fetchAuditLogsByTable(tableFilter.trim(), { limit })
        : fetchAuditLogs({ limit }),
  });

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Failed to load audit logs',
        message: error instanceof Error ? error.message : 'Unable to load audit logs.',
      });
    }
  }, [error, addNotification]);

  const uniqueTables = useMemo(
    () => Array.from(new Set(logs.map((log) => log.table_name).filter(Boolean))) as string[],
    [logs]
  );

  // Define table columns
  const columns: DataTableColumn<AuditLog>[] = useMemo(() => [
    {
      id: 'table_name',
      header: 'Table',
      accessorKey: 'table_name',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: uniqueTables.map((table) => ({ label: table, value: table })),
      cell: (log) => (
        <span className="font-medium text-gray-900">{log.table_name || 'Unknown table'}</span>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (log) => <span className="capitalize">{log.action || 'action'}</span>,
    },
    {
      id: 'user_id',
      header: 'User ID',
      accessorKey: 'user_id',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (log) => log.user_id ?? 'n/a',
    },
    {
      id: 'created_at',
      header: 'Timestamp',
      accessorKey: 'created_at',
      sortable: true,
      filterable: true,
      filterType: 'date',
      cell: (log) => dayjs(log.created_at).format('DD MMM YYYY, HH:mm'),
    },
  ], [uniqueTables]);

  // Define row actions
  const rowActions: RowAction<AuditLog>[] = [
    {
      id: 'view_details',
      label: 'View Details',
      icon: <Eye className="w-4 h-4" />,
      onClick: (log) => setSelectedLog(log),
    },
  ];

  const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && (value as Record<string, unknown>).constructor === Object;

  const diffValues = (
    oldValue: unknown,
    newValue: unknown,
    path = ''
  ): Array<{ path: string; oldValue: unknown; newValue: unknown }> => {
    if (isPlainObject(oldValue) && isPlainObject(newValue)) {
      const keys = Array.from(new Set([...Object.keys(oldValue), ...Object.keys(newValue)]));
      return keys.flatMap((key) =>
        diffValues(oldValue[key], newValue[key], path ? `${path}.${key}` : key)
      );
    }

    // Treat arrays/primitive/other objects as leaf comparisons
    const same =
      (oldValue === undefined || oldValue === null ? '' : JSON.stringify(oldValue)) ===
      (newValue === undefined || newValue === null ? '' : JSON.stringify(newValue));

    if (same) {
      return [];
    }

    return [
      {
        path: path || '(root)',
        oldValue,
        newValue,
      },
    ];
  };

  const renderJson = (value: unknown) => {
    if (value === null || value === undefined) return 'No details';
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return JSON.stringify(parsed, null, 2);
    } catch {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-600">Change history</p>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-600 mt-1">
              View audit entries by table, sorted newest first.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => refetch()} isLoading={isFetching}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                Table name (optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  placeholder="e.g., assets, devices"
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  list="audit-table-suggestions"
                />
                <datalist id="audit-table-suggestions">
                  {uniqueTables.map((table) => (
                    <option key={table} value={table || ''} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                Max rows
              </label>
              <input
                type="number"
                min={10}
                max={200}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 50)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Audit entries</h2>
                <p className="text-sm text-gray-600">Newest first</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">{logs.length} rows</div>
          </div>

          <DataTable
            data={logs}
            columns={columns}
            rowActions={rowActions}
            isLoading={isLoading}
            rowIdAccessor="id"
            exportable
            exportFilename="audit-logs"
            tableId="audit-logs-table"
            defaultView="card"
            allowViewToggle
            emptyState={
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No audit logs found</p>
                <p className="text-gray-400 text-sm">Try adjusting your table filter or limit</p>
              </div>
            }
            cardRenderer={(log) => (
              <div className="space-y-3">
                <div className="text-lg font-bold text-gray-900">
                  {log.table_name || 'Unknown table'} • ID {log.id}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="capitalize">{log.action || 'action'}</span> by user {log.user_id ?? 'n/a'}
                </div>
                <div className="text-xs text-gray-500">
                  {dayjs(log.created_at).format('DD MMM YYYY, HH:mm')}
                </div>
              </div>
            )}
          />
        </Card>

        <Modal open={!!selectedLog} onOpenChange={() => setSelectedLog(null)} title="Audit detail">
          {!selectedLog ? null : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <p className="text-gray-500">ID</p>
                  <p className="font-semibold text-gray-900">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Table</p>
                  <p className="font-semibold text-gray-900">{selectedLog.table_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Record</p>
                  <p className="font-semibold text-gray-900">{selectedLog.record_id ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">User</p>
                  <p className="font-semibold text-gray-900">{selectedLog.user_id ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Client</p>
                  <p className="font-semibold text-gray-900">{selectedLog.client_id ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Branch</p>
                  <p className="font-semibold text-gray-900">{selectedLog.branch_id ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Action</p>
                  <p className="font-semibold text-gray-900">{selectedLog.action || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-semibold text-gray-900">
                    {dayjs(selectedLog.created_at).format('DD MMM YYYY, HH:mm')}
                  </p>
                </div>
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Old value</p>
                  <pre className="bg-gray-100 border border-gray-200 rounded p-3 text-xs overflow-auto max-h-64">
{renderJson(selectedLog.old_value)}
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">New value</p>
                  <pre className="bg-gray-100 border border-gray-200 rounded p-3 text-xs overflow-auto max-h-64">
{renderJson(selectedLog.new_value)}
                  </pre>
                </div>
              </div> */}

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Detected changes</p>
                {diffValues(selectedLog.old_value, selectedLog.new_value).length === 0 ? (
                  <p className="text-sm text-gray-600">No field-level differences detected.</p>
                ) : (
                  <div className="space-y-2">
                    {diffValues(selectedLog.old_value, selectedLog.new_value).map((change) => (
                      <div
                        key={change.path}
                        className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800"
                      >
                        <p className="font-semibold text-gray-900">{change.path}</p>
                        <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <p className="text-[11px] uppercase text-gray-500">Old</p>
                            <pre className="bg-gray-100 border border-gray-200 rounded p-2 overflow-auto max-h-32">
{renderJson(change.oldValue)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase text-gray-500">New</p>
                            <pre className="bg-gray-100 border border-gray-200 rounded p-2 overflow-auto max-h-32">
{renderJson(change.newValue)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}

