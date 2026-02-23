// app/api/admin/products/upload/route.js
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeBaseName(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPG, PNG, WEBP, or GIF is allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Image size must be 5MB or less" },
        { status: 400 },
      );
    }

    const ext = EXT_BY_MIME[file.type] || ".jpg";
    const baseName = sanitizeBaseName(file.name || "product");
    const fileName = `${baseName || "product"}-${Date.now()}-${randomUUID()}${ext}`;

    const productsDir = path.join(process.cwd(), "public", "products");
    await mkdir(productsDir, { recursive: true });

    const targetPath = path.join(productsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(targetPath, buffer);

    return NextResponse.json({
      success: true,
      data: {
        path: `/products/${fileName}`,
      },
    });
  } catch (error) {
    console.error("Error uploading product image:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image" },
      { status: 500 },
    );
  }
}
