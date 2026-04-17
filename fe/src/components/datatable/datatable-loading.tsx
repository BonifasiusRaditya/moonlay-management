import type { DataTableLoadingProps } from './datatable-types';

function TableRowSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columnCount }).map((_, index) => (
        <td key={index} className="py-3 px-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </td>
      ))}
    </tr>
  );
}

function TableSkeleton({ columnCount, rowCount }: { columnCount: number; rowCount: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            {Array.from({ length: columnCount }).map((_, index) => (
              <th key={index} className="text-left py-3 px-4">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, index) => (
            <TableRowSkeleton key={index} columnCount={columnCount} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-200 animate-pulse">
      <div className="space-y-3">
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

function CardViewSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: rowCount }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

export function DataTableLoading({ view, columnCount, rowCount = 10 }: DataTableLoadingProps) {
  if (view === 'card') {
    return <CardViewSkeleton rowCount={rowCount} />;
  }
  
  return <TableSkeleton columnCount={columnCount} rowCount={rowCount} />;
}
