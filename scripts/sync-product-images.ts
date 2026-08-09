import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { consolidateRawProducts, type RawProduct } from "./catalog-utils";

const prisma = new PrismaClient();

function titleCase(value: string) {
  if (value === value.toUpperCase()) {
    return value
      .toLowerCase()
      .split(" ")
      .map((word) =>
        word.length <= 3
          ? word.toUpperCase()
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ")
      .replace(/\bHplc\b/gi, "HPLC");
  }
  return value;
}

async function main() {
  const dataFile = path.join(process.cwd(), "prisma", "products_seed_data.json");
  const raw = JSON.parse(fs.readFileSync(dataFile, "utf8")) as RawProduct[];
  const products = consolidateRawProducts(raw);
  let updated = 0;

  for (const product of products) {
    const imagePath = path.join(
      process.cwd(),
      "public",
      "images",
      "products",
      `${product.sku.toLowerCase()}.webp`
    );

    if (!fs.existsSync(imagePath)) {
      console.warn(`Missing image for ${product.sku}: ${imagePath}`);
      continue;
    }

    const productName = titleCase(product.name);
    const url = `/images/products/${product.sku.toLowerCase()}.webp`;

    await prisma.product.update({
      where: { sku: product.sku },
      data: {
        images: {
          deleteMany: { url: { startsWith: "/images/products/" } },
          create: {
            url,
            altText: `${productName} molecular structure`,
            sortOrder: -100,
          },
        },
      },
    });

    updated += 1;
    if (updated % 100 === 0) console.log(`Attached ${updated}/${products.length} images`);
  }

  console.log(`Finished. Attached ${updated} product images.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });