import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";
import { deleteFile } from "@/common/storage";

const updateSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().min(1),
  fileUrl: z.string().min(1),
  sortOrder: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "certificate:manage");
    const parsed = updateSchema.parse(await req.json());
    const item = await prisma.catalogueItem.update({ where: { id: params.id }, data: parsed });
    await logAudit(req, user.sub, "CATALOGUE_ITEM_UPDATE", "CatalogueItem", item.id);
    return NextResponse.json({ item });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "certificate:manage");
    const item = await prisma.catalogueItem.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.catalogueItem.delete({ where: { id: params.id } });
    await deleteFile(item.imageUrl);
    await deleteFile(item.fileUrl);
    await logAudit(req, user.sub, "CATALOGUE_ITEM_DELETE", "CatalogueItem", params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}