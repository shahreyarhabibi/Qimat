import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let productsFeaturedReady = false;
let productsFeaturedPromise = null;

export async function ensureProductsFeaturedColumn() {
  if (productsFeaturedReady) return;
  if (productsFeaturedPromise) {
    await productsFeaturedPromise;
    return;
  }

  productsFeaturedPromise = (async () => {
    const tableInfo = await client.execute("PRAGMA table_info(products)");
    const hasFeaturedColumn = tableInfo.rows.some(
      (row) => row.name === "is_featured",
    );

    if (!hasFeaturedColumn) {
      await client.execute(
        "ALTER TABLE products ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0",
      );
    }

    await client.execute(
      "CREATE INDEX IF NOT EXISTS product_featured_idx ON products(is_featured)",
    );

    productsFeaturedReady = true;
  })();

  try {
    await productsFeaturedPromise;
  } finally {
    if (!productsFeaturedReady) {
      productsFeaturedPromise = null;
    }
  }
}
