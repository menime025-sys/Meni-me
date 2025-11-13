import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { addItemToWishlist, getUserCommerceCounts, removeItemFromWishlist } from "@/server/storefront-service";

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

  try {
    const item = await addItemToWishlist(user.id, productId);
    const counts = await getUserCommerceCounts(user.id);

    return NextResponse.json({ item, counts }, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to add wishlist item", error);
    return NextResponse.json({ error: "Unable to add item to wishlist" }, { status: 500 });
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
    const result = await removeItemFromWishlist(user.id, productId);
    const counts = await getUserCommerceCounts(user.id);

    return NextResponse.json({ result, counts }, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to remove wishlist item", error);
    return NextResponse.json({ error: "Unable to remove item from wishlist" }, { status: 500 });
  }
}
