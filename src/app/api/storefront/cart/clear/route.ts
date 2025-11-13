import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { clearUserCart } from "@/server/storefront-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let productIds: string[] | undefined;

  try {
    const body = await request.json().catch(() => null);
    if (body && Array.isArray(body.productIds)) {
      productIds = body.productIds
        .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0);
    }
  } catch (error) {
    console.warn("Failed to parse cart clear payload", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await clearUserCart(user.id, productIds);

  return NextResponse.json(result, { status: 200 });
}
