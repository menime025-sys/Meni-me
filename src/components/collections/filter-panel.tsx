'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

type Filters = {
  category: string[];
  size: string[];
  discount: string[];
  color: string[];
  price: [number, number];
  fit: string[];
  style: string[];
};

type FilterPanelProps = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onClear: () => void;
  isMobile?: boolean;
  onApply?: () => void;
  title?: string;
};

export function FilterPanel({ filters, setFilters, onClear, isMobile, onApply, title }: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['category']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const filterOptions = {
    categories: ['Bags', 'Belts', 'Cargos', 'Chinos', 'Coats', 'Jackets', 'Jeans', 'Shirts', 'T-Shirts', 'Sweaters'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    discounts: ['0-25%', '25-50%', '50-75%', '75%+'],
    colors: ['Black', 'Blue', 'Gray', 'Navy', 'White', 'Red', 'Green', 'Brown'],
    fits: ['Slim', 'Relaxed', 'Tapered', 'Baggy', 'Regular'],
    styles: ['Graphic', 'Solid', 'Striped', 'Embroidered', 'Printed'],
  };

  const renderFilterSection = (title: string, options: string[], filterKey: keyof Filters, isExpanded: boolean) => {
    return (
      <div key={filterKey} className={`border-b border-gray-200 ${!isMobile ? 'py-4' : 'py-0'}`}>
        <button
          onClick={() => toggleSection(filterKey as string)}
          className={`flex items-center justify-between w-full ${isMobile ? 'px-4 py-4' : 'px-0 py-4'} text-xs font-bold uppercase tracking-[0.3em] text-gray-900 hover:text-red-600 transition`}
        >
          {title}
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className={`space-y-2 ${isMobile ? 'px-4 pb-4' : 'pb-4'} ${isMobile ? 'animate-in slide-in-from-top-2' : ''}`}>
            {options.map(option => (
              <label key={option} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(filters[filterKey] as string[]).includes(option)}
                  onChange={(e) => {
                    if (Array.isArray(filters[filterKey])) {
                      setFilters({
                        ...filters,
                        [filterKey]: e.target.checked
                          ? [...(filters[filterKey] as string[]), option]
                          : (filters[filterKey] as string[]).filter(f => f !== option)
                      });
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 cursor-pointer"
                />
                <span className="text-xs text-gray-600 group-hover:text-gray-900 transition">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${isMobile ? '' : 'px-4'}`}>
      {isMobile && (
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-900">
            {title ? title : "FILTERS"}
          </h3>
        </div>
      )}

      <div className="space-y-0">
        {renderFilterSection('CATEGORIES', filterOptions.categories, 'category', expandedSections.includes('category'))}
        {renderFilterSection('SIZE', filterOptions.sizes, 'size', expandedSections.includes('size'))}
        {renderFilterSection('DISCOUNT', filterOptions.discounts, 'discount', expandedSections.includes('discount'))}
        {renderFilterSection('COLOR', filterOptions.colors, 'color', expandedSections.includes('color'))}
        {renderFilterSection('PRICE', ['₹0-₹5000', '₹5000-₹10000', '₹10000+'], 'price', expandedSections.includes('price'))}
        {renderFilterSection('FIT', filterOptions.fits, 'fit', expandedSections.includes('fit'))}
        {renderFilterSection('STYLE', filterOptions.styles, 'style', expandedSections.includes('style'))}
      </div>

      {isMobile && (
        <div className="sticky bottom-0 grid grid-cols-2 gap-3 px-4 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClear}
            className="px-4 py-3 border border-gray-900 text-gray-900 text-sm font-bold uppercase tracking-[0.2em] rounded transition hover:bg-gray-50"
          >
            CLEAR
          </button>
          <button
            onClick={onApply}
            className="px-4 py-3 bg-black text-white text-sm font-bold uppercase tracking-[0.2em] rounded transition hover:bg-gray-900"
          >
            APPLY
          </button>
        </div>
      )}
    </div>
  );
}
