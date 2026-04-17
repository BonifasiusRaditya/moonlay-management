import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Filter, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { DataTableColumnFilterProps } from './datatable-types';

export function DataTableColumnFilter<T>({
  column,
  filter,
  onFilterChange,
}: DataTableColumnFilterProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [operator, setOperator] = useState<string>(filter?.operator || 'contains');
  const [value, setValue] = useState<any>(filter?.value || '');
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [numberRange, setNumberRange] = useState<[string, string]>(['', '']);
  
  const hasActiveFilter = filter !== undefined && filter !== null;
  
  const handleApply = () => {
    if (!value && operator !== 'between') {
      onFilterChange(null);
      setIsOpen(false);
      return;
    }
    
    let filterValue = value;
    
    if (operator === 'between' && column.filterType === 'date') {
      filterValue = dateRange;
    } else if (operator === 'between' && column.filterType === 'number') {
      filterValue = numberRange;
    }
    
    onFilterChange({
      columnId: column.id,
      value: filterValue,
      operator: operator as any,
    });
    setIsOpen(false);
  };
  
  const handleClear = () => {
    setValue('');
    setDateRange(['', '']);
    setNumberRange(['', '']);
    setOperator(column.filterType === 'text' ? 'contains' : 'equals');
    onFilterChange(null);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && filter) {
      setValue(filter.value);
      setOperator(filter.operator || 'contains');
      if (Array.isArray(filter.value) && filter.operator === 'between') {
        if (column.filterType === 'date') {
          setDateRange(filter.value as [string, string]);
        } else if (column.filterType === 'number') {
          setNumberRange(filter.value as [string, string]);
        }
      }
    }
  };
  
  const renderFilterInput = () => {
    if (column.filterType === 'select') {
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Value</label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select...</option>
            {column.filterOptions?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    
    if (column.filterType === 'date') {
      if (operator === 'between') {
        return (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange[0]}
                onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                value={dateRange[1]}
                onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      );
    }
    
    if (column.filterType === 'number') {
      if (operator === 'between') {
        return (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={numberRange[0]}
                onChange={(e) => setNumberRange([e.target.value, numberRange[1]])}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={numberRange[1]}
                onChange={(e) => setNumberRange([numberRange[0], e.target.value])}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Value</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      );
    }
    
    // Text filter (default)
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Value</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter filter value..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    );
  };
  
  const getOperatorOptions = (): Array<{ value: string; label: string }> => {
    if (column.filterType === 'select') {
      return [{ value: 'equals', label: 'Equals' }];
    }
    
    if (column.filterType === 'date') {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'before', label: 'Before' },
        { value: 'after', label: 'After' },
        { value: 'between', label: 'Between' },
      ];
    }
    
    if (column.filterType === 'number') {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'greaterThan', label: 'Greater Than' },
        { value: 'lessThan', label: 'Less Than' },
        { value: 'between', label: 'Between' },
      ];
    }
    
    // Text filter
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'startsWith', label: 'Starts With' },
      { value: 'endsWith', label: 'Ends With' },
    ];
  };
  
  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenu.Trigger asChild>
        <button
          className={clsx(
            'p-1 rounded hover:bg-gray-200 transition-colors',
            hasActiveFilter && 'text-primary-600 bg-primary-50 hover:bg-primary-100'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {hasActiveFilter ? (
            <div className="relative">
              <Filter className="w-4 h-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-600 rounded-full" />
            </div>
          ) : (
            <Filter className="w-4 h-4" />
          )}
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[280px] bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
          align="start"
          sideOffset={5}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">Filter {column.header}</h4>
              {hasActiveFilter && (
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            
            {column.filterType !== 'select' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Operator</label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {getOperatorOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {renderFilterInput()}
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
