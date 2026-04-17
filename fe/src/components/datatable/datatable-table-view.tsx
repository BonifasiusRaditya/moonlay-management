import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown, 
  MoreVertical,
  GripVertical,
} from 'lucide-react';
import { getCellValue, getPinnedColumns, getVisibleColumns } from './datatable-utils';
import { DataTableColumnFilter } from './datatable-column-filter';
import type { DataTableTableViewProps, DataTableColumn, SortingState } from './datatable-types';
import { clsx } from 'clsx';

interface ResizingState {
  columnId: string;
  startX: number;
  startWidth: number;
}

function SortIndicator({ direction }: { direction?: 'asc' | 'desc' }) {
  if (direction === 'asc') {
    return <ArrowUp className="w-4 h-4" />;
  }
  if (direction === 'desc') {
    return <ArrowDown className="w-4 h-4" />;
  }
  return <ArrowUpDown className="w-4 h-4 opacity-50" />;
}

function TableHeader<T>({
  column,
  sorting,
  onSort,
  onResize,
  width,
  isPinned,
  columnFilter,
  onFilterChange,
}: {
  column: DataTableColumn<T>;
  sorting: SortingState[];
  onSort: (columnId: string, shiftKey: boolean) => void;
  onResize: (columnId: string, width: number) => void;
  width?: number;
  isPinned?: 'left' | 'right';
  columnFilter?: any;
  onFilterChange: (filter: any) => void;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const resizingRef = useRef<ResizingState | null>(null);
  
  const currentSort = sorting.find((s) => s.column === column.id);
  const isSortable = column.sortable !== false;
  const isFilterable = column.filterable !== false;
  
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizingRef.current = {
      columnId: column.id,
      startX: e.clientX,
      startWidth: width || column.width || 150,
    };
  };
  
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      
      const diff = e.clientX - resizingRef.current.startX;
      const newWidth = Math.max(
        column.minWidth || 100,
        Math.min(
          column.maxWidth || 600,
          resizingRef.current.startWidth + diff
        )
      );
      
      onResize(resizingRef.current.columnId, newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      resizingRef.current = null;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, column.minWidth, column.maxWidth, onResize]);
  
  return (
    <th
      className={clsx(
        'text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50/50 border-b border-gray-200 relative group',
        isSortable && 'cursor-pointer hover:bg-gray-100',
        isPinned && 'sticky z-10 bg-gray-50',
        isPinned === 'left' && 'left-0',
        isPinned === 'right' && 'right-0'
      )}
      style={{ width: width || column.width }}
      onClick={(e) => isSortable && onSort(column.id, e.shiftKey)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="truncate">{column.header}</span>
          {isSortable && <SortIndicator direction={currentSort?.direction} />}
        </div>
        
        <div className="flex items-center gap-1">
          {isFilterable && (
            <DataTableColumnFilter
              column={column}
              filter={columnFilter}
              onFilterChange={onFilterChange}
            />
          )}
        </div>
      </div>
      
      {column.resizable !== false && (
        <div
          className={clsx(
            'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            isResizing && 'opacity-100 bg-primary-500'
          )}
          onMouseDown={handleResizeStart}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
        </div>
      )}
    </th>
  );
}

function TableCell<T>({
  row,
  column,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}: {
  row: T;
  column: DataTableColumn<T>;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: any) => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const value = getCellValue(row, column);
  const cellContent = column.cell ? column.cell(row) : value;
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      setEditValue(String(value || ''));
      inputRef.current.focus();
    }
  }, [isEditing, value]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  const handleBlur = () => {
    onSave(editValue);
  };
  
  if (isEditing && column.editable) {
    return (
      <td className="py-3 px-4 text-sm">
        {column.editType === 'select' && column.filterOptions ? (
          <select
            ref={inputRef as any}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {column.filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef}
            type={column.editType || 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        )}
      </td>
    );
  }
  
  return (
    <td
      className={clsx(
        'py-3 px-4 text-sm',
        column.editable && 'cursor-pointer hover:bg-gray-50'
      )}
      onDoubleClick={column.editable ? onEdit : undefined}
    >
      {cellContent}
    </td>
  );
}

function RowActionsMenu<T>({ row, actions }: { row: T; actions: any[] }) {
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
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical className="w-4 h-4 text-gray-600" />
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

export function DataTableTableView<T>({
  data,
  columns,
  columnConfig,
  sorting,
  onSortingChange,
  onColumnResize,
  selectable,
  selectedRows,
  onSelectionChange,
  rowIdAccessor,
  rowActions,
  columnFilters,
  onColumnFilterChange,
  editingCell,
  onEditCell,
  onSaveEdit,
  onCancelEdit,
}: DataTableTableViewProps<T>) {
  const visibleColumns = getVisibleColumns(columns, columnConfig.hidden);
  const { leftPinned, rightPinned, unpinned } = getPinnedColumns(
    visibleColumns,
    columnConfig.pinned.left,
    columnConfig.pinned.right
  );
  
  const allColumns = [...leftPinned, ...unpinned, ...rightPinned];
  const hasActions = rowActions && rowActions.length > 0;
  
  const handleSort = (columnId: string, shiftKey: boolean) => {
    const currentSort = sorting.find((s) => s.column === columnId);
    
    let newSorting: SortingState[];
    
    if (shiftKey) {
      // Multi-column sort
      if (currentSort) {
        if (currentSort.direction === 'asc') {
          newSorting = sorting.map((s) =>
            s.column === columnId ? { ...s, direction: 'desc' as const } : s
          );
        } else {
          newSorting = sorting.filter((s) => s.column !== columnId);
        }
      } else {
        newSorting = [...sorting, { column: columnId, direction: 'asc' as const }];
      }
    } else {
      // Single column sort
      if (currentSort) {
        if (currentSort.direction === 'asc') {
          newSorting = [{ column: columnId, direction: 'desc' as const }];
        } else {
          newSorting = [];
        }
      } else {
        newSorting = [{ column: columnId, direction: 'asc' as const }];
      }
    }
    
    onSortingChange(newSorting);
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = data.map((row) => {
        if (typeof rowIdAccessor === 'function') {
          return rowIdAccessor(row);
        }
        return row[rowIdAccessor as keyof T] as string | number;
      });
      onSelectionChange(new Set(allIds));
    } else {
      onSelectionChange(new Set());
    }
  };
  
  const handleSelectRow = (rowId: string | number, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    onSelectionChange(newSelection);
  };
  
  const isAllSelected = data.length > 0 && selectedRows.size === data.length;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < data.length;
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            {selectable && (
              <th className="text-left py-3 px-4 w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </th>
            )}
            
            {allColumns.map((column) => {
              const isPinned = columnConfig.pinned.left.includes(column.id)
                ? 'left'
                : columnConfig.pinned.right.includes(column.id)
                ? 'right'
                : undefined;
              
              const filter = columnFilters.find((f) => f.columnId === column.id);
              
              return (
                <TableHeader
                  key={column.id}
                  column={column}
                  sorting={sorting}
                  onSort={handleSort}
                  onResize={onColumnResize}
                  width={columnConfig.widths[column.id]}
                  isPinned={isPinned}
                  columnFilter={filter}
                  onFilterChange={(newFilter) => onColumnFilterChange(newFilter)}
                />
              );
            })}
            
            {hasActions && (
              <th
                className={clsx(
                  'text-left py-3 px-4 w-12 text-sm font-semibold text-gray-700 border-b border-gray-200',
                  'sticky right-0 z-20 bg-[#f3f3f3]',
                  'shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.12)]'
                )}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const rowId = typeof rowIdAccessor === 'function'
              ? rowIdAccessor(row)
              : row[rowIdAccessor as keyof T] as string | number;
            
            const isSelected = selectedRows.has(rowId);
            
            return (
              <tr
                key={rowId}
                className={clsx(
                  'group border-b border-gray-100 hover:bg-gray-50 animate-in fade-in slide-in-from-left-4 duration-300',
                  isSelected && 'bg-primary-50'
                )}
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
              >
                {selectable && (
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </td>
                )}
                
                {allColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    row={row}
                    column={column}
                    isEditing={
                      editingCell !== null &&
                      editingCell.rowId === rowId &&
                      editingCell.columnId === column.id
                    }
                    onEdit={() => onEditCell(rowId, column.id)}
                    onSave={(value) => onSaveEdit(rowId, column.id, value)}
                    onCancel={onCancelEdit}
                  />
                ))}
                
                {hasActions && (
                  <td
                    className={clsx(
                      'py-3 px-4 sticky right-0 z-10',
                      isSelected ? 'bg-primary-50' : 'bg-[#f3f3f3]',
                      !isSelected && 'group-hover:bg-[#f3f3f3]',
                      'shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.12)]'
                    )}
                  >
                    <RowActionsMenu row={row} actions={rowActions} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
