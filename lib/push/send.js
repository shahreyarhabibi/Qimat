import { getPushSubscriptionsForProduct, removePushSubscriptionByEndpoint } from "@/lib/push/subscriptions";

function getVapidConfig() {
  const publicKey = String(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "")
    .replace(/\s+/g, "")
    .trim();
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || "")
    .replace(/\s+/g, "")
    .trim();
  const subject = String(process.env.VAPID_SUBJECT || "").trim();

  if (!publicKey || !privateKey || !subject) {
    return null;
  }

  if (!subject.startsWith("mailto:") && !subject.startsWith("https://")) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

async function getWebPushClient() {
  try {
    const webPushModule = await import("web-push");
    return webPushModule.default || webPushModule;
  } catch {
    return null;
  }
}

export async function sendPriceChangePush({
  productId,
  productName,
  oldPrice,
  newPrice,
  currencyLabel = "AFN",
}) {
  const vapid = getVapidConfig();
  if (!vapid) {
    return { sent: 0, skipped: 0, reason: "missing_vapid" };
  }

  const webpush = await getWebPushClient();
  if (!webpush) {
    return { sent: 0, skipped: 0, reason: "missing_web_push_package" };
  }

  const subscriptions = await getPushSubscriptionsForProduct(productId);
  if (!subscriptions.length) {
    return { sent: 0, skipped: 0, reason: "no_subscribers" };
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const change = Number(newPrice) - Number(oldPrice);
  const isIncrease = change > 0;
  const absChange = Math.round(Math.abs(change)).toLocaleString();
  const title = `Price update: ${productName}`;
  const body = `${isIncrease ? "+" : "-"}${absChange} ${currencyLabel}`;

  const payload = JSON.stringify({
    title,
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: {
      productId,
      productName,
      oldPrice,
      newPrice,
      change,
      url: "/",
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const row of subscriptions) {
    const subscription = {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    };

    try {
      await webpush.sendNotification(subscription, payload);
      sent += 1;
    } catch (error) {
      const statusCode = Number(error?.statusCode || 0);
      if (statusCode === 404 || statusCode === 410) {
        await removePushSubscriptionByEndpoint(row.endpoint);
      }
      skipped += 1;
    }
  }

  return { sent, skipped };
}
