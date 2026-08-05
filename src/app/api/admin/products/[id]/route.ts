import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";
import { productSchema } from "@/common/validations";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminAuth(req, "product:read");
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { images: true, packSizes: true, specifications: true, downloads: true, category: true },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "product:update");
    const body = await req.json();
    const parsed = productSchema.partial().parse(body);

    const { packSizes, ...rest } = parsed;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...rest,
        categoryId: rest.categoryId || undefined,
        subcategoryId: rest.subcategoryId || undefined,
        ...(packSizes
          ? {
              packSizes: {
                deleteMany: {},
                create: packSizes.map((label) => ({ label })),
              },
            }
          : {}),
      },
    });

    await logAudit(req, user.sub, "PRODUCT_UPDATE", "Product", product.id);
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "product:delete");
    await prisma.product.delete({ where: { id: params.id } });
    await logAudit(req, user.sub, "PRODUCT_DELETE", "Product", params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
