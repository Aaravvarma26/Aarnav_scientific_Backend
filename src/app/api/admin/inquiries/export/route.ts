import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, handleApiError } from "@/common/admin-api";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, "inquiry:read");
    const inquiries = await prisma.inquiry.findMany({
      include: { product: { select: { name: true } }, assignedTo: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const header = [
      "Date", "Company", "Contact Person", "Email", "Phone", "Country",
      "Product", "Quantity", "Status", "Assigned To", "Message",
    ];
    const rows = inquiries.map((i) =>
      [
        i.createdAt.toISOString(),
        i.companyName,
        i.contactPerson,
        i.email,
        i.phone,
        i.country || "",
        i.product?.name || "",
        i.quantity || "",
        i.status,
        i.assignedTo?.name || "",
        i.message.replace(/\n/g, " "),
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="inquiries-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
