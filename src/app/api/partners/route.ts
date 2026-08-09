import { NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ partners });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
  }
}
