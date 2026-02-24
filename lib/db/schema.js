// lib/db/schema.js
import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";

// ============================================
// CATEGORIES TABLE
// ============================================
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(), // "essentials", "phones", etc.
  name: text("name").notNull(), // "Essentials", "Phones", etc.
  icon: text("icon"), // Optional emoji/icon
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// SOURCES TABLE
// ============================================
export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(), // "bagh-qazi", "gulbahar", etc.
  name: text("name").notNull(), // "Bagh Qazi"
  shortName: text("short_name").notNull(), // "Bagh Qazi"
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// PRODUCTS TABLE
// ============================================
export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    categorySlug: text("category_slug").notNull(), // References category slug
    unit: text("unit").notNull(), // "1 sack (24.5 kg)", "1 ser (7 kg)", "1 kg", etc.
    imagePath: text("image_path"), // "/products/rice.jpg"
    sourceSlug: text("source_slug"), // References source slug
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    categoryIdx: index("product_category_idx").on(table.categorySlug),
    activeIdx: index("product_active_idx").on(table.isActive),
    featuredIdx: index("product_featured_idx").on(table.isFeatured),
  }),
);

// ============================================
// PRICES TABLE (Daily Price History)
// ============================================
export const prices = sqliteTable(
  "prices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    price: real("price").notNull(),
    date: text("date").notNull(), // "YYYY-MM-DD" format
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    productDateIdx: index("price_product_date_idx").on(
      table.productId,
      table.date,
    ),
    dateIdx: index("price_date_idx").on(table.date),
    // Unique constraint: one price per product per day
    uniqueProductDate: index("unique_product_date").on(
      table.productId,
      table.date,
    ),
  }),
);

// ============================================
// CALCULATOR CONFIGS TABLE
// ============================================
export const calculatorConfigs = sqliteTable("calculator_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .unique()
    .references(() => products.id, { onDelete: "cascade" }),
  baseQuantity: real("base_quantity").notNull(), // Price is for this quantity
  displayUnit: text("display_unit").notNull(), // "kg", "liter", "piece"
  step: real("step").default(1), // Increment step (0.5, 1, etc.)
  minQuantity: real("min_quantity").default(0.5), // Minimum selectable
  defaultQuantity: real("default_quantity"), // Default when selected
});

// ============================================
// CALCULATOR PRESETS TABLE
// ============================================
export const calculatorPresets = sqliteTable(
  "calculator_presets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    configId: integer("config_id")
      .notNull()
      .references(() => calculatorConfigs.id, { onDelete: "cascade" }),
    label: text("label").notNull(), // "1 kg", "1 ser", "1 sack"
    value: real("value").notNull(), // 1, 7, 24.5
    sortOrder: integer("sort_order").default(0),
  },
  (table) => ({
    configIdx: index("preset_config_idx").on(table.configId),
  }),
);

// ============================================
// PRICE UNITS TABLE (Display options like "per kg", "per ser")
// ============================================
export const priceUnits = sqliteTable(
  "price_units",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    label: text("label").notNull(), // "1 kg", "1 ser (7 kg)"
    multiplier: real("multiplier").notNull(), // 1, 7, 24.5
    sortOrder: integer("sort_order").default(0),
  },
  (table) => ({
    productIdx: index("price_unit_product_idx").on(table.productId),
  }),
);

// ============================================
// USERS TABLE (For Admin Panel - Future)
// ============================================
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").default("admin"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: text("last_login_at"),
});

// ============================================
// NOTIFICATIONS TABLE
// ============================================
export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    priceChange: real("price_change"),
    isRead: integer("is_read", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    readIdx: index("notification_read_idx").on(table.isRead),
  }),
);

// ============================================
// PUSH SUBSCRIPTIONS TABLE (Anonymous Web Push)
// ============================================
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: text("client_id").notNull().unique(),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    favoriteIds: text("favorite_ids").notNull().default("[]"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    activeIdx: index("push_subscriptions_active_idx").on(table.isActive),
    clientIdx: index("push_subscriptions_client_idx").on(table.clientId),
    endpointIdx: index("push_subscriptions_endpoint_idx").on(table.endpoint),
  }),
);
