// lib/db/queries.js
import { db } from "./index";
import {
  products,
  prices,
  categories,
  sources,
  calculatorConfigs,
  calculatorPresets,
  priceUnits,
  notifications,
} from "./schema";
import { eq, desc, and, gte, lte, sql, inArray, asc } from "drizzle-orm";

// ============================================
// HELPER FUNCTIONS
// ============================================
export function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

function getToday() {
  return formatDate(new Date());
}

function getYesterday() {
  return getDateDaysAgo(1);
}

// ============================================
// GET ALL CATEGORIES
// ============================================
export async function getCategories() {
  const result = await db
    .select({
      id: categories.slug,
      name: categories.name,
      icon: categories.icon,
    })
    .from(categories)
    .orderBy(categories.sortOrder);

  return result;
}

// ============================================
// GET ALL SOURCES
// ============================================
export async function getSources() {
  const result = await db.select().from(sources);

  // Return as object keyed by slug for easy lookup
  const sourcesMap = {};
  result.forEach((s) => {
    sourcesMap[s.slug] = {
      id: s.slug,
      name: s.name,
      shortName: s.shortName,
    };
  });

  return sourcesMap;
}

// ============================================
// GET ALL PRODUCTS WITH CURRENT PRICES
// (Matches your mock data structure exactly)
// ============================================
export async function getProductsWithPrices() {
  const today = getToday();
  const yesterday = getYesterday();
  const thirtyDaysAgo = getDateDaysAgo(30);

  // Get all active products
  const productsData = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true));

  if (productsData.length === 0) return [];

  const productIds = productsData.map((p) => p.id);

  // Get all sources
  const sourcesData = await db.select().from(sources);
  const sourcesMap = {};
  sourcesData.forEach((s) => {
    sourcesMap[s.slug] = {
      id: s.slug,
      name: s.name,
      shortName: s.shortName,
    };
  });

  // Get all prices for last 30 days (for price history)
  const allPrices = await db
    .select({
      productId: prices.productId,
      price: prices.price,
      date: prices.date,
    })
    .from(prices)
    .where(
      and(
        inArray(prices.productId, productIds),
        gte(prices.date, thirtyDaysAgo),
        lte(prices.date, today),
      ),
    )
    .orderBy(prices.productId, asc(prices.date));

  // Get calculator configs
  const configs = await db
    .select()
    .from(calculatorConfigs)
    .where(inArray(calculatorConfigs.productId, productIds));

  const configIds = configs.map((c) => c.id);
  const configByProduct = {};
  configs.forEach((c) => {
    configByProduct[c.productId] = c;
  });

  // Get calculator presets
  const presets =
    configIds.length > 0
      ? await db
          .select()
          .from(calculatorPresets)
          .where(inArray(calculatorPresets.configId, configIds))
          .orderBy(calculatorPresets.sortOrder)
      : [];

  const presetsByConfig = {};
  presets.forEach((p) => {
    if (!presetsByConfig[p.configId]) {
      presetsByConfig[p.configId] = [];
    }
    presetsByConfig[p.configId].push({ label: p.label, value: p.value });
  });

  // Get price units
  const priceUnitsData = await db
    .select()
    .from(priceUnits)
    .where(inArray(priceUnits.productId, productIds))
    .orderBy(priceUnits.sortOrder);

  const priceUnitsByProduct = {};
  priceUnitsData.forEach((pu) => {
    if (!priceUnitsByProduct[pu.productId]) {
      priceUnitsByProduct[pu.productId] = [];
    }
    priceUnitsByProduct[pu.productId].push({
      label: pu.label,
      multiplier: pu.multiplier,
    });
  });

  // Group prices by product and build price history
  const pricesByProduct = {};
  allPrices.forEach((p) => {
    if (!pricesByProduct[p.productId]) {
      pricesByProduct[p.productId] = [];
    }
    pricesByProduct[p.productId].push({
      date: p.date,
      price: p.price,
    });
  });

  // Transform to your exact mock data format
  return productsData.map((product) => {
    const productPrices = pricesByProduct[product.id] || [];
    const priceHistory = fillMissingDates(productPrices, 30);

    // Get today's and yesterday's price for change calculation
    const todayPrice = priceHistory.find((p) => p.date === today)?.price || 0;
    const yesterdayPrice =
      priceHistory.find((p) => p.date === yesterday)?.price || todayPrice;
    const change = Math.round((todayPrice - yesterdayPrice) * 100) / 100;

    // Get calculator config
    const config = configByProduct[product.id];
    const configPresets = config ? presetsByConfig[config.id] || [] : [];

    // Get price units
    const productPriceUnits = priceUnitsByProduct[product.id] || [];

    return {
      id: product.id,
      name: product.name,
      unit: product.unit,
      price: todayPrice,
      change: change,
      category: product.categorySlug,
      source: sourcesMap[product.sourceSlug] || {
        id: "unknown",
        name: "Unknown",
        shortName: "Unknown",
      },
      image: product.imagePath || "/products/placeholder.jpg",
      description: product.description || "",
      priceHistory: priceHistory,
      calculator: config
        ? {
            baseQuantity: config.baseQuantity,
            defaultQuantity: config.defaultQuantity,
            displayUnit: config.displayUnit,
            step: config.step,
            min: config.minQuantity,
            presets: configPresets,
          }
        : null,
      priceUnits: productPriceUnits.length > 0 ? productPriceUnits : null,
    };
  });
}

// ============================================
// GET SINGLE PRODUCT WITH FULL HISTORY
// ============================================
export async function getProductById(productId) {
  const allProducts = await getProductsWithPrices();
  return allProducts.find((p) => p.id === productId) || null;
}

// ============================================
// GET PRODUCT BY SLUG
// ============================================
export async function getProductBySlug(slug) {
  const allProducts = await getProductsWithPrices();
  const product = allProducts.find(
    (p) => p.name.toLowerCase().replace(/\s+/g, "-") === slug,
  );
  return product || null;
}

// ============================================
// FILL MISSING DATES IN PRICE HISTORY
// (If no price for a day, use previous day's price)
// ============================================
function fillMissingDates(priceHistory, days) {
  if (priceHistory.length === 0) return [];

  const result = [];
  const priceMap = new Map();

  // Create a map of existing prices
  priceHistory.forEach((p) => {
    priceMap.set(p.date, p.price);
  });

  // Get the first known price
  const sortedPrices = [...priceHistory].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  let lastKnownPrice = sortedPrices[0]?.price || 0;

  // Iterate through each day
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);

    const price = priceMap.get(dateStr);
    if (price !== undefined) {
      lastKnownPrice = price;
    }

    result.push({
      date: dateStr,
      price: Math.round(lastKnownPrice * 100) / 100,
    });
  }

  return result;
}

// ============================================
// ADMIN: UPSERT PRICE (Insert or Update)
// ============================================
export async function upsertPrice(productId, price, date = null) {
  const priceDate = date || getToday();

  // Check if price exists for this date
  const [existing] = await db
    .select()
    .from(prices)
    .where(and(eq(prices.productId, productId), eq(prices.date, priceDate)))
    .limit(1);

  if (existing) {
    // Update existing price
    await db
      .update(prices)
      .set({ price: price })
      .where(eq(prices.id, existing.id));
    return { action: "updated", id: existing.id };
  } else {
    // Insert new price
    const [inserted] = await db
      .insert(prices)
      .values({
        productId: productId,
        price: price,
        date: priceDate,
      })
      .returning();
    return { action: "inserted", id: inserted.id };
  }
}

// ============================================
// ADMIN: BULK UPDATE PRICES FOR TODAY
// ============================================
export async function bulkUpdatePrices(priceUpdates) {
  // priceUpdates: Array of { productId, price }
  const today = getToday();
  const results = [];

  for (const update of priceUpdates) {
    const result = await upsertPrice(update.productId, update.price, today);
    results.push({ ...update, ...result });
  }

  return results;
}

// ============================================
// ADMIN: CREATE PRODUCT
// ============================================
export async function createProduct(data) {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Insert product
  const [product] = await db
    .insert(products)
    .values({
      name: data.name,
      slug: slug,
      description: data.description || null,
      categorySlug: data.category,
      unit: data.unit,
      imagePath: data.image || null,
      sourceSlug: data.sourceSlug || null,
    })
    .returning();

  // Create calculator config if provided
  if (data.calculator) {
    const [config] = await db
      .insert(calculatorConfigs)
      .values({
        productId: product.id,
        baseQuantity: data.calculator.baseQuantity,
        displayUnit: data.calculator.displayUnit,
        step: data.calculator.step || 1,
        minQuantity: data.calculator.min || 0.5,
        defaultQuantity: data.calculator.defaultQuantity || null,
      })
      .returning();

    // Create presets
    if (data.calculator.presets?.length > 0) {
      await db.insert(calculatorPresets).values(
        data.calculator.presets.map((preset, index) => ({
          configId: config.id,
          label: preset.label,
          value: preset.value,
          sortOrder: index,
        })),
      );
    }
  }

  // Create price units if provided
  if (data.priceUnits?.length > 0) {
    await db.insert(priceUnits).values(
      data.priceUnits.map((pu, index) => ({
        productId: product.id,
        label: pu.label,
        multiplier: pu.multiplier,
        sortOrder: index,
      })),
    );
  }

  // Add initial price if provided
  if (data.price) {
    await upsertPrice(product.id, data.price);
  }

  return product;
}

// ============================================
// ADMIN: UPDATE PRODUCT
// ============================================
export async function updateProduct(productId, data) {
  const updateData = {};

  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.unit) updateData.unit = data.unit;
  if (data.image) updateData.imagePath = data.image;
  if (data.category) updateData.categorySlug = data.category;
  if (data.sourceSlug) updateData.sourceSlug = data.sourceSlug;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  updateData.updatedAt = getToday();

  const [updated] = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, productId))
    .returning();

  return updated;
}

// ============================================
// GET NOTIFICATIONS
// ============================================
export async function getNotifications(limit = 20) {
  const result = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      message: notifications.message,
      priceChange: notifications.priceChange,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return result.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    priceChange: n.priceChange,
    read: n.isRead,
    time: formatTimeAgo(new Date(n.createdAt)),
  }));
}

export async function getUnreadNotificationCount() {
  const [result] = await db
    .select({ count: sql`count(*)` })
    .from(notifications)
    .where(eq(notifications.isRead, false));

  return Number(result?.count) || 0;
}

// ============================================
// CREATE NOTIFICATION
// ============================================
export async function createNotification(data) {
  const [notification] = await db
    .insert(notifications)
    .values({
      productId: data.productId || null,
      title: data.title,
      message: data.message,
      priceChange: data.priceChange || null,
    })
    .returning();

  return notification;
}

// ============================================
// HELPER: Format time ago
// ============================================
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ============================================
// GET TICKER ITEMS (for public display)
// ============================================
export async function getTickerItems() {
  const today = getToday();
  const yesterday = getDateDaysAgo(1);

  const result = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      unit: products.unit,
      categorySlug: products.categorySlug,
    })
    .from(tickerItems)
    .innerJoin(products, eq(tickerItems.productId, products.id))
    .where(eq(products.isActive, true))
    .orderBy(tickerItems.sortOrder);

  // Get prices for ticker items
  const productIds = result.map((p) => p.id);

  if (productIds.length === 0) return [];

  const pricesData = await db
    .select({
      productId: prices.productId,
      price: prices.price,
      date: prices.date,
    })
    .from(prices)
    .where(
      and(
        inArray(prices.productId, productIds),
        gte(prices.date, yesterday),
        lte(prices.date, today),
      ),
    )
    .orderBy(desc(prices.date));

  // Build lookup
  const pricesByProduct = {};
  pricesData.forEach((p) => {
    if (!pricesByProduct[p.productId]) {
      pricesByProduct[p.productId] = [];
    }
    pricesByProduct[p.productId].push(p);
  });

  return result.map((product) => {
    const productPrices = pricesByProduct[product.id] || [];
    const currentPrice = productPrices[0]?.price || 0;
    const previousPrice = productPrices[1]?.price || currentPrice;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      unit: product.unit,
      category: product.categorySlug,
      price: currentPrice,
      change: currentPrice - previousPrice,
    };
  });
}
