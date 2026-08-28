import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().min(1),
  fileUrl: z.string().min(1),
  sortOrder: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "certificate:manage");
    const items = await prisma.catalogueItem.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminAuth(req, "certificate:manage");
    const parsed = schema.parse(await req.json());
    const item = await prisma.catalogueItem.create({ data: parsed });
    await logAudit(req, user.sub, "CATALOGUE_ITEM_CREATE", "CatalogueItem", item.id);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}