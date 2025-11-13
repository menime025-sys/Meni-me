"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id?: string;
  handler?: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
};

type RazorpayInstance = {
  open: () => void;
  close: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
};

let razorpayScriptPromise: Promise<void> | null = null;

const loadRazorpayScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay is only available in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay checkout."));
      document.body.appendChild(script);
    }).catch((error) => {
      razorpayScriptPromise = null;
      throw error;
    });
  }

  return razorpayScriptPromise;
};

export type RazorpayButtonProps = {
  amount: number;
  currency?: string;
  name: string;
  description?: string;
  orderId?: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess?: (response: RazorpaySuccessResponse) => void;
  onFailure?: (response: RazorpayFailureResponse) => void;
  onOpen?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

const RazorpayButton = ({
  amount,
  currency = "INR",
  name,
  description,
  orderId,
  customer,
  notes,
  onSuccess,
  onFailure,
  onOpen,
  className,
  disabled,
  children,
}: RazorpayButtonProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    loadRazorpayScript()
      .then(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      })
      .catch((loadError) => {
        console.error(loadError);
        if (isMounted) {
          setError("Unable to initialize Razorpay checkout at this moment.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedAmount = useMemo(() => {
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }, [amount, currency]);

  const handleClick = useCallback(async () => {
    setError(null);

    if (disabled) {
      return;
    }

    if (typeof window === "undefined") {
      setError("Razorpay checkout is only available in the browser.");
      return;
    }

    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) {
      setError("Razorpay key is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID.");
      return;
    }

    try {
      await loadRazorpayScript();
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load Razorpay checkout.");
      return;
    }

    const Razorpay = window.Razorpay;
    if (!Razorpay) {
      setError("Razorpay SDK is unavailable.");
      return;
    }

    const instance = new Razorpay({
      key,
      amount: Math.round(amount * 100),
      currency,
      name,
      description,
      order_id: orderId,
      handler: (response: RazorpaySuccessResponse) => {
        onSuccess?.(response);
        router.push("/orders");
      },
      prefill: customer,
      notes,
      theme: {
        color: "#111827",
      },
    });

    instance.on("payment.failed", (response: RazorpayFailureResponse) => {
      console.warn("Razorpay payment failed", response);
      onFailure?.(response);
    });

    onOpen?.();
    instance.open();
  }, [amount, currency, description, disabled, customer, name, notes, onFailure, onOpen, onSuccess, orderId, router]);

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={isLoading || disabled}
        className={className}
      >
        {children ?? `Pay ${formattedAmount}`}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
};

export default RazorpayButton;
