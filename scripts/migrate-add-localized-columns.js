import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const localizationPlan = [
  {
    table: "products",
    columns: [
      { name: "name_fa", type: "TEXT", copyFrom: "name" },
      { name: "name_ps", type: "TEXT", copyFrom: "name" },
      { name: "description_fa", type: "TEXT", copyFrom: "description" },
      { name: "description_ps", type: "TEXT", copyFrom: "description" },
      { name: "unit_fa", type: "TEXT", copyFrom: "unit" },
      { name: "unit_ps", type: "TEXT", copyFrom: "unit" },
    ],
  },
  {
    table: "categories",
    columns: [
      { name: "name_fa", type: "TEXT", copyFrom: "name" },
      { name: "name_ps", type: "TEXT", copyFrom: "name" },
    ],
  },
  {
    table: "sources",
    columns: [
      { name: "name_fa", type: "TEXT", copyFrom: "name" },
      { name: "name_ps", type: "TEXT", copyFrom: "name" },
      { name: "short_name_fa", type: "TEXT", copyFrom: "short_name" },
      { name: "short_name_ps", type: "TEXT", copyFrom: "short_name" },
    ],
  },
  {
    table: "calculator_configs",
    columns: [
      { name: "display_unit_fa", type: "TEXT", copyFrom: "display_unit" },
      { name: "display_unit_ps", type: "TEXT", copyFrom: "display_unit" },
    ],
  },
  {
    table: "calculator_presets",
    columns: [
      { name: "label_fa", type: "TEXT", copyFrom: "label" },
      { name: "label_ps", type: "TEXT", copyFrom: "label" },
    ],
  },
  {
    table: "price_units",
    columns: [
      { name: "label_fa", type: "TEXT", copyFrom: "label" },
      { name: "label_ps", type: "TEXT", copyFrom: "label" },
    ],
  },
];

async function hasColumn(table, columnName) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.some((row) => row.name === columnName);
}

async function addColumnIfMissing(table, columnName, columnType) {
  const exists = await hasColumn(table, columnName);
  if (exists) {
    console.log(`- ${table}.${columnName} already exists`);
    return false;
  }

  await client.execute(
    `ALTER TABLE ${table} ADD COLUMN ${columnName} ${columnType}`,
  );
  console.log(`+ Added ${table}.${columnName}`);
  return true;
}

async function backfillFromSourceColumn(table, localizedColumn, sourceColumn) {
  await client.execute(
    `UPDATE ${table}
     SET ${localizedColumn} = ${sourceColumn}
     WHERE ${localizedColumn} IS NULL
       AND ${sourceColumn} IS NOT NULL`,
  );
  console.log(`  Backfilled ${table}.${localizedColumn} from ${sourceColumn}`);
}

async function run() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error(
      "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.",
    );
  }

  console.log("Starting localization columns migration...");

  for (const target of localizationPlan) {
    console.log(`\nTable: ${target.table}`);
    for (const column of target.columns) {
      const created = await addColumnIfMissing(
        target.table,
        column.name,
        column.type,
      );

      if (created && column.copyFrom) {
        await backfillFromSourceColumn(
          target.table,
          column.name,
          column.copyFrom,
        );
      }
    }
  }

  console.log("\nLocalization columns migration finished.");
}

run().catch((error) => {
  console.error("Localization migration failed:", error.message);
  process.exit(1);
});
