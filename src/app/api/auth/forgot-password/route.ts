import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/common/prisma";
import { forgotPasswordSchema } from "@/common/validations";
import { rateLimit, getClientIp } from "@/common/rate-limit";
import { sendMail } from "@/common/mailer";
import { siteConfig } from "@/common/site-config";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`forgot-password:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always return success to avoid leaking whether an email is registered.
  if (user) {
    const token = randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExp },
    });

    const resetUrl = `${siteConfig.url}/admin/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your Aarnav Scientific admin password",
      html: `<p>Hello ${user.name},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, message: "If that email exists, a reset link has been sent." });
}
