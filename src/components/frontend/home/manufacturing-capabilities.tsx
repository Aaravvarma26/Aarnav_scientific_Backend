import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const capabilities = [
  "In-house QC laboratory with batch-wise testing",
  "Custom synthesis for non-catalogue requirements",
  "Flexible packaging: lab packs to bulk drums",
  "Dedicated export documentation & logistics desk",
];

export function ManufacturingCapabilitiesSection() {
  return (
    <section className="section-y bg-white">
      <div className="container-px mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Manufacturing Capabilities</span>
            <h2 className="section-heading mt-4 text-balance">
              Infrastructure built for consistent, scalable quality
            </h2>
            <p className="mt-5 leading-relaxed text-navy-600">
              Our Mumbai-based facility combines trained manpower, quality-controlled processes and
              rigorous testing protocols to deliver laboratory reagents and fine chemicals that meet
              exacting international standards, batch after batch.
            </p>
            <ul className="mt-6 space-y-3">
              {capabilities.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-navy-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card">
              <Image src="/images/hero/hero-3.jpg" alt="Manufacturing" fill className="object-cover" />
            </div>
            <div className="relative mt-8 aspect-square overflow-hidden rounded-2xl shadow-card">
              <Image src="/images/hero/hero-4.jpg" alt="Quality testing" fill className="object-cover" />
            </div>
            <div className="relative -mt-8 aspect-square overflow-hidden rounded-2xl shadow-card">
              <Image src="/images/gallery/gallery-9.jpg" alt="Packaging" fill className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card">
              <Image src="/images/gallery/gallery-11.jpg" alt="Warehouse" fill className="object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
