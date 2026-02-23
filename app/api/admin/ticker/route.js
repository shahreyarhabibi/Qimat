// app/api/admin/ticker/route.js
import { NextResponse } from "next/server";
import { getTickerItems, updateTickerItems } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tickerItems = await getTickerItems();
    return NextResponse.json({ success: true, data: tickerItems });
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
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating ticker items:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
