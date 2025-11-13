import { prisma } from "@/lib/db";

const getMonthlyBuckets = (months: number) => {
  const now = new Date();
  const buckets: { key: string; start: Date; end: Date }[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const key = start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    buckets.push({ key, start, end });
  }

  return buckets;
};

export const getAdminReportSummary = async (months = 6) => {
  const [orderAggregate, totalOrders, fulfilledOrders, pendingOrders, cancelledOrders, recentOrders, cartWithItems, products, categories, users, orderItems] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.order.findMany({
        orderBy: { placedAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.cart.count({ where: { items: { some: {} } } }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          stock: true,
          price: true,
          orderItems: {
            select: { quantity: true, lineTotal: true },
          },
        },
      }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          products: {
            select: {
              product: {
                select: {
                  orderItems: {
                    select: { quantity: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          orders: {
            select: {
              total: true,
              placedAt: true,
            },
          },
        },
      }),
      prisma.orderItem.findMany({
        select: {
          productId: true,
          quantity: true,
          lineTotal: true,
        },
      }),
    ]);

  const totalRevenue = orderAggregate._sum.total?.toNumber() ?? 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const revenueBuckets = getMonthlyBuckets(months);
  const ordersForTrend = await prisma.order.findMany({
    where: {
      placedAt: {
        gte: revenueBuckets[0]?.start,
      },
    },
    select: {
      placedAt: true,
      total: true,
    },
  });

  const revenueTrend = revenueBuckets.map((bucket) => {
    const bucketTotal = ordersForTrend
      .filter((order) => order.placedAt >= bucket.start && order.placedAt < bucket.end)
      .reduce((sum, order) => sum + order.total.toNumber(), 0);

    return {
      label: bucket.key,
      value: bucketTotal,
    };
  });

  const topProducts = products
    .map((product) => {
      const quantitySold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const revenue = product.orderItems.reduce((sum, item) => sum + item.lineTotal.toNumber(), 0);
      return {
        id: product.id,
        name: product.name,
        quantitySold,
        revenue,
        stock: product.stock,
        price: product.price.toNumber(),
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const categoryPerformance = categories.map((category) => {
    const quantitySold = category.products.reduce(
      (sum, pivot) =>
        sum + pivot.product.orderItems.reduce((acc, item) => acc + item.quantity, 0),
      0,
    );

    return {
      id: category.id,
      name: category.name,
      quantitySold,
    };
  });

  const newCustomers = users
    .map((user) => ({
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      lifetimeValue: user.orders.reduce((sum, order) => sum + order.total.toNumber(), 0),
      orderCount: user.orders.length,
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  const fulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;

  const recentOrdersFormatted = recentOrders.map((order) => ({
    ...order,
    subtotal: order.subtotal.toNumber(),
    shippingFee: order.shippingFee?.toNumber() ?? null,
    tax: order.tax?.toNumber() ?? null,
    total: order.total.toNumber(),
  }));

  return {
    kpis: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      fulfilledOrders,
      pendingOrders,
      cancelledOrders,
      fulfillmentRate,
      abandonedCarts: cartWithItems,
    },
    revenueTrend,
    topProducts,
    categoryPerformance,
    newCustomers,
    recentOrders: recentOrdersFormatted,
    orderTotals: orderItems.reduce(
      (acc, item) => {
        const quantity = acc.quantity + item.quantity;
        const revenue = acc.revenue + item.lineTotal.toNumber();
        return { quantity, revenue };
      },
      { quantity: 0, revenue: 0 },
    ),
  };
};
