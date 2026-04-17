import dayjs from '@/utils/dayjs';
import type { DataTableColumn, ColumnFilter, SortingState } from './datatable-types';

/**
 * Get the value from a row using the column's accessor
 */
export function getCellValue<T>(row: T, column: DataTableColumn<T>): any {
  if (column.accessorFn) {
    return column.accessorFn(row);
  }
  if (column.accessorKey) {
    return row[column.accessorKey as keyof T];
  }
  return null;
}

/**
 * Format a value for CSV export
 */
export function formatValueForCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Handle dates
  if (value instanceof Date) {
    return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
  }
  
  // Handle objects/arrays
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Convert to string and escape
  const stringValue = String(value);
  
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Generate CSV from data
 */
export function generateCSV<T>(
  data: T[],
  columns: DataTableColumn<T>[],
  hiddenColumns: string[]
): string {
  const visibleColumns = columns.filter((col) => !hiddenColumns.includes(col.id));
  
  // Generate header row
  const headers = visibleColumns.map((col) => formatValueForCSV(col.header));
  const headerRow = headers.join(',');
  
  // Generate data rows
  const dataRows = data.map((row) => {
    const values = visibleColumns.map((col) => {
      const value = getCellValue(row, col);
      return formatValueForCSV(value);
    });
    return values.join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export data to CSV
 */
export function exportToCSV<T>(
  data: T[],
  columns: DataTableColumn<T>[],
  hiddenColumns: string[],
  filename: string
) {
  const csv = generateCSV(data, columns, hiddenColumns);
  downloadCSV(csv, filename);
}

/**
 * Calculate column width based on content
 */
export function calculateColumnWidth(
  content: string,
  minWidth: number = 100,
  maxWidth: number = 400
): number {
  // Rough estimation: 8px per character + 32px padding
  const estimatedWidth = content.length * 8 + 32;
  return Math.min(Math.max(estimatedWidth, minWidth), maxWidth);
}

/**
 * Get pinned columns separated by side
 */
export function getPinnedColumns<T>(
  columns: DataTableColumn<T>[],
  pinnedLeft: string[],
  pinnedRight: string[]
) {
  const leftPinned = pinnedLeft
    .map((id) => columns.find((col) => col.id === id))
    .filter(Boolean) as DataTableColumn<T>[];
  
  const rightPinned = pinnedRight
    .map((id) => columns.find((col) => col.id === id))
    .filter(Boolean) as DataTableColumn<T>[];
  
  const unpinned = columns.filter(
    (col) => !pinnedLeft.includes(col.id) && !pinnedRight.includes(col.id)
  );
  
  return { leftPinned, rightPinned, unpinned };
}

/**
 * Get visible columns (not hidden)
 */
export function getVisibleColumns<T>(
  columns: DataTableColumn<T>[],
  hiddenColumns: string[]
): DataTableColumn<T>[] {
  return columns.filter((col) => !hiddenColumns.includes(col.id));
}

/**
 * Sort data client-side
 */
export function sortData<T>(
  data: T[],
  sorting: SortingState[],
  columns: DataTableColumn<T>[]
): T[] {
  if (sorting.length === 0) {
    return data;
  }
  
  return [...data].sort((a, b) => {
    for (const sort of sorting) {
      const column = columns.find((col) => col.id === sort.column);
      if (!column) continue;
      
      const aValue = getCellValue(a, column);
      const bValue = getCellValue(b, column);
      
      // Handle null/undefined
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      // Use custom sort function if provided
      if (column.sortFn) {
        const result = column.sortFn(a, b);
        if (result !== 0) {
          return sort.direction === 'asc' ? result : -result;
        }
        continue;
      }
      
      // Default sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        if (result !== 0) {
          return sort.direction === 'asc' ? result : -result;
        }
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        if (result !== 0) {
          return sort.direction === 'asc' ? result : -result;
        }
      } else {
        const result = String(aValue).localeCompare(String(bValue));
        if (result !== 0) {
          return sort.direction === 'asc' ? result : -result;
        }
      }
    }
    
    return 0;
  });
}

/**
 * Filter data client-side by global filter
 */
export function filterDataByGlobalFilter<T>(
  data: T[],
  columns: DataTableColumn<T>[],
  globalFilter: string
): T[] {
  if (!globalFilter) {
    return data;
  }
  
  const searchTerm = globalFilter.toLowerCase();
  const searchableColumns = columns.filter((col) => col.filterable !== false);
  
  return data.filter((row) => {
    return searchableColumns.some((col) => {
      const value = getCellValue(row, col);
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm);
    });
  });
}

/**
 * Filter data client-side by column filters
 */
export function filterDataByColumnFilters<T>(
  data: T[],
  columns: DataTableColumn<T>[],
  columnFilters: ColumnFilter[]
): T[] {
  if (columnFilters.length === 0) {
    return data;
  }
  
  return data.filter((row) => {
    return columnFilters.every((filter) => {
      const column = columns.find((col) => col.id === filter.columnId);
      if (!column) return true;
      
      const value = getCellValue(row, column);
      if (value === null || value === undefined) return false;
      
      const filterValue = filter.value;
      const operator = filter.operator || 'contains';
      
      // Text filtering
      if (column.filterType === 'text' || !column.filterType) {
        const strValue = String(value).toLowerCase();
        const strFilter = String(filterValue).toLowerCase();
        
        switch (operator) {
          case 'equals':
            return strValue === strFilter;
          case 'startsWith':
            return strValue.startsWith(strFilter);
          case 'endsWith':
            return strValue.endsWith(strFilter);
          case 'contains':
          default:
            return strValue.includes(strFilter);
        }
      }
      
      // Select filtering
      if (column.filterType === 'select') {
        if (Array.isArray(filterValue)) {
          return filterValue.includes(String(value));
        }
        return String(value) === String(filterValue);
      }
      
      // Number filtering
      if (column.filterType === 'number') {
        const numValue = Number(value);
        const numFilter = Number(filterValue);
        
        switch (operator) {
          case 'equals':
            return numValue === numFilter;
          case 'greaterThan':
            return numValue > numFilter;
          case 'lessThan':
            return numValue < numFilter;
          case 'between':
            if (Array.isArray(filterValue) && filterValue.length === 2) {
              return numValue >= Number(filterValue[0]) && numValue <= Number(filterValue[1]);
            }
            return true;
          default:
            return true;
        }
      }
      
      // Date filtering
      if (column.filterType === 'date') {
        const dateValue = dayjs(value);
        const dateFilter = dayjs(filterValue);
        
        switch (operator) {
          case 'equals':
            return dateValue.isSame(dateFilter, 'day');
          case 'before':
            return dateValue.isBefore(dateFilter, 'day');
          case 'after':
            return dateValue.isAfter(dateFilter, 'day');
          case 'between':
            if (Array.isArray(filterValue) && filterValue.length === 2) {
              const startDate = dayjs(filterValue[0]);
              const endDate = dayjs(filterValue[1]);
              return dateValue.isAfter(startDate, 'day') && dateValue.isBefore(endDate, 'day');
            }
            return true;
          default:
            return true;
        }
      }
      
      return true;
    });
  });
}

/**
 * Get paginated data
 */
export function getPaginatedData<T>(
  data: T[],
  page: number,
  pageSize: number
): T[] {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(totalRows: number, pageSize: number): number {
  return Math.ceil(totalRows / pageSize);
}

/**
 * Generate page numbers for pagination
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const pages: (number | 'ellipsis')[] = [];
  const halfVisible = Math.floor(maxVisible / 2);
  
  // Always show first page
  pages.push(1);
  
  // Calculate range around current page
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);
  
  // Adjust range if at beginning or end
  if (currentPage <= halfVisible) {
    end = Math.min(totalPages - 1, maxVisible - 1);
  }
  if (currentPage >= totalPages - halfVisible) {
    start = Math.max(2, totalPages - maxVisible + 2);
  }
  
  // Add ellipsis after first page if needed
  if (start > 2) {
    pages.push('ellipsis');
  }
  
  // Add pages in range
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  // Add ellipsis before last page if needed
  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }
  
  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }
  
  return pages;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
