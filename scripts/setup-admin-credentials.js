// Run with: node --env-file=.env.local scripts/setup-admin-credentials.js

import { createClient } from "@libsql/client";
import { hashPassword } from "../lib/auth/password.js";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function setupAdminCredentials() {
  const username = (process.env.ADMIN_USERNAME || "admin").trim();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  if (!username || !password) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be provided");
  }

  console.log("Setting up admin credentials table...");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    )
  `);

  await client.execute(
    `CREATE INDEX IF NOT EXISTS idx_admin_credentials_username ON admin_credentials(username)`,
  );

  const passwordHash = hashPassword(password);

  await client.execute({
    sql: `
      INSERT INTO admin_credentials (username, password_hash, is_active)
      VALUES (?, ?, 1)
      ON CONFLICT(username) DO UPDATE SET
        password_hash = excluded.password_hash,
        is_active = 1,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [username, passwordHash],
  });

  console.log(`Admin credentials ready for username: ${username}`);
}

setupAdminCredentials()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to set up admin credentials:", error.message);
    process.exit(1);
  });
