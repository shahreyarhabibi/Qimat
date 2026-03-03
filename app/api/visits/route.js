import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { recordVisit } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getClientIp(requestHeaders) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return (
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    null
  );
}

function hashIp(ip) {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

export async function POST(request) {
  try {
    const requestHeaders = await headers();
    const payload = await request.json().catch(() => ({}));

    const ip = getClientIp(requestHeaders);
    const userAgent = requestHeaders.get("user-agent") || null;
    const referrer = payload.referrer || requestHeaders.get("referer") || null;
    const page = payload.page || "/";

    await recordVisit({
      page,
      userAgent,
      ipHash: hashIp(ip),
      referrer,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording visit:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record visit" },
      { status: 500 },
    );
  }
}
