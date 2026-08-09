import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError, ApiError } from "@/common/admin-api";
import { blogPostSchema } from "@/common/validations";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminAuth(req, "blog:manage");
    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
      include: { tags: true },
    });
    if (!post) throw new ApiError("Post not found", 404);
    return NextResponse.json({ post });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "blog:manage");
    const body = await req.json();
    const parsed = blogPostSchema.partial().parse(body);
    const { tags, ...rest } = parsed;

    const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
    const wasPublished = existing?.status === "PUBLISHED";

    if (rest.slug) {
      const baseSlug = slugify(rest.slug, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      while (
        await prisma.blogPost.findFirst({ where: { slug, NOT: { id: params.id } } })
      ) {
        slug = `${baseSlug}-${counter++}`;
      }
      rest.slug = slug;
    }

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        ...rest,
        publishedAt: parsed.status === "PUBLISHED" && !wasPublished ? new Date() : undefined,
        tags: tags
          ? {
              set: [],
              connectOrCreate: tags.map((t) => ({
                where: { slug: slugify(t, { lower: true, strict: true }) },
                create: { name: t, slug: slugify(t, { lower: true, strict: true }) },
              })),
            }
          : undefined,
      },
    });

    await logAudit(req, user.sub, "BLOG_UPDATE", "BlogPost", post.id);
    return NextResponse.json({ post });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdminAuth(req, "blog:manage");
    await prisma.blogPost.delete({ where: { id: params.id } });
    await logAudit(req, user.sub, "BLOG_DELETE", "BlogPost", params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}