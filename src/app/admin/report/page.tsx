import type { Metadata } from "next";
import { getInternalApiUrl } from "@/lib/internal-api";
import ReportClient, { type ReportResponse } from "./_components/report-client";

export const metadata: Metadata = {
	title: "Admin • Reports",
	description: "Surface commerce insights and spot opportunities at a glance.",
};

export const dynamic = "force-dynamic";

async function getReport(): Promise<ReportResponse | null> {
	try {
		const res = await fetch(getInternalApiUrl("/api/admin/report"), {
			cache: "no-store",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});

		if (!res.ok) {
			return null;
		}

		return res.json();
	} catch (error) {
		console.error("[ADMIN_REPORT_PAGE]", error);
		return null;
	}
}

const ReportPage = async () => {
	const report = await getReport();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
				<p className="text-sm text-slate-500">Keep your finger on the pulse of revenue and retention.</p>
			</div>
			<ReportClient initialReport={report ?? undefined} />
		</div>
	);
};

export default ReportPage;
