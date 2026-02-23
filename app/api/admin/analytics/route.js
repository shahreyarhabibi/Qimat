// app/api/admin/analytics/route.js
import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const analytics = await getAnalytics();
    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
