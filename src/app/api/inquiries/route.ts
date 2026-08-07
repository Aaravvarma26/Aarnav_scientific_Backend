import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { inquirySchema } from "@/common/validations";
import { rateLimit, getClientIp } from "@/common/rate-limit";
import { sendMail } from "@/common/mailer";
import { uploadFile, ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/common/storage";
import { siteConfig } from "@/common/site-config";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`inquiry:${ip}`, { limit: 8, windowMs: 60 * 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const contentType = req.headers.get("content-type") || "";
  let fields: Record<string, string> = {};
  let attachmentUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") fields[key] = value;
    }
    const file = form.get("attachment");
    if (file && file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD_SIZE) {
        return NextResponse.json({ error: "Attachment must be under 10MB" }, { status: 400 });
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadFile(buffer, file.name, file.type);
      attachmentUrl = uploaded.url;
    }
  } else {
    fields = await req.json().catch(() => ({}));
  }

  const parsed = inquirySchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  const inquiry = await prisma.inquiry.create({
    data: {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      country: data.country,
      phone: data.phone,
      email: data.email,
      productId: data.productId || undefined,
      quantity: data.quantity,
      message: data.message,
      attachmentUrl,
    },
  });

  await Promise.all([
    sendMail({
      to: data.email,
      subject: "We've received your inquiry — Aarnav Scientific",
      html: `<p>Dear ${data.contactPerson},</p><p>Thank you for reaching out to ${siteConfig.name}. We have received your inquiry${
        data.productName ? ` regarding <strong>${data.productName}</strong>` : ""
      } and our team will get back to you within one business day.</p><p>Reference ID: ${inquiry.id}</p><p>Regards,<br/>${siteConfig.name} Team</p>`,
    }),
    sendMail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || "sales@aarnavscientific.co.in",
      subject: `New inquiry from ${data.companyName}`,
      html: `<p>New inquiry received:</p><ul>
        <li><strong>Company:</strong> ${data.companyName}</li>
        <li><strong>Contact:</strong> ${data.contactPerson}</li>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>Phone:</strong> ${data.phone}</li>
        <li><strong>Country:</strong> ${data.country || "—"}</li>
        <li><strong>Product:</strong> ${data.productName || "—"}</li>
        <li><strong>Quantity:</strong> ${data.quantity || "—"}</li>
        <li><strong>Message:</strong> ${data.message}</li>
        ${attachmentUrl ? `<li><strong>Attachment:</strong> <a href="${siteConfig.url}${attachmentUrl}">${siteConfig.url}${attachmentUrl}</a></li>` : ""}
      </ul><p><a href="${siteConfig.url}/admin/inquiries/${inquiry.id}">View in admin panel</a></p>`,
    }),
  ]).catch((err) => console.error("Failed to send inquiry emails", err));

  return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
}