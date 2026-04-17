import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export type TypeaheadItem<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
};

interface TypeaheadLookupProps<T extends string | number> {
  items: TypeaheadItem<T>[];
  value?: T;
  onSelect: (value: T | undefined) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  label?: string;
}

export function TypeaheadLookup<T extends string | number>({
  items,
  value,
  onSelect,
  placeholder = 'Search…',
  emptyText = 'No results',
  disabled = false,
  label,
}: TypeaheadLookupProps<T>) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q));
  }, [items, query]);

  const selectedLabel = useMemo(() => items.find((item) => item.value === value)?.label, [items, value]);

  return (
    <div className="relative">
      {label && <label className="text-sm text-gray-600 mb-1 block">{label}</label>}
      <div
        className={cn(
          'flex items-center gap-2 border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500 bg-white',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-text'
        )}
        onClick={() => !disabled && setOpen(true)}
      >
        <Search className="h-4 w-4 text-gray-400" />
        <input
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm bg-transparent"
        />
        {value !== undefined && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(undefined);
              setQuery('');
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {selectedLabel && query === '' && (
        <p className="text-xs text-gray-600 mt-1">Selected: {selectedLabel}</p>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto animate-in fade-in slide-in-from-top-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{emptyText}</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onSelect(item.value);
                  setQuery('');
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                  item.value === value ? 'bg-primary-50 text-primary-800' : 'text-gray-800'
                )}
              >
                <div className="font-semibold">{item.label}</div>
                {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

