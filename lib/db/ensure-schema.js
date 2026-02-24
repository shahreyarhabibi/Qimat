import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let productsFeaturedReady = false;
let productsFeaturedPromise = null;
let pushSubscriptionsReady = false;
let pushSubscriptionsPromise = null;

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

export async function ensurePushSubscriptionsTable() {
  if (pushSubscriptionsReady) return;
  if (pushSubscriptionsPromise) {
    await pushSubscriptionsPromise;
    return;
  }

  pushSubscriptionsPromise = (async () => {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL UNIQUE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        favorite_ids TEXT NOT NULL DEFAULT '[]',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(
      "CREATE INDEX IF NOT EXISTS push_subscriptions_active_idx ON push_subscriptions(is_active)",
    );
    await client.execute(
      "CREATE INDEX IF NOT EXISTS push_subscriptions_client_idx ON push_subscriptions(client_id)",
    );
    await client.execute(
      "CREATE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON push_subscriptions(endpoint)",
    );

    pushSubscriptionsReady = true;
  })();

  try {
    await pushSubscriptionsPromise;
  } finally {
    if (!pushSubscriptionsReady) {
      pushSubscriptionsPromise = null;
    }
  }
}
