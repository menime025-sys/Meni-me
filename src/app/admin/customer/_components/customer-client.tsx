"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { RefreshCcw } from "lucide-react";
import { UserRole } from "@/generated/prisma";

const customerFormSchema = z.object({
  name: z.string().min(1, "Required"),
  role: z.nativeEnum(UserRole),
  emailVerified: z.boolean(),
  defaultAddressId: z.string().nullable(),
});

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
};

type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phoneNumber: string | null;
  streetLine1: string;
  streetLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
};

type CustomerResponse = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  defaultAddress: Address | null;
  addresses: Address[];
};

const mapCustomerToForm = (customer: CustomerResponse) => ({
  name: customer.name ?? "",
  role: customer.role,
  emailVerified: customer.emailVerified,
  defaultAddressId: customer.defaultAddress?.id ?? null,
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

type CustomerClientProps = {
  initialCustomers?: CustomerResponse[];
};

const CustomerClient = ({ initialCustomers }: CustomerClientProps) => {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialCustomers && initialCustomers.length > 0 ? initialCustomers[0].id : null,
  );

  const { data: customers = [], isFetching } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => fetcher<CustomerResponse[]>("/api/admin/customer"),
    initialData: initialCustomers,
  });

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      role: UserRole.CUSTOMER,
      emailVerified: false,
      defaultAddressId: null,
    },
  });

  const selectedCustomer = useMemo(() => {
    if (customers.length === 0) return null;
    if (selectedCustomerId) {
      return customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0];
    }

    return customers[0];
  }, [customers, selectedCustomerId]);

  const lastSyncedId = useRef<string | null>(selectedCustomer?.id ?? null);

  useEffect(() => {
    if (!selectedCustomer || form.formState.isDirty) {
      return;
    }

    if (lastSyncedId.current === selectedCustomer.id) {
      return;
    }

    form.reset(mapCustomerToForm(selectedCustomer));
    lastSyncedId.current = selectedCustomer.id;
  }, [selectedCustomer, form, form.formState.isDirty]);

  const updateMutation = useMutation({
    mutationFn: async (payload: CustomerFormValues) => {
      if (!selectedCustomer) return;

      const response = await fetch(`/api/admin/customer/${selectedCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          role: payload.role,
          emailVerified: payload.emailVerified,
          defaultAddressId: payload.defaultAddressId ?? null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to update customer" }));
        throw new Error(body.message ?? "Unable to update customer");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      form.reset(variables);
    },
  });

  const handleRowClick = (customer: CustomerResponse) => {
    setSelectedCustomerId(customer.id);
    form.reset(mapCustomerToForm(customer));
  };

  const onSubmit: SubmitHandler<CustomerFormValues> = (values) => {
    return updateMutation.mutate(values);
  };

  const mutationError = updateMutation.error as Error | undefined;

  const customerRows = useMemo(() => {
    return customers.map((customer) => ({
      ...customer,
      name: customer.name ?? "Untitled",
    }));
  }, [customers]);

  return (
    <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Customer roster</h2>
            <p className="text-sm text-slate-500">
              {isFetching ? "Refreshing customers…" : `${formatNumber(customerRows.length)} profiles`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "customers"] })}
          >
            <RefreshCcw className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total spent</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerRows.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;
                return (
                  <tr
                    key={customer.id}
                    className={cn(
                      "cursor-pointer transition hover:bg-slate-50",
                      isSelected ? "bg-slate-900/5" : "",
                    )}
                    onClick={() => handleRowClick(customer)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                      <p className="text-xs text-slate-500">{customer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatNumber(customer.totalOrders)} orders
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {customer.role === UserRole.ADMIN ? "Admin" : "Customer"}
                    </td>
                  </tr>
                );
              })}
              {customerRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    {isFetching ? "Loading customers…" : "No customers yet."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Customer details</h2>
          <p className="text-sm text-slate-500">
            Manage customer permissions, verification, and address preferences.
          </p>

          {selectedCustomer ? (
            <Form {...form}>
              <form className="mt-6 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                {mutationError ? (
                  <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-600">
                    {mutationError.message}
                  </p>
                ) : null}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value as UserRole)}
                        >
                          <option value={UserRole.CUSTOMER}>Customer</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        Admins gain access to the entire dashboard.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailVerified"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                      <div>
                        <FormLabel className="text-sm font-semibold">Email verified</FormLabel>
                        <FormDescription>Toggle if the inbox has been confirmed.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultAddressId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default shipping address</FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value || null)}
                        >
                          <option value="">No default address</option>
                          {selectedCustomer.addresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.label ?? address.fullName}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription>Select which address pre-fills checkout.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => (selectedCustomer ? form.reset(mapCustomerToForm(selectedCustomer)) : undefined)}
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
            <p className="mt-6 text-sm text-slate-500">Select a customer to view details.</p>
          )}
        </div>

        {selectedCustomer ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Activity & addresses
            </h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Joined</dt>
                <dd>{new Date(selectedCustomer.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Last order</dt>
                <dd>
                  {selectedCustomer.lastOrderDate
                    ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString()
                    : "No orders yet"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Lifetime spend</dt>
                <dd>{formatCurrency(selectedCustomer.totalSpent)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Orders placed</dt>
                <dd>{formatNumber(selectedCustomer.totalOrders)}</dd>
              </div>
            </dl>

            <div className="mt-6 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Addresses
              </h4>
              {selectedCustomer.addresses.length === 0 ? (
                <p className="text-sm text-slate-500">No addresses saved.</p>
              ) : (
                selectedCustomer.addresses.map((address) => {
                  const isDefault = selectedCustomer.defaultAddress?.id === address.id;
                  return (
                    <div
                      key={address.id}
                      className={cn(
                        "rounded-xl border border-slate-200 px-4 py-3 text-sm",
                        isDefault ? "border-slate-900 bg-slate-900/5" : ""
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{address.fullName}</p>
                        {address.label ? (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {address.label}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-slate-600">
                        {address.streetLine1}
                        {address.streetLine2 ? `, ${address.streetLine2}` : ""}
                      </p>
                      <p className="text-slate-600">
                        {[address.city, address.state, address.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-slate-500">{address.country}</p>
                      {address.phoneNumber ? (
                        <p className="text-xs text-slate-500">Phone {address.phoneNumber}</p>
                      ) : null}
                      {isDefault ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Default address
                        </p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CustomerClient;
export type { CustomerResponse };
