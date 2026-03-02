// app/api/admin/ticker/route.js
import { NextResponse } from "next/server";
import { getTickerItems, updateTickerItems } from "@/lib/db/admin-queries";

// ✅ Cache layer
let tickerCache = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (ticker config rarely changes)

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = Date.now();

    // ✅ Return cached if fresh
    if (tickerCache.data && now - tickerCache.timestamp < CACHE_TTL) {
      return NextResponse.json(tickerCache.data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const tickerItems = await getTickerItems();
    const responseData = { success: true, data: tickerItems };

    // ✅ Update cache
    tickerCache = { data: responseData, timestamp: now };

    return NextResponse.json(responseData, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Error fetching ticker items:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { productIds } = await request.json();
    const result = await updateTickerItems(productIds || []);

    // ✅ Clear cache on update
    tickerCache = { data: null, timestamp: 0 };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating ticker items:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
