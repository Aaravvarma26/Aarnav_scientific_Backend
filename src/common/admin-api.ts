import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { verifyAccessToken, hasPermission, type AccessTokenPayload } from "@/common/auth";
import { prisma } from "@/common/prisma";
import { ACCESS_COOKIE } from "@/common/session";
import { getClientIp } from "@/common/rate-limit";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireAdminAuth(
  req: NextRequest,
  permission?: string
): Promise<AccessTokenPayload> {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) throw new ApiError("Unauthorized", 401);
  if (permission && !hasPermission(payload.role, permission)) {
    throw new ApiError("Forbidden", 403);
  }
  return payload;
}

export async function logAudit(
  req: NextRequest,
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.auditLog
    .create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
        ipAddress: getClientIp(req.headers),
      },
    })
    .catch((err) => console.error("audit log failed", err));
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  // Zod validation errors (e.g. password too short, invalid email) were
  // previously falling through to a generic 500, hiding the real problem
  // from the person filling out the form. Surface the actual message.
  if (err instanceof ZodError) {
    const first = err.errors[0];
    return NextResponse.json(
      { error: first?.message || "Invalid input" },
      { status: 400 }
    );
  }

  // Prisma unique-constraint violations (e.g. creating a user with an email
  // that already exists) were also being masked as a generic 500.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "field";
      return NextResponse.json(
        { error: `A record with this ${target} already exists.` },
        { status: 409 }
      );
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }
  }

  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}