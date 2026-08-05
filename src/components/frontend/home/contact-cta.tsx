import Link from "next/link";
import { ArrowRight, PhoneCall } from "lucide-react";
import { siteConfig } from "@/common/site-config";

export function ContactCta() {
  return (
    <section className="section-y bg-white">
      <div className="container-px mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-8 py-16 text-center md:px-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-white text-balance md:text-4xl">
              Ready to source with confidence?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-navy-300">
              Talk to our team about product availability, pricing and export documentation —
              we typically respond within one business day.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/inquiry" className="btn-primary">
                Request Quotation <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`tel:${siteConfig.phone}`} className="btn-ghost-light">
                <PhoneCall className="h-4 w-4" /> {siteConfig.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
