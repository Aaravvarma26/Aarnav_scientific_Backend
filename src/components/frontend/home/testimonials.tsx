import { prisma } from "@/common/prisma";
import { Star, Quote } from "lucide-react";

export async function TestimonialsSection() {
  let testimonials: Awaited<ReturnType<typeof getTestimonials>> = [];
  try {
    testimonials = await getTestimonials();
  } catch {
    testimonials = [];
  }
  if (testimonials.length === 0) return null;

  return (
    <section className="section-y bg-navy-50/50">
      <div className="container-px mx-auto max-w-7xl">
        <div className="text-center">
          <span className="eyebrow">Testimonials</span>
          <h2 className="section-heading mx-auto mt-4 max-w-2xl text-balance">
            What our partners say
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.id} className="card-surface p-7">
              <Quote className="h-7 w-7 text-teal-200" />
              <p className="mt-4 text-sm leading-relaxed text-navy-700">&ldquo;{t.message}&rdquo;</p>
              <div className="mt-5 flex items-center justify-between border-t border-navy-100 pt-4">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{t.name}</p>
                  <p className="text-xs text-navy-500">
                    {t.company}
                    {t.country ? `, ${t.country}` : ""}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-teal-500 text-teal-500" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getTestimonials() {
  return prisma.testimonial.findMany({ where: { isFeatured: true }, take: 6 });
}
