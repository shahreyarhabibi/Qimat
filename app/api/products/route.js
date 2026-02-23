// app/api/products/route.js
import { NextResponse } from "next/server";
import { getProductsWithPrices, getCategories } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [items, categories] = await Promise.all([
      getProductsWithPrices(),
      getCategories(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        categories,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
