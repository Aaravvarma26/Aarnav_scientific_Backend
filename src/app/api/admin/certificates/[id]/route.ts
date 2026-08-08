import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";

const updateSchema = z.object({
  title: z.string().min(2),
  issuer: z.string().optional(),
  certNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  imageUrl: z.string().min(1),
  fileUrl: z.string().optional(),
  sortOrder: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "certificate:manage");
    const parsed = updateSchema.parse(await req.json());
    const certificate = await prisma.certificate.update({
      where: { id: params.id },
      data: {
        ...parsed,
        issueDate: parsed.issueDate ? new Date(parsed.issueDate) : null,
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
      },
    });
    await logAudit(req, user.sub, "CERTIFICATE_UPDATE", "Certificate", certificate.id);
    return NextResponse.json({ certificate });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "certificate:manage");
    await prisma.certificate.delete({ where: { id: params.id } });
    await logAudit(req, user.sub, "CERTIFICATE_DELETE", "Certificate", params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}