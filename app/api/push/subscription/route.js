import { NextResponse } from "next/server";
import {
  upsertPushSubscription,
  deactivatePushSubscription,
} from "@/lib/push/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { clientId, subscription, favoriteIds } = await request.json();
    await upsertPushSubscription({ clientId, subscription, favoriteIds });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { clientId } = await request.json();
    await deactivatePushSubscription({ clientId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
