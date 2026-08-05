import Link from "next/link";
import {
  Pill,
  UtensilsCrossed,
  Sparkles,
  Wheat,
  FlaskConical,
  Factory,
  Droplets,
  TestTubes,
  ArrowRight,
} from "lucide-react";
import { industriesList } from "@/common/site-config";

const iconMap: Record<string, React.ElementType> = {
  Pill,
  UtensilsCrossed,
  Sparkles,
  Wheat,
  FlaskConical,
  Factory,
  Droplets,
  TestTubes,
};

export function IndustriesServed() {
  return (
    <section className="section-y bg-white">
      <div className="container-px mx-auto max-w-7xl">
        <div className="text-center">
          <span className="eyebrow">Industries We Serve</span>
          <h2 className="section-heading mx-auto mt-4 max-w-2xl text-balance">
            Purpose-built chemical solutions across sectors
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {industriesList.map((ind) => {
            const Icon = iconMap[ind.icon] || FlaskConical;
            return (
              <Link
                key={ind.slug}
                href={`/industries/${ind.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-navy-900 p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-500/20 blur-2xl transition-all duration-300 group-hover:bg-teal-500/40" />
                <Icon className="h-8 w-8 text-teal-400" />
                <h3 className="mt-5 font-display text-base font-semibold text-white">{ind.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-300">{ind.summary}</p>
                <span className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-400 opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
