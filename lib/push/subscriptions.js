import { createClient } from "@libsql/client";
import { ensurePushSubscriptionsTable } from "@/lib/db/ensure-schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function toJsonString(value, fallback = []) {
  try {
    return JSON.stringify(Array.isArray(value) ? value : fallback);
  } catch {
    return JSON.stringify(fallback);
  }
}

function normalizeFavoriteIds(favoriteIds) {
  if (!Array.isArray(favoriteIds)) return [];
  return favoriteIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export async function upsertPushSubscription({ clientId, subscription, favoriteIds = [] }) {
  if (!clientId || typeof clientId !== "string") {
    throw new Error("clientId is required");
  }

  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Invalid push subscription payload");
  }

  await ensurePushSubscriptionsTable();

  const normalizedFavoriteIds = normalizeFavoriteIds(favoriteIds);

  await client.execute({
    sql: `DELETE FROM push_subscriptions WHERE endpoint = ? AND client_id != ?`,
    args: [endpoint, clientId],
  });

  await client.execute({
    sql: `
      INSERT INTO push_subscriptions (
        client_id,
        endpoint,
        p256dh,
        auth,
        favorite_ids,
        is_active,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(client_id) DO UPDATE SET
        endpoint = excluded.endpoint,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        favorite_ids = excluded.favorite_ids,
        is_active = 1,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      clientId,
      endpoint,
      p256dh,
      auth,
      toJsonString(normalizedFavoriteIds),
    ],
  });

  return { success: true };
}

export async function updatePushPreferences({ clientId, favoriteIds = [] }) {
  if (!clientId || typeof clientId !== "string") {
    throw new Error("clientId is required");
  }

  await ensurePushSubscriptionsTable();

  const normalizedFavoriteIds = normalizeFavoriteIds(favoriteIds);

  await client.execute({
    sql: `
      UPDATE push_subscriptions
      SET favorite_ids = ?, updated_at = CURRENT_TIMESTAMP
      WHERE client_id = ?
    `,
    args: [toJsonString(normalizedFavoriteIds), clientId],
  });

  return { success: true };
}

export async function deactivatePushSubscription({ clientId }) {
  if (!clientId || typeof clientId !== "string") {
    throw new Error("clientId is required");
  }

  await ensurePushSubscriptionsTable();

  await client.execute({
    sql: `
      UPDATE push_subscriptions
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE client_id = ?
    `,
    args: [clientId],
  });

  return { success: true };
}

export async function getPushSubscriptionsForProduct(productId) {
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) return [];

  await ensurePushSubscriptionsTable();

  const result = await client.execute({
    sql: `
      SELECT id, endpoint, p256dh, auth, favorite_ids
      FROM push_subscriptions
      WHERE is_active = 1
    `,
  });

  return result.rows.filter((row) => {
    try {
      const ids = JSON.parse(row.favorite_ids || "[]");
      return Array.isArray(ids) && ids.includes(id);
    } catch {
      return false;
    }
  });
}

export async function removePushSubscriptionByEndpoint(endpoint) {
  if (!endpoint) return;

  await ensurePushSubscriptionsTable();

  await client.execute({
    sql: `DELETE FROM push_subscriptions WHERE endpoint = ?`,
    args: [endpoint],
  });
}
