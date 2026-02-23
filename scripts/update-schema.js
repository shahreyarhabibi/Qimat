// scripts/update-schema.js
// Run with: node --env-file=.env.local scripts/update-schema.js

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function updateSchema() {
  console.log("🔄 Updating database schema...\n");

  // Step 1: Create tables
  console.log("📦 Creating new tables...");

  const createTableStatements = [
    // Ticker Items Table
    `CREATE TABLE IF NOT EXISTS ticker_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`,

    // Settings Table
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Visits Table
    `CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT NOT NULL,
      user_agent TEXT,
      ip_hash TEXT,
      referrer TEXT,
      country TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Activity Log Table
    `CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      entity_name TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of createTableStatements) {
    try {
      await client.execute(sql);
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1];
      console.log(`   ✓ Created table: ${tableName}`);
    } catch (error) {
      console.error(`   ✗ Error creating table: ${error.message}`);
    }
  }

  // Step 2: Create indexes
  console.log("\n📇 Creating indexes...");

  const createIndexStatements = [
    `CREATE INDEX IF NOT EXISTS idx_ticker_sort ON ticker_items(sort_order)`,
    `CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_visits_page ON visits(page)`,
  ];

  for (const sql of createIndexStatements) {
    try {
      await client.execute(sql);
      const indexName = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/i)?.[1];
      console.log(`   ✓ Created index: ${indexName}`);
    } catch (error) {
      // Ignore "already exists" errors
      if (!error.message.includes("already exists")) {
        console.error(`   ✗ Error creating index: ${error.message}`);
      }
    }
  }

  // Step 3: Insert default settings
  console.log("\n⚙️  Inserting default settings...");

  const settingsData = [
    { key: "site_name", value: "Qimat" },
    { key: "currency", value: "AFN" },
    { key: "ticker_speed", value: "25" },
  ];

  for (const setting of settingsData) {
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
        args: [setting.key, setting.value],
      });
      console.log(`   ✓ Setting: ${setting.key}`);
    } catch (error) {
      console.error(`   ✗ Error inserting setting: ${error.message}`);
    }
  }

  // Step 4: Insert default ticker items
  console.log("\n📰 Setting up default ticker items...");

  try {
    // Get products that should be in ticker
    const tickerSlugs = [
      "usd",
      "euro",
      "petrol",
      "gold-24k",
      "haji-aziz-rice",
      "flour",
    ];

    const products = await client.execute(`
      SELECT id, slug FROM products 
      WHERE slug IN ('usd', 'euro', 'petrol', 'gold-24k', 'haji-aziz-rice', 'flour')
      AND is_active = 1
    `);

    if (products.rows.length > 0) {
      for (let i = 0; i < products.rows.length; i++) {
        const product = products.rows[i];
        try {
          await client.execute({
            sql: `INSERT OR IGNORE INTO ticker_items (product_id, sort_order) VALUES (?, ?)`,
            args: [product.id, i],
          });
          console.log(`   ✓ Added to ticker: ${product.slug}`);
        } catch (error) {
          // Ignore duplicate errors
          if (!error.message.includes("UNIQUE")) {
            console.error(`   ✗ Error: ${error.message}`);
          }
        }
      }
    } else {
      console.log("   ℹ No matching products found for ticker");
    }
  } catch (error) {
    console.error(`   ✗ Error setting up ticker: ${error.message}`);
  }

  // Step 5: Verify tables exist
  console.log("\n🔍 Verifying tables...");

  const tablesToCheck = ["ticker_items", "settings", "visits", "activity_log"];

  for (const tableName of tablesToCheck) {
    try {
      const result = await client.execute(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
      );
      if (result.rows.length > 0) {
        console.log(`   ✓ Table exists: ${tableName}`);
      } else {
        console.log(`   ✗ Table missing: ${tableName}`);
      }
    } catch (error) {
      console.error(`   ✗ Error checking table: ${error.message}`);
    }
  }

  console.log("\n✅ Schema update complete!");
}

updateSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
  });
