// app/api/admin/auth/session/route.js
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        username: session.username,
        role: session.role,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
}
