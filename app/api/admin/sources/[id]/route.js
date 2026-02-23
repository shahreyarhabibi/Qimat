// app/api/admin/sources/[id]/route.js
import { NextResponse } from "next/server";
import { updateSource, deleteSource } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const result = await updateSource(parseInt(id, 10), data);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating source:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await deleteSource(parseInt(id, 10));
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error deleting source:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
