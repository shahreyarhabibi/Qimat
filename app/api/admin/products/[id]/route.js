// app/api/admin/products/[id]/route.js
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const product = await getProductById(parseInt(id, 10));

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const result = await updateProduct(parseInt(id, 10), data);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await deleteProduct(parseInt(id, 10));

    if (result?.deleteImageFile && typeof result.imagePath === "string") {
      const normalizedPath = result.imagePath.split("?")[0];
      if (normalizedPath.startsWith("/products/")) {
        const fileName = path.basename(normalizedPath);
        const productsDir = path.join(process.cwd(), "public", "products");
        const imageFilePath = path.join(productsDir, fileName);
        const resolvedProductsDir = path.resolve(productsDir);
        const resolvedImagePath = path.resolve(imageFilePath);

        if (resolvedImagePath.startsWith(resolvedProductsDir)) {
          try {
            await unlink(resolvedImagePath);
          } catch (error) {
            // Ignore missing files; log unexpected filesystem issues.
            if (error?.code !== "ENOENT") {
              console.error("Error deleting product image file:", error);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
