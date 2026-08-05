import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { compareSkus, productIdentityKey } from "./catalog-utils";

const prisma = new PrismaClient();
const GENERATED_PREFIX = "/images/products/";

async function main() {
  const products = await prisma.product.findMany({
    include: {
      packSizes: true,
      images: true,
      specifications: true,
    },
  });

  const groups = new Map<string, typeof products>();
  for (const product of products) {
    const key = productIdentityKey({
      name: product.name,
      casNumber: product.casNumber,
      categoryId: product.categoryId,
    });
    const group = groups.get(key) || [];
    group.push(product);
    groups.set(key, group);
  }

  const duplicateGroups = Array.from(groups.values()).filter((group) => group.length > 1);
  let removed = 0;

  for (const group of duplicateGroups) {
    const sorted = [...group].sort((a, b) => compareSkus(a.sku, b.sku));
    const canonical = sorted[0];
    const duplicates = sorted.slice(1);
    const duplicateIds = duplicates.map((product) => product.id);

    const packLabels = Array.from(
      new Set(sorted.flatMap((product) => product.packSizes.map((pack) => pack.label)))
    );

    const specifications = Array.from(
      new Map(
        sorted
          .flatMap((product) => product.specifications)
          .map((spec) => [`${spec.label.trim()}||${spec.value.trim()}`, spec] as const)
      ).values()
    ).sort((a, b) => a.sortOrder - b.sortOrder);

    const manualImages = Array.from(
      new Map(
        sorted
          .flatMap((product) => product.images)
          .filter((image) => !image.url.startsWith(GENERATED_PREFIX))
          .map((image) => [image.url, image] as const)
      ).values()
    );

    await prisma.$transaction(async (tx) => {
      await tx.inquiry.updateMany({
        where: { productId: { in: duplicateIds } },
        data: { productId: canonical.id },
      });

      await tx.download.updateMany({
        where: { productId: { in: duplicateIds } },
        data: { productId: canonical.id },
      });

      await tx.productPackSize.deleteMany({ where: { productId: canonical.id } });
      if (packLabels.length) {
        await tx.productPackSize.createMany({
          data: packLabels.map((label) => ({ productId: canonical.id, label })),
        });
      }

      await tx.productSpecification.deleteMany({ where: { productId: canonical.id } });
      if (specifications.length) {
        await tx.productSpecification.createMany({
          data: specifications.map((spec, index) => ({
            productId: canonical.id,
            label: spec.label,
            value: spec.value,
            sortOrder: index,
          })),
        });
      }

      await tx.productImage.deleteMany({ where: { productId: canonical.id } });
      await tx.productImage.create({
        data: {
          productId: canonical.id,
          url: `${GENERATED_PREFIX}${canonical.sku.toLowerCase()}.webp`,
          altText: `${canonical.name} molecular structure`,
          sortOrder: -100,
        },
      });
      if (manualImages.length) {
        await tx.productImage.createMany({
          data: manualImages.map((image, index) => ({
            productId: canonical.id,
            url: image.url,
            altText: image.altText,
            sortOrder: Math.max(0, index),
          })),
        });
      }

      await tx.product.update({
        where: { id: canonical.id },
        data: {
          isActive: sorted.some((product) => product.isActive),
          isFeatured: sorted.some((product) => product.isFeatured),
          isPopular: sorted.some((product) => product.isPopular),
        },
      });

      await tx.product.deleteMany({ where: { id: { in: duplicateIds } } });
    });

    for (const duplicate of duplicates) {
      const oldImage = path.join(
        process.cwd(),
        "public",
        "images",
        "products",
        `${duplicate.sku.toLowerCase()}.webp`
      );
      if (fs.existsSync(oldImage)) fs.unlinkSync(oldImage);
    }

    removed += duplicates.length;
    console.log(
      `Merged ${duplicates.map((product) => product.sku).join(", ")} into ${canonical.sku}`
    );
  }

  console.log(`Finished. Removed ${removed} duplicate product rows.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
