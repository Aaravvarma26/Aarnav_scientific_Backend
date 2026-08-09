import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { signAccessToken, verifyRefreshJwt } from "@/common/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/common/session";

export async function POST(req: NextRequest) {
  const raw = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!raw || !raw.includes(".")) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const [refreshTokenId, refreshJwt] = raw.split(".", 2);

  const payload = await verifyRefreshJwt(refreshJwt);
  if (!payload) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({ where: { refreshToken: refreshTokenId } });
  if (!session || session.expiresAt < new Date() || session.userId !== payload.sub) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { role: true } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Account disabled" }, { status: 401 });
  }

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role.name });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  return res;
}
