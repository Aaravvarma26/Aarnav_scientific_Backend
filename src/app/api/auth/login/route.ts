import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { verifyPassword, signAccessToken, signRefreshJwt, generateRefreshToken, REFRESH_TOKEN_TTL_DAYS } from "@/common/auth";
import { loginSchema } from "@/common/validations";
import { rateLimit, getClientIp } from "@/common/rate-limit";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/common/session";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role.name,
  });
  const refreshTokenId = generateRefreshToken();
  const refreshJwt = await signRefreshJwt(user.id);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: refreshTokenId,
      userAgent: req.headers.get("user-agent") || undefined,
      ipAddress: ip,
      expiresAt,
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "USER_LOGIN", ipAddress: ip },
  });

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
  });

  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  res.cookies.set(REFRESH_COOKIE, `${refreshTokenId}.${refreshJwt}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });

  return res;
}
