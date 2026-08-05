import Image from "next/image";
import { ShieldCheck, Timer, Globe2, FlaskConical, Award, Truck } from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "ISO 9001:2015 Certified",
    desc: "Every batch manufactured under a certified quality management system with full documentation.",
  },
  {
    icon: FlaskConical,
    title: "3,400+ SKU Portfolio",
    desc: "AR, LR, GR and HPLC grade reagents across acids, solvents, buffers and specialty chemicals.",
  },
  {
    icon: Timer,
    title: "Quick Turnaround",
    desc: "Efficient order processing and dispatch, from small lab packs to bulk industrial quantities.",
  },
  {
    icon: Globe2,
    title: "Global Export Network",
    desc: "Reliable export documentation and logistics to 15+ countries and growing.",
  },
  {
    icon: Award,
    title: "Consistent Quality",
    desc: "Rigorous QC testing and batch-wise Certificates of Analysis on every shipment.",
  },
  {
    icon: Truck,
    title: "Flexible Packaging",
    desc: "Small lab packs through to bulk drums — packaging matched to your requirement.",
  },
];

export function CompanyIntroAndWhyChooseUs() {
  return (
    <section className="section-y bg-white">
      <div className="container-px mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-premium">
              <Image
                src="/images/hero/hero-2.jpg"
                alt="Aarnav Scientific manufacturing facility"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 hidden w-56 rounded-2xl border border-navy-100 bg-white p-5 shadow-premium md:block">
              <p className="font-display text-3xl font-bold text-navy-900">2017</p>
              <p className="mt-1 text-sm text-navy-500">
                Manufacturing laboratory reagents & fine chemicals since our founding year.
              </p>
            </div>
          </div>

          <div>
            <span className="eyebrow">Who We Are</span>
            <h2 className="section-heading mt-4 text-balance">
              A trusted name in specialty chemical manufacturing and export
            </h2>
            <p className="mt-5 leading-relaxed text-navy-600">
              Aarnav Scientific, trading under the Quanta Chem brand, is an ISO 9001:2015 certified
              manufacturer, importer, exporter and distributor of laboratory reagents and fine
              chemicals based in Mumbai, India. We serve pharmaceutical, food, cosmetic,
              agricultural, laboratory, industrial and water-treatment industries with a catalogue
              of over 3,400 products — backed by consistent quality, competitive pricing and
              dependable service.
            </p>
            <p className="mt-4 leading-relaxed text-navy-600">
              We also offer custom synthesis to meet requirements beyond our standard catalogue,
              and we are proud to be MSME (Udyam) registered under the Government of India.
            </p>
          </div>
        </div>

        <div className="mt-24 text-center">
          <span className="eyebrow">Why Choose Us</span>
          <h2 className="section-heading mx-auto mt-4 max-w-2xl text-balance">
            Built on quality, consistency and long-term partnerships
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="card-surface p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
                <r.icon className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-navy-900">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
