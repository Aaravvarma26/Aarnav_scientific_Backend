import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const served = req.nextUrl.searchParams.get("served");
    const countries = await prisma.country.findMany({
      where: served === "true" ? { isServed: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ countries });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
  }
}
