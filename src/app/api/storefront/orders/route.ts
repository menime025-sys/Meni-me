import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { createOrder, getUserOrders } from "@/server/order-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await getUserOrders(user.id);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Unable to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  // Validate each item
  const validatedItems = items.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Each item must be an object");
    }

    const productId = (item as { productId?: unknown }).productId;
    const quantity = (item as { quantity?: unknown }).quantity;

    if (typeof productId !== "string" || !productId.trim()) {
      throw new Error("Each item must have a valid productId");
    }

    const parsedQuantity = typeof quantity === "number" ? quantity : Number(quantity ?? 1);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      throw new Error("Each item must have a valid quantity");
    }

    return {
      productId: productId.trim(),
      quantity: Math.floor(parsedQuantity),
    };
  });

  const paymentId = typeof (payload as { paymentId?: unknown }).paymentId === "string"
    ? (payload as { paymentId: string }).paymentId.trim()
    : undefined;

  const orderId = typeof (payload as { orderId?: unknown }).orderId === "string"
    ? (payload as { orderId: string }).orderId.trim()
    : undefined;

  const signature = typeof (payload as { signature?: unknown }).signature === "string"
    ? (payload as { signature: string }).signature.trim()
    : undefined;

  const shippingAddress = (payload as { shippingAddress?: unknown }).shippingAddress;
  const billingAddress = (payload as { billingAddress?: unknown }).billingAddress;
  const notes = typeof (payload as { notes?: unknown }).notes === "string"
    ? (payload as { notes: string }).notes.trim()
    : undefined;

  const currency = typeof (payload as { currency?: unknown }).currency === "string"
    ? (payload as { currency: string }).currency.trim()
    : "INR";

  try {
    const order = await createOrder({
      userId: user.id,
      items: validatedItems,
      paymentId,
      orderId,
      signature,
      shippingAddress: shippingAddress && typeof shippingAddress === "object"
        ? (shippingAddress as Record<string, unknown>)
        : undefined,
      billingAddress: billingAddress && typeof billingAddress === "object"
        ? (billingAddress as Record<string, unknown>)
        : undefined,
      notes,
      currency,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("[storefront] Failed to create order", error);
    const message = error instanceof Error ? error.message : "Unable to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
