import Link from "next/link";
import { FlaskConical, ArrowUpRight, Package } from "lucide-react";
import { Badge } from "@/components/common/badge";

type CardProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  casNumber?: string | null;
  category?: { name: string; slug: string } | null;
  packSizes?: { label: string }[];
  images?: { url: string }[];
  isPopular?: boolean;
};

export function ProductCard({ product }: { product: CardProduct }) {
  const packs = product.packSizes?.map((pack) => pack.label) || [];
  const visiblePacks = packs.slice(0, 3);
  const extraPackCount = Math.max(0, packs.length - visiblePacks.length);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card-surface group flex flex-col overflow-hidden p-0"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-white via-navy-50/40 to-teal-50/60 p-4">
        {product.images && product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0].url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full rounded-xl object-contain transition-transform duration-300 group-hover:scale-[1.025]"
          />
        ) : (
          <FlaskConical className="h-12 w-12 text-teal-400/60 transition-transform duration-300 group-hover:scale-110" />
        )}

        {product.isPopular && (
          <Badge variant="teal" className="absolute left-3 top-3">
            Popular
          </Badge>
        )}

        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-card transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4 text-navy-700" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {product.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
            {product.category.name}
          </span>
        )}

        <h3 className="mt-1.5 line-clamp-2 font-display text-sm font-semibold leading-snug text-navy-900">
          {product.name}
        </h3>

        {visiblePacks.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-navy-600">
            <Package className="h-3.5 w-3.5 text-teal-600" />
            {visiblePacks.map((pack) => (
              <span key={pack} className="rounded-full bg-navy-50 px-2 py-1">
                {pack}
              </span>
            ))}
            {extraPackCount > 0 && <span>+{extraPackCount} more</span>}
          </div>
        )}

        <div className="mt-4 flex flex-1 items-end justify-between gap-3 text-xs text-navy-500">
          <span>SKU: {product.sku}</span>
          {product.casNumber && <span className="text-right">CAS {product.casNumber}</span>}
        </div>
      </div>
    </Link>
  );
}