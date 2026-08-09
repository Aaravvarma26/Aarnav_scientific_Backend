import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";
import { categorySchema } from "@/common/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "category:manage");
    const body = await req.json();
    const parsed = categorySchema.partial().parse(body);
    const category = await prisma.category.update({ where: { id: params.id }, data: parsed });
    await logAudit(req, user.sub, "CATEGORY_UPDATE", "Category", category.id);
    return NextResponse.json({ category });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "category:manage");
    await prisma.category.delete({ where: { id: params.id } });
    await logAudit(req, user.sub, "CATEGORY_DELETE", "Category", params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
