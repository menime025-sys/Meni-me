import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth-helpers";
import { getUserCommerceCounts } from "@/server/storefront-service";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { cartCount: 0, wishlistCount: 0 },
        { status: 401 },
      );
    }

    const counts = await getUserCommerceCounts(user.id);

    return NextResponse.json(counts);
  } catch (error) {
    console.error("[STORE_FRONT_COMMERCE_COUNTS]", error);
    return NextResponse.json(
      { message: "Failed to load commerce counts" },
      { status: 500 },
    );
  }
}
