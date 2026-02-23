// app/api/admin/auth/login/route.js
import { NextResponse } from "next/server";
import { verifyCredentials, createSession } from "@/lib/auth";
import { logActivity } from "@/lib/db/admin-queries";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 },
      );
    }

    // Verify credentials
    const isValid = verifyCredentials(username, password);

    if (!isValid) {
      // Log failed attempt (optional)
      try {
        await logActivity(
          "login_failed",
          "auth",
          null,
          `Failed login attempt for: ${username}`,
        );
      } catch (e) {
        // Ignore logging errors
      }

      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Create session
    await createSession(username);

    // Log successful login
    try {
      await logActivity("login", "auth", null, `Admin logged in: ${username}`);
    } catch (e) {
      // Ignore logging errors
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during login" },
      { status: 500 },
    );
  }
}
