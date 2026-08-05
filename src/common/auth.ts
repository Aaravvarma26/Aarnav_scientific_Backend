import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me"
);

export const ACCESS_TOKEN_TTL = "45m";
export const REFRESH_TOKEN_TTL_DAYS = 30;

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: "ADMIN" | "EDITOR" | "SALES";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(ACCESS_SECRET);
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as AccessTokenPayload & { iat: number; exp: number };
  } catch {
    return null;
  }
}

export function generateRefreshToken() {
  return randomBytes(48).toString("hex");
}

export async function signRefreshJwt(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_DAYS}d`)
    .sign(REFRESH_SECRET);
}

export async function verifyRefreshJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as { sub: string; iat: number; exp: number };
  } catch {
    return null;
  }
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ["*"],
  EDITOR: [
    "product:read", "product:create", "product:update", "product:delete",
    "category:manage", "blog:manage", "media:manage", "download:manage",
    "certificate:manage", "testimonial:manage", "partner:manage",
    "homepage:manage",
  ],
  SALES: ["inquiry:read", "inquiry:update", "product:read", "dashboard:read"],
};

export function hasPermission(role: string, permission: string) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(permission);
}