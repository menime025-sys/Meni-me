import type { Metadata } from "next";
import { getInternalApiUrl } from "@/lib/internal-api";
import CustomerClient, { type CustomerResponse } from "./_components/customer-client";

export const metadata: Metadata = {
	title: "Admin • Customers",
	description: "Manage customer accounts, roles, and address preferences.",
};

export const dynamic = "force-dynamic";

async function getCustomers(): Promise<CustomerResponse[]> {
	try {
			const res = await fetch(getInternalApiUrl("/api/admin/customer"), {
			cache: "no-store",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});

		if (!res.ok) {
			return [];
		}

		return res.json();
	} catch (error) {
		console.error("[ADMIN_CUSTOMERS_PAGE]", error);
		return [];
	}
}

const CustomerPage = async () => {
	const customers = await getCustomers();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
				<p className="text-sm text-slate-500">Understand your buyers and fine-tune their experience.</p>
			</div>
			<CustomerClient initialCustomers={customers} />
		</div>
	);
};

export default CustomerPage;
