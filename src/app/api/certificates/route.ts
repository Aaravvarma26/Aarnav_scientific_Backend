import { NextResponse } from "next/server";
import { prisma } from "@/common/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const certificates = await prisma.certificate.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ certificates });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
