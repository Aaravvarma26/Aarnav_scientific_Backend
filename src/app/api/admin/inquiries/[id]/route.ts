import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";
import { sendMail } from "@/common/mailer";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONTACTED", "QUOTATION_SENT", "CLOSED"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminAuth(req, "inquiry:read");
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id },
      include: { product: true, assignedTo: { select: { id: true, name: true } } },
    });
    if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ inquiry });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "inquiry:update");
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const inquiry = await prisma.inquiry.update({ where: { id: params.id }, data: parsed });
    await logAudit(req, user.sub, "INQUIRY_UPDATE", "Inquiry", inquiry.id, parsed);

    if (parsed.status === "QUOTATION_SENT") {
      await sendMail({
        to: inquiry.email,
        subject: "Your quotation is on the way — Aarnav Scientific",
        html: `<p>Dear ${inquiry.contactPerson},</p><p>Our sales team has prepared a quotation for your inquiry and will share it with you shortly via email.</p><p>Regards,<br/>Aarnav Scientific</p>`,
      }).catch(() => null);
    }

    return NextResponse.json({ inquiry });
  } catch (err) {
    return handleApiError(err);
  }
}
