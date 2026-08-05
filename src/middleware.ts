import { verifyAccessToken } from "@/common/auth-edge";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get("as_access_token")?.value;
    const payload = token ? await verifyAccessToken(token) : null;

    if (!payload) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Route-level RBAC: only ADMIN/EDITOR may access user & settings management
    if (
      (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/settings")) &&
      payload.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
