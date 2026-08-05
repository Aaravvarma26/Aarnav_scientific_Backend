import { prisma } from "@/common/prisma";
import Image from "next/image";

export async function PartnerLogos() {
  let partners: Awaited<ReturnType<typeof getPartners>> = [];
  try {
    partners = await getPartners();
  } catch {
    partners = [];
  }
  if (partners.length === 0) return null;

  return (
    <section className="border-y border-navy-100 bg-white py-12">
      <div className="container-px mx-auto max-w-7xl">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-navy-400">
          Trusted by laboratories and manufacturers worldwide
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-70 grayscale">
          {partners.map((p) => (
            <div key={p.id} className="relative h-8 w-28">
              <Image src={p.logoUrl} alt={p.name} fill className="object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getPartners() {
  return prisma.partner.findMany({ orderBy: { sortOrder: "asc" } });
}
