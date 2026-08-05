import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Globe2, Factory } from "lucide-react";
import { siteConfig } from "@/common/site-config";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>
      <div className="absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-teal-500/20 blur-3xl" />
      <div className="absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-navy-500/30 blur-3xl" />

      <div className="container-px relative mx-auto grid max-w-7xl items-center gap-16 py-24 md:py-32 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-fade-up">
          <span className="eyebrow bg-white/10 text-teal-300">
            ISO 9001:2015 Certified · Est. 2017
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] text-white text-balance md:text-5xl lg:text-6xl">
            Precision chemicals.
            <br />
            <span className="text-teal-400">Global trust.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-200">
            {siteConfig.name} manufactures, imports and exports laboratory reagents and fine
            chemicals under the <span className="font-semibold text-white">{siteConfig.brand}</span>{" "}
            brand — trusted by pharmaceutical, food, cosmetics, agriculture and industrial
            laboratories across the world.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/products" className="btn-primary">
              Explore Products <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/inquiry" className="btn-ghost-light">
              Request a Quotation
            </Link>
          </div>

          <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
            <Stat icon={ShieldCheck} value="3,400+" label="Products" />
            <Stat icon={Globe2} value="33+" label="Countries Served" />
            <Stat icon={Factory} value="9+" label="Years Manufacturing" />
          </div>
        </div>

        {/* Signature element: a "Certificate of Analysis"-styled spec panel */}
        <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:150ms]">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-400/30 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-premium backdrop-blur-xl">
            <div className="relative h-56 w-full">
              <Image
                src="/images/hero/hero-1.jpg"
                alt="Quanta Chem laboratory reagents"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent" />
            </div>
            <div className="space-y-3 p-6 font-mono text-xs text-teal-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px] uppercase tracking-widest text-navy-300">
                <span>Certificate of Analysis</span>
                <span>Sample Extract</span>
              </div>
              <SpecRow label="Product" value="Acetonitrile HPLC Grade" />
              <SpecRow label="CAS No." value="75-05-8" />
              <SpecRow label="Assay (GC)" value="≥ 99.9 %" />
              <SpecRow label="Water Content" value="≤ 0.02 %" />
              <SpecRow label="Status" value="CONFORMS" highlight />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div>
      <Icon className="h-5 w-5 text-teal-400" />
      <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-navy-300">{label}</p>
    </div>
  );
}

function SpecRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-navy-400">{label}</span>
      <span className={highlight ? "font-bold text-teal-400" : "text-white"}>{value}</span>
    </div>
  );
}
