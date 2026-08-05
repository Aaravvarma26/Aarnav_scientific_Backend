import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, handleApiError, ApiError } from "@/common/admin-api";
import { paginationParams } from "@/common/validations";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAdminAuth(req);
    if (actor.role !== "ADMIN") throw new ApiError("Forbidden", 403);
    const { page, limit, skip } = paginationParams(req.nextUrl.searchParams);
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);
    return NextResponse.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    return handleApiError(err);
  }
}
