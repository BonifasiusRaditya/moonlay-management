import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/card';
import { DataTableToolbar } from './datatable-toolbar';
import { DataTableTableView } from './datatable-table-view';
import { DataTableCardView } from './datatable-card-view';
import { DataTablePagination } from './datatable-pagination';
import { DataTableColumnManager } from './datatable-column-manager';
import { DataTableLoading } from './datatable-loading';
import { useDataTableState } from './use-datatable-state';
import {
  exportToCSV,
  filterDataByColumnFilters,
  filterDataByGlobalFilter,
  getPaginatedData,
  getVisibleColumns,
  sortData,
} from './datatable-utils';
import { useNotificationStore } from '@/stores/notificationStore';
import type { DataTableProps } from './datatable-types';

export function DataTable<T = any>({
  data,
  columns,
  totalRows,
  isLoading = false,
  onFetchData,
  pagination: externalPagination,
  onPaginationChange,
  sorting: externalSorting,
  onSortingChange,
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange,
  selectable = false,
  selectedRows: externalSelectedRows,
  onSelectionChange,
  rowIdAccessor = 'id' as any,
  defaultView = 'table',
  allowViewToggle = true,
  pinnedColumns,
  hiddenColumns,
  onColumnConfigChange,
  rowActions = [],
  bulkActions = [],
  exportable = true,
  exportFilename = 'export',
  emptyState,
  cardRenderer,
  className = '',
  tableId,
}: DataTableProps<T>) {
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  // Internal state management
  const state = useDataTableState({
    tableId,
    columns,
    defaultView,
    defaultPageSize: externalPagination?.pageSize || 10,
  });
  
  // Use external state if provided, otherwise use internal state
  const view = state.view;
  const pagination = externalPagination || state.pagination;
  const sorting = externalSorting || state.sorting;
  const globalFilter = externalGlobalFilter !== undefined ? externalGlobalFilter : state.globalFilter;
  const columnFilters = externalColumnFilters || state.columnFilters;
  const selectedRows = externalSelectedRows || state.selectedRows;
  const columnConfig = state.columnConfig;
  
  // Column manager dialog state
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  
  // Apply external column configuration if provided
  useEffect(() => {
    if (hiddenColumns || pinnedColumns) {
      const newConfig = {
        ...state.columnConfig,
        ...(hiddenColumns && { hidden: hiddenColumns }),
        ...(pinnedColumns && { pinned: pinnedColumns }),
      };
      state.handleColumnConfigChange(newConfig);
    }
  }, [hiddenColumns, pinnedColumns, state, state.columnConfig, state.handleColumnConfigChange]);
  
  // Notify parent of fetch data changes
  useEffect(() => {
    if (onFetchData) {
      onFetchData({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sorting,
        globalFilter,
        columnFilters,
      });
    }
  }, [
    pagination.page,
    pagination.pageSize,
    sorting,
    globalFilter,
    columnFilters,
    onFetchData,
  ]);
  
  // Handler wrappers that use external handlers if provided
  const handlePaginationChange = (page: number, pageSize: number) => {
    if (onPaginationChange) {
      onPaginationChange(page, pageSize);
    } else {
      if (pageSize !== pagination.pageSize) {
        state.handlePageSizeChange(pageSize);
      } else {
        state.handlePageChange(page);
      }
    }
  };
  
  const handleSortingChange = (newSorting: any) => {
    if (onSortingChange) {
      onSortingChange(newSorting);
    } else {
      state.handleSortingChange(newSorting);
    }
  };
  
  const handleGlobalFilterChange = (filter: string) => {
    if (onGlobalFilterChange) {
      onGlobalFilterChange(filter);
    } else {
      state.handleGlobalFilterChange(filter);
    }
  };
  
  const handleColumnFiltersChange = (filters: any) => {
    if (onColumnFiltersChange) {
      onColumnFiltersChange(filters);
    } else {
      state.handleColumnFiltersChange(filters);
    }
  };
  
  const handleSelectionChange = (selected: Set<string | number>) => {
    if (onSelectionChange) {
      onSelectionChange(selected);
    } else {
      state.handleSelectionChange(selected);
    }
  };
  
  const handleColumnConfigChange = (config: any) => {
    if (onColumnConfigChange) {
      onColumnConfigChange(config);
    }
    state.handleColumnConfigChange(config);
  };
  
  const handleClearFilters = () => {
    handleGlobalFilterChange('');
    handleColumnFiltersChange([]);
  };
  
  const handleExport = () => {
    try {
      exportToCSV(data, columns, columnConfig.hidden, exportFilename);
      addNotification({
        type: 'success',
        title: 'Export successful',
        message: 'Data has been exported to CSV successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export failed',
        message: 'Failed to export data. Please try again.',
      });
    }
  };
  
  const handleBulkAction = async (action: any) => {
    const selectedData = data.filter((row) => {
      const id = typeof rowIdAccessor === 'function'
        ? rowIdAccessor(row)
        : row[rowIdAccessor as keyof T];
      return selectedRows.has(id as string | number);
    });
    
    try {
      await action.onClick(selectedData);
      handleSelectionChange(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };
  
  const handleEditCell = (rowId: string | number, columnId: string) => {
    state.handleEditCell(rowId, columnId);
  };
  
  const handleSaveEdit = async (rowId: string | number, columnId: string, value: any) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column || !column.onEdit) {
      state.handleCancelEdit();
      return;
    }
    
    const row = data.find((r) => {
      const id = typeof rowIdAccessor === 'function'
        ? rowIdAccessor(r)
        : r[rowIdAccessor as keyof T];
      return id === rowId;
    });
    
    if (!row) {
      state.handleCancelEdit();
      return;
    }
    
    try {
      await column.onEdit(row, value);
      state.handleCancelEdit();
      addNotification({
        type: 'success',
        title: 'Updated',
        message: 'Cell updated successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: 'Failed to update cell. Please try again.',
      });
    }
  };
  
  const visibleColumns = useMemo(
    () => getVisibleColumns(columns, columnConfig.hidden),
    [columns, columnConfig.hidden]
  );

  // Client-side operations (when server-side hook isn't provided)
  const clientSideResult = useMemo(() => {
    // If server-side fetching is enabled, assume `data` is already the correct slice.
    if (onFetchData) {
      return {
        rows: data,
        totalRows: totalRows !== undefined ? totalRows : data.length,
      };
    }

    const afterGlobal = filterDataByGlobalFilter(data, visibleColumns, globalFilter);
    const afterColumnFilters = filterDataByColumnFilters(afterGlobal, visibleColumns, columnFilters);
    const afterSorting = sortData(afterColumnFilters, sorting, visibleColumns);
    const paginated = getPaginatedData(afterSorting, pagination.page, pagination.pageSize);

    return {
      rows: paginated,
      totalRows: afterSorting.length,
    };
  }, [
    columnFilters,
    data,
    globalFilter,
    onFetchData,
    pagination.page,
    pagination.pageSize,
    sorting,
    totalRows,
    visibleColumns,
  ]);
  
  const effectiveTotalRows = totalRows !== undefined ? totalRows : clientSideResult.totalRows;
  const hasData = clientSideResult.rows.length > 0;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <DataTableToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={handleGlobalFilterChange}
        view={view}
        onViewChange={state.handleViewChange}
        allowViewToggle={allowViewToggle}
        onOpenColumnManager={() => setColumnManagerOpen(true)}
        onExport={handleExport}
        exportable={exportable}
        selectedCount={selectedRows.size}
        bulkActions={bulkActions.map((action) => ({
          ...action,
          onClick: () => handleBulkAction(action),
        }))}
        onClearSelection={() => handleSelectionChange(new Set())}
        columnFilters={columnFilters}
        onClearFilters={handleClearFilters}
      />
      
      {/* Data View */}
      <Card className="border-gray-200/50 bg-gradient-to-br from-white to-gray-50/80">
        {isLoading ? (
          <DataTableLoading
            view={view}
            columnCount={visibleColumns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
            rowCount={pagination.pageSize}
          />
        ) : !hasData ? (
          <div className="text-center py-12">
            {emptyState || (
              <div>
                <p className="text-gray-500 text-lg mb-2">No data found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        ) : view === 'table' ? (
          <DataTableTableView
            data={clientSideResult.rows}
            columns={columns}
            columnConfig={columnConfig}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onColumnResize={state.handleColumnResize}
            selectable={selectable}
            selectedRows={selectedRows}
            onSelectionChange={handleSelectionChange}
            rowIdAccessor={rowIdAccessor}
            rowActions={rowActions}
            columnFilters={columnFilters}
            onColumnFilterChange={state.handleColumnFilterChange}
            editingCell={state.editingCell}
            onEditCell={handleEditCell}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={state.handleCancelEdit}
          />
        ) : (
          <DataTableCardView
            data={clientSideResult.rows}
            columns={columns}
            columnConfig={columnConfig}
            selectable={selectable}
            selectedRows={selectedRows}
            onSelectionChange={handleSelectionChange}
            rowIdAccessor={rowIdAccessor}
            rowActions={rowActions}
            cardRenderer={cardRenderer}
          />
        )}
      </Card>
      
      {/* Pagination */}
      {hasData && (
        <DataTablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalRows={effectiveTotalRows}
          pageSizeOptions={pagination.pageSizeOptions || [10, 25, 50, 100]}
          onPageChange={(page) => handlePaginationChange(page, pagination.pageSize)}
          onPageSizeChange={(pageSize) => handlePaginationChange(1, pageSize)}
        />
      )}
      
      {/* Column Manager Dialog */}
      <DataTableColumnManager
        open={columnManagerOpen}
        onOpenChange={setColumnManagerOpen}
        columns={columns}
        columnConfig={columnConfig}
        onColumnConfigChange={handleColumnConfigChange}
      />
    </div>
  );
}
