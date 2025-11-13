import { getAdminReportSummary } from "@/lib/admin/report";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { StatCard } from "../_components/stat-card";
import TrendChart from "../_components/trend-chart";
import { ArrowDownRight, ArrowUpRight, ShoppingBag, Users2 } from "lucide-react";
import Link from "next/link";

const DashboardPage = async () => {
  const report = await getAdminReportSummary();
  const { kpis, revenueTrend, topProducts, categoryPerformance, newCustomers, recentOrders, orderTotals } = report;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Commerce Pulse</h1>
          <p className="mt-2 text-sm text-slate-500">
            Track revenue, customer growth, and operational performance across your Hub Fashiion storefront.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/report"
            className="inline-flex items-center gap-2 rounded-full border border-slate-900 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:bg-slate-900 hover:text-white"
          >
            Download report
          </Link>
          <Link
            href="/admin/order"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:bg-slate-100"
          >
            Manage orders
          </Link>
        </div>
      </div>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          change={`${formatPercent(kpis.fulfillmentRate)} fulfillment`}
          caption="All time store revenue"
        />
        <StatCard
          title="Orders"
          value={formatNumber(kpis.totalOrders)}
          change={`${formatNumber(kpis.pendingOrders)} open`}
          caption="Lifetime customer orders"
          icon={ShoppingBag}
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(kpis.averageOrderValue)}
          change={`${formatCurrency(kpis.totalRevenue / Math.max(kpis.totalOrders, 1))} avg`}
          caption="Per order"
        />
        <StatCard
          title="Abandoned carts"
          value={formatNumber(kpis.abandonedCarts)}
          change={`${formatPercent(kpis.fulfillmentRate)} fulfillment rate`}
          caption="Carts started without checkout"
          icon={Users2}
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <TrendChart data={revenueTrend} />
        <div className="h-56 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Order volume</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(orderTotals.quantity)}</p>
              <p className="text-sm text-slate-500">Items fulfilled this year</p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                <ArrowUpRight className="h-3.5 w-3.5" /> {formatPercent(kpis.fulfillmentRate)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-600">
                <ArrowDownRight className="h-3.5 w-3.5" /> {kpis.cancelledOrders} cancelled
              </span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Delivered</span>
              <span className="font-semibold text-slate-900">{formatNumber(kpis.fulfilledOrders)}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-slate-900"
                style={{ width: `${Math.min(kpis.fulfillmentRate, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Pending</span>
              <span>{formatNumber(kpis.pendingOrders)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Top performers</h2>
              <p className="text-sm text-slate-500">Products ranked by revenue contribution.</p>
            </div>
            <Link href="/admin/products" className="text-sm font-medium text-slate-600 underline">
              Manage inventory
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatNumber(product.quantitySold)} units · {formatCurrency(product.revenue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-slate-500">Stock</p>
                  <p className="text-sm font-semibold text-slate-900">{product.stock}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No sales yet — start promoting your latest drops.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Category mix</h2>
          <p className="text-sm text-slate-500">Demand split across merchandising categories.</p>
          <div className="mt-6 space-y-4">
            {categoryPerformance.map((category) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-slate-900/10 text-center text-sm font-semibold leading-10 text-slate-900">
                    {category.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                    <p className="text-xs text-slate-500">{formatNumber(category.quantitySold)} units</p>
                  </div>
                </div>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-slate-900"
                    style={{ width: `${Math.min(100, category.quantitySold)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[3fr_2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
            <Link href="/admin/order" className="text-sm font-medium text-slate-600 underline">
              View all
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.3em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap py-3 pr-4 font-medium text-slate-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{order.user?.name ?? "Guest"}</div>
                      <div className="text-xs text-slate-500">{order.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No orders yet. Run a seasonal campaign to bring shoppers in.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Fresh customers</h2>
            <Link href="/admin/customer" className="text-sm font-medium text-slate-600 underline">
              Manage
            </Link>
          </div>
          <ul className="mt-4 space-y-4">
            {newCustomers.map((customer) => (
              <li key={customer.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                  <p className="text-xs text-slate-500">
                    Joined {customer.createdAt.toLocaleDateString()} · {customer.orderCount} orders
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(customer.lifetimeValue)}
                </span>
              </li>
            ))}
            {newCustomers.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Grow your community with targeted marketing campaigns.
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
