import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

const INDUSTRY_CATEGORY_SLUGS: Record<string, string[]> = {
  pharmaceuticals: ["pharmaceutical-chemicals"],
  food: ["food-chemicals"],
  cosmetics: ["organic-chemicals"],
  agriculture: ["inorganic-chemicals", "organic-chemicals"],
  laboratory: ["laboratory-chemicals"],
  "industrial-chemicals": ["inorganic-chemicals", "acids", "solvents"],
  "water-treatment": ["water-treatment-chemicals"],
  "specialty-chemicals": ["organic-chemicals"],
};

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const industry = await prisma.industry.findUnique({ where: { slug: params.slug } });
    const categorySlugs = INDUSTRY_CATEGORY_SLUGS[params.slug];
    let products = categorySlugs
      ? await prisma.product.findMany({
          where: { isActive: true, category: { slug: { in: categorySlugs } } },
          select: { id: true, slug: true, name: true },
          take: 4,
          orderBy: { isFeatured: "desc" },
        })
      : [];

    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, name: true },
        take: 4,
        orderBy: { isFeatured: "desc" },
      });
    }

    return NextResponse.json({ industry, products });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch industry" }, { status: 500 });
  }
}
