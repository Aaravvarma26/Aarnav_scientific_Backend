import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/common/validations";
import { rateLimit, getClientIp } from "@/common/rate-limit";
import { sendMail } from "@/common/mailer";
import { siteConfig } from "@/common/site-config";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`contact:${ip}`, { limit: 8, windowMs: 60 * 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  await sendMail({
    to: process.env.ADMIN_NOTIFICATION_EMAIL || siteConfig.email,
    subject: `Contact form: ${data.subject || "New message"}`,
    html: `<p><strong>Name:</strong> ${data.name}</p><p><strong>Email:</strong> ${data.email}</p><p><strong>Phone:</strong> ${
      data.phone || "—"
    }</p><p><strong>Message:</strong><br/>${data.message}</p>`,
  }).catch((err) => console.error("Failed to send contact email", err));

  return NextResponse.json({ ok: true });
}
