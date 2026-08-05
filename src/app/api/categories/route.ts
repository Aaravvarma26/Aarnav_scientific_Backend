import { NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      subcategories: true,
      _count: { select: { products: true } },
    },
  });
  return NextResponse.json({ categories });
}
