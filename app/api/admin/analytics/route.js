// app/api/admin/analytics/route.js
import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

let analyticsCache = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 30 * 1000;

export async function GET() {
  try {
    const now = Date.now();

    if (analyticsCache.data && now - analyticsCache.timestamp < CACHE_TTL) {
      return NextResponse.json(analyticsCache.data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const analytics = await getAnalytics();
    const responseData = { success: true, data: analytics };
    analyticsCache = { data: responseData, timestamp: now };

    return NextResponse.json(responseData, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
