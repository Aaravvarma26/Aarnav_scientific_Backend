import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, handleApiError } from "@/common/admin-api";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req);

    const [
      totalProducts,
      totalCategories,
      totalInquiries,
      pendingInquiries,
      totalUsers,
      totalBlogPosts,
      totalDownloads,
      recentInquiries,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.blogPost.count(),
      prisma.download.count(),
      prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    // Monthly inquiry stats for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const inquiries = await prisma.inquiry.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });
    const monthly: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      monthly[d.toLocaleString("en-US", { month: "short", year: "2-digit" })] = 0;
    }
    for (const inq of inquiries) {
      const key = inq.createdAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (key in monthly) monthly[key]++;
    }

    return NextResponse.json({
      stats: {
        totalProducts,
        totalCategories,
        totalInquiries,
        pendingInquiries,
        totalUsers,
        totalBlogPosts,
        totalDownloads,
      },
      monthlyInquiries: Object.entries(monthly).map(([month, count]) => ({ month, count })),
      recentInquiries,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
