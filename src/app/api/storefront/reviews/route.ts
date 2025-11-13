import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getProductReviewBundle, upsertProductReview } from "@/server/storefront-service";

const reviewInputSchema = z.object({
  productId: z.string().trim().min(1, "productId is required"),
  rating: z.coerce.number().min(1).max(5),
  title: z
    .string()
    .max(120)
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  comment: z
    .string()
    .max(1000)
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId")?.trim() ?? "";

  if (!productId) {
    return NextResponse.json({ error: "productId query parameter is required" }, { status: 400 });
  }

  const limitParam = searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : undefined;
  const limit = parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : undefined;

  const user = await getCurrentUser();

  try {
    const bundle = await getProductReviewBundle(productId, {
      limit,
      userId: user?.id,
    });

    return NextResponse.json(bundle, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to fetch product reviews", error);
    return NextResponse.json({ error: "Unable to fetch product reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = reviewInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const input = parsed.data;

  try {
    const bundle = await upsertProductReview({
      userId: user.id,
      productId: input.productId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
    });

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { slug: true },
    });

    if (product?.slug) {
      await revalidatePath(`/products/${product.slug}`);
    }

    await revalidatePath("/products");

    return NextResponse.json(bundle, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to submit product review", error);
    return NextResponse.json({ error: "Unable to submit product review" }, { status: 500 });
  }
}
