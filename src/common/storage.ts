import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "crypto";

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}

/**
 * Uploads a file buffer to whichever storage backend is configured via env vars.
 * Priority: Cloudinary > AWS S3 > local disk (development fallback only —
 * do NOT rely on local disk storage in production/serverless deployments).
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const ext = path.extname(originalName) || "";
  const fileName = `${randomUUID()}${ext}`;

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return uploadToCloudinary(buffer, fileName, mimeType);
  }
  if (process.env.AWS_S3_BUCKET) {
    return uploadToS3(buffer, fileName, mimeType);
  }
  return uploadToLocalDisk(buffer, fileName, mimeType);
}

async function uploadToCloudinary(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.round(Date.now() / 1000);
  const crypto = await import("crypto");
  const signature = crypto
    .createHash("sha1")
    .update(`timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), fileName);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${await res.text()}`);
  const data = await res.json();
  return { url: data.secure_url, fileName, size: buffer.length, mimeType };
}

async function uploadToS3(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
  // Dynamically imported so the AWS SDK is only required when S3 is configured.
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  const key = `uploads/${fileName}`;
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { url, fileName, size: buffer.length, mimeType };
}

/**
 * Deletes the underlying stored file for a URL previously returned by
 * uploadFile(), from whichever provider it was actually stored on
 * (detected from the URL shape itself, not from current env vars — so
 * this still works correctly if you've since switched providers).
 *
 * Best-effort: failures are logged, not thrown, so a storage hiccup
 * never blocks removing the database row that references it.
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    if (url.includes("res.cloudinary.com")) {
      await deleteFromCloudinary(url);
    } else if (url.includes(".amazonaws.com/")) {
      await deleteFromS3(url);
    } else if (url.startsWith("/uploads/")) {
      await deleteFromLocalDisk(url);
    }
  } catch (err) {
    console.error(`storage.deleteFile: failed to delete ${url}`, err);
  }
}

async function deleteFromCloudinary(url: string): Promise<void> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return;

  // e.g. https://res.cloudinary.com/<cloud>/image/upload/v169.../abc123.webp
  const match = url.match(/\/(image|video|raw)\/upload\/(?:v\d+\/)?([^./]+)/);
  if (!match) return;
  const [, resourceType, publicId] = match;

  const timestamp = Math.round(Date.now() / 1000);
  const crypto = await import("crypto");
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary delete failed: ${await res.text()}`);
}

async function deleteFromS3(url: string): Promise<void> {
  if (!process.env.AWS_S3_BUCKET) return;
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  const key = new URL(url).pathname.replace(/^\//, "");
  await client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key }));
}

async function deleteFromLocalDisk(url: string): Promise<void> {
  const { unlink } = await import("node:fs/promises");
  const filePath = path.join(process.cwd(), "public", url);
  await unlink(filePath);
}

async function uploadToLocalDisk(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);
  return { url: `/uploads/${fileName}`, fileName, size: buffer.length, mimeType };
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB