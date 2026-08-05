import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";

const schema = z.object({
  title: z.string().min(2),
  issuer: z.string().optional(),
  certNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  imageUrl: z.string().min(1),
  fileUrl: z.string().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "certificate:manage");
    const certificates = await prisma.certificate.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ certificates });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminAuth(req, "certificate:manage");
    const parsed = schema.parse(await req.json());
    const certificate = await prisma.certificate.create({
      data: {
        ...parsed,
        issueDate: parsed.issueDate ? new Date(parsed.issueDate) : undefined,
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : undefined,
      },
    });
    await logAudit(req, user.sub, "CERTIFICATE_CREATE", "Certificate", certificate.id);
    return NextResponse.json({ certificate }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
