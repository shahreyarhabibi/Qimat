// app/api/notifications/route.js
import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const startDate = getDateDaysAgo(days);

    // Get all price changes in the last N days
    const result = await client.execute({
      sql: `
        WITH price_changes AS (
          SELECT 
            p.id as product_id,
            p.name as product_name,
            p.slug as product_slug,
            p.unit as product_unit,
            p.category_slug,
            pr.price as current_price,
            pr.date as price_date,
            LAG(pr.price) OVER (PARTITION BY p.id ORDER BY pr.date) as previous_price,
            LAG(pr.date) OVER (PARTITION BY p.id ORDER BY pr.date) as previous_date
          FROM products p
          INNER JOIN prices pr ON pr.product_id = p.id
          WHERE p.is_active = 1
            AND pr.date >= ?
          ORDER BY pr.date DESC
        )
        SELECT 
          product_id,
          product_name,
          product_slug,
          product_unit,
          category_slug,
          current_price,
          previous_price,
          price_date,
          previous_date,
          (current_price - previous_price) as change_amount
        FROM price_changes
        WHERE previous_price IS NOT NULL
          AND current_price != previous_price
        ORDER BY price_date DESC, ABS(current_price - previous_price) DESC
        LIMIT ?
      `,
      args: [startDate, limit],
    });

    // Group by date for better organization
    const notifications = result.rows.map((row, index) => {
      const changeAmount = row.change_amount;
      const changePercent = row.previous_price
        ? ((changeAmount / row.previous_price) * 100).toFixed(1)
        : 0;

      return {
        id: `${row.product_id}-${row.price_date}-${index}`,
        productId: row.product_id,
        productName: row.product_name,
        productSlug: row.product_slug,
        productUnit: row.product_unit,
        category: row.category_slug,
        currentPrice: row.current_price,
        previousPrice: row.previous_price,
        changeAmount: changeAmount,
        changePercent: parseFloat(changePercent),
        date: row.price_date,
        previousDate: row.previous_date,
        isIncrease: changeAmount > 0,
        isDecrease: changeAmount < 0,
      };
    });

    // Count unread (changes from today)
    const today = formatDate(new Date());
    const todayCount = notifications.filter((n) => n.date === today).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        todayCount,
        totalCount: notifications.length,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
