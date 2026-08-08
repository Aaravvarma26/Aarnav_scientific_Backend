import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { paginationParams } from "@/common/validations";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const { page, limit, skip } = paginationParams(searchParams);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category");
  const categories = searchParams.get("categories")?.split(",").map((v) => v.trim()).filter(Boolean);
  const subcategory = searchParams.get("subcategory");
  const sort = searchParams.get("sort") || "name_asc";
  const featured = searchParams.get("featured");
  const popular = searchParams.get("popular");

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
      { casNumber: { contains: q } },
    ];
  }
  if (categories?.length) where.category = { slug: { in: categories } };
  else if (category) where.category = { slug: category };
  if (subcategory) where.subcategory = { slug: subcategory };
  if (featured === "true") where.isFeatured = true;
  if (popular === "true") where.isPopular = true;

  const orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
    sort === "name_desc"
      ? { name: "desc" }
      : sort === "newest"
      ? { createdAt: "desc" }
      : sort === "featured"
      ? [{ isFeatured: "desc" }, { name: "asc" }]
      : { name: "asc" };

  try {
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, packSizes: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}