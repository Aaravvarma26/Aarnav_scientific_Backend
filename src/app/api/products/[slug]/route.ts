import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      subcategory: true,
      images: { orderBy: { sortOrder: "asc" } },
      packSizes: true,
      specifications: { orderBy: { sortOrder: "asc" } },
      downloads: true,
    },
  });

  if (!product || !product.isActive) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    include: { category: true, packSizes: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 4,
  });

  return NextResponse.json({ product, related });
}