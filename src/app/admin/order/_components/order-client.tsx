"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { RefreshCcw } from "lucide-react";
import { OrderStatus, PaymentStatus } from "@/generated/prisma";

const orderFormSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  paymentStatus: z.nativeEnum(PaymentStatus),
  notes: z.string().optional().nullable(),
});

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
};

type OrderItemResponse = {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    slug: string;
  };
};

type OrderAddress = {
  fullName?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
  [key: string]: unknown;
} | null;

type OrderResponse = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number | null;
  tax: number | null;
  total: number;
  currency: string;
  notes: string | null;
  placedAt: string;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: OrderItemResponse[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
};

const mapOrderToForm = (order: OrderResponse) => ({
  status: order.status,
  paymentStatus: order.paymentStatus,
  notes: order.notes ?? "",
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

type OrderClientProps = {
  initialOrders?: OrderResponse[];
};

const OrderClient = ({ initialOrders }: OrderClientProps) => {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrders && initialOrders.length > 0 ? initialOrders[0].id : null,
  );

  const { data: orders = [], isFetching } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => fetcher<OrderResponse[]>("/api/admin/order"),
    initialData: initialOrders,
  });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      notes: "",
    },
  });

  const selectedOrder = useMemo(() => {
    if (orders.length === 0) return null;
    if (selectedOrderId) {
      return orders.find((order) => order.id === selectedOrderId) ?? orders[0];
    }

    return orders[0];
  }, [orders, selectedOrderId]);

  const lastSyncedId = useRef<string | null>(selectedOrder?.id ?? null);

  useEffect(() => {
    if (!selectedOrder || form.formState.isDirty) {
      return;
    }

    if (lastSyncedId.current === selectedOrder.id) {
      return;
    }

    form.reset(mapOrderToForm(selectedOrder));
    lastSyncedId.current = selectedOrder.id;
  }, [selectedOrder, form, form.formState.isDirty]);

  const updateMutation = useMutation({
    mutationFn: async (payload: OrderFormValues) => {
      if (!selectedOrder) return;

      const response = await fetch(`/api/admin/order/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: payload.status,
          paymentStatus: payload.paymentStatus,
          notes: payload.notes?.trim() ? payload.notes.trim() : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to update order" }));
        throw new Error(body.message ?? "Unable to update order");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      form.reset(variables);
    },
  });

  const handleRowClick = (order: OrderResponse) => {
    setSelectedOrderId(order.id);
    form.reset(mapOrderToForm(order));
  };

  const onSubmit: SubmitHandler<OrderFormValues> = (values) => {
    return updateMutation.mutate(values);
  };

  const mutationError = updateMutation.error as Error | undefined;

  const orderRows = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      customerName: order.user.name ?? "Guest",
    }));
  }, [orders]);

  const renderAddress = (address: OrderAddress) => {
    if (!address) return "Not provided";

    const parts = [
      address.fullName,
      address.streetLine1,
      address.streetLine2,
      [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
      address.country,
    ]
      .filter(Boolean)
      .join("\n");

    return parts || "Not provided";
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
            <p className="text-sm text-slate-500">
              {isFetching ? "Refreshing orders…" : `${formatNumber(orderRows.length)} records`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] })}
          >
            <RefreshCcw className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orderRows.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <tr
                    key={order.id}
                    className={cn(
                      "cursor-pointer transition hover:bg-slate-50",
                      isSelected ? "bg-slate-900/5" : "",
                    )}
                    onClick={() => handleRowClick(order)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">
                        Placed {new Date(order.placedAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <p>{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {order.status}
                    </td>
                  </tr>
                );
              })}
              {orderRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    {isFetching ? "Loading orders…" : "No orders yet"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {selectedOrder ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Line items</h3>
            <div className="mt-4 space-y-4">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 text-sm text-slate-600">
                  <div>
                    <p className="font-semibold text-slate-900">{item.product.name}</p>
                    <p className="text-xs text-slate-500">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Order details</h2>
          <p className="text-sm text-slate-500">
            Update fulfillment and payment state to keep operations aligned.
          </p>

          {selectedOrder ? (
            <Form {...form}>
              <form className="mt-6 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                {mutationError ? (
                  <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-600">
                    {mutationError.message}
                  </p>
                ) : null}

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fulfillment status</FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value as OrderStatus)}
                        >
                          {Object.values(OrderStatus).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription>Communicate where the package stands.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment status</FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value as PaymentStatus)}
                        >
                          {Object.values(PaymentStatus).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription>Track what finance should expect.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal notes</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Gift wrap request, delivery instructions…" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormDescription>Only your team can see these.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => (selectedOrder ? form.reset(mapOrderToForm(selectedOrder)) : undefined)}
                    disabled={updateMutation.isPending}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    Save changes
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Select an order to manage statuses.</p>
          )}
        </div>

        {selectedOrder ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Summary</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatCurrency(selectedOrder.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{selectedOrder.shippingFee !== null ? formatCurrency(selectedOrder.shippingFee) : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{selectedOrder.tax !== null ? formatCurrency(selectedOrder.tax) : "—"}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold text-slate-900">
                <dt>Total</dt>
                <dd>{formatCurrency(selectedOrder.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Placed</dt>
                <dd>{new Date(selectedOrder.placedAt).toLocaleString()}</dd>
              </div>
              {selectedOrder.fulfilledAt ? (
                <div className="flex justify-between">
                  <dt>Fulfilled</dt>
                  <dd>{new Date(selectedOrder.fulfilledAt).toLocaleString()}</dd>
                </div>
              ) : null}
              {selectedOrder.cancelledAt ? (
                <div className="flex justify-between text-rose-500">
                  <dt>Cancelled</dt>
                  <dd>{new Date(selectedOrder.cancelledAt).toLocaleString()}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 grid gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Shipping to
                </h4>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{renderAddress(selectedOrder.shippingAddress)}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Billing to
                </h4>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{renderAddress(selectedOrder.billingAddress)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderClient;
export type { OrderResponse };
