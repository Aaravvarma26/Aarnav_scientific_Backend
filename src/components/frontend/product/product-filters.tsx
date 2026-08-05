"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, X } from "lucide-react";
import { productCategoriesList } from "@/common/site-config";

export function ProductFilters({ purityOptions = [] }: { purityOptions?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCategory = searchParams.get("category");
  const activePurity = searchParams.get("purity");
  const activeSort = searchParams.get("sort") || "name_asc";
  const hasActiveFilters = !!activeCategory || !!activePurity;

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("purity");
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B5D6B] transition-colors hover:text-[#0a4d59]"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      <FilterSection title="Category">
        <div className="flex flex-col gap-1">
          <FilterOption
            active={!activeCategory}
            label="All Categories"
            onClick={() => updateParam("category", null)}
          />
          {productCategoriesList.map((c) => (
            <FilterOption
              key={c.slug}
              active={activeCategory === c.slug}
              label={c.name}
              onClick={() => updateParam("category", c.slug)}
            />
          ))}
        </div>
      </FilterSection>

      {purityOptions.length > 0 && (
        <FilterSection title="Purity">
          <div className="flex flex-col gap-1">
            <FilterOption
              active={!activePurity}
              label="Any Purity"
              onClick={() => updateParam("purity", null)}
            />
            {purityOptions.map((p) => (
              <FilterOption
                key={p}
                active={activePurity === p}
                label={p}
                onClick={() => updateParam("purity", p)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Sort By" defaultOpen>
        <select
          value={activeSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-[#0B5D6B] focus:outline-none focus:ring-2 focus:ring-[#0B5D6B]/10"
        >
          <option value="name_asc">Name (A–Z)</option>
          <option value="name_desc">Name (Z–A)</option>
          <option value="newest">Newest First</option>
        </select>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-out ${
          open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">{children}</div>
      </div>
    </div>
  );
}

function FilterOption({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active ? "bg-[#0B5D6B]/10 font-semibold text-[#0B5D6B]" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}