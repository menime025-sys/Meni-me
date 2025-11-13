import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const formatted = orders.map((order) => ({
      ...order,
      subtotal: order.subtotal.toNumber(),
      shippingFee: order.shippingFee?.toNumber() ?? null,
      tax: order.tax?.toNumber() ?? null,
      total: order.total.toNumber(),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        lineTotal: item.lineTotal.toNumber(),
        product: item.product,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[ADMIN_ORDERS_GET]", error);
    return NextResponse.json({ message: "Failed to fetch orders" }, { status: 500 });
  }
}
