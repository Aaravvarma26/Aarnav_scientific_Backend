import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays } from "lucide-react";
import { prisma } from "@/common/prisma";
import { formatDate } from "@/common/utils";

export async function LatestNews() {
  let posts: Awaited<ReturnType<typeof getPosts>> = [];
  try {
    posts = await getPosts();
  } catch {
    posts = [];
  }
  if (posts.length === 0) return null;

  return (
    <section className="section-y bg-white">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow">Latest News</span>
            <h2 className="section-heading mt-4">From the blog</h2>
          </div>
          <Link href="/blog" className="flex items-center gap-2 text-sm font-semibold text-teal-700 hover:underline">
            View all posts <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="card-surface overflow-hidden p-0">
              <div className="relative aspect-[16/10] bg-navy-50">
                {post.featuredImage && (
                  <Image src={post.featuredImage} alt={post.title} fill className="object-cover" />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-navy-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(post.publishedAt || post.createdAt)}
                </div>
                <h3 className="mt-2 line-clamp-2 font-display text-base font-semibold text-navy-900">
                  {post.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function getPosts() {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
}
