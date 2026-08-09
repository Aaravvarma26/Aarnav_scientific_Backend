import { NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
export async function GET() {
  try {
    const productCount = await prisma.product.count();
    return NextResponse.json({ ok: true, service: "aarnav-scientific-api", database: "connected", products: productCount });
  } catch (error) {
    return NextResponse.json({ ok: false, service: "aarnav-scientific-api", database: "error", message: error instanceof Error ? error.message : "Unknown database error" }, { status: 503 });
  }
}
