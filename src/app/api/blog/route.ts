import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { paginationParams } from "@/common/validations";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const { page, limit, skip } = paginationParams(searchParams);
  const q = searchParams.get("q");
  const tag = searchParams.get("tag");

  const where: Prisma.BlogPostWhereInput = { status: "PUBLISHED" };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { excerpt: { contains: q } },
    ];
  }
  if (tag) where.tags = { some: { slug: tag } };

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: { tags: true, author: { select: { name: true } } },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
