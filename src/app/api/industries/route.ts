import { NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const industries = await prisma.industry.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ industries });
}
