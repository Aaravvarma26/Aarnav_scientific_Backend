import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "partner:manage");
    await prisma.partner.delete({ where: { id: params.id } });
    await logAudit(req, user.sub, "PARTNER_DELETE", "Partner", params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
