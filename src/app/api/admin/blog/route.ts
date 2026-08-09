import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError } from "@/common/admin-api";
import { blogPostSchema, paginationParams } from "@/common/validations";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "blog:manage");
    const { page, limit, skip } = paginationParams(req.nextUrl.searchParams);
    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        include: { tags: true },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.blogPost.count(),
    ]);
    return NextResponse.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminAuth(req, "blog:manage");
    const body = await req.json();
    const parsed = blogPostSchema.parse(body);

    const baseSlug = parsed.slug
      ? slugify(parsed.slug, { lower: true, strict: true })
      : slugify(parsed.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const { tags, ...rest } = parsed;
    const post = await prisma.blogPost.create({
      data: {
        ...rest,
        slug,
        authorId: user.sub,
        publishedAt: parsed.status === "PUBLISHED" ? new Date() : null,
        tags: tags
          ? {
              connectOrCreate: tags.map((t) => ({
                where: { slug: slugify(t, { lower: true, strict: true }) },
                create: { name: t, slug: slugify(t, { lower: true, strict: true }) },
              })),
            }
          : undefined,
      },
    });

    await logAudit(req, user.sub, "BLOG_CREATE", "BlogPost", post.id);
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}