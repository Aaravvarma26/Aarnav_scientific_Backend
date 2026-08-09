import { cookies } from "next/headers";
import { verifyAccessToken } from "./auth";

export const ACCESS_COOKIE = "as_access_token";
export const REFRESH_COOKIE = "as_refresh_token";

export async function getCurrentUser() {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return { id: payload.sub, email: payload.email, role: payload.role };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

export async function requireRole(roles: Array<"ADMIN" | "EDITOR" | "SALES">) {
  const user = await requireUser();
  if (!roles.includes(user.role as "ADMIN" | "EDITOR" | "SALES")) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
