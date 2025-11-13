'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CartItemWithProduct } from '@/server/storefront-service';

import { formatCurrency } from '@/lib/format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CheckoutPayment from './_components/checkout-payment';

const FALLBACK_GRADIENT = 'bg-linear-to-br from-slate-200 via-slate-100 to-slate-300';

const CheckoutPage = () => {
  const { data: cartData } = useQuery({
    queryKey: ['user-cart'],
    queryFn: async () => {
      const response = await fetch('/api/storefront/cart');
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
  });

  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  const cartItems: CartItemWithProduct[] = cartData?.items ?? [];

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Checkout</p>
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Complete your look
              </h1>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/cart">Return to bag</Link>
            </Button>
          </div>

          <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Add items to your cart before proceeding to checkout.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const checkoutPayload = cartItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 250 ? 0 : 12;
  const taxes = Math.round(subtotal * 0.09 * 100) / 100;
  const total = subtotal + shipping + taxes;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Checkout</p>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Complete your look</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Confirm delivery details and secure your pieces with Razorpay. You&apos;re moments away from a curated wardrobe upgrade.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/cart">Return to bag</Link>
          </Button>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Delivery & payment
              </CardTitle>
              <CardDescription className="text-slate-500">
                Fill in your information and confirm payment securely with Razorpay.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <CheckoutPayment amount={total} currency="INR" items={checkoutPayload} profile={profileData} />
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Order summary</CardTitle>
                <CardDescription className="text-slate-500">
                  Review your capsule before completing the payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const image = item.product.mediaUrls[0] ?? null;
                    return (
                      <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                        <div className="relative size-20 overflow-hidden rounded-2xl">
                          {image ? (
                            <Image
                              src={image}
                              alt={item.product.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className={`flex h-full w-full items-center justify-center ${FALLBACK_GRADIENT}`}>
                              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
                                Meni-me
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                Qty · {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(item.product.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Complimentary' : formatCurrency(shipping)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taxes</span>
                    <span>{formatCurrency(taxes)}</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                    <span>Total due</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Trust the Meni-me standard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>• Secure Razorpay payments with instant confirmation.</p>
                <p>• Delivery estimates shared within minutes of payment.</p>
                <p>• White-glove support and easy returns on every order.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default CheckoutPage;
