import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, handleApiError, ApiError } from "@/common/admin-api";
import { uploadFile, ALLOWED_MIME_TYPES } from "@/common/storage";

/**
 * Dedicated upload endpoint for the admin Downloads section (Certificates
 * and Catalogue & Price Lists thumbnails/files). Deliberately separate
 * from /api/admin/upload — that route enforces a 10MB cap for the general
 * Media Library, and this one intentionally does not, per the requirement
 * that Downloads uploads have no app-level size limit.
 *
 * NOTE: removing the app-level check here does not remove every limit in
 * the chain. Cloudinary's own plan still enforces its own per-file cap
 * (commonly ~10MB on free-tier images; larger for "raw"/PDF uploads, but
 * still capped), and if a reverse proxy (e.g. Nginx) sits in front of this
 * Node app on Hostinger, IT may also reject large request bodies before
 * this code ever runs. Test with a real large file after deploying.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdminAuth(req, "certificate:manage");
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError("No file provided", 400);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ApiError("Unsupported file type", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFile(buffer, file.name, file.type);

    return NextResponse.json({ url: uploaded.url, fileName: uploaded.fileName }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}