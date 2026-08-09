import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const keys = (req.nextUrl.searchParams.get("keys") || req.nextUrl.searchParams.get("key") || "")
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean);

    if (keys.length === 0) return NextResponse.json({ settings: {} });

    const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
    const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return NextResponse.json({ settings });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
