// app/api/admin/products/route.js
import { NextResponse } from "next/server";
import { getAllProducts, createProduct } from "@/lib/db/admin-queries";

// ✅ Cache layer
let productsCache = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 60 * 1000; // 1 minute

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = Date.now();

    // ✅ Return cached if fresh
    if (productsCache.data && now - productsCache.timestamp < CACHE_TTL) {
      return NextResponse.json(productsCache.data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const products = await getAllProducts();
    const responseData = { success: true, data: products };

    // ✅ Update cache
    productsCache = { data: responseData, timestamp: now };

    return NextResponse.json(responseData, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await createProduct(data);

    // ✅ Clear cache on create
    productsCache = { data: null, timestamp: 0 };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
