// Main component
export { DataTable } from './datatable';

// Types
export type {
  DataTableProps,
  DataTableColumn,
  RowAction,
  BulkAction,
  ColumnFilter,
  SortingState,
  PaginationState,
  ColumnConfig,
  FetchDataParams,
  ViewMode,
  FilterType,
  TextFilterOperator,
  NumberFilterOperator,
  DateFilterOperator,
} from './datatable-types';

// Sub-components (if needed for custom usage)
export { DataTableToolbar } from './datatable-toolbar';
export { DataTableTableView } from './datatable-table-view';
export { DataTableCardView } from './datatable-card-view';
export { DataTablePagination } from './datatable-pagination';
export { DataTableColumnManager } from './datatable-column-manager';
export { DataTableColumnFilter } from './datatable-column-filter';
export { DataTableLoading } from './datatable-loading';

// Utilities
export {
  getCellValue,
  exportToCSV,
  generateCSV,
  downloadCSV,
  sortData,
  filterDataByGlobalFilter,
  filterDataByColumnFilters,
  getPaginatedData,
  calculateTotalPages,
  generatePageNumbers,
} from './datatable-utils';

// Hook
export { useDataTableState } from './use-datatable-state';
