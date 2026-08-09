import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError, ApiError } from "@/common/admin-api";
import { userSchema } from "@/common/validations";
import { hashPassword } from "@/common/auth";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAdminAuth(req);
    if (actor.role !== "ADMIN") throw new ApiError("Forbidden", 403);
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.name,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAdminAuth(req);
    if (actor.role !== "ADMIN") throw new ApiError("Forbidden", 403);

    const body = await req.json();
    const parsed = userSchema.parse(body);
    if (!parsed.password) throw new ApiError("Password is required for new users", 400);

    const role = await prisma.role.findUnique({ where: { name: parsed.roleName } });
    if (!role) throw new ApiError("Invalid role", 400);

    const passwordHash = await hashPassword(parsed.password);
    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        passwordHash,
        roleId: role.id,
        isActive: parsed.isActive ?? true,
      },
    });

    await logAudit(req, actor.sub, "USER_CREATE", "User", user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
