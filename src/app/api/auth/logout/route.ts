import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/common/session";

export async function POST(req: NextRequest) {
  const raw = req.cookies.get(REFRESH_COOKIE)?.value;
  if (raw && raw.includes(".")) {
    const [refreshTokenId] = raw.split(".", 2);
    await prisma.session.deleteMany({ where: { refreshToken: refreshTokenId } }).catch(() => null);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { path: "/api/auth", maxAge: 0 });
  return res;
}
