import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { clsx } from 'clsx';
import { generatePageNumbers, calculateTotalPages } from './datatable-utils';
import type { DataTablePaginationProps } from './datatable-types';

export function DataTablePagination({
  page,
  pageSize,
  totalRows,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const totalPages = calculateTotalPages(totalRows, pageSize);
  const pageNumbers = generatePageNumbers(page, totalPages);
  
  const startRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRows);
  
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Info & Page Size Selector */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{startRow}</span> to{' '}
          <span className="font-medium">{endRow}</span> of{' '}
          <span className="font-medium">{totalRows}</span> results
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-gray-700">
            Rows per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          className={clsx(
            'p-2 rounded-md transition-colors',
            canGoPrevious
              ? 'hover:bg-gray-100 text-gray-700'
              : 'text-gray-400 cursor-not-allowed'
          )}
          title="First page"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
        
        {/* Previous Page */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          className={clsx(
            'p-2 rounded-md transition-colors',
            canGoPrevious
              ? 'hover:bg-gray-100 text-gray-700'
              : 'text-gray-400 cursor-not-allowed'
          )}
          title="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500"
                >
                  ...
                </span>
              );
            }
            
            const isCurrentPage = pageNum === page;
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={clsx(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isCurrentPage
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        {/* Next Page */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className={clsx(
            'p-2 rounded-md transition-colors',
            canGoNext
              ? 'hover:bg-gray-100 text-gray-700'
              : 'text-gray-400 cursor-not-allowed'
          )}
          title="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className={clsx(
            'p-2 rounded-md transition-colors',
            canGoNext
              ? 'hover:bg-gray-100 text-gray-700'
              : 'text-gray-400 cursor-not-allowed'
          )}
          title="Last page"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
