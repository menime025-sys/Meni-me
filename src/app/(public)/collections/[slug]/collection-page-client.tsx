"use client";

import { useMemo, useState } from "react";
import Footer from "@/components/layout/footer";
import { FilterPanel } from "@/components/collections/filter-panel";
import { ProductGrid, type CollectionGridProduct } from "@/components/collections/product-grid";
import { FilterChips } from "@/components/collections/filter-chips";
import { SortDropdown } from "@/components/collections/sort-dropdown";
import { Settings2, Sliders, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { StorefrontCollection } from "@/lib/storefront/catalog";

const FALLBACK_FEATURED_CATEGORIES = ["JEANS", "T-SHIRTS", "JACKETS", "SHIRTS", "SWEATSHIRT"];
const FALLBACK_ALL_CATEGORIES = [
  "JEANS",
  "T-SHIRTS",
  "JACKETS",
  "SHIRTS",
  "SWEATSHIRT",
  "COATS",
  "BELTS",
  "BAGS",
  "CARGOS",
  "CHINOS",
];

type Filters = {
  category: string[];
  size: string[];
  discount: string[];
  color: string[];
  price: [number, number];
  fit: string[];
  style: string[];
};

type CollectionPageClientProps = {
  collection: StorefrontCollection;
  childrenCollections: StorefrontCollection[];
  products: CollectionGridProduct[];
};

const createDefaultFilters = (): Filters => ({
  category: [],
  size: [],
  discount: [],
  color: [],
  price: [0, 100000] as [number, number],
  fit: [],
  style: [],
});

const formatCategory = (value: string) => value.trim().toUpperCase();

export function CollectionPageClient({ collection, childrenCollections, products }: CollectionPageClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [filters, setFilters] = useState<Filters>(createDefaultFilters);

  const derivedCategories = childrenCollections.length
    ? childrenCollections.map((child) => formatCategory(child.name))
    : FALLBACK_FEATURED_CATEGORIES;

  const allCategories = Array.from(
    new Set([
      ...derivedCategories,
      ...childrenCollections.map((child) => formatCategory(child.name)),
      ...FALLBACK_ALL_CATEGORIES,
    ]),
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.category.length > 0) {
        const productCategory = product.category ? formatCategory(product.category) : null;
        if (!productCategory || !filters.category.includes(productCategory)) {
          return false;
        }
      }

      if (filters.price && (product.salePrice < filters.price[0] || product.salePrice > filters.price[1])) {
        return false;
      }

      return true;
    });
  }, [filters, products]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.salePrice - b.salePrice);
      case "price-high":
        return sorted.sort((a, b) => b.salePrice - a.salePrice);
      case "a-z":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "z-a":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case "newest":
        return sorted.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        });
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  const hasActiveFilters = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : false,
  );

  const handleClearFilters = () => {
    setFilters(createDefaultFilters());
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
  };

  const handleCategoryToggle = (category: string) => {
    const normalized = formatCategory(category);
    setFilters((prev) => ({
      ...prev,
      category: prev.category.includes(normalized)
        ? prev.category.filter((cat) => cat !== normalized)
        : [...prev.category, normalized],
    }));
  };

  const heroTitle = formatCategory(collection.name);

  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1">
        <div className="border-b border-gray-200 px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 hover:border-gray-400 transition whitespace-nowrap"
            >
              <Sliders size={16} />
              FILTERS
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-base md:text-xl lg:text-2xl font-bold text-gray-900">
                {heroTitle}
              </h1>
              {collection.description ? (
                <p className="mt-1 text-xs text-gray-500 uppercase tracking-[0.3em]">{collection.description}</p>
              ) : null}
            </div>

            <div className="whitespace-nowrap">
              <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
            </div>
          </div>
        </div>

        <div className="flex relative">
          <div className="hidden lg:block w-80 border-r border-gray-200 bg-white sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="px-6 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-900">Filter by</h2>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold transition"
                  >
                    CLEAR ×
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 font-semibold">₹</div>
            </div>
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              onClear={handleClearFilters}
              title={collection.name}
            />
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetContent side="left" className="w-full max-w-sm sm:w-96 p-0 rounded-none">
              <SheetHeader className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-sm font-bold uppercase tracking-[0.3em] text-gray-900">Filter by</SheetTitle>
                    <SheetDescription className="text-xs text-gray-500 font-semibold mt-2">₹</SheetDescription>
                  </div>
                  <SheetClose className="p-2 hover:bg-gray-100 rounded transition" asChild>
                    <button aria-label="Close filter sheet">
                      <X size={20} className="text-gray-600" />
                    </button>
                  </SheetClose>
                </div>
              </SheetHeader>

              <div className="overflow-y-auto h-[calc(100vh-180px)]">
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  onClear={handleClearFilters}
                  isMobile
                  onApply={handleApplyFilters}
                  title={collection.name}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={isMoreCategoriesOpen} onOpenChange={setIsMoreCategoriesOpen}>
            <SheetContent side="left" className="w-full max-w-sm sm:w-96 p-0 rounded-none">
              <SheetHeader className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sm font-bold uppercase tracking-[0.3em] text-gray-900">Categories</SheetTitle>
                  <SheetClose className="p-2 hover:bg-gray-100 rounded transition" asChild>
                    <button aria-label="Close categories sheet">
                      <X size={20} className="text-gray-600" />
                    </button>
                  </SheetClose>
                </div>
              </SheetHeader>

              <div className="overflow-y-auto h-[calc(100vh-120px)] px-6 py-4">
                <div className="space-y-2">
                  {allCategories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-gray-50 transition group">
                      <input
                        type="checkbox"
                        checked={filters.category.includes(cat)}
                        onChange={(e) => {
                          setFilters((prev) => ({
                            ...prev,
                            category: e.target.checked
                              ? [...prev.category, cat]
                              : prev.category.filter((c) => c !== cat),
                          }));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-white">
                <button
                  onClick={() => setIsMoreCategoriesOpen(false)}
                  className="w-full px-4 py-3 bg-black text-white text-sm font-bold uppercase tracking-[0.2em] rounded transition hover:bg-gray-900"
                >
                  APPLY
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <div className="hidden lg:flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
              <FilterChips filters={filters} setFilters={setFilters} />
              <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
            </div>

            <div className="border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4">
              <div className="max-w-full">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-900 mb-3">FILTER FOR YOU</h3>
                <div className="flex flex-wrap gap-2">
                  {derivedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        filters.category.includes(cat)
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsMoreCategoriesOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition"
                  >
                    +More
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 md:px-6 lg:px-8 py-8">
              <ProductGrid products={sortedProducts} />
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-4 md:px-6 lg:px-8 py-8">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-6">GOT ANY SIZE/COLOR?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-red-600 mb-4">SIZE</h4>
                    <div className="flex flex-wrap gap-2">
                      {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                        <button
                          key={size}
                          className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded hover:border-gray-400 transition"
                        >
                          {size}
                        </button>
                      ))}
                      <button className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 transition">
                        +More
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-red-600 mb-4">COLOR</h4>
                    <div className="flex flex-wrap gap-3">
                      {["black", "blue", "gray", "navy", "white"].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition ${
                            color === "black"
                              ? "bg-black"
                              : color === "blue"
                              ? "bg-blue-600"
                              : color === "gray"
                              ? "bg-gray-400"
                              : color === "navy"
                              ? "bg-blue-900"
                              : "bg-white"
                          }`}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-2 gap-0 border-t border-gray-200 bg-white lg:hidden">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-900 border-r border-gray-200 hover:bg-gray-50 transition"
          >
            <Settings2 size={18} />
            SORT
          </button>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-900 hover:bg-gray-50 transition"
          >
            <Sliders size={18} />
            FILTER
          </button>
        </div>
      </main>

      <div className="h-20 lg:h-0" />

      <Footer />
    </div>
  );
}
