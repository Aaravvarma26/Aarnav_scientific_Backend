import { NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [products, posts] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return NextResponse.json({ products, posts });
  } catch (err) {
    console.error("[sitemap]", err);
    return NextResponse.json({ error: "Failed to fetch sitemap data" }, { status: 500 });
  }
}
