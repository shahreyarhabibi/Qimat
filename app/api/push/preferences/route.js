// app/api/push/preferences/route.js
import { NextResponse } from "next/server";
import { updatePushPreferences } from "@/lib/push/subscriptions";

export const dynamic = "force-dynamic";

// ✅ Simple in-memory deduplication
const recentUpdates = new Map();
const DEDUPE_TTL = 30 * 1000; // 30 seconds

function cleanOldEntries() {
  const now = Date.now();
  for (const [key, timestamp] of recentUpdates.entries()) {
    if (now - timestamp > DEDUPE_TTL) {
      recentUpdates.delete(key);
    }
  }
}

export async function POST(request) {
  try {
    const { clientId, favoriteIds } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId required" },
        { status: 400 },
      );
    }

    // ✅ Create a unique key for this request
    const sortedIds = Array.isArray(favoriteIds)
      ? [...favoriteIds].sort().join(",")
      : "";
    const dedupeKey = `${clientId}:${sortedIds}`;

    // ✅ Check if we recently processed the same request
    cleanOldEntries();
    if (recentUpdates.has(dedupeKey)) {
      return NextResponse.json({
        success: true,
        cached: true,
      });
    }

    // ✅ Mark as processing
    recentUpdates.set(dedupeKey, Date.now());

    // ✅ Process update (don't await if you want faster response)
    await updatePushPreferences({ clientId, favoriteIds });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push preferences error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
