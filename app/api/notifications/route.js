// app/api/notifications/route.js
import { NextResponse } from "next/server";
import { getNotifications, getUnreadNotificationCount } from "@/lib/db/queries";

export async function GET() {
  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(20),
      getUnreadNotificationCount(),
    ]);

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
