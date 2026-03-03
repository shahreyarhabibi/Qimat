// lib/db/init.js
import { ensureAdminTables, ensureProductsFeaturedColumn } from "./ensure-schema";

let initialized = false;

export async function initializeDatabase() {
  if (initialized) return;

  try {
    await ensureProductsFeaturedColumn();
    await ensureAdminTables();
    initialized = true;
    console.log("Database initialized");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}
