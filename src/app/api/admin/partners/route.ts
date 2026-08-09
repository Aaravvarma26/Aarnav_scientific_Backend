import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";

const schema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().min(1),
  website: z.string().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "partner:manage");
    const partners = await prisma.partner.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ partners });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminAuth(req, "partner:manage");
    const parsed = schema.parse(await req.json());
    const partner = await prisma.partner.create({ data: parsed });
    await logAudit(req, user.sub, "PARTNER_CREATE", "Partner", partner.id);
    return NextResponse.json({ partner }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
