import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "homepage:manage");
    const sections = await prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ sections });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdminAuth(req, "homepage:manage");
    const body = await req.json(); // { key, title?, subtitle?, isEnabled?, content? }
    const section = await prisma.homepageSection.update({
      where: { key: body.key },
      data: {
        title: body.title,
        subtitle: body.subtitle,
        isEnabled: body.isEnabled,
        content: body.content,
      },
    });
    await logAudit(req, user.sub, "HOMEPAGE_SECTION_UPDATE", "HomepageSection", section.id);
    return NextResponse.json({ section });
  } catch (err) {
    return handleApiError(err);
  }
}
