"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { mainNav, productCategoriesList, industriesList, siteConfig } from "@/common/site-config";
import { cn } from "@/common/utils";

// A nav item stays highlighted for its own page AND any page nested under it
// (e.g. "/products" stays active while viewing "/products/some-slug"), except
// for "/" which would otherwise match every route.
function isNavItemActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMega(null);
  }, [pathname]);

  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-navy-100 bg-white/90 shadow-sm backdrop-blur-md"
          : "bg-white/70 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 xl:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/images/logo/logo-a-mark.png"
            alt=""
            width={40}
            height={35}
            className="h-9 w-auto shrink-0 xl:h-10"
          />
          <p className="whitespace-nowrap font-display text-lg font-bold leading-tight text-navy-900">
            {siteConfig.name}
          </p>
        </Link>

        <nav className="hidden shrink-0 items-center gap-0.5 xl:flex">
          {mainNav.map((item) => (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => item.megaMenu && setOpenMega(item.title)}
              onMouseLeave={() => item.megaMenu && setOpenMega(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50 hover:text-teal-700",
                  isNavItemActive(pathname, item.href) && "bg-navy-50 text-teal-700"
                )}
              >
                {item.title}
                {(item.megaMenu || "children" in item) && <ChevronDown className="h-3.5 w-3.5" />}
              </Link>

              {item.megaMenu && item.title === "Products" && openMega === "Products" && (
                <MegaPanel>
                  <div className="grid grid-cols-2 gap-2">
                    {productCategoriesList.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/products?category=${c.slug}`}
                        className="rounded-lg px-3 py-2 text-sm text-navy-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-navy-100 pt-4">
                    <Link href="/products" className="text-sm font-semibold text-teal-700 hover:underline">
                      Browse full catalogue →
                    </Link>
                  </div>
                </MegaPanel>
              )}

              {item.megaMenu && item.title === "Industries" && openMega === "Industries" && (
                <MegaPanel>
                  <div className="grid grid-cols-2 gap-2">
                    {industriesList.map((ind) => (
                      <Link
                        key={ind.slug}
                        href={`/industries/${ind.slug}`}
                        className="rounded-lg px-3 py-2 text-sm text-navy-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                      >
                        {ind.name}
                      </Link>
                    ))}
                  </div>
                </MegaPanel>
              )}

              {"children" in item && item.children && openMega === item.title && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-56 rounded-xl border border-navy-100 bg-white p-2 shadow-premium">
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm text-navy-700 hover:bg-teal-50 hover:text-teal-700",
                          pathname === c.href && "bg-teal-50 text-teal-700"
                        )}
                      >
                        {c.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <div className="group relative h-10 w-10 shrink-0">
            <form
              onSubmit={handleSearchSubmit}
              className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center overflow-hidden rounded-full border border-transparent bg-white text-navy-600 transition-all duration-300 ease-out group-hover:w-64 group-hover:border-navy-200 group-hover:shadow-premium focus-within:w-64 focus-within:border-navy-200 focus-within:shadow-premium"
            >
              <button
                type="submit"
                aria-label="Search products"
                className="flex h-10 w-10 shrink-0 items-center justify-center text-navy-600 hover:text-teal-700"
              >
                <Search className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="w-0 min-w-0 bg-transparent pr-4 text-sm text-navy-800 opacity-0 outline-none transition-opacity duration-200 placeholder:text-navy-400 group-hover:w-full group-hover:opacity-100 focus:w-full focus:opacity-100"
              />
            </form>
          </div>
          <Link href="/inquiry" className="btn-primary whitespace-nowrap">
            Request Quotation
          </Link>
          <Image
            src="/images/logo/logo-full.png"
            alt="Quanta Chem — by Aarnav Scientific"
            width={138}
            height={32}
            className="h-8 w-auto shrink-0"
          />
        </div>

        <button
          className="rounded-lg p-2 text-navy-800 xl:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-navy-100 bg-white px-6 py-4 xl:hidden">
          <div className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium text-navy-800 hover:bg-navy-50",
                  isNavItemActive(pathname, item.href) && "bg-navy-50 text-teal-700"
                )}
              >
                {item.title}
              </Link>
            ))}
            <Link href="/inquiry" className="btn-primary mt-3 w-full">
              Request Quotation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MegaPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-1/2 top-full w-[520px] -translate-x-1/2 pt-2">
      <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-premium">{children}</div>
    </div>
  );
}