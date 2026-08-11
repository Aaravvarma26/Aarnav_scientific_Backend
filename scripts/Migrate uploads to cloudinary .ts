/**
 * One-time migration: moves files currently stored on local disk
 * (public/uploads/*) up to Cloudinary, then updates every database
 * row that points at the old local URL.
 *
 * Run this ONCE, after CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY /
 * CLOUDINARY_API_SECRET are set in your environment — it reuses the
 * exact same uploadFile() helper your admin upload route already
 * calls, so it will upload to whichever provider is configured.
 *
 * Usage (from the backend project root, on the server where
 * public/uploads actually holds the files):
 *   npx tsx scripts/migrate-uploads-to-cloudinary.ts
 *
 * It's safe to re-run — rows already pointing at a Cloudinary/S3 URL
 * (i.e. not starting with "/uploads/") are skipped automatically.
 *
 * NOTE: unlike Next.js itself, tsx does NOT auto-load .env files — this
 * import is what makes CLOUDINARY_CLOUD_NAME etc. actually visible here.
 * Requires the "dotenv" package: npm install dotenv
 */
import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/common/prisma";
import { uploadFile } from "../src/common/storage";

const LOCAL_PREFIX = "/uploads/";

async function migrateFile(localUrl: string): Promise<string | null> {
  const fileName = localUrl.replace(LOCAL_PREFIX, "");
  const filePath = path.join(process.cwd(), "public", "uploads", fileName);

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    console.error(`  ✗ File not found on disk, skipping: ${filePath}`);
    return null;
  }

  const ext = path.extname(fileName).toLowerCase();
  const mimeType =
    ext === ".png" ? "image/png" :
    ext === ".webp" ? "image/webp" :
    ext === ".gif" ? "image/gif" :
    ext === ".pdf" ? "application/pdf" :
    "image/jpeg";

  const uploaded = await uploadFile(buffer, fileName, mimeType);
  return uploaded.url;
}

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.AWS_S3_BUCKET) {
    console.error(
      "No CLOUDINARY_CLOUD_NAME or AWS_S3_BUCKET set in the environment this script is running in. " +
      "Set your Cloudinary credentials first, then re-run."
    );
    process.exit(1);
  }

  console.log("== Media table ==");
  const media = await prisma.media.findMany({
    where: { url: { startsWith: LOCAL_PREFIX } },
  });
  console.log(`Found ${media.length} local file(s) to migrate.`);
  for (const m of media) {
    console.log(`Uploading ${m.fileName} (${m.url}) ...`);
    const newUrl = await migrateFile(m.url);
    if (newUrl) {
      await prisma.media.update({ where: { id: m.id }, data: { url: newUrl } });
      console.log(`  ✓ -> ${newUrl}`);
    }
  }

  console.log("\n== Inquiry attachments ==");
  const inquiries = await prisma.inquiry.findMany({
    where: { attachmentUrl: { startsWith: LOCAL_PREFIX } },
  });
  console.log(`Found ${inquiries.length} local attachment(s) to migrate.`);
  for (const i of inquiries) {
    console.log(`Uploading inquiry ${i.id} attachment (${i.attachmentUrl}) ...`);
    const newUrl = await migrateFile(i.attachmentUrl!);
    if (newUrl) {
      await prisma.inquiry.update({ where: { id: i.id }, data: { attachmentUrl: newUrl } });
      console.log(`  ✓ -> ${newUrl}`);
    }
  }

  console.log("\nDone. Re-run this script any time — already-migrated rows are skipped automatically.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});