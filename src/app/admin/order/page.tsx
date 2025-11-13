import type { Metadata } from "next";
import { getInternalApiUrl } from "@/lib/internal-api";
import OrderClient, { type OrderResponse } from "./_components/order-client";

export const metadata: Metadata = {
	title: "Admin • Orders",
	description: "Monitor purchases, update fulfillment, and keep customers informed.",
};

export const dynamic = "force-dynamic";

async function getOrders(): Promise<OrderResponse[]> {
	try {
			const res = await fetch(getInternalApiUrl("/api/admin/order"), {
			cache: "no-store",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});

		if (!res.ok) {
			return [];
		}

		return res.json();
	} catch (error) {
		console.error("[ADMIN_ORDERS_PAGE]", error);
		return [];
	}
}

const OrderPage = async () => {
	const orders = await getOrders();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
				<p className="text-sm text-slate-500">Oversee the queue, spot delays, and delight customers.</p>
			</div>
			<OrderClient initialOrders={orders} />
		</div>
	);
};

export default OrderPage;
