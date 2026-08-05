import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";
import { productSchema, paginationParams } from "@/common/validations";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "product:read");
    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip } = paginationParams(searchParams);
    const q = searchParams.get("q");
    const categoryId = searchParams.get("categoryId");

    const where: Prisma.ProductWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, packSizes: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminAuth(req, "product:create");
    const body = await req.json();
    const parsed = productSchema.parse(body);

    const baseSlug = parsed.slug || slugify(`${parsed.name}-${parsed.sku}`, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const product = await prisma.product.create({
      data: {
        sku: parsed.sku,
        slug,
        name: parsed.name,
        casNumber: parsed.casNumber,
        hsnCode: parsed.hsnCode,
        unNumber: parsed.unNumber,
        chemicalFormula: parsed.chemicalFormula,
        molecularWeight: parsed.molecularWeight,
        purity: parsed.purity,
        appearance: parsed.appearance,
        applications: parsed.applications,
        safetyInfo: parsed.safetyInfo,
        storageConditions: parsed.storageConditions,
        description: parsed.description,
        categoryId: parsed.categoryId || undefined,
        subcategoryId: parsed.subcategoryId || undefined,
        isFeatured: parsed.isFeatured ?? false,
        isPopular: parsed.isPopular ?? false,
        isActive: parsed.isActive ?? true,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        packSizes: parsed.packSizes ? { create: parsed.packSizes.map((label) => ({ label })) } : undefined,
      },
    });

    await logAudit(req, user.sub, "PRODUCT_CREATE", "Product", product.id);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}