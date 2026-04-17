import { useState, useEffect, useCallback } from 'react';
import type {
  ViewMode,
  ColumnConfig,
  DataTableColumn,
  SortingState,
  ColumnFilter,
  PaginationState,
} from './datatable-types';

interface DataTableStateConfig {
  tableId?: string;
  columns: DataTableColumn<any>[];
  defaultView?: ViewMode;
  defaultPageSize?: number;
}

interface PersistedState {
  view?: ViewMode;
  columnConfig?: ColumnConfig;
  pageSize?: number;
}

const STORAGE_PREFIX = 'datatable_config_';

function loadPersistedState(tableId?: string): PersistedState | null {
  if (!tableId) return null;
  
  try {
    const key = `${STORAGE_PREFIX}${tableId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load datatable state from localStorage:', error);
  }
  
  return null;
}

function savePersistedState(tableId: string | undefined, state: PersistedState) {
  if (!tableId) return;
  
  try {
    const key = `${STORAGE_PREFIX}${tableId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save datatable state to localStorage:', error);
  }
}

function getDefaultColumnConfig(columns: DataTableColumn<any>[]): ColumnConfig {
  const hidden: string[] = [];
  const widths: Record<string, number> = {};
  const order: string[] = [];
  
  columns.forEach((col) => {
    order.push(col.id);
    if (col.defaultHidden) {
      hidden.push(col.id);
    }
    if (col.width) {
      widths[col.id] = col.width;
    }
  });
  
  return {
    hidden,
    pinned: {
      left: [],
      right: [],
    },
    widths,
    order,
  };
}

export function useDataTableState(config: DataTableStateConfig) {
  const { tableId, columns, defaultView = 'table', defaultPageSize = 25 } = config;
  
  // Load persisted state
  const persistedState = loadPersistedState(tableId);
  
  // View mode state
  const [view, setView] = useState<ViewMode>(
    persistedState?.view || defaultView
  );
  
  // Column configuration state
  const [columnConfig, setColumnConfig] = useState<ColumnConfig>(() => {
    const defaultConfig = getDefaultColumnConfig(columns);
    if (persistedState?.columnConfig) {
      // Merge persisted config with defaults (in case columns changed)
      return {
        hidden: persistedState.columnConfig.hidden?.filter((id) =>
          columns.some((col) => col.id === id)
        ) || defaultConfig.hidden,
        pinned: {
          left: persistedState.columnConfig.pinned?.left?.filter((id) =>
            columns.some((col) => col.id === id)
          ) || [],
          right: persistedState.columnConfig.pinned?.right?.filter((id) =>
            columns.some((col) => col.id === id)
          ) || [],
        },
        widths: persistedState.columnConfig.widths || defaultConfig.widths,
        order: persistedState.columnConfig.order?.filter((id) =>
          columns.some((col) => col.id === id)
        ) || defaultConfig.order,
      };
    }
    return defaultConfig;
  });
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: persistedState?.pageSize || defaultPageSize,
    pageSizeOptions: [10, 25, 50, 100],
  });
  
  // Sorting state
  const [sorting, setSorting] = useState<SortingState[]>([]);
  
  // Filter states
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  
  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  
  // Editing state
  const [editingCell, setEditingCell] = useState<{
    rowId: string | number;
    columnId: string;
  } | null>(null);
  
  // Persist state changes
  useEffect(() => {
    if (tableId) {
      savePersistedState(tableId, {
        view,
        columnConfig,
        pageSize: pagination.pageSize,
      });
    }
  }, [tableId, view, columnConfig, pagination.pageSize]);
  
  // Handlers
  const handleViewChange = useCallback((newView: ViewMode) => {
    setView(newView);
  }, []);
  
  const handleColumnConfigChange = useCallback((newConfig: ColumnConfig) => {
    setColumnConfig(newConfig);
  }, []);
  
  const handleColumnResize = useCallback((columnId: string, width: number) => {
    setColumnConfig((prev) => ({
      ...prev,
      widths: {
        ...prev.widths,
        [columnId]: width,
      },
    }));
  }, []);
  
  const handleColumnHide = useCallback((columnId: string) => {
    setColumnConfig((prev) => ({
      ...prev,
      hidden: [...prev.hidden, columnId],
    }));
  }, []);
  
  const handleColumnShow = useCallback((columnId: string) => {
    setColumnConfig((prev) => ({
      ...prev,
      hidden: prev.hidden.filter((id) => id !== columnId),
    }));
  }, []);
  
  const handleColumnPin = useCallback((columnId: string, side: 'left' | 'right') => {
    setColumnConfig((prev) => ({
      ...prev,
      pinned: {
        left: side === 'left' 
          ? [...prev.pinned.left.filter((id) => id !== columnId), columnId]
          : prev.pinned.left.filter((id) => id !== columnId),
        right: side === 'right'
          ? [...prev.pinned.right.filter((id) => id !== columnId), columnId]
          : prev.pinned.right.filter((id) => id !== columnId),
      },
    }));
  }, []);
  
  const handleColumnUnpin = useCallback((columnId: string) => {
    setColumnConfig((prev) => ({
      ...prev,
      pinned: {
        left: prev.pinned.left.filter((id) => id !== columnId),
        right: prev.pinned.right.filter((id) => id !== columnId),
      },
    }));
  }, []);
  
  const handleResetColumnConfig = useCallback(() => {
    setColumnConfig(getDefaultColumnConfig(columns));
  }, [columns]);
  
  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);
  
  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);
  
  const handleSortingChange = useCallback((newSorting: SortingState[]) => {
    setSorting(newSorting);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);
  
  const handleGlobalFilterChange = useCallback((filter: string) => {
    setGlobalFilter(filter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);
  
  const handleColumnFiltersChange = useCallback((filters: ColumnFilter[]) => {
    setColumnFilters(filters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);
  
  const handleColumnFilterChange = useCallback((filter: ColumnFilter | null) => {
    if (filter === null) {
      setColumnFilters((prev) => prev.filter((f) => f.columnId !== filter));
    } else {
      setColumnFilters((prev) => {
        const existing = prev.find((f) => f.columnId === filter.columnId);
        if (existing) {
          return prev.map((f) => f.columnId === filter.columnId ? filter : f);
        }
        return [...prev, filter];
      });
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);
  
  const handleClearFilters = useCallback(() => {
    setGlobalFilter('');
    setColumnFilters([]);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);
  
  const handleSelectionChange = useCallback((selected: Set<string | number>) => {
    setSelectedRows(selected);
  }, []);
  
  const handleSelectAll = useCallback((allRowIds: (string | number)[]) => {
    setSelectedRows(new Set(allRowIds));
  }, []);
  
  const handleClearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);
  
  const handleEditCell = useCallback((rowId: string | number, columnId: string) => {
    setEditingCell({ rowId, columnId });
  }, []);
  
  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);
  
  return {
    // State
    view,
    columnConfig,
    pagination,
    sorting,
    globalFilter,
    columnFilters,
    selectedRows,
    editingCell,
    
    // Handlers
    handleViewChange,
    handleColumnConfigChange,
    handleColumnResize,
    handleColumnHide,
    handleColumnShow,
    handleColumnPin,
    handleColumnUnpin,
    handleResetColumnConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSortingChange,
    handleGlobalFilterChange,
    handleColumnFiltersChange,
    handleColumnFilterChange,
    handleClearFilters,
    handleSelectionChange,
    handleSelectAll,
    handleClearSelection,
    handleEditCell,
    handleCancelEdit,
  };
}
