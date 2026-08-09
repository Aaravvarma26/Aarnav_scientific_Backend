import { jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me"
);

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "SALES";
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as AccessTokenPayload & { iat: number; exp: number };
  } catch {
    return null;
  }
}