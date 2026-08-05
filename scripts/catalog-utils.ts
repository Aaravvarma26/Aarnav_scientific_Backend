export type RawProduct = {
  sku: string;
  cas: string;
  name: string;
  pack_sizes: string[];
  hsn: string;
  un_no: string;
  category: string;
};

export type ConsolidatedProduct = RawProduct & {
  sourceSkus: string[];
};

export function normalizeProductName(value: string) {
  return value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[–—−]/g, "-")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeCasNumber(value?: string | null) {
  const cleaned = (value || "").trim();
  return cleaned === "---" || cleaned.toUpperCase() === "NA" ? "" : cleaned;
}

export function productIdentityKey(input: {
  name: string;
  cas?: string | null;
  casNumber?: string | null;
  category?: string | null;
  categoryId?: string | null;
}) {
  return [
    normalizeProductName(input.name),
    normalizeCasNumber(input.cas ?? input.casNumber),
    input.category ?? input.categoryId ?? "",
  ].join("||");
}

function skuNumber(sku: string) {
  const match = sku.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function compareSkus(a: string, b: string) {
  return skuNumber(a) - skuNumber(b) || a.localeCompare(b);
}

export function consolidateRawProducts(products: RawProduct[]): ConsolidatedProduct[] {
  const groups = new Map<string, RawProduct[]>();

  for (const product of products) {
    const key = productIdentityKey(product);
    const group = groups.get(key) || [];
    group.push(product);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => {
      const sorted = [...group].sort((a, b) => compareSkus(a.sku, b.sku));
      const canonical = sorted[0];
      const packSizes = Array.from(
        new Set(sorted.flatMap((product) => product.pack_sizes || []).filter(Boolean))
      );

      return {
        ...canonical,
        pack_sizes: packSizes,
        sourceSkus: sorted.map((product) => product.sku),
      };
    })
    .sort((a, b) => compareSkus(a.sku, b.sku));
}
