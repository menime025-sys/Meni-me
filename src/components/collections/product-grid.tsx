"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";

export type CollectionGridProduct = {
  id: string;
  slug: string;
  title: string;
  originalPrice: number;
  salePrice: number;
  discount?: string | null;
  image?: string | null;
  colors?: string[];
  category?: string;
  createdAt?: string;
};

type ProductGridProps = {
  products: CollectionGridProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  const [wishlist, setWishlist] = useState<string[]>([]);

  const toggleWishlist = (id: string) => {
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      black: 'bg-black',
      blue: 'bg-blue-600',
      navy: 'bg-blue-900',
      gray: 'bg-gray-500',
      lightBlue: 'bg-blue-300',
      white: 'bg-white border border-gray-300',
      red: 'bg-red-600',
      green: 'bg-green-600',
      brown: 'bg-amber-900',
      charcoal: 'bg-gray-700'
    };
    return colorMap[color] || 'bg-gray-400';
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No products found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(product => {
        const wishlistActive = wishlist.includes(product.id);
        const salePrice = product.salePrice.toLocaleString("en-IN");
        const originalPrice = product.originalPrice.toLocaleString("en-IN");

        return (
          <Link key={product.id} href={`/products/${product.slug}`} className="group cursor-pointer" prefetch={false}>
            <div className="relative mb-3 bg-gray-100 rounded-lg overflow-hidden aspect-3/4 md:aspect-2/3">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 50vw, 50vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                  {product.title.slice(0, 6)}
                </div>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  toggleWishlist(product.id);
                }}
                className={`absolute top-2 right-2 p-2 rounded-full transition ${
                  wishlistActive
                    ? "bg-red-600 text-white"
                    : "bg-white/80 hover:bg-white text-gray-900"
                }`}
              >
                <Heart size={18} fill={wishlistActive ? "currentColor" : "none"} />
              </button>
              {product.discount && (
                <span className="absolute bottom-2 left-2 bg-white text-xs font-bold text-red-600 px-2 py-1 rounded">
                  {product.discount}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs md:text-sm text-gray-600 line-clamp-2 min-h-8">{product.title}</p>

              <div className="flex items-center gap-2">
                <p className="text-xs md:text-sm font-bold text-gray-900">₹{salePrice}</p>
                <p className="text-xs text-gray-500 line-through">₹{originalPrice}</p>
              </div>

              {/* Color swatches */}
              <div className="flex gap-1">
                {(product.colors ?? []).slice(0, 3).map((color, idx) => (
                  <div
                    key={`${product.id}-${color}-${idx}`}
                    className={`w-3 h-3 rounded-full ${getColorClass(color)}`}
                    title={color}
                  />
                ))}
                {product.colors && product.colors.length > 3 && (
                  <span className="text-xs text-gray-600 ml-1">+{product.colors.length - 3}</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
