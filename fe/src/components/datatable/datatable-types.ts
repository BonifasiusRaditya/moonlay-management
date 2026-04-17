import type { ReactNode } from 'react';

// Column filter types
export type FilterType = 'text' | 'select' | 'date' | 'number';

export type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith';
export type NumberFilterOperator = 'equals' | 'greaterThan' | 'lessThan' | 'between';
export type DateFilterOperator = 'equals' | 'before' | 'after' | 'between';

export interface ColumnFilter {
  columnId: string;
  value: any;
  operator?: TextFilterOperator | NumberFilterOperator | DateFilterOperator;
}

// Sorting types
export interface SortingState {
  column: string;
  direction: 'asc' | 'desc';
}

// Column configuration
export interface DataTableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  cell?: (row: T) => ReactNode;
  
  // Sorting
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  
  // Filtering
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: Array<{ label: string; value: string }>;
  
  // Column management
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  pinnable?: boolean;
  hideable?: boolean;
  defaultHidden?: boolean;
  
  // Card view
  showInCard?: boolean;
  cardPosition?: 'title' | 'subtitle' | 'content' | 'footer';
  
  // Inline editing
  editable?: boolean;
  editType?: 'text' | 'number' | 'select' | 'date';
  onEdit?: (row: T, value: any) => Promise<void>;
}

// Row actions
export interface RowAction<T = any> {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void | Promise<void>;
  variant?: 'default' | 'danger' | 'warning';
  show?: (row: T) => boolean;
}

// Bulk actions
export interface BulkAction<T = any> {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (rows: T[]) => void | Promise<void>;
  variant?: 'default' | 'danger' | 'warning';
  confirmMessage?: string;
}

// Pagination
export interface PaginationState {
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
}

// Column configuration state
export interface ColumnConfig {
  hidden: string[];
  pinned: {
    left: string[];
    right: string[];
  };
  widths: Record<string, number>;
  order: string[];
}

// Fetch data params for server-side operations
export interface FetchDataParams {
  page: number;
  pageSize: number;
  sorting: SortingState[];
  globalFilter?: string;
  columnFilters: ColumnFilter[];
}

// View mode
export type ViewMode = 'table' | 'card';

// DataTable props
export interface DataTableProps<T = any> {
  // Required
  data: T[];
  columns: DataTableColumn<T>[];
  
  // Data info
  totalRows?: number;
  isLoading?: boolean;
  
  // Server-side operations
  onFetchData?: (params: FetchDataParams) => void;
  
  // Pagination
  pagination?: PaginationState;
  onPaginationChange?: (page: number, pageSize: number) => void;
  
  // Sorting
  sorting?: SortingState[];
  onSortingChange?: (sorting: SortingState[]) => void;
  
  // Filtering
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
  columnFilters?: ColumnFilter[];
  onColumnFiltersChange?: (filters: ColumnFilter[]) => void;
  
  // Selection
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;
  rowIdAccessor?: keyof T | ((row: T) => string | number);
  
  // Views
  defaultView?: ViewMode;
  allowViewToggle?: boolean;
  
  // Column management
  pinnedColumns?: {
    left: string[];
    right: string[];
  };
  hiddenColumns?: string[];
  onColumnConfigChange?: (config: ColumnConfig) => void;
  
  // Actions
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction<T>[];
  
  // Export
  exportable?: boolean;
  exportFilename?: string;
  
  // Customization
  emptyState?: ReactNode;
  cardRenderer?: (row: T) => ReactNode;
  className?: string;
  tableId?: string; // For localStorage persistence
}

// Internal state for the datatable
export interface DataTableState {
  view: ViewMode;
  columnConfig: ColumnConfig;
  selectedRows: Set<string | number>;
  editingCell: {
    rowId: string | number;
    columnId: string;
  } | null;
}

// Props for sub-components
export interface DataTableToolbarProps<T = any> {
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  allowViewToggle: boolean;
  onOpenColumnManager: () => void;
  onExport: () => void;
  exportable: boolean;
  selectedCount: number;
  bulkActions: BulkAction<T>[];
  onClearSelection: () => void;
  columnFilters: ColumnFilter[];
  onClearFilters: () => void;
}

export interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalRows: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface DataTableColumnManagerProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataTableColumn<T>[];
  columnConfig: ColumnConfig;
  onColumnConfigChange: (config: ColumnConfig) => void;
}

export interface DataTableColumnFilterProps<T = any> {
  column: DataTableColumn<T>;
  filter?: ColumnFilter;
  onFilterChange: (filter: ColumnFilter | null) => void;
}

export interface DataTableTableViewProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  columnConfig: ColumnConfig;
  sorting: SortingState[];
  onSortingChange: (sorting: SortingState[]) => void;
  onColumnResize: (columnId: string, width: number) => void;
  selectable: boolean;
  selectedRows: Set<string | number>;
  onSelectionChange: (selected: Set<string | number>) => void;
  rowIdAccessor: (row: T) => string | number;
  rowActions: RowAction<T>[];
  columnFilters: ColumnFilter[];
  onColumnFilterChange: (filter: ColumnFilter | null) => void;
  editingCell: { rowId: string | number; columnId: string } | null;
  onEditCell: (rowId: string | number, columnId: string) => void;
  onSaveEdit: (rowId: string | number, columnId: string, value: any) => void;
  onCancelEdit: () => void;
}

export interface DataTableCardViewProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  columnConfig: ColumnConfig;
  selectable: boolean;
  selectedRows: Set<string | number>;
  onSelectionChange: (selected: Set<string | number>) => void;
  rowIdAccessor: (row: T) => string | number;
  rowActions: RowAction<T>[];
  cardRenderer?: (row: T) => ReactNode;
}

export interface DataTableLoadingProps {
  view: ViewMode;
  columnCount: number;
  rowCount?: number;
}
