import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Table2, 
  LayoutGrid, 
  Settings, 
  Download, 
  X,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { debounce } from './datatable-utils';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import type { DataTableToolbarProps, BulkAction } from './datatable-types';

export function DataTableToolbar<T>({
  globalFilter,
  onGlobalFilterChange,
  view,
  onViewChange,
  allowViewToggle,
  onOpenColumnManager,
  onExport,
  exportable,
  selectedCount,
  bulkActions,
  onClearSelection,
  columnFilters,
  onClearFilters,
}: DataTableToolbarProps<T>) {
  const [searchValue, setSearchValue] = useState(globalFilter);
  const [showBulkActionConfirm, setShowBulkActionConfirm] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<BulkAction<T> | null>(null);
  
  // Debounce search input
  const debouncedSearch = useRef(
    debounce((value: string) => {
      onGlobalFilterChange(value);
    }, 300)
  ).current;
  
  useEffect(() => {
    setSearchValue(globalFilter);
  }, [globalFilter]);
  
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };
  
  const handleClearSearch = () => {
    setSearchValue('');
    onGlobalFilterChange('');
  };
  
  const handleBulkActionClick = (action: BulkAction<T>) => {
    if (action.confirmMessage) {
      setPendingBulkAction(action);
      setShowBulkActionConfirm(true);
    } else {
      action.onClick([]);
    }
  };
  
  const handleConfirmBulkAction = () => {
    if (pendingBulkAction) {
      pendingBulkAction.onClick([]);
      setPendingBulkAction(null);
      setShowBulkActionConfirm(false);
    }
  };
  
  const hasActiveFilters = globalFilter || columnFilters.length > 0;
  
  return (
    <div className="space-y-3">
      {/* Main Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search across all columns..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* View Toggle */}
          {allowViewToggle && (
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => onViewChange('table')}
                className={clsx(
                  'px-3 py-2 flex items-center gap-2 transition-colors',
                  view === 'table'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
                title="Table view"
              >
                <Table2 className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Table</span>
              </button>
              <button
                onClick={() => onViewChange('card')}
                className={clsx(
                  'px-3 py-2 flex items-center gap-2 transition-colors border-l border-gray-300',
                  view === 'card'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
                title="Card view"
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Cards</span>
              </button>
            </div>
          )}
          
          {/* Column Manager */}
          <button
            onClick={onOpenColumnManager}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Manage columns"
          >
            <Settings className="w-5 h-5 text-gray-700" />
            <span className="hidden sm:inline text-sm font-medium text-gray-700">Columns</span>
          </button>
          
          {/* Export */}
          {exportable && (
            <button
              onClick={onExport}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="Export to CSV"
            >
              <Download className="w-5 h-5 text-gray-700" />
              <span className="hidden sm:inline text-sm font-medium text-gray-700">Export</span>
            </button>
          )}
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
              title="Clear all filters"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Clear Filters</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Bulk Actions Toolbar (shown when rows are selected) */}
      {selectedCount > 0 && bulkActions.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-primary-900 font-medium">
              <AlertCircle className="w-5 h-5" />
              <span>{selectedCount} row{selectedCount !== 1 ? 's' : ''} selected</span>
            </div>
            
            <div className="flex gap-2">
              {bulkActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleBulkActionClick(action)}
                  className={clsx(
                    'px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors',
                    action.variant === 'danger'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : action.variant === 'warning'
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  )}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={onClearSelection}
            className="px-3 py-1.5 text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}
      
      {/* Filter Info */}
      {columnFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {columnFilters.map((filter) => (
            <div
              key={filter.columnId}
              className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center gap-2"
            >
              <span className="font-medium">{filter.columnId}:</span>
              <span>{String(filter.value)}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Bulk Action Confirmation Dialog */}
      {pendingBulkAction && (
        <ConfirmationDialog
          open={showBulkActionConfirm}
          onOpenChange={setShowBulkActionConfirm}
          title={`Confirm ${pendingBulkAction.label}`}
          description={pendingBulkAction.confirmMessage || 'Are you sure you want to perform this action?'}
          confirmLabel={pendingBulkAction.label}
          variant={pendingBulkAction.variant === 'danger' ? 'danger' : 'info'}
          onConfirm={handleConfirmBulkAction}
        />
      )}
    </div>
  );
}
