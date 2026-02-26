// lib/db/admin-queries.js
import { createClient } from "@libsql/client";
import { ensureProductsFeaturedColumn } from "./ensure-schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ============================================
// HELPER FUNCTIONS
// ============================================
export function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export function getToday() {
  return formatDate(new Date());
}

// ============================================
// PRODUCTS
// ============================================
export async function getAllProducts() {
  await ensureProductsFeaturedColumn();

  const result = await client.execute(`
    SELECT 
      p.*,
      c.name as category_name,
      s.name as source_name,
      s.short_name as source_short_name,
      (SELECT price FROM prices WHERE product_id = p.id ORDER BY date DESC LIMIT 1) as current_price,
      (SELECT date FROM prices WHERE product_id = p.id ORDER BY date DESC LIMIT 1) as last_price_date,
      (SELECT COUNT(*) FROM prices WHERE product_id = p.id) as price_count
    FROM products p
    LEFT JOIN categories c ON p.category_slug = c.slug
    LEFT JOIN sources s ON p.source_slug = s.slug
    ORDER BY p.id DESC
  `);

  return result.rows;
}

export async function getProductById(id) {
  await ensureProductsFeaturedColumn();

  // Get product
  const productResult = await client.execute({
    sql: `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as source_name
      FROM products p
      LEFT JOIN categories c ON p.category_slug = c.slug
      LEFT JOIN sources s ON p.source_slug = s.slug
      WHERE p.id = ?
    `,
    args: [id],
  });

  if (productResult.rows.length === 0) return null;

  const product = productResult.rows[0];

  // Get calculator config
  const configResult = await client.execute({
    sql: `SELECT * FROM calculator_configs WHERE product_id = ?`,
    args: [id],
  });

  let calculator = null;
  if (configResult.rows.length > 0) {
    const config = configResult.rows[0];

    // Get presets
    const presetsResult = await client.execute({
      sql: `SELECT * FROM calculator_presets WHERE config_id = ? ORDER BY sort_order`,
      args: [config.id],
    });

    calculator = {
      id: config.id,
      baseQuantity: config.base_quantity,
      displayUnit: config.display_unit,
      step: config.step,
      min: config.min_quantity,
      presets: presetsResult.rows.map((p) => ({
        id: p.id,
        label: p.label,
        value: p.value,
      })),
    };
  }

  // Get price units
  const priceUnitsResult = await client.execute({
    sql: `SELECT * FROM price_units WHERE product_id = ? ORDER BY sort_order`,
    args: [id],
  });

  // Get recent prices
  const pricesResult = await client.execute({
    sql: `SELECT * FROM prices WHERE product_id = ? ORDER BY date DESC LIMIT 30`,
    args: [id],
  });

  return {
    ...product,
    calculator,
    priceUnits: priceUnitsResult.rows,
    recentPrices: pricesResult.rows,
  };
}

export async function createProduct(data) {
  await ensureProductsFeaturedColumn();

  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Insert product
  const productResult = await client.execute({
    sql: `
      INSERT INTO products (
        name, name_fa, name_ps,
        slug,
        description, description_fa, description_ps,
        category_slug,
        unit, unit_fa, unit_ps,
        image_path, source_slug, is_active, is_featured
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.name,
      data.nameFa || null,
      data.namePs || null,
      slug,
      data.description || null,
      data.descriptionFa || null,
      data.descriptionPs || null,
      data.category,
      data.unit,
      data.unitFa || null,
      data.unitPs || null,
      data.image || null,
      data.source || null,
      data.isActive !== false ? 1 : 0,
      data.isFeatured === true ? 1 : 0,
    ],
  });

  const productId = Number(productResult.lastInsertRowid);

  // Insert calculator config if provided
  if (data.calculator) {
    const configResult = await client.execute({
      sql: `
        INSERT INTO calculator_configs (product_id, base_quantity, display_unit, step, min_quantity)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        productId,
        data.calculator.baseQuantity || 1,
        data.calculator.displayUnit || "unit",
        data.calculator.step || 1,
        data.calculator.min || 1,
      ],
    });

    const configId = Number(configResult.lastInsertRowid);

    // Insert presets
    if (data.calculator.presets?.length > 0) {
      for (let i = 0; i < data.calculator.presets.length; i++) {
        const preset = data.calculator.presets[i];
        await client.execute({
          sql: `INSERT INTO calculator_presets (config_id, label, value, sort_order) VALUES (?, ?, ?, ?)`,
          args: [configId, preset.label, preset.value, i],
        });
      }
    }
  }

  // Insert price units if provided
  if (data.priceUnits?.length > 0) {
    for (let i = 0; i < data.priceUnits.length; i++) {
      const pu = data.priceUnits[i];
      await client.execute({
        sql: `INSERT INTO price_units (product_id, label, multiplier, sort_order) VALUES (?, ?, ?, ?)`,
        args: [productId, pu.label, pu.multiplier, i],
      });
    }
  }

  // Insert initial price if provided
  if (data.price) {
    const priceDate = data.priceDate || getToday();
    await client.execute({
      sql: `INSERT INTO prices (product_id, price, date) VALUES (?, ?, ?)`,
      args: [productId, data.price, priceDate],
    });
  }

  // Log activity
  await logActivity("create", "product", productId, data.name);

  return { id: productId, slug };
}

export async function updateProduct(id, data) {
  await ensureProductsFeaturedColumn();

  const updates = [];
  const args = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    args.push(data.name);
  }
  if (data.nameFa !== undefined) {
    updates.push("name_fa = ?");
    args.push(data.nameFa || null);
  }
  if (data.namePs !== undefined) {
    updates.push("name_ps = ?");
    args.push(data.namePs || null);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    args.push(data.description);
  }
  if (data.descriptionFa !== undefined) {
    updates.push("description_fa = ?");
    args.push(data.descriptionFa || null);
  }
  if (data.descriptionPs !== undefined) {
    updates.push("description_ps = ?");
    args.push(data.descriptionPs || null);
  }
  if (data.category !== undefined) {
    updates.push("category_slug = ?");
    args.push(data.category);
  }
  if (data.unit !== undefined) {
    updates.push("unit = ?");
    args.push(data.unit);
  }
  if (data.unitFa !== undefined) {
    updates.push("unit_fa = ?");
    args.push(data.unitFa || null);
  }
  if (data.unitPs !== undefined) {
    updates.push("unit_ps = ?");
    args.push(data.unitPs || null);
  }
  if (data.image !== undefined) {
    updates.push("image_path = ?");
    args.push(data.image);
  }
  if (data.source !== undefined) {
    updates.push("source_slug = ?");
    args.push(data.source);
  }
  if (data.isActive !== undefined) {
    updates.push("is_active = ?");
    args.push(data.isActive ? 1 : 0);
  }
  if (data.isFeatured !== undefined) {
    updates.push("is_featured = ?");
    args.push(data.isFeatured ? 1 : 0);
  }

  updates.push("updated_at = ?");
  args.push(getToday());
  args.push(id);

  await client.execute({
    sql: `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  // Update calculator config if provided
  if (data.calculator) {
    // Check if config exists
    const existingConfig = await client.execute({
      sql: `SELECT id FROM calculator_configs WHERE product_id = ?`,
      args: [id],
    });

    if (existingConfig.rows.length > 0) {
      const configId = existingConfig.rows[0].id;

      // Update config
      await client.execute({
        sql: `
          UPDATE calculator_configs 
          SET base_quantity = ?, display_unit = ?, step = ?, min_quantity = ?
          WHERE id = ?
        `,
        args: [
          data.calculator.baseQuantity,
          data.calculator.displayUnit,
          data.calculator.step,
          data.calculator.min,
          configId,
        ],
      });

      // Delete old presets and insert new ones
      await client.execute({
        sql: `DELETE FROM calculator_presets WHERE config_id = ?`,
        args: [configId],
      });

      if (data.calculator.presets?.length > 0) {
        for (let i = 0; i < data.calculator.presets.length; i++) {
          const preset = data.calculator.presets[i];
          await client.execute({
            sql: `INSERT INTO calculator_presets (config_id, label, value, sort_order) VALUES (?, ?, ?, ?)`,
            args: [configId, preset.label, preset.value, i],
          });
        }
      }
    } else {
      // Create new config
      const configResult = await client.execute({
        sql: `
          INSERT INTO calculator_configs (product_id, base_quantity, display_unit, step, min_quantity)
          VALUES (?, ?, ?, ?, ?)
        `,
        args: [
          id,
          data.calculator.baseQuantity,
          data.calculator.displayUnit,
          data.calculator.step,
          data.calculator.min,
        ],
      });

      const configId = Number(configResult.lastInsertRowid);

      if (data.calculator.presets?.length > 0) {
        for (let i = 0; i < data.calculator.presets.length; i++) {
          const preset = data.calculator.presets[i];
          await client.execute({
            sql: `INSERT INTO calculator_presets (config_id, label, value, sort_order) VALUES (?, ?, ?, ?)`,
            args: [configId, preset.label, preset.value, i],
          });
        }
      }
    }
  }

  // Update price units if provided
  if (data.priceUnits) {
    await client.execute({
      sql: `DELETE FROM price_units WHERE product_id = ?`,
      args: [id],
    });

    for (let i = 0; i < data.priceUnits.length; i++) {
      const pu = data.priceUnits[i];
      await client.execute({
        sql: `INSERT INTO price_units (product_id, label, multiplier, sort_order) VALUES (?, ?, ?, ?)`,
        args: [id, pu.label, pu.multiplier, i],
      });
    }
  }

  // Log activity
  await logActivity("update", "product", id, data.name);

  return { success: true };
}

export async function deleteProduct(id) {
  await ensureProductsFeaturedColumn();

  // Get product details for logging and optional file cleanup
  const product = await client.execute({
    sql: `SELECT name, image_path FROM products WHERE id = ?`,
    args: [id],
  });

  if (product.rows.length === 0) {
    throw new Error("Product not found");
  }

  const productName = product.rows[0]?.name || "Unknown";
  const imagePath = product.rows[0]?.image_path || null;

  // Delete product (cascades to prices, configs, etc.)
  await client.execute({
    sql: `DELETE FROM products WHERE id = ?`,
    args: [id],
  });

  // Only delete image file when no other product references the same path
  let deleteImageFile = false;
  if (imagePath) {
    const imageUsage = await client.execute({
      sql: `SELECT COUNT(*) as count FROM products WHERE image_path = ?`,
      args: [imagePath],
    });
    deleteImageFile = Number(imageUsage.rows[0]?.count || 0) === 0;
  }

  // Log activity
  await logActivity("delete", "product", id, productName);

  return { success: true, imagePath, deleteImageFile };
}

// ============================================
// PRICES
// ============================================
export async function updatePrice(productId, price, date) {
  const priceDate = date || getToday();
  let oldPrice = null;

  // Check if price exists for this date
  const existing = await client.execute({
    sql: `SELECT id, price FROM prices WHERE product_id = ? AND date = ?`,
    args: [productId, priceDate],
  });

  if (existing.rows.length > 0) {
    // Update existing
    oldPrice = Number(existing.rows[0].price);
    await client.execute({
      sql: `UPDATE prices SET price = ? WHERE id = ?`,
      args: [price, existing.rows[0].id],
    });
    return {
      action: "updated",
      oldPrice,
      newPrice: Number(price),
      changed: Number(oldPrice) !== Number(price),
    };
  } else {
    // Capture the most recent previous price before this new date.
    const previous = await client.execute({
      sql: `
        SELECT price
        FROM prices
        WHERE product_id = ? AND date < ?
        ORDER BY date DESC
        LIMIT 1
      `,
      args: [productId, priceDate],
    });
    if (previous.rows.length > 0) {
      oldPrice = Number(previous.rows[0].price);
    }

    // Insert new
    await client.execute({
      sql: `INSERT INTO prices (product_id, price, date) VALUES (?, ?, ?)`,
      args: [productId, price, priceDate],
    });
    return {
      action: "inserted",
      oldPrice,
      newPrice: Number(price),
      changed: oldPrice !== null && Number(oldPrice) !== Number(price),
    };
  }
}

export async function bulkUpdatePrices(updates, date) {
  const priceDate = date || getToday();
  const results = [];
  const changedUpdates = [];

  for (const update of updates) {
    const result = await updatePrice(update.productId, update.price, priceDate);
    const row = { ...update, ...result };
    results.push(row);
    if (row.changed) changedUpdates.push(row);
  }

  let productNamesById = {};
  if (changedUpdates.length > 0) {
    const uniqueIds = [...new Set(changedUpdates.map((u) => Number(u.productId)))];
    const placeholders = uniqueIds.map(() => "?").join(",");
    const productRows = await client.execute({
      sql: `SELECT id, name FROM products WHERE id IN (${placeholders})`,
      args: uniqueIds,
    });

    productNamesById = Object.fromEntries(
      productRows.rows.map((row) => [Number(row.id), row.name]),
    );
  }

  // Log activity
  await logActivity(
    "bulk_update",
    "prices",
    null,
    `${updates.length} products updated for ${priceDate}`,
  );

  return {
    updates: results,
    changedUpdates: changedUpdates.map((update) => ({
      ...update,
      productName: productNamesById[Number(update.productId)] || "Product",
    })),
  };
}

export async function getPriceHistory(productId, days = 30) {
  const result = await client.execute({
    sql: `
      SELECT * FROM prices 
      WHERE product_id = ? 
      ORDER BY date DESC 
      LIMIT ?
    `,
    args: [productId, days],
  });

  return result.rows;
}

// ============================================
// CATEGORIES
// ============================================
export async function getAllCategories() {
  const result = await client.execute(`
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM products WHERE category_slug = c.slug) as product_count
    FROM categories c
    ORDER BY c.sort_order, c.name
  `);

  return result.rows;
}

export async function createCategory(data) {
  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Get max sort order
  const maxOrder = await client.execute(
    `SELECT MAX(sort_order) as max_order FROM categories`,
  );
  const sortOrder = (maxOrder.rows[0]?.max_order || 0) + 1;

  const result = await client.execute({
    sql: `INSERT INTO categories (slug, name, name_fa, name_ps, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      slug,
      data.name,
      data.nameFa || null,
      data.namePs || null,
      data.icon || null,
      sortOrder,
    ],
  });

  await logActivity(
    "create",
    "category",
    Number(result.lastInsertRowid),
    data.name,
  );

  return { id: Number(result.lastInsertRowid), slug };
}

export async function updateCategory(id, data) {
  const updates = [];
  const args = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    args.push(data.name);
  }
  if (data.nameFa !== undefined) {
    updates.push("name_fa = ?");
    args.push(data.nameFa || null);
  }
  if (data.namePs !== undefined) {
    updates.push("name_ps = ?");
    args.push(data.namePs || null);
  }
  if (data.icon !== undefined) {
    updates.push("icon = ?");
    args.push(data.icon);
  }
  if (data.sortOrder !== undefined) {
    updates.push("sort_order = ?");
    args.push(data.sortOrder);
  }

  args.push(id);

  await client.execute({
    sql: `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  await logActivity("update", "category", id, data.name);

  return { success: true };
}

export async function deleteCategory(id) {
  // Check if category has products
  const category = await client.execute({
    sql: `SELECT slug, name FROM categories WHERE id = ?`,
    args: [id],
  });

  if (category.rows.length === 0) {
    throw new Error("Category not found");
  }

  const products = await client.execute({
    sql: `SELECT COUNT(*) as count FROM products WHERE category_slug = ?`,
    args: [category.rows[0].slug],
  });

  if (products.rows[0].count > 0) {
    throw new Error(
      `Cannot delete category with ${products.rows[0].count} products`,
    );
  }

  await client.execute({
    sql: `DELETE FROM categories WHERE id = ?`,
    args: [id],
  });

  await logActivity("delete", "category", id, category.rows[0].name);

  return { success: true };
}

// ============================================
// SOURCES
// ============================================
export async function getAllSources() {
  const result = await client.execute(`
    SELECT 
      s.*,
      (SELECT COUNT(*) FROM products WHERE source_slug = s.slug) as product_count
    FROM sources s
    ORDER BY s.name
  `);

  return result.rows;
}

export async function createSource(data) {
  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const result = await client.execute({
    sql: `
      INSERT INTO sources (
        slug, name, name_fa, name_ps,
        short_name, short_name_fa, short_name_ps
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      slug,
      data.name,
      data.nameFa || null,
      data.namePs || null,
      data.shortName || data.name,
      data.shortNameFa || null,
      data.shortNamePs || null,
    ],
  });

  await logActivity(
    "create",
    "source",
    Number(result.lastInsertRowid),
    data.name,
  );

  return { id: Number(result.lastInsertRowid), slug };
}

export async function updateSource(id, data) {
  const updates = [];
  const args = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    args.push(data.name);
  }
  if (data.nameFa !== undefined) {
    updates.push("name_fa = ?");
    args.push(data.nameFa || null);
  }
  if (data.namePs !== undefined) {
    updates.push("name_ps = ?");
    args.push(data.namePs || null);
  }
  if (data.shortName !== undefined) {
    updates.push("short_name = ?");
    args.push(data.shortName);
  }
  if (data.shortNameFa !== undefined) {
    updates.push("short_name_fa = ?");
    args.push(data.shortNameFa || null);
  }
  if (data.shortNamePs !== undefined) {
    updates.push("short_name_ps = ?");
    args.push(data.shortNamePs || null);
  }

  args.push(id);

  await client.execute({
    sql: `UPDATE sources SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  await logActivity("update", "source", id, data.name);

  return { success: true };
}

export async function deleteSource(id) {
  const source = await client.execute({
    sql: `SELECT slug, name FROM sources WHERE id = ?`,
    args: [id],
  });

  if (source.rows.length === 0) {
    throw new Error("Source not found");
  }

  // Set products with this source to null
  await client.execute({
    sql: `UPDATE products SET source_slug = NULL WHERE source_slug = ?`,
    args: [source.rows[0].slug],
  });

  await client.execute({
    sql: `DELETE FROM sources WHERE id = ?`,
    args: [id],
  });

  await logActivity("delete", "source", id, source.rows[0].name);

  return { success: true };
}

// ============================================
// TICKER
// ============================================
export async function getTickerItems() {
  const result = await client.execute(`
    SELECT 
      t.id as ticker_id,
      t.sort_order,
      p.id,
      p.name,
      p.slug,
      p.unit,
      p.category_slug,
      (SELECT price FROM prices WHERE product_id = p.id ORDER BY date DESC LIMIT 1) as current_price
    FROM ticker_items t
    JOIN products p ON t.product_id = p.id
    WHERE p.is_active = 1
    ORDER BY t.sort_order
  `);

  return result.rows;
}

export async function updateTickerItems(productIds) {
  // Clear existing ticker items
  await client.execute(`DELETE FROM ticker_items`);

  // Insert new items
  for (let i = 0; i < productIds.length; i++) {
    await client.execute({
      sql: `INSERT INTO ticker_items (product_id, sort_order) VALUES (?, ?)`,
      args: [productIds[i], i],
    });
  }

  await logActivity(
    "update",
    "ticker",
    null,
    `${productIds.length} items configured`,
  );

  return { success: true };
}

// ============================================
// ANALYTICS
// ============================================
export async function getAnalytics() {
  // Total products
  const totalProducts = await client.execute(
    `SELECT COUNT(*) as count FROM products WHERE is_active = 1`,
  );

  // Products by category
  const byCategory = await client.execute(`
    SELECT 
      c.name,
      c.slug,
      COUNT(p.id) as count
    FROM categories c
    LEFT JOIN products p ON c.slug = p.category_slug AND p.is_active = 1
    GROUP BY c.id
    ORDER BY count DESC
  `);

  // Recently updated products
  const recentUpdates = await client.execute(`
    SELECT 
      p.id,
      p.name,
      p.category_slug,
      pr.price,
      pr.date
    FROM products p
    JOIN prices pr ON pr.product_id = p.id
    WHERE pr.date = (SELECT MAX(date) FROM prices WHERE product_id = p.id)
    ORDER BY pr.date DESC
    LIMIT 10
  `);

  // Products not updated in 7 days
  const sevenDaysAgo = formatDate(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  );
  const staleProducts = await client.execute({
    sql: `
      SELECT 
        p.id,
        p.name,
        p.category_slug,
        MAX(pr.date) as last_update
      FROM products p
      LEFT JOIN prices pr ON pr.product_id = p.id
      WHERE p.is_active = 1
      GROUP BY p.id
      HAVING last_update < ? OR last_update IS NULL
      ORDER BY last_update ASC
    `,
    args: [sevenDaysAgo],
  });

  // Price changes today
  const today = getToday();
  const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const priceChanges = await client.execute({
    sql: `
      SELECT 
        p.id,
        p.name,
        today.price as today_price,
        yesterday.price as yesterday_price,
        (today.price - yesterday.price) as change
      FROM products p
      JOIN prices today ON today.product_id = p.id AND today.date = ?
      LEFT JOIN prices yesterday ON yesterday.product_id = p.id AND yesterday.date = ?
      WHERE yesterday.price IS NOT NULL AND today.price != yesterday.price
      ORDER BY ABS(today.price - yesterday.price) DESC
      LIMIT 10
    `,
    args: [today, yesterday],
  });

  // Visit stats
  const visitStats = await client.execute(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as visits
    FROM visits
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  const totalVisits = await client.execute(
    `SELECT COUNT(*) as count FROM visits`,
  );

  const todayVisits = await client.execute({
    sql: `SELECT COUNT(*) as count FROM visits WHERE DATE(created_at) = ?`,
    args: [today],
  });

  // Recent activity
  const recentActivity = await client.execute(`
    SELECT * FROM activity_log
    ORDER BY created_at DESC
    LIMIT 20
  `);

  return {
    summary: {
      totalProducts: totalProducts.rows[0]?.count || 0,
      totalVisits: totalVisits.rows[0]?.count || 0,
      todayVisits: todayVisits.rows[0]?.count || 0,
      staleProductsCount: staleProducts.rows.length,
    },
    byCategory: byCategory.rows,
    recentUpdates: recentUpdates.rows,
    staleProducts: staleProducts.rows,
    priceChanges: priceChanges.rows,
    visitStats: visitStats.rows,
    recentActivity: recentActivity.rows,
  };
}

// ============================================
// VISITS
// ============================================
export async function recordVisit(data) {
  await client.execute({
    sql: `INSERT INTO visits (page, user_agent, ip_hash, referrer) VALUES (?, ?, ?, ?)`,
    args: [
      data.page || "/",
      data.userAgent || null,
      data.ipHash || null,
      data.referrer || null,
    ],
  });
}

// ============================================
// ACTIVITY LOG
// ============================================
export async function logActivity(
  action,
  entityType,
  entityId,
  entityName,
  details = null,
) {
  await client.execute({
    sql: `INSERT INTO activity_log (action, entity_type, entity_id, entity_name, details) VALUES (?, ?, ?, ?, ?)`,
    args: [action, entityType, entityId, entityName, details],
  });
}

export async function getActivityLog(limit = 50) {
  const result = await client.execute({
    sql: `SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?`,
    args: [limit],
  });

  return result.rows;
}

// ============================================
// ADMIN AUTH
// ============================================
export async function getAdminCredentialByUsername(username) {
  const result = await client.execute({
    sql: `
      SELECT id, username, password_hash, is_active
      FROM admin_credentials
      WHERE username = ?
      LIMIT 1
    `,
    args: [username],
  });

  return result.rows[0] || null;
}
