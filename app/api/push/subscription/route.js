// app/api/push/subscription/route.js
import { NextResponse } from "next/server";
import {
  upsertPushSubscription,
  deactivatePushSubscription,
} from "@/lib/push/subscriptions";

export const dynamic = "force-dynamic";

// ✅ Simple in-memory deduplication for subscriptions
const recentSubscriptions = new Map();
const DEDUPE_TTL = 60 * 1000; // 1 minute

function cleanOldEntries() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubscriptions.entries()) {
    if (now - timestamp > DEDUPE_TTL) {
      recentSubscriptions.delete(key);
    }
  }
}

export async function POST(request) {
  try {
    const { clientId, subscription, favoriteIds } = await request.json();

    if (!clientId || !subscription) {
      return NextResponse.json(
        { success: false, error: "clientId and subscription required" },
        { status: 400 },
      );
    }

    // ✅ Create deduplication key
    const endpoint = subscription.endpoint || "";
    const sortedIds = Array.isArray(favoriteIds)
      ? [...favoriteIds].sort().join(",")
      : "";
    const dedupeKey = `${clientId}:${endpoint.slice(-50)}:${sortedIds}`;

    // ✅ Check if we recently processed the same subscription
    cleanOldEntries();
    if (recentSubscriptions.has(dedupeKey)) {
      return NextResponse.json({
        success: true,
        cached: true,
      });
    }

    // ✅ Mark as processing
    recentSubscriptions.set(dedupeKey, Date.now());

    await upsertPushSubscription({ clientId, subscription, favoriteIds });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId required" },
        { status: 400 },
      );
    }

    await deactivatePushSubscription({ clientId });

    // ✅ Clear any cached entries for this client
    for (const key of recentSubscriptions.keys()) {
      if (key.startsWith(`${clientId}:`)) {
        recentSubscriptions.delete(key);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
