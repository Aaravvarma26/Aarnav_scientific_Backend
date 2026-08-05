import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError, ApiError } from "@/common/admin-api";
import { userSchema } from "@/common/validations";
import { hashPassword } from "@/common/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAdminAuth(req);
    if (actor.role !== "ADMIN") throw new ApiError("Forbidden", 403);

    const body = await req.json();
    const parsed = userSchema.partial().parse(body);

    const data: Record<string, unknown> = {
      name: parsed.name,
      email: parsed.email,
      isActive: parsed.isActive,
    };
    if (parsed.roleName) {
      const role = await prisma.role.findUnique({ where: { name: parsed.roleName } });
      if (!role) throw new ApiError("Invalid role", 400);
      data.roleId = role.id;
    }
    if (parsed.password) {
      data.passwordHash = await hashPassword(parsed.password);
    }

    const user = await prisma.user.update({ where: { id: params.id }, data });
    await logAudit(req, actor.sub, "USER_UPDATE", "User", user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAdminAuth(req);
    if (actor.role !== "ADMIN") throw new ApiError("Forbidden", 403);
    if (actor.sub === params.id) throw new ApiError("You cannot delete your own account", 400);

    await prisma.user.update({ where: { id: params.id }, data: { isActive: false } });
    await logAudit(req, actor.sub, "USER_DEACTIVATE", "User", params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
