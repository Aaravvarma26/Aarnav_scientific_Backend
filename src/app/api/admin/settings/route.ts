import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError, ApiError } from "@/common/admin-api";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req);
    const settings = await prisma.setting.findMany();
    return NextResponse.json({
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const actor = await requireAdminAuth(req);
    if (actor.role !== "ADMIN") throw new ApiError("Forbidden", 403);
    const body: Record<string, string> = await req.json();

    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    await logAudit(req, actor.sub, "SETTINGS_UPDATE");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
