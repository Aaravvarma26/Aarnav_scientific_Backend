/**
 * One-time bulk migration: uploads every file under public/images/products
 * and public/images/certificates to Cloudinary, then updates every
 * database row that points at the old local /images/... path.
 *
 * This is separate from migrate-uploads-to-cloudinary.ts, which handles
 * files that were uploaded through the admin panel (public/uploads/*).
 * This script instead handles the product/certificate images that were
 * bundled directly into the repo as static assets.
 *
 * Scope (verified against a database export before writing this):
 *   - ProductImage.url   — 2,206 rows referencing /images/products/*
 *   - Certificate.imageUrl — 6 rows referencing /images/certificates/*
 * No other table (Category, Industry, BlogPost, Testimonial, Partner,
 * Country) currently has any /images/ value set.
 *
 * Run this ONCE, after CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY /
 * CLOUDINARY_API_SECRET are set in your environment, from the backend
 * project root, in the environment where public/images actually has
 * the files (e.g. your deploy checkout, not a fresh clone missing assets):
 *
 *   npx tsx scripts/migrate-static-images-to-cloudinary.ts
 *
 * It processes files with limited concurrency (5 at a time) and prints
 * progress as it goes, since this is ~2,200 uploads and will take a
 * while. It's safe to stop (Ctrl+C) and re-run — any row that no longer
 * starts with "/images/" is treated as already migrated and skipped.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/common/prisma";
import { uploadFile } from "../src/common/storage";

const LOCAL_PREFIX = "/images/";
const CONCURRENCY = 5;

async function migrateFile(localUrl: string): Promise<string | null> {
  const relPath = localUrl.replace(LOCAL_PREFIX, ""); // e.g. "products/as1113.webp"
  const filePath = path.join(process.cwd(), "public", "images", relPath);
  const fileName = path.basename(relPath);

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
    "image/jpeg";

  const uploaded = await uploadFile(buffer, fileName, mimeType);
  return uploaded.url;
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>
) {
  let cursor = 0;
  async function next(): Promise<void> {
    const i = cursor++;
    if (i >= items.length) return;
    await worker(items[i], i);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()));
}

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.AWS_S3_BUCKET) {
    console.error(
      "No CLOUDINARY_CLOUD_NAME or AWS_S3_BUCKET set in the environment this script is running in. " +
      "Set your Cloudinary credentials first, then re-run."
    );
    process.exit(1);
  }

  console.log("== ProductImage rows ==");
  const productImages = await prisma.productImage.findMany({
    where: { url: { startsWith: LOCAL_PREFIX } },
  });
  console.log(`Found ${productImages.length} local product image(s) to migrate.\n`);

  let done = 0;
  await runWithConcurrency(productImages, CONCURRENCY, async (img) => {
    const newUrl = await migrateFile(img.url);
    if (newUrl) {
      await prisma.productImage.update({ where: { id: img.id }, data: { url: newUrl } });
    }
    done++;
    if (done % 50 === 0 || done === productImages.length) {
      console.log(`  ...${done}/${productImages.length} product images done`);
    }
  });

  console.log("\n== Certificate rows ==");
  const certificates = await prisma.certificate.findMany({
    where: { imageUrl: { startsWith: LOCAL_PREFIX } },
  });
  console.log(`Found ${certificates.length} local certificate image(s) to migrate.`);
  for (const c of certificates) {
    console.log(`Uploading ${c.title} (${c.imageUrl}) ...`);
    const newUrl = await migrateFile(c.imageUrl);
    if (newUrl) {
      await prisma.certificate.update({ where: { id: c.id }, data: { imageUrl: newUrl } });
      console.log(`  ✓ -> ${newUrl}`);
    }
  }

  console.log("\nDone. Re-run any time — already-migrated rows (no longer starting with /images/) are skipped.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});