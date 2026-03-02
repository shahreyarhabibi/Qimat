// app/api/products/route.js
import { NextResponse } from "next/server";
import { getProductsWithPrices, getCategories } from "@/lib/db/queries";

// Simple in-memory cache
let cache = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (cache.data && now - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    const [items, categories] = await Promise.all([
      getProductsWithPrices(),
      getCategories(),
    ]);

    const responseData = {
      success: true,
      data: { items, categories },
    };

    // Update cache
    cache = {
      data: responseData,
      timestamp: now,
    };

    return NextResponse.json(responseData, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
