import { NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_CATALOGUE_URL = "/downloads/Quanta-Chem-Product-Catalogue.pdf";

export async function GET() {
  try {
    const [certificates, testimonials, partners, countries, catalogueSetting] = await Promise.all([
      prisma.certificate.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.testimonial.findMany({ where: { isFeatured: true }, take: 6 }),
      prisma.partner.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.country.findMany({ where: { isServed: true }, orderBy: { sortOrder: "asc" } }),
      prisma.setting.findUnique({ where: { key: "product_catalogue_url" } }),
    ]);

    return NextResponse.json({
      certificates,
      testimonials,
      partners,
      countries,
      catalogueUrl: catalogueSetting?.value || DEFAULT_CATALOGUE_URL,
    });
  } catch (err) {
    console.error("[site-content]", err);
    return NextResponse.json({ error: "Failed to fetch site content" }, { status: 500 });
  }
}
