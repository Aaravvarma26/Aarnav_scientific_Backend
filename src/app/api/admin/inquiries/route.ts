import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, handleApiError } from "@/common/admin-api";
import { paginationParams } from "@/common/validations";
import type { Prisma, InquiryStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "inquiry:read");
    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip } = paginationParams(searchParams);
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const where: Prisma.InquiryWhereInput = {};
    if (status) where.status = status as InquiryStatus;
    if (q) {
      where.OR = [
        { companyName: { contains: q } },
        { email: { contains: q } },
        { contactPerson: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: { product: { select: { name: true, sku: true } }, assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return NextResponse.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    return handleApiError(err);
  }
}
