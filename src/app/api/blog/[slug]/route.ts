import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    include: { tags: true, author: { select: { name: true } } },
  });
  if (!post || post.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}
