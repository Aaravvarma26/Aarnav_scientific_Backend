import { WorldExportMap } from "@/components/frontend/export/world-map";

// NOTE: the requested stat copy said "34 Countries" but the actual list of
// highlighted countries (verified against WorldExportMap's data) contains
// 33 unique countries. This constant is the single source of truth — update
// it here (and the list in export/world-map.tsx) if a country is added or
// the copy is corrected, rather than hardcoding the number in the JSX below.
const COUNTRIES_SERVED = 33;

export function GlobalPresence() {
  return (
    <section className="section-y relative overflow-hidden bg-white">
      <div className="container-px relative mx-auto max-w-7xl text-center">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-navy-900 text-balance md:text-4xl">
          Global Presence
        </h2>
        <p className="mx-auto mt-4 text-lg font-semibold" style={{ color: "#0A66C2" }}>
          Serving {COUNTRIES_SERVED} Countries Across 5 Continents
        </p>
        <p className="mx-auto mt-2 max-w-xl text-navy-500">
          Delivering High-Quality Chemical Solutions Worldwide
        </p>
      </div>

      <div className="container-px mx-auto mt-12 max-w-6xl">
        <WorldExportMap />
      </div>
    </section>
  );
}