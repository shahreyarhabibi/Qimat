import { NextResponse } from "next/server";
import { updatePushPreferences } from "@/lib/push/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { clientId, favoriteIds } = await request.json();
    await updatePushPreferences({ clientId, favoriteIds });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
