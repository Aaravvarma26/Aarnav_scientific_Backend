import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const featured = req.nextUrl.searchParams.get("featured");
    const limitRaw = parseInt(req.nextUrl.searchParams.get("limit") || "100", 10);
    const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 100));
    const testimonials = await prisma.testimonial.findMany({
      where: featured === "true" ? { isFeatured: true } : undefined,
      take: limit,
    });
    return NextResponse.json({ testimonials });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}
