import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";
import { deleteFile } from "@/common/storage";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "media:manage");
    const media = await prisma.media.findUnique({ where: { id: params.id } });
    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.media.delete({ where: { id: params.id } });
    await deleteFile(media.url);
    await logAudit(req, user.sub, "MEDIA_DELETE", "Media", params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}