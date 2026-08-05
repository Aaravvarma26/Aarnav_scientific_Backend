import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/common/prisma";
import { ArrowRight, Download } from "lucide-react";

export async function CertificatesSection() {
  let certificates: Awaited<ReturnType<typeof getCerts>> = [];
  try {
    certificates = await getCerts();
  } catch {
    certificates = [];
  }
  if (certificates.length === 0) return null;

  return (
    <section className="section-y bg-navy-50/50">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow">Certifications & Compliance</span>
            <h2 className="section-heading mt-4">Quality you can verify</h2>
          </div>
          <Link href="/certifications" className="flex items-center gap-2 text-sm font-semibold text-teal-700 hover:underline">
            View all certifications <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <div key={c.id} className="card-surface overflow-hidden p-0">
              <div className="relative aspect-[4/3] bg-navy-50">
                <Image src={c.imageUrl} alt={c.title} fill className="object-contain p-4" />
              </div>
              <div className="p-5">
                <h3 className="font-display text-sm font-semibold text-navy-900">{c.title}</h3>
                {c.certNumber && <p className="mt-1 text-xs text-navy-500">Cert. No. {c.certNumber}</p>}
                {c.fileUrl && (
                  <a
                    href={c.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getCerts() {
  return prisma.certificate.findMany({ orderBy: { sortOrder: "asc" } });
}
