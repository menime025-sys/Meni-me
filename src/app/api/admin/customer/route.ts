import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const customers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        addresses: true,
        defaultAddress: true,
        orders: {
          orderBy: { placedAt: "desc" },
          include: {
            items: true,
          },
        },
      },
    });

    const formatted = customers.map((customer) => {
      const totalOrders = customer.orders.length;
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total.toNumber(), 0);
      const lastOrderDate = customer.orders[0]?.placedAt ?? null;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        emailVerified: customer.emailVerified,
        role: customer.role,
        createdAt: customer.createdAt,
        totalOrders,
        totalSpent,
        lastOrderDate,
        defaultAddress: customer.defaultAddress,
        addresses: customer.addresses,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[ADMIN_CUSTOMERS_GET]", error);
    return NextResponse.json({ message: "Failed to fetch customers" }, { status: 500 });
  }
}
