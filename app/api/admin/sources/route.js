// app/api/admin/sources/route.js
import { NextResponse } from "next/server";
import {
  getAllSources,
  createSource,
  updateSource,
  deleteSource,
} from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sources = await getAllSources();
    return NextResponse.json({ success: true, data: sources });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await createSource(data);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating source:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
