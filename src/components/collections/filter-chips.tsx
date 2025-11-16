'use client';

import { X } from 'lucide-react';

type Filters = {
  category: string[];
  size: string[];
  discount: string[];
  color: string[];
  price: [number, number];
  fit: string[];
  style: string[];
};

type FilterChipsProps = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
};

export function FilterChips({ filters, setFilters }: FilterChipsProps) {
  const allActiveFilters = [
    ...filters.category.map(f => ({ type: 'category', value: f })),
    ...filters.size.map(f => ({ type: 'size', value: f })),
    ...filters.color.map(f => ({ type: 'color', value: f })),
    ...filters.fit.map(f => ({ type: 'fit', value: f })),
    ...filters.style.map(f => ({ type: 'style', value: f })),
  ];

  if (allActiveFilters.length === 0) return null;

  const removeFilter = (type: string, value: string) => {
    setFilters({
      ...filters,
      [type]: (filters[type as keyof Filters] as string[]).filter(f => f !== value)
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allActiveFilters.map((filter, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-semibold"
        >
          {filter.value}
          <button
            onClick={() => removeFilter(filter.type, filter.value)}
            className="hover:text-red-900 transition"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
