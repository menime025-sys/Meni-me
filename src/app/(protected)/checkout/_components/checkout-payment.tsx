"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import RazorpayButton from "@/components/payments/razorpay-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  FormattedProfileAddress,
  ProfileResponse,
} from "@/server/profile-service";
import { commerceCountsQueryKey } from "@/lib/query-keys";

const isEmailValid = (value: string) => /.+@.+\..+/.test(value);
const isPhoneValid = (value: string) => /^\+?[0-9]{6,15}$/.test(value.trim());

type CheckoutPaymentProps = {
  amount: number;
  currency?: string;
  orderId?: string;
  profile?: ProfileResponse | null;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
};

type CheckoutFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
};

const splitFullName = (name?: string | null) => {
  if (!name) {
    return { firstName: "", lastName: "" };
  }

  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { firstName: "", lastName: "" };
  }

  const [first, ...rest] = tokens;
  return {
    firstName: first ?? "",
    lastName: rest.join(" ") ?? "",
  };
};

const createInitialFormState = (profile?: ProfileResponse | null): CheckoutFormState => {
  const { firstName, lastName } = splitFullName(profile?.name);
  return {
    firstName,
    lastName,
    email: profile?.email ?? "",
    phone: profile?.phoneNumber ?? "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    notes: "",
  };
};

const formatSavedAddress = (address: FormattedProfileAddress | null) => {
  if (!address) {
    return "";
  }

  const segments = [
    address.streetLine1,
    address.streetLine2,
    [address.city, address.state].filter(Boolean).join(", "),
    [address.country, address.postalCode].filter(Boolean).join(" - "),
  ]
    .filter((segment): segment is string => typeof segment === "string" && segment.trim().length > 0)
    .map((segment) => segment.trim());

  return segments.join(", ");
};

const formatSavedAddressNote = (address: FormattedProfileAddress | null) => {
  if (!address) {
    return "";
  }

  const location = formatSavedAddress(address);
  const primaryLabel = address.label
    ? `${address.label}${address.fullName ? ` (${address.fullName})` : ""}`
    : address.fullName;

  return [primaryLabel, location]
    .filter((segment): segment is string => typeof segment === "string" && segment.trim().length > 0)
    .map((segment) => segment.trim())
    .join(" · ");
};

const formatManualAddressNote = (state: CheckoutFormState) => {
  const segments = [
    state.addressLine1,
    state.addressLine2,
    [state.city, state.state].filter(Boolean).join(", "),
    state.postalCode,
  ]
    .filter((segment): segment is string => typeof segment === "string" && segment.trim().length > 0)
    .map((segment) => segment.trim());

  return segments.join(", ");
};

const CheckoutPayment = ({ amount, currency = "INR", orderId, profile, items }: CheckoutPaymentProps) => {
  const queryClient = useQueryClient();
  const savedAddresses = useMemo(
    () => profile?.addresses ?? [],
    [profile],
  );
  const defaultSavedAddressId = savedAddresses.length === 0
    ? null
    : profile?.defaultAddressId && savedAddresses.some((address) => address.id === profile.defaultAddressId)
      ? profile.defaultAddressId
      : savedAddresses[0]?.id ?? null;

  const [form, setForm] = useState(() => createInitialFormState(profile));
  const [addressMode, setAddressMode] = useState<"saved" | "new">(
    savedAddresses.length > 0 ? "saved" : "new",
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    savedAddresses.length > 0 ? defaultSavedAddressId : null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "success" | "error">("info");

  const orderedProductIds = useMemo(() => {
    if (!items) {
      return [] as string[];
    }

    return items
      .map((item) => item.productId)
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0);
  }, [items]);

  const handleFieldChange = (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) {
      return null;
    }

    return savedAddresses.find((address) => address.id === selectedAddressId) ?? null;
  }, [savedAddresses, selectedAddressId]);

  const isFormValid = useMemo(() => {
    const hasContactDetails =
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      isEmailValid(form.email) &&
      isPhoneValid(form.phone);

    if (!hasContactDetails) {
      return false;
    }

    if (addressMode === "saved") {
      return !!selectedAddress;
    }

    return (
      form.addressLine1.trim().length > 0 &&
      form.city.trim().length > 0 &&
      form.state.trim().length > 0 &&
      form.postalCode.trim().length > 0
    );
  }, [addressMode, form, selectedAddress]);

  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [amount, currency]);

  const statusClass =
    statusTone === "success"
      ? "text-emerald-600"
      : statusTone === "error"
        ? "text-rose-600"
        : "text-slate-500";

  const savedAddressNote = formatSavedAddressNote(
    addressMode === "saved" ? selectedAddress : null,
  );

  const checkoutNotes: Record<string, string> = {
    address:
      addressMode === "saved" && savedAddressNote
        ? savedAddressNote
        : formatManualAddressNote(form),
  };

  if (addressMode === "saved" && selectedAddress) {
    checkoutNotes.savedAddressId = selectedAddress.id;
  }

  if (form.notes.trim().length > 0) {
    checkoutNotes.deliveryNotes = form.notes.trim();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Contact information</h2>
        <p className="text-sm text-slate-500">
          We&apos;ll send order updates and delivery confirmations to the details you provide below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="First name"
          required
          value={form.firstName}
          onChange={handleFieldChange("firstName")}
        />
        <Input
          placeholder="Last name"
          required
          value={form.lastName}
          onChange={handleFieldChange("lastName")}
        />
        <Input
          placeholder="Email"
          type="email"
          required
          value={form.email}
          onChange={handleFieldChange("email")}
        />
        <Input
          placeholder="Phone (+91...)"
          required
          value={form.phone}
          onChange={handleFieldChange("phone")}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Shipping address</h3>
        {savedAddresses.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={addressMode === "saved" ? "default" : "outline"}
                onClick={() => {
                  setAddressMode("saved");
                  if (!selectedAddressId && savedAddresses.length > 0) {
                    setSelectedAddressId(defaultSavedAddressId ?? savedAddresses[0].id);
                  }
                }}
              >
                Deliver to saved address
              </Button>
              <Button
                type="button"
                variant={addressMode === "new" ? "default" : "outline"}
                onClick={() => setAddressMode("new")}
              >
                Use a different address
              </Button>
            </div>

            {addressMode === "saved" ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Select where we should deliver this order. Need to make changes?&nbsp;
                  <Link href="/profile" className="font-semibold text-slate-800 underline-offset-4 hover:underline">
                    Manage addresses
                  </Link>
                </p>
                <div className="space-y-3">
                  {savedAddresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300"
                    >
                      <input
                        type="radio"
                        className="mt-1 h-4 w-4"
                        name="saved-address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                      />
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <div className="flex flex-wrap items-center gap-2 text-slate-900">
                          <span className="font-semibold">
                            {address.label ?? "Untitled address"}
                          </span>
                          {address.isDefault ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          {address.fullName}
                        </span>
                        <span>{formatSavedAddress(address)}</span>
                        {address.phoneNumber ? (
                          <span className="text-xs text-slate-500">
                            Phone: {address.phoneNumber}
                          </span>
                        ) : null}
                      </div>
                    </label>
                  ))}
                </div>
                {!selectedAddress ? (
                  <p className="text-xs text-rose-600">
                    Select an address to continue.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Address line 1"
                  required
                  value={form.addressLine1}
                  onChange={handleFieldChange("addressLine1")}
                />
                <Input
                  placeholder="Address line 2 (optional)"
                  value={form.addressLine2}
                  onChange={handleFieldChange("addressLine2")}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="City"
                    required
                    value={form.city}
                    onChange={handleFieldChange("city")}
                  />
                  <Input
                    placeholder="State"
                    required
                    value={form.state}
                    onChange={handleFieldChange("state")}
                  />
                </div>
                <Input
                  placeholder="Postal code"
                  required
                  value={form.postalCode}
                  onChange={handleFieldChange("postalCode")}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            <Input
              placeholder="Address line 1"
              required
              value={form.addressLine1}
              onChange={handleFieldChange("addressLine1")}
            />
            <Input
              placeholder="Address line 2 (optional)"
              value={form.addressLine2}
              onChange={handleFieldChange("addressLine2")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="City"
                required
                value={form.city}
                onChange={handleFieldChange("city")}
              />
              <Input
                placeholder="State"
                required
                value={form.state}
                onChange={handleFieldChange("state")}
              />
            </div>
            <Input
              placeholder="Postal code"
              required
              value={form.postalCode}
              onChange={handleFieldChange("postalCode")}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Delivery notes</h3>
        <Textarea
          placeholder="Tell our concierge about delivery preferences, timing, or gifting notes."
          rows={4}
          value={form.notes}
          onChange={handleFieldChange("notes")}
        />
      </div>

      {statusMessage ? <p className={`text-sm ${statusClass}`}>{statusMessage}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <RazorpayButton
          amount={amount}
          currency={currency}
          orderId={orderId}
          name="Meni-me Checkout"
          description="Style specially curated for you"
          customer={{
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            contact: form.phone,
          }}
          notes={checkoutNotes}
          disabled={!isFormValid || isProcessing || hasPaid}
          onOpen={() => {
            setIsProcessing(true);
            setStatusTone("info");
            setStatusMessage("Redirecting to Razorpay. Complete the payment to confirm your order.");
          }}
          onSuccess={(response) => {
            setIsProcessing(false);
            setHasPaid(true);
            setStatusTone("success");
            setStatusMessage(
              `Payment confirmed · ${response.razorpay_payment_id}. We\'ve sent a receipt to ${form.email}.`,
            );

            void (async () => {
              try {
                // Create the order in database
                const shippingAddress =
                  addressMode === "saved" && selectedAddress
                    ? {
                        label: selectedAddress.label,
                        fullName: selectedAddress.fullName,
                        phoneNumber: selectedAddress.phoneNumber,
                        streetLine1: selectedAddress.streetLine1,
                        streetLine2: selectedAddress.streetLine2,
                        city: selectedAddress.city,
                        state: selectedAddress.state,
                        postalCode: selectedAddress.postalCode,
                        country: selectedAddress.country,
                      }
                    : {
                        fullName: `${form.firstName} ${form.lastName}`.trim(),
                        phoneNumber: form.phone,
                        streetLine1: form.addressLine1,
                        streetLine2: form.addressLine2 || undefined,
                        city: form.city,
                        state: form.state,
                        postalCode: form.postalCode,
                        country: "India",
                      };

                const orderResponse = await fetch("/api/storefront/orders", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    items,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature,
                    shippingAddress,
                    notes: form.notes.trim() || undefined,
                    currency,
                  }),
                });

                if (!orderResponse.ok) {
                  throw new Error(`Failed to create order: ${orderResponse.status}`);
                }

                // Clear cart items that were ordered
                const clearResponse = await fetch("/api/storefront/cart/clear", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ productIds: orderedProductIds }),
                });

                if (!clearResponse.ok) {
                  throw new Error(`Failed to clear cart: ${clearResponse.status}`);
                }

                await queryClient.invalidateQueries({ queryKey: commerceCountsQueryKey });
              } catch (error) {
                console.error("Failed to process post-payment actions", error);
                setStatusMessage((prev) =>
                  prev
                    ? `${prev} We couldn't complete all post-payment steps—please contact support.`
                    : "We couldn't complete all post-payment steps—please contact support.",
                );
              }
            })();
          }}
          onFailure={(response) => {
            setIsProcessing(false);
            setStatusTone("error");
            setStatusMessage(`Payment failed: ${response.error.description}`);
          }}
        >
          {hasPaid ? "Payment complete" : isProcessing ? "Processing payment..." : `Pay ${formattedAmount}`}
        </RazorpayButton>
        {!hasPaid ? (
          <Button
            type="button"
            variant="ghost"
            className="text-sm text-slate-600 hover:text-slate-900"
            onClick={() => {
              setStatusTone("info");
              setStatusMessage("Questions? Our concierge can help at support@meni-me.com");
            }}
          >
            Need help with payment?
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default CheckoutPayment;
