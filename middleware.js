// middleware.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "qimat_admin_session";
const secretKey = process.env.JWT_SECRET || "fallback-secret-key-change-this";

// Routes that don't require authentication
const publicRoutes = ["/admin/login"];

// Check if path is an admin route
function isAdminRoute(pathname) {
  return pathname.startsWith("/admin");
}

// Check if path is a public admin route
function isPublicAdminRoute(pathname) {
  return publicRoutes.some((route) => pathname === route);
}

// Verify JWT token
async function verifyToken(token) {
  try {
    const key = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip non-admin routes
  if (!isAdminRoute(pathname)) {
    return NextResponse.next();
  }

  // Skip API routes (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow public admin routes (login page)
  if (isPublicAdminRoute(pathname)) {
    // If already logged in, redirect to dashboard
    const sessionCookie = request.cookies.get(COOKIE_NAME);
    if (sessionCookie) {
      const session = await verifyToken(sessionCookie.value);
      if (session) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME);

  if (!sessionCookie) {
    // No session, redirect to login
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the session token
  const session = await verifyToken(sessionCookie.value);

  if (!session) {
    // Invalid session, redirect to login
    const response = NextResponse.redirect(
      new URL("/admin/login", request.url),
    );
    // Clear invalid cookie
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Valid session, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all admin routes
    "/admin/:path*",
  ],
};
