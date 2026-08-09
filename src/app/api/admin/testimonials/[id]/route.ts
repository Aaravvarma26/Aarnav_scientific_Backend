import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "testimonial:manage");
    await prisma.testimonial.delete({ where: { id: params.id } });
    await logAudit(req, user.sub, "TESTIMONIAL_DELETE", "Testimonial", params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
