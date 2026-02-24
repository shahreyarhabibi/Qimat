// app/api/admin/prices/route.js
import { NextResponse } from "next/server";
import { bulkUpdatePrices } from "@/lib/db/admin-queries";
import { sendPriceChangePush } from "@/lib/push/send";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { updates, date } = await request.json();
    const result = await bulkUpdatePrices(updates, date);

    if (Array.isArray(result.changedUpdates) && result.changedUpdates.length > 0) {
      await Promise.all(
        result.changedUpdates.map((change) =>
          sendPriceChangePush({
            productId: change.productId,
            productName: change.productName,
            oldPrice: change.oldPrice,
            newPrice: change.newPrice,
            currencyLabel: "AFN",
          }),
        ),
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating prices:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
