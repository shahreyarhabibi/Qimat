// scripts/seed.js
// Run with: node --env-file=.env.local scripts/seed.js

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  categories,
  sources,
  products,
  prices,
  calculatorConfigs,
  calculatorPresets,
  priceUnits,
} from "../lib/db/schema.js";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// ============================================
// HELPER: Generate price history (same as your mock)
// ============================================
function generatePriceHistory(currentPrice, volatility = 0.05) {
  const history = [];
  let price = currentPrice;

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const change = price * (Math.random() * volatility * 2 - volatility);
    price = i === 0 ? currentPrice : price + change;
    history.push({
      date: date.toISOString().split("T")[0],
      price: Math.round(price * 100) / 100,
    });
  }

  return history;
}

// ============================================
// SEED DATA (Matching your mock data exactly)
// ============================================
async function seed() {
  console.log("🌱 Starting database seed...\n");

  // ==========================================
  // 1. INSERT CATEGORIES
  // ==========================================
  console.log("📁 Creating categories...");

  const categoryData = [
    { slug: "essentials", name: "Essentials", icon: "🛒", sortOrder: 1 },
    { slug: "phones", name: "Phones", icon: "📱", sortOrder: 2 },
    { slug: "currencies", name: "Currencies", icon: "💱", sortOrder: 3 },
    { slug: "fuel", name: "Fuel", icon: "⛽", sortOrder: 4 },
    { slug: "metals", name: "Metals", icon: "🥇", sortOrder: 5 },
  ];

  await db.insert(categories).values(categoryData);
  console.log(`   ✓ Created ${categoryData.length} categories`);

  // ==========================================
  // 2. INSERT SOURCES
  // ==========================================
  console.log("📍 Creating sources...");

  const sourceData = [
    { slug: "bagh-qazi", name: "Bagh Qazi", shortName: "Bagh Qazi" },
    { slug: "gulbahar", name: "Gulbahar Center", shortName: "Gulbahar" },
    {
      slug: "sarai-shahzada",
      name: "Sarai Shahzada",
      shortName: "Sarai Shahzada",
    },
    {
      slug: "local-station",
      name: "Kabul Fuel Stations",
      shortName: "Kabul Stations",
    },
    { slug: "jewelry", name: "Timur Shahi Market", shortName: "Timur Shahi" },
  ];

  await db.insert(sources).values(sourceData);
  console.log(`   ✓ Created ${sourceData.length} sources`);

  // ==========================================
  // 3. INSERT PRODUCTS
  // ==========================================
  console.log("📦 Creating products...\n");

  const productsData = [
    // =====================
    // ESSENTIALS
    // =====================
    {
      name: "Haji Aziz Rice",
      slug: "haji-aziz-rice",
      unit: "1 sack (24.5 kg)",
      price: 3800,
      volatility: 0.02,
      category: "essentials",
      source: "bagh-qazi",
      image: "/products/hajiaziz.jpg",
      description:
        "Premium quality Haji Aziz brand rice, perfect for daily cooking and special occasions.",
      calculator: {
        baseQuantity: 24.5,
        displayUnit: "kg",
        step: 0.5,
        min: 0.5,
        presets: [
          { label: "1 kg", value: 1 },
          { label: "2 kg", value: 2 },
          { label: "½ ser", value: 3.5 },
          { label: "1 ser", value: 7 },
          { label: "2 ser", value: 14 },
          { label: "1 sack", value: 24.5 },
        ],
      },
      priceUnits: [
        { label: "1 kg", multiplier: 1 },
        { label: "1 ser (7 kg)", multiplier: 7 },
        { label: "1 sack (24.5 kg)", multiplier: 24.5 },
      ],
    },
    {
      name: "Capsole Beans",
      slug: "capsole-beans",
      unit: "1 ser (7 kg)",
      price: 750,
      volatility: 0.03,
      category: "essentials",
      source: "bagh-qazi",
      image: "/products/beans.jpg",
      description: "High-quality capsole beans, a staple in Afghan cuisine.",
      calculator: {
        baseQuantity: 7,
        displayUnit: "kg",
        step: 0.5,
        min: 0.5,
        presets: [
          { label: "1 kg", value: 1 },
          { label: "2 kg", value: 2 },
          { label: "½ ser", value: 3.5 },
          { label: "1 ser", value: 7 },
          { label: "2 ser", value: 14 },
          { label: "3 ser", value: 21 },
        ],
      },
      priceUnits: [
        { label: "1 kg", multiplier: 1 },
        { label: "1 ser (7 kg)", multiplier: 7 },
      ],
    },
    {
      name: "Sugar",
      slug: "sugar",
      unit: "1 kg",
      price: 85,
      volatility: 0.04,
      category: "essentials",
      source: "bagh-qazi",
      image: "/products/sugar.jpg",
      description: "Refined white sugar for everyday use.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "kg",
        step: 0.5,
        min: 0.5,
        presets: [
          { label: "½ kg", value: 0.5 },
          { label: "1 kg", value: 1 },
          { label: "2 kg", value: 2 },
          { label: "5 kg", value: 5 },
          { label: "1 ser", value: 7 },
          { label: "2 ser", value: 14 },
        ],
      },
      priceUnits: [
        { label: "1 kg", multiplier: 1 },
        { label: "1 ser (7 kg)", multiplier: 7 },
      ],
    },
    {
      name: "Flour",
      slug: "flour",
      unit: "1 kg",
      price: 65,
      volatility: 0.03,
      category: "essentials",
      source: "bagh-qazi",
      image: "/products/flour.jpg",
      description: "Fine wheat flour, ideal for bread and pastries.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "kg",
        step: 0.5,
        min: 0.5,
        presets: [
          { label: "1 kg", value: 1 },
          { label: "2 kg", value: 2 },
          { label: "5 kg", value: 5 },
          { label: "1 ser", value: 7 },
          { label: "2 ser", value: 14 },
          { label: "50 kg", value: 50 },
        ],
      },
      priceUnits: [
        { label: "1 kg", multiplier: 1 },
        { label: "1 ser (7 kg)", multiplier: 7 },
        { label: "1 sack (50 kg)", multiplier: 50 },
      ],
    },
    {
      name: "Cooking Oil",
      slug: "cooking-oil",
      unit: "1 L",
      price: 170,
      volatility: 0.02,
      category: "essentials",
      source: "bagh-qazi",
      image: "/products/oil.jpg",
      description: "Vegetable cooking oil for all your culinary needs.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "liter",
        step: 0.5,
        min: 0.5,
        presets: [
          { label: "½ L", value: 0.5 },
          { label: "1 L", value: 1 },
          { label: "2 L", value: 2 },
          { label: "5 L", value: 5 },
          { label: "10 L", value: 10 },
          { label: "16 L", value: 16 },
        ],
      },
      priceUnits: [
        { label: "1 liter", multiplier: 1 },
        { label: "5 liters", multiplier: 5 },
        { label: "16 liters (tin)", multiplier: 16 },
      ],
    },

    // =====================
    // CURRENCIES
    // =====================
    {
      name: "US Dollar",
      slug: "usd",
      unit: "1 USD",
      price: 70.5,
      volatility: 0.01,
      category: "currencies",
      source: "sarai-shahzada",
      image: "/products/usd.jpg",
      description: "United States Dollar exchange rate.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "USD",
        step: 1,
        min: 1,
        presets: [
          { label: "$10", value: 10 },
          { label: "$50", value: 50 },
          { label: "$100", value: 100 },
          { label: "$500", value: 500 },
          { label: "$1000", value: 1000 },
        ],
      },
      priceUnits: [
        { label: "$1", multiplier: 1 },
        { label: "$100", multiplier: 100 },
      ],
    },
    {
      name: "Euro",
      slug: "euro",
      unit: "1 EUR",
      price: 76.8,
      volatility: 0.01,
      category: "currencies",
      source: "sarai-shahzada",
      image: "/products/euro.jpg",
      description: "Euro exchange rate.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "EUR",
        step: 1,
        min: 1,
        presets: [
          { label: "€10", value: 10 },
          { label: "€50", value: 50 },
          { label: "€100", value: 100 },
          { label: "€500", value: 500 },
        ],
      },
      priceUnits: [
        { label: "€1", multiplier: 1 },
        { label: "€100", multiplier: 100 },
      ],
    },
    {
      name: "Pakistani Rupee",
      slug: "pkr",
      unit: "1000 PKR",
      price: 252,
      volatility: 0.015,
      category: "currencies",
      source: "sarai-shahzada",
      image: "/products/pkr.jpg",
      description: "Pakistani Rupee exchange rate.",
      calculator: {
        baseQuantity: 1000,
        displayUnit: "PKR",
        step: 100,
        min: 100,
        presets: [
          { label: "1,000 PKR", value: 1000 },
          { label: "5,000 PKR", value: 5000 },
          { label: "10,000 PKR", value: 10000 },
          { label: "50,000 PKR", value: 50000 },
        ],
      },
      priceUnits: [
        { label: "1,000 PKR", multiplier: 1000 },
        { label: "10,000 PKR", multiplier: 10000 },
      ],
    },

    // =====================
    // FUEL
    // =====================
    {
      name: "Petrol",
      slug: "petrol",
      unit: "1 L",
      price: 65,
      volatility: 0.03,
      category: "fuel",
      source: "local-station",
      image: "/products/petrol.jpg",
      description: "Regular petrol/gasoline for vehicles.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "liter",
        step: 1,
        min: 1,
        presets: [
          { label: "5 L", value: 5 },
          { label: "10 L", value: 10 },
          { label: "20 L", value: 20 },
          { label: "30 L", value: 30 },
          { label: "50 L", value: 50 },
        ],
      },
      priceUnits: [
        { label: "1 liter", multiplier: 1 },
        { label: "10 liters", multiplier: 10 },
      ],
    },
    {
      name: "Diesel",
      slug: "diesel",
      unit: "1 L",
      price: 62,
      volatility: 0.03,
      category: "fuel",
      source: "local-station",
      image: "/products/diesel.jpg",
      description: "Diesel fuel for vehicles and generators.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "liter",
        step: 1,
        min: 1,
        presets: [
          { label: "10 L", value: 10 },
          { label: "20 L", value: 20 },
          { label: "50 L", value: 50 },
          { label: "100 L", value: 100 },
        ],
      },
      priceUnits: [
        { label: "1 liter", multiplier: 1 },
        { label: "10 liters", multiplier: 10 },
      ],
    },
    {
      name: "LPG Gas",
      slug: "lpg-gas",
      unit: "1 kg",
      price: 85,
      volatility: 0.02,
      category: "fuel",
      source: "local-station",
      image: "/products/gas.jpg",
      description: "Liquefied petroleum gas for cooking and heating.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "kg",
        step: 1,
        min: 1,
        presets: [
          { label: "5 kg", value: 5 },
          { label: "10 kg", value: 10 },
          { label: "15 kg", value: 15 },
          { label: "20 kg", value: 20 },
        ],
      },
      priceUnits: [
        { label: "1 kg", multiplier: 1 },
        { label: "1 cylinder (15 kg)", multiplier: 15 },
      ],
    },

    // =====================
    // METALS (Gold)
    // =====================
    {
      name: "Gold 24K",
      slug: "gold-24k",
      unit: "1 gram",
      price: 7850,
      volatility: 0.01,
      category: "metals",
      source: "jewelry",
      image: "/products/gold.jpg",
      description: "Pure 24 karat gold.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "gram",
        step: 0.5,
        min: 0.5,
        presets: [
          { label: "1 gram", value: 1 },
          { label: "5 gram", value: 5 },
          { label: "10 gram", value: 10 },
          { label: "1 tola", value: 11.66 },
          { label: "50 gram", value: 50 },
        ],
      },
      priceUnits: [
        { label: "1 gram", multiplier: 1 },
        { label: "1 tola (11.66g)", multiplier: 11.66 },
      ],
    },
    {
      name: "Gold 22K",
      slug: "gold-22k",
      unit: "1 gram",
      price: 7200,
      volatility: 0.01,
      category: "metals",
      source: "jewelry",
      image: "/products/gold22.jpg",
      description: "22 karat gold, commonly used in jewelry.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "gram",
        step: 0.5,
        min: 0.5,
        presets: [
          { label: "1 gram", value: 1 },
          { label: "5 gram", value: 5 },
          { label: "10 gram", value: 10 },
          { label: "1 tola", value: 11.66 },
        ],
      },
      priceUnits: [
        { label: "1 gram", multiplier: 1 },
        { label: "1 tola (11.66g)", multiplier: 11.66 },
      ],
    },

    // =====================
    // PHONES
    // =====================
    {
      name: "iPhone 16 Pro Max",
      slug: "iphone-16-pro-max",
      unit: "Used",
      price: 185000,
      volatility: 0.02,
      category: "phones",
      source: "gulbahar",
      image: "/products/iphone16promax.jpg",
      description: "Apple iPhone 16 Pro Max, used condition.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "piece",
        step: 1,
        min: 1,
        presets: [{ label: "1 phone", value: 1 }],
      },
      priceUnits: null,
    },
    {
      name: "iPhone 15 Pro",
      slug: "iphone-15-pro",
      unit: "Used",
      price: 145000,
      volatility: 0.02,
      category: "phones",
      source: "gulbahar",
      image: "/products/iphone15pro.jpg",
      description: "Apple iPhone 15 Pro, used condition.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "piece",
        step: 1,
        min: 1,
        presets: [{ label: "1 phone", value: 1 }],
      },
      priceUnits: null,
    },
    {
      name: "iPhone 14 Pro",
      slug: "iphone-14-pro",
      unit: "Used",
      price: 95000,
      volatility: 0.02,
      category: "phones",
      source: "gulbahar",
      image: "/products/iphone14pro.jpg",
      description: "Apple iPhone 14 Pro, used condition.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "piece",
        step: 1,
        min: 1,
        presets: [{ label: "1 phone", value: 1 }],
      },
      priceUnits: null,
    },
    {
      name: "Samsung S24 Ultra",
      slug: "samsung-s24-ultra",
      unit: "Used",
      price: 165000,
      volatility: 0.02,
      category: "phones",
      source: "gulbahar",
      image: "/products/samsungs24ultra.jpg",
      description: "Samsung Galaxy S24 Ultra, used condition.",
      calculator: {
        baseQuantity: 1,
        displayUnit: "piece",
        step: 1,
        min: 1,
        presets: [{ label: "1 phone", value: 1 }],
      },
      priceUnits: null,
    },
  ];

  for (const item of productsData) {
    console.log(`   📦 Creating: ${item.name}`);

    // Insert product
    const [product] = await db
      .insert(products)
      .values({
        name: item.name,
        slug: item.slug,
        description: item.description,
        categorySlug: item.category,
        unit: item.unit,
        imagePath: item.image,
        sourceSlug: item.source,
      })
      .returning();

    // Insert calculator config
    if (item.calculator) {
      const [config] = await db
        .insert(calculatorConfigs)
        .values({
          productId: product.id,
          baseQuantity: item.calculator.baseQuantity,
          displayUnit: item.calculator.displayUnit,
          step: item.calculator.step,
          minQuantity: item.calculator.min,
        })
        .returning();

      // Insert presets
      if (item.calculator.presets?.length > 0) {
        await db.insert(calculatorPresets).values(
          item.calculator.presets.map((preset, index) => ({
            configId: config.id,
            label: preset.label,
            value: preset.value,
            sortOrder: index,
          })),
        );
      }
    }

    // Insert price units
    if (item.priceUnits?.length > 0) {
      await db.insert(priceUnits).values(
        item.priceUnits.map((pu, index) => ({
          productId: product.id,
          label: pu.label,
          multiplier: pu.multiplier,
          sortOrder: index,
        })),
      );
    }

    // Generate and insert price history
    const priceHistory = generatePriceHistory(item.price, item.volatility);
    await db.insert(prices).values(
      priceHistory.map((ph) => ({
        productId: product.id,
        price: ph.price,
        date: ph.date,
      })),
    );

    console.log(`      ✓ Added ${priceHistory.length} price records`);
  }

  console.log("\n✅ Database seeding complete!");
  console.log(`   📁 ${categoryData.length} categories`);
  console.log(`   📍 ${sourceData.length} sources`);
  console.log(`   📦 ${productsData.length} products`);
  console.log(`   💰 ${productsData.length * 31} price records (31 days each)`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
