import { NextResponse } from "next/server";
import { getAdminReportSummary } from "@/lib/admin/report";

export async function GET() {
  try {
    const report = await getAdminReportSummary();

    return NextResponse.json(report);
  } catch (error) {
    console.error("[ADMIN_REPORTS_GET]", error);
    return NextResponse.json({ message: "Failed to generate report" }, { status: 500 });
  }
}
