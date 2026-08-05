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
