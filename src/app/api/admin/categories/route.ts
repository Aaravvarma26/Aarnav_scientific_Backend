import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";
import { categorySchema } from "@/common/validations";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "category:manage");
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } }, subcategories: true },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminAuth(req, "category:manage");
    const body = await req.json();
    const parsed = categorySchema.parse(body);
    const baseSlug = parsed.slug || slugify(parsed.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    const category = await prisma.category.create({ data: { ...parsed, slug } });
    await logAudit(req, user.sub, "CATEGORY_CREATE", "Category", category.id);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
