import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { getCellValue, getVisibleColumns } from './datatable-utils';
import type { DataTableCardViewProps } from './datatable-types';

function DefaultCardRenderer<T>({
  row,
  columns,
  columnConfig,
}: {
  row: T;
  columns: any[];
  columnConfig: any;
}) {
  const visibleColumns = getVisibleColumns(columns, columnConfig.hidden);
  
  // Organize columns by card position
  const titleColumn = visibleColumns.find((col) => col.cardPosition === 'title');
  const subtitleColumn = visibleColumns.find((col) => col.cardPosition === 'subtitle');
  const contentColumns = visibleColumns.filter(
    (col) => col.cardPosition === 'content' || (!col.cardPosition && col.showInCard !== false)
  );
  const footerColumns = visibleColumns.filter((col) => col.cardPosition === 'footer');
  
  return (
    <div className="space-y-3">
      {/* Title */}
      {titleColumn && (
        <div className="text-lg font-bold text-gray-900 truncate">
          {titleColumn.cell ? titleColumn.cell(row) : getCellValue(row, titleColumn)}
        </div>
      )}
      
      {/* Subtitle */}
      {subtitleColumn && (
        <div className="text-sm text-gray-600 truncate">
          {subtitleColumn.cell ? subtitleColumn.cell(row) : getCellValue(row, subtitleColumn)}
        </div>
      )}
      
      {/* Content */}
      {contentColumns.length > 0 && (
        <div className="space-y-2">
          {contentColumns.slice(0, 4).map((column) => {
            const value = getCellValue(row, column);
            const content = column.cell ? column.cell(row) : value;
            
            return (
              <div key={column.id} className="flex justify-between items-start gap-2">
                <span className="text-sm font-medium text-gray-700 flex-shrink-0">
                  {column.header}:
                </span>
                <span className="text-sm text-gray-900 text-right flex-1 truncate">
                  {content}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Footer */}
      {footerColumns.length > 0 && (
        <div className="pt-2 border-t border-gray-200 flex gap-2 flex-wrap">
          {footerColumns.map((column) => {
            const content = column.cell ? column.cell(row) : getCellValue(row, column);
            return (
              <div key={column.id} className="text-xs">
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CardActionsMenu<T>({ row, actions }: { row: T; actions: any[] }) {
  const visibleActions = actions.filter((action) => {
    if (action.show) {
      return action.show(row);
    }
    return true;
  });
  
  if (visibleActions.length === 0) {
    return null;
  }
  
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
          align="end"
          sideOffset={5}
        >
          {visibleActions.map((action) => (
            <DropdownMenu.Item
              key={action.id}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none',
                action.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50'
                  : action.variant === 'warning'
                  ? 'text-yellow-600 hover:bg-yellow-50'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
              onClick={() => action.onClick(row)}
            >
              {action.icon}
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function DataTableCardView<T>({
  data,
  columns,
  columnConfig,
  selectable,
  selectedRows,
  onSelectionChange,
  rowIdAccessor,
  rowActions,
  cardRenderer,
}: DataTableCardViewProps<T>) {
  const hasActions = rowActions && rowActions.length > 0;
  
  const handleSelectRow = (rowId: string | number, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    onSelectionChange(newSelection);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((row, index) => {
        const rowId = typeof rowIdAccessor === 'function'
          ? rowIdAccessor(row)
          : row[rowIdAccessor as keyof T] as string | number;
        
        const isSelected = selectedRows.has(rowId);
        
        return (
          <div
            key={rowId}
            className={clsx(
              'p-4 bg-white rounded-lg shadow-sm border transition-all duration-200',
              'hover:shadow-md animate-in fade-in slide-in-from-bottom-4',
              isSelected
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
            style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
          >
            {/* Card Header - Selection & Actions */}
            <div className="flex items-start justify-between mb-3">
              {selectable && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
                />
              )}
              
              {hasActions && (
                <div className="ml-auto">
                  <CardActionsMenu row={row} actions={rowActions} />
                </div>
              )}
            </div>
            
            {/* Card Content */}
            {cardRenderer ? (
              cardRenderer(row)
            ) : (
              <DefaultCardRenderer
                row={row}
                columns={columns}
                columnConfig={columnConfig}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
