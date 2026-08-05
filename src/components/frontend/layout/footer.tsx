"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Mail, MapPin, Phone, Linkedin, Facebook, Twitter, Instagram } from "lucide-react";
import { siteConfig, productCategoriesList, industriesList } from "@/common/site-config";
import { NewsletterForm } from "@/components/frontend/layout/newsletter-form";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="container-px mx-auto max-w-7xl py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Image
              src="/images/logo/logo-combo.png"
              alt={`${siteConfig.name} — Quanta Chem`}
              width={120}
              height={96}
              className="h-24 w-auto"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-300">
              {siteConfig.description}
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Linkedin, href: siteConfig.social.linkedin },
                { icon: Facebook, href: siteConfig.social.facebook },
                { icon: Twitter, href: siteConfig.social.twitter },
                { icon: Instagram, href: siteConfig.social.instagram },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-navy-300 transition-colors hover:border-teal-500 hover:text-teal-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Products"
            links={productCategoriesList.slice(0, 6).map((c) => ({
              label: c.name,
              href: `/products?category=${c.slug}`,
            }))}
          />

          <FooterCol
            title="Industries"
            links={industriesList.slice(0, 6).map((i) => ({
              label: i.name,
              href: `/industries/${i.slug}`,
            }))}
          />

          <FooterCol
            title="Company"
            links={[
              { label: "About Us", href: "/about" },
              { label: "Manufacturing", href: "/manufacturing" },
              { label: "Export", href: "/export" },
              { label: "Certifications", href: "/certifications" },
              { label: "Blog", href: "/blog" },
              { label: "Contact", href: "/contact" },
            ]}
          />
        </div>

        <div className="mt-12 grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-display text-lg font-semibold text-white">Stay updated</p>
            <p className="mt-1 text-sm text-navy-300">
              Product launches, certifications and export news — no spam.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="mt-10 grid gap-4 text-sm text-navy-300 sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-400" />
            <span>
              {siteConfig.address.line1}, {siteConfig.address.line2}, {siteConfig.address.city},{" "}
              {siteConfig.address.state} {siteConfig.address.pincode}, {siteConfig.address.country}
            </span>
          </div>
          <a href={`tel:${siteConfig.phone}`} className="flex items-center gap-2.5 hover:text-teal-400">
            <Phone className="h-4 w-4 flex-shrink-0 text-teal-400" /> {siteConfig.phone}
          </a>
          <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2.5 hover:text-teal-400">
            <Mail className="h-4 w-4 flex-shrink-0 text-teal-400" /> {siteConfig.email}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-px mx-auto flex max-w-7xl flex-col gap-2 py-6 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.. {siteConfig.legal.iso}.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-teal-400">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-teal-400">
              Terms of Use
            </Link>
            <Link href="/sitemap.xml" className="hover:text-teal-400">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="font-display text-sm font-semibold uppercase tracking-wide text-white">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-navy-300 transition-colors hover:text-teal-400">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}