// app/api/admin/prices/route.js
import { NextResponse } from "next/server";
import { bulkUpdatePrices } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { updates, date } = await request.json();
    const result = await bulkUpdatePrices(updates, date);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating prices:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
