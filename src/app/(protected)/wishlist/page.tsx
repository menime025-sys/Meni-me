'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { UserWishlistData } from '@/server/storefront-service';

import { Button } from '@/components/ui/button';
import { WishlistItemCard } from './_components/wishlist-item-card';

const WishlistPage = () => {
  const { data: wishlistData } = useQuery({
    queryKey: ['user-wishlist'],
    queryFn: async () => {
      const response = await fetch('/api/storefront/wishlist');
      if (!response.ok) throw new Error('Failed to fetch wishlist');
      return response.json() as Promise<UserWishlistData>;
    },
  });

  const wishlistItems = wishlistData?.items ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Wishlist</p>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Pieces under consideration</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Your saved looks from the latest drops. Move them into your bag or share with your stylist.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/orders">View past orders</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/products">Shop new arrivals</Link>
            </Button>
          </div>
        </div>

        {wishlistItems.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {wishlistItems.map((item) => (
              <WishlistItemCard
                key={item.id}
                id={item.id}
                productId={item.productId}
                productName={item.product.name}
                price={item.product.price}
                image={item.product.mediaUrls[0] || '/placeholder.png'}
                slug={item.product.slug}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <h2 className="text-xl font-semibold text-slate-900">Your wishlist is empty</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Save your favorite silhouettes, accessories, and ready-to-wear pieces to keep them on your radar.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link href="/products">Find inspiration</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default WishlistPage;
