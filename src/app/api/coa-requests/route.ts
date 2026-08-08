import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { coaRequestSchema } from "@/common/validations";
import { rateLimit, getClientIp } from "@/common/rate-limit";
import { sendMail } from "@/common/mailer";
import { siteConfig } from "@/common/site-config";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`coa:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const fields = await req.json().catch(() => ({}));
  const parsed = coaRequestSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  const coaRequest = await prisma.cOARequest.create({
    data: {
      productId: data.productId || undefined,
      productName: data.productName,
      sku: data.sku,
      batchNo: data.batchNo,
      email: data.email,
    },
  });

  const [confirmationResult, adminNotifyResult] = await Promise.allSettled([
    sendMail({
      to: data.email,
      subject: "We've received your Certificate of Analysis (COA) request — Aarnav Scientific",
      html: `<p>Hello,</p><p>Thank you for your COA request${
        data.productName ? ` for <strong>${data.productName}</strong>` : ""
      }.</p><ul>
        <li><strong>SKU:</strong> ${data.sku}</li>
        <li><strong>Batch No.:</strong> ${data.batchNo}</li>
      </ul><p>Our team will send the relevant Certificate of Analysis to this email address shortly.</p><p>Regards,<br/>${siteConfig.name} Team</p>`,
    }),
    sendMail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || "sales@aarnavscientific.co.in",
      subject: `New COA request — ${data.sku} (Batch ${data.batchNo})`,
      html: `<p>New Certificate of Analysis request:</p><ul>
        <li><strong>Product:</strong> ${data.productName || "—"}</li>
        <li><strong>SKU:</strong> ${data.sku}</li>
        <li><strong>Batch No.:</strong> ${data.batchNo}</li>
        <li><strong>Requested by:</strong> ${data.email}</li>
      </ul><p><a href="${siteConfig.url}/admin/coa-requests">View in admin panel</a></p>`,
    }),
  ]);

  if (adminNotifyResult.status === "rejected" || adminNotifyResult.value?.sent === false) {
    console.error(
      `[coa-requests] Admin notification email FAILED for request ${coaRequest.id}:`,
      adminNotifyResult.status === "rejected" ? adminNotifyResult.reason : adminNotifyResult.value?.reason
    );
  }
  if (confirmationResult.status === "rejected" || confirmationResult.value?.sent === false) {
    console.error(
      `[coa-requests] Confirmation email FAILED for request ${coaRequest.id}:`,
      confirmationResult.status === "rejected" ? confirmationResult.reason : confirmationResult.value?.reason
    );
  }

  return NextResponse.json({ ok: true, id: coaRequest.id }, { status: 201 });
}
