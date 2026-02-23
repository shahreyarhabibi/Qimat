// app/api/admin/auth/logout/route.js
import { NextResponse } from "next/server";
import { deleteSession, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/db/admin-queries";

export async function POST(request) {
  try {
    // Get current session before deleting
    const session = await getSession();

    // Delete session
    await deleteSession();

    // Log logout
    if (session) {
      try {
        await logActivity(
          "logout",
          "auth",
          null,
          `Admin logged out: ${session.username}`,
        );
      } catch (e) {
        // Ignore logging errors
      }
    }

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during logout" },
      { status: 500 },
    );
  }
}
