import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/common/prisma";
import { requireAdminAuth, logAudit, handleApiError, ApiError } from "@/common/admin-api";
import { uploadFile, ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/common/storage";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminAuth(req, "media:manage");
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError("No file provided", 400);
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      throw new ApiError("File must be under 10MB", 400);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ApiError("Unsupported file type", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFile(buffer, file.name, file.type);

    const media = await prisma.media.create({
      data: {
        fileName: file.name,
        url: uploaded.url,
        mimeType: file.type,
        size: file.size,
      },
    });

    await logAudit(req, user.sub, "MEDIA_UPLOAD", "Media", media.id);
    return NextResponse.json({ media }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
