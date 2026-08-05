/**
 * One-off data script — NOT run automatically by `prisma db seed`.
 *
 * Assigns a generic placeholder photo to every product that doesn't already
 * have one, using its pack-size units (e.g. "500GM" vs "2.5LTR") to decide
 * whether it's a liquid or a solid. This mapping was checked against the
 * actual seed data before writing it:
 *
 *   LIQUID → LTR, ML, AMP   (ampoules in this catalogue are volumetric/
 *                             titration standards — genuinely liquid)
 *   SOLID  → GM, KG, MG, CAP, TAB
 *
 * Units left out on purpose because they don't reliably indicate physical
 * state (mostly test-paper/strip products, not liquids or solids):
 *   BKT, BKTS, VIAL, IVS, BOX
 *
 * If a product's pack sizes mix liquid and solid units, or use only
 * unrecognised/excluded units, it's skipped rather than guessed at — with
 * a fallback check against the free-text `appearance` field first.
 *
 * Run with:  npx tsx prisma/assign-placeholder-images.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LIQUID_PLACEHOLDER_URL = "/images/products/liquid-placeholder.jpg";
const SOLID_PLACEHOLDER_URL = "/images/products/solid-placeholder.jpg";

const LIQUID_UNITS = new Set(["LTR", "ML", "AMP"]);
const SOLID_UNITS = new Set(["GM", "KG", "MG", "CAP", "TAB"]);

const LIQUID_WORDS = ["liquid", "solution", "syrup", "oil", "viscous"];
const SOLID_WORDS = ["powder", "crystal", "crystalline", "solid", "granule", "granular", "flake", "lump"];

function unitFromLabel(label: string): string | null {
  const match = label.trim().toUpperCase().match(/([A-Z]+)\s*$/);
  return match ? match[1] : null;
}

function classify(packLabels: string[], appearance: string | null): "LIQUID" | "SOLID" | null {
  const units = packLabels.map(unitFromLabel).filter((u): u is string => !!u);
  const isLiquid = units.some((u) => LIQUID_UNITS.has(u));
  const isSolid = units.some((u) => SOLID_UNITS.has(u));

  if (isLiquid && !isSolid) return "LIQUID";
  if (isSolid && !isLiquid) return "SOLID";
  if (isLiquid && isSolid) return null; // mixed units — ambiguous, don't guess

  // No usable pack-size signal — fall back to the free-text appearance field.
  const text = (appearance || "").toLowerCase();
  if (LIQUID_WORDS.some((w) => text.includes(w))) return "LIQUID";
  if (SOLID_WORDS.some((w) => text.includes(w))) return "SOLID";

  return null;
}

async function main() {
  // Only fill in products that don't already have a real photo — never overwrite existing images.
  const products = await prisma.product.findMany({
    where: { images: { none: {} } },
    include: { packSizes: true },
  });

  let liquidCount = 0;
  let solidCount = 0;
  let skipped = 0;

  for (const product of products) {
    const state = classify(
      product.packSizes.map((p) => p.label),
      product.appearance
    );

    if (!state) {
      skipped++;
      continue;
    }

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: state === "LIQUID" ? LIQUID_PLACEHOLDER_URL : SOLID_PLACEHOLDER_URL,
        altText: `${product.name} — ${state === "LIQUID" ? "liquid" : "solid"} reagent bottle`,
        sortOrder: 0,
      },
    });

    if (state === "LIQUID") liquidCount++;
    else solidCount++;
  }

  console.log(`Assigned liquid placeholder to ${liquidCount} products.`);
  console.log(`Assigned solid placeholder to ${solidCount} products.`);
  console.log(`Skipped ${skipped} products (already had an image, or couldn't be confidently classified).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
