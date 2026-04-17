import * as Dialog from '@radix-ui/react-dialog';
import { X, Eye, EyeOff, Pin, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import type { DataTableColumnManagerProps, ColumnConfig } from './datatable-types';

export function DataTableColumnManager<T>({
  open,
  onOpenChange,
  columns,
  columnConfig,
  onColumnConfigChange,
}: DataTableColumnManagerProps<T>) {
  const handleToggleColumn = (columnId: string) => {
    const isHidden = columnConfig.hidden.includes(columnId);
    
    const newConfig: ColumnConfig = {
      ...columnConfig,
      hidden: isHidden
        ? columnConfig.hidden.filter((id) => id !== columnId)
        : [...columnConfig.hidden, columnId],
    };
    
    onColumnConfigChange(newConfig);
  };
  
  const handlePinColumn = (columnId: string, side: 'left' | 'right') => {
    const isPinnedLeft = columnConfig.pinned.left.includes(columnId);
    const isPinnedRight = columnConfig.pinned.right.includes(columnId);
    
    // If already pinned to the requested side, unpin it
    if ((side === 'left' && isPinnedLeft) || (side === 'right' && isPinnedRight)) {
      const newConfig: ColumnConfig = {
        ...columnConfig,
        pinned: {
          left: columnConfig.pinned.left.filter((id) => id !== columnId),
          right: columnConfig.pinned.right.filter((id) => id !== columnId),
        },
      };
      onColumnConfigChange(newConfig);
      return;
    }
    
    // Otherwise, pin to the requested side (and remove from other side if needed)
    const newConfig: ColumnConfig = {
      ...columnConfig,
      pinned: {
        left: side === 'left'
          ? [...columnConfig.pinned.left.filter((id) => id !== columnId), columnId]
          : columnConfig.pinned.left.filter((id) => id !== columnId),
        right: side === 'right'
          ? [...columnConfig.pinned.right.filter((id) => id !== columnId), columnId]
          : columnConfig.pinned.right.filter((id) => id !== columnId),
      },
    };
    
    onColumnConfigChange(newConfig);
  };
  
  const handleReset = () => {
    const defaultConfig: ColumnConfig = {
      hidden: columns.filter((col) => col.defaultHidden).map((col) => col.id),
      pinned: {
        left: [],
        right: [],
      },
      widths: columns.reduce((acc, col) => {
        if (col.width) {
          acc[col.id] = col.width;
        }
        return acc;
      }, {} as Record<string, number>),
      order: columns.map((col) => col.id),
    };
    
    onColumnConfigChange(defaultConfig);
  };
  
  const handleShowAll = () => {
    const newConfig: ColumnConfig = {
      ...columnConfig,
      hidden: [],
    };
    onColumnConfigChange(newConfig);
  };
  
  const handleHideAll = () => {
    const newConfig: ColumnConfig = {
      ...columnConfig,
      hidden: columns.map((col) => col.id),
    };
    onColumnConfigChange(newConfig);
  };
  
  const visibleCount = columns.length - columnConfig.hidden.length;
  
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Manage Columns
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                Show, hide, and pin columns to customize your view
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-180px)]">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {visibleCount} of {columns.length} columns visible
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleShowAll}
                  className="px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                >
                  Show All
                </button>
                <button
                  onClick={handleHideAll}
                  className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Hide All
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {columns.map((column) => {
                const isHidden = columnConfig.hidden.includes(column.id);
                const isPinnedLeft = columnConfig.pinned.left.includes(column.id);
                const isPinnedRight = columnConfig.pinned.right.includes(column.id);
                const isHideable = column.hideable !== false;
                const isPinnable = column.pinnable !== false;
                
                return (
                  <div
                    key={column.id}
                    className={clsx(
                      'flex items-center justify-between p-3 border border-gray-200 rounded-lg',
                      isHidden && 'bg-gray-50 opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => isHideable && handleToggleColumn(column.id)}
                        disabled={!isHideable}
                        className={clsx(
                          'p-1 rounded transition-colors',
                          isHideable
                            ? 'hover:bg-gray-200 cursor-pointer'
                            : 'cursor-not-allowed opacity-50'
                        )}
                      >
                        {isHidden ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-primary-600" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {column.header}
                        </div>
                        <div className="text-xs text-gray-500">
                          {column.id}
                        </div>
                      </div>
                      
                      {(isPinnedLeft || isPinnedRight) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                          <Pin className="w-3 h-3" />
                          {isPinnedLeft ? 'Left' : 'Right'}
                        </div>
                      )}
                    </div>
                    
                    {isPinnable && (
                      <div className="flex gap-1 ml-3">
                        <button
                          onClick={() => handlePinColumn(column.id, 'left')}
                          className={clsx(
                            'p-2 rounded transition-colors text-xs font-medium',
                            isPinnedLeft
                              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                          title="Pin left"
                        >
                          Pin ←
                        </button>
                        <button
                          onClick={() => handlePinColumn(column.id, 'right')}
                          className={clsx(
                            'p-2 rounded transition-colors text-xs font-medium',
                            isPinnedRight
                              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                          title="Pin right"
                        >
                          → Pin
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            
            <Dialog.Close asChild>
              <button className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium">
                Done
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
