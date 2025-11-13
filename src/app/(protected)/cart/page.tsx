'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CartItemWithProduct, UserCartData } from '@/server/storefront-service';

import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CartItemCard } from './_components/cart-item-card';

const CartPage = () => {

  const { data: cartData } = useQuery({
    queryKey: ['user-cart'],
    queryFn: async () => {
      const response = await fetch('/api/storefront/cart');
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json() as Promise<UserCartData>;
    },
  });

  const cartItems: CartItemWithProduct[] = cartData?.items ?? [];

  const subtotal = cartItems.reduce((total: number, item: CartItemWithProduct) => {
    return total + (item.product.price * item.quantity);
  }, 0);

  const shipping = subtotal >= 250 ? 0 : 12;
  const taxes = Math.round(subtotal * 0.09 * 100) / 100;
  const total = subtotal + shipping + taxes;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Your bag</p>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Ready to deliver</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review your curated picks before heading to checkout. Shipping is complimentary on orders over {formatCurrency(250)}.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            {cartItems.length > 0 ? (
              <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <CardContent className="divide-y">
                  {cartItems.map((item: CartItemWithProduct) => (
                    <CartItemCard
                      key={item.id}
                      id={item.id}
                      productId={item.productId}
                      productName={item.product.name}
                      price={item.product.price}
                      quantity={item.quantity}
                      image={item.product.mediaUrls[0] || '/placeholder.png'}
                    />
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-3xl border-dashed bg-slate-50 text-center">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-900">Your bag is currently empty</CardTitle>
                  <CardDescription className="text-slate-500">
                    Explore the latest drops and add your favorites to build your look.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center pb-6">
                  <Button asChild className="rounded-full">
                    <Link href="/products">Shop the collection</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Order summary</CardTitle>
                <CardDescription className="text-slate-500">
                  Taxes are estimated and will be updated during checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Complimentary' : formatCurrency(shipping)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Taxes</span>
                  <span>{formatCurrency(taxes)}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pb-6">
                <Button
                  asChild
                  className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
                  disabled={cartItems.length === 0}
                >
                  <Link href="/checkout">Proceed to checkout</Link>
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Need styling support? Chat with our concierge team for fit guidance.
                </p>
              </CardFooter>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Delivery promise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>• Express dispatch within 24 hours for in-stock items.</p>
                <p>• Complimentary tailoring consults for every apparel order.</p>
                <p>• Easy returns within 14 days — pick-up scheduled for you.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default CartPage;
