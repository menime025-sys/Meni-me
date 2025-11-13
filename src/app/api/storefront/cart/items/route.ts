import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { addItemToCart, clearUserCart, getUserCommerceCounts } from "@/server/storefront-service";

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

  const productId = typeof (payload as { productId?: unknown }).productId === "string"
    ? (payload as { productId: string }).productId.trim()
    : "";

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const rawQuantity = (payload as { quantity?: unknown }).quantity;
  const parsedQuantity = typeof rawQuantity === "number" ? rawQuantity : Number(rawQuantity ?? 1);

  const quantity = Number.isFinite(parsedQuantity) ? parsedQuantity : 1;

  try {
    const item = await addItemToCart(user.id, productId, quantity);
    const counts = await getUserCommerceCounts(user.id);

    return NextResponse.json({ item, counts }, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to add cart item", error);
    return NextResponse.json({ error: "Unable to add item to cart" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

  const productId = typeof (payload as { productId?: unknown }).productId === "string"
    ? (payload as { productId: string }).productId.trim()
    : "";

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  try {
    const result = await clearUserCart(user.id, [productId]);
    const counts = await getUserCommerceCounts(user.id);

    return NextResponse.json({ result, counts }, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to remove cart item", error);
    return NextResponse.json({ error: "Unable to remove item from cart" }, { status: 500 });
  }
}
