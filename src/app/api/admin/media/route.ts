import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, handleApiError } from "@/common/admin-api";
import { paginationParams } from "@/common/validations";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "media:manage");
    const { page, limit, skip } = paginationParams(req.nextUrl.searchParams);
    const [items, total] = await Promise.all([
      prisma.media.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.media.count(),
    ]);
    return NextResponse.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    return handleApiError(err);
  }
}
