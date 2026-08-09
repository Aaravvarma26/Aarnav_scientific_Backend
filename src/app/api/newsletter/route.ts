import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { newsletterSchema } from "@/common/validations";
import { rateLimit, getClientIp } from "@/common/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`newsletter:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email },
  });

  return NextResponse.json({ ok: true });
}
