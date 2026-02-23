import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  const tableInfo = await client.execute("PRAGMA table_info(products)");
  const hasFeaturedColumn = tableInfo.rows.some(
    (row) => row.name === "is_featured",
  );

  if (!hasFeaturedColumn) {
    await client.execute(
      "ALTER TABLE products ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0",
    );
    console.log("Added products.is_featured column");
  } else {
    console.log("products.is_featured already exists");
  }

  await client.execute(
    "CREATE INDEX IF NOT EXISTS product_featured_idx ON products(is_featured)",
  );
  console.log("Ensured product_featured_idx index");
}

run().catch((error) => {
  console.error("Failed to apply featured column migration:", error);
  process.exit(1);
});
