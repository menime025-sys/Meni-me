import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const imageItemSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1),
});

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, or hyphens"),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  image: imageItemSchema.nullable().optional(),
});

const serializeCategory = <T extends { imageUrl: string | null; imageFileId: string | null }>(category: T) => ({
  ...category,
  image:
    category.imageUrl && category.imageFileId
      ? {
          url: category.imageUrl,
          fileId: category.imageFileId,
        }
      : null,
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { parent: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(categories.map(serializeCategory));
  } catch (error) {
    console.error("[ADMIN_CATEGORY_GET]", error);
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = categorySchema.parse(await request.json());

    const image = payload.image ?? null;

    const category = await prisma.category.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description ?? undefined,
        parent: payload.parentId
          ? {
              connect: { id: payload.parentId },
            }
          : undefined,
        isPublished: payload.isPublished,
        imageUrl: image?.url ?? null,
        imageFileId: image?.fileId ?? null,
      },
      include: { parent: true },
    });

    return NextResponse.json(serializeCategory(category), { status: 201 });
  } catch (error) {
    console.error("[ADMIN_CATEGORY_POST]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", issues: error.issues }, { status: 422 });
    }

    return NextResponse.json({ message: "Failed to create category" }, { status: 500 });
  }
}
