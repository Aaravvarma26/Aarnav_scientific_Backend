import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";

const schema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  country: z.string().optional(),
  message: z.string().min(5),
  avatarUrl: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  isFeatured: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "testimonial:manage");
    const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ testimonials });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminAuth(req, "testimonial:manage");
    const parsed = schema.parse(await req.json());
    const testimonial = await prisma.testimonial.create({ data: parsed });
    await logAudit(req, user.sub, "TESTIMONIAL_CREATE", "Testimonial", testimonial.id);
    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
