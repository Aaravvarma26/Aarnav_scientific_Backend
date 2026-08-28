import { NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.catalogueItem.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch catalogue items" }, { status: 500 });
  }
}