import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserCart } from "@/server/storefront-service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cart = await getUserCart(user.id);

    if (!cart) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to fetch cart", error);
    return NextResponse.json({ error: "Unable to fetch cart" }, { status: 500 });
  }
}
