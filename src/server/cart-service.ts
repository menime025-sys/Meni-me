import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/db";

export type CartWithItems = {
  id: string;
  userId: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    addedAt: Date;
    product: {
      id: string;
      name: string;
      price: Decimal;
      mediaUrls: string[];
      stock: number;
    };
  }>;
};

export const getUserCart = async (userId: string): Promise<CartWithItems | null> => {
  if (!userId.trim()) {
    return null;
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          addedAt: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              mediaUrls: true,
              stock: true,
            },
          },
        },
        orderBy: {
          addedAt: "desc",
        },
      },
    },
  });

  return cart;
};
