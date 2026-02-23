// lib/auth.js
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createClient } from "@libsql/client";
import { verifyPassword } from "@/lib/auth/password";

const secretKey = process.env.JWT_SECRET || "fallback-secret-key-change-this";
const key = new TextEncoder().encode(secretKey);
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const COOKIE_NAME = "qimat_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Create JWT token
export async function createToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

// Verify JWT token
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

// Get session from cookies
export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  const session = await verifyToken(sessionCookie.value);
  return session;
}

// Create session cookie
export async function createSession(username) {
  const token = await createToken({ username, role: "admin" });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return token;
}

// Delete session cookie
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Verify credentials (from Turso DB)
export async function verifyCredentials(username, password) {
  const result = await db.execute({
    sql: `
      SELECT id, username, password_hash, is_active
      FROM admin_credentials
      WHERE username = ?
      LIMIT 1
    `,
    args: [username],
  });

  const admin = result.rows[0];
  if (!admin) return false;

  const isActive = Number(admin.is_active) === 1 || admin.is_active === true;
  if (!isActive) return false;

  return verifyPassword(password, admin.password_hash);
}

// Export cookie name for middleware
export { COOKIE_NAME };
